import json
import logging
from datetime import datetime

import anthropic
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user_memory import UserMemory

logger = logging.getLogger(__name__)


def extract_and_save_memory(db: Session, user_id: int, user_message: str, assistant_response: str) -> None:
    """Extract behavioral signals from a conversation exchange and store in user_memory."""
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system="""Analyze this conversation exchange between a user and their financial advisor.
Extract any behavioral signals worth remembering for future personalization.

Return a JSON array of objects, each with:
- key: a short snake_case identifier (e.g. "interested_sectors", "risk_concerns", "watched_tickers", "life_events", "preferred_topics")
- value: the extracted information as a concise string

Only extract genuinely useful signals. If there's nothing noteworthy, return an empty array [].
Return ONLY the JSON array, no other text.""",
            messages=[{
                "role": "user",
                "content": f"USER MESSAGE: {user_message}\n\nADVISOR RESPONSE: {assistant_response[:500]}",
            }],
        )

        response_text = response.content[0].text.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()

        memories = json.loads(response_text)
        if not memories:
            return

        now = datetime.utcnow()
        for mem in memories:
            key = mem.get("key", "").strip()
            value = mem.get("value", "").strip()
            if not key or not value:
                continue

            # Upsert: update existing key or create new
            existing = (
                db.query(UserMemory)
                .filter(UserMemory.user_id == user_id, UserMemory.key == key)
                .first()
            )
            if existing:
                # Merge values if different
                if value not in existing.value:
                    existing.value = f"{existing.value}, {value}"
                existing.last_updated = now
                existing.source = "conversation"
            else:
                new_memory = UserMemory(
                    user_id=user_id,
                    key=key,
                    value=value,
                    source="conversation",
                    confidence=0.8,
                )
                db.add(new_memory)

        db.commit()
    except Exception:
        logger.exception("Failed to extract behavioral memory")
