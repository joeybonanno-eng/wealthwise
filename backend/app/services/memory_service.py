import json
import logging
from datetime import datetime

import anthropic
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user_memory import UserMemory

logger = logging.getLogger(__name__)

SUMMARY_THRESHOLD = 10  # Summarize when conversation exceeds this many messages


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


def summarize_conversation(db: Session, user_id: int, conversation_id: int, messages: list) -> None:
    """Summarize a long conversation and store the summary as a memory entry.

    Called after each exchange when the conversation exceeds SUMMARY_THRESHOLD messages.
    The summary captures key decisions, advice given, and action items discussed.
    """
    if len(messages) < SUMMARY_THRESHOLD:
        return

    try:
        # Build conversation transcript (truncate individual messages to keep prompt reasonable)
        transcript_parts = []
        for msg in messages:
            role = msg.role.upper() if hasattr(msg, "role") else msg.get("role", "").upper()
            content = msg.content if hasattr(msg, "content") else msg.get("content", "")
            # Limit each message to ~300 chars for the summary prompt
            truncated = content[:300] + ("..." if len(content) > 300 else "")
            transcript_parts.append(f"{role}: {truncated}")

        transcript = "\n\n".join(transcript_parts)

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            system="""Summarize this financial advisor conversation into a concise memory note.
Focus on:
1. Key financial facts the user shared (income, goals, holdings, etc.)
2. Specific advice or recommendations given
3. Decisions or action items the user agreed to
4. Any concerns or questions that were raised

Return a JSON object with:
- "summary": A 2-4 sentence summary of the conversation
- "key_facts": An array of 1-5 key facts worth remembering (short strings)
- "action_items": An array of 0-3 action items discussed (short strings)

Return ONLY the JSON object, no other text.""",
            messages=[{
                "role": "user",
                "content": f"Conversation transcript:\n\n{transcript}",
            }],
        )

        response_text = response.content[0].text.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()

        parsed = json.loads(response_text)
        now = datetime.utcnow()

        # Store conversation summary
        summary_key = f"conversation_summary_{conversation_id}"
        summary_value = json.dumps({
            "summary": parsed.get("summary", ""),
            "key_facts": parsed.get("key_facts", []),
            "action_items": parsed.get("action_items", []),
            "message_count": len(messages),
        })

        existing = (
            db.query(UserMemory)
            .filter(UserMemory.user_id == user_id, UserMemory.key == summary_key)
            .first()
        )
        if existing:
            existing.value = summary_value
            existing.last_updated = now
        else:
            db.add(UserMemory(
                user_id=user_id,
                key=summary_key,
                value=summary_value,
                source="conversation",
                confidence=0.9,
            ))

        db.commit()
    except Exception:
        logger.exception("Failed to summarize conversation")


def get_conversation_summaries(db: Session, user_id: int, limit: int = 5) -> list:
    """Retrieve recent conversation summaries for system prompt injection."""
    summaries = (
        db.query(UserMemory)
        .filter(
            UserMemory.user_id == user_id,
            UserMemory.key.like("conversation_summary_%"),
        )
        .order_by(UserMemory.last_updated.desc())
        .limit(limit)
        .all()
    )

    results = []
    for s in summaries:
        try:
            parsed = json.loads(s.value)
            results.append(parsed)
        except (json.JSONDecodeError, KeyError):
            continue

    return results
