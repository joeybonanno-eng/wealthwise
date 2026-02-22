import json
import logging

import anthropic
from sqlalchemy.orm import Session

from app.config import settings
from app.models.financial_profile import FinancialProfile
from app.models.user import User

logger = logging.getLogger(__name__)

ONBOARDING_SYSTEM_PROMPT = """You are WealthWise, a friendly AI financial advisor conducting a brief onboarding conversation.

Your goal is to learn about the user through natural conversation. Extract the following information naturally:
1. Their primary financial goals
2. Their experience level with investing
3. Their risk tolerance
4. Basic financial snapshot (income, expenses, savings, debt) — optional, don't push
5. Their investment timeline
6. What financial topics interest them
7. How they like to be communicated with (simple vs technical)

RULES:
- Be warm, conversational, and encouraging
- Ask only 1-2 questions at a time
- Don't interrogate — if they skip something, move on
- After gathering enough info (or after 4-5 exchanges), summarize what you've learned and offer to complete setup
- When you have enough information, end your message with the exact tag: [ONBOARDING_COMPLETE]
- Along with [ONBOARDING_COMPLETE], include a JSON block with extracted data like this:
  [PROFILE_DATA]{"investment_goals":"...","experience_level":"beginner|intermediate|advanced","risk_tolerance":"conservative|moderate|aggressive","annual_income":null,"monthly_expenses":null,"total_savings":null,"total_debt":null,"investment_timeline":"...","interested_topics":"...","communication_level":"elementary|high_school|college|phd","advisor_tone":"friendly|professional|mentor|casual"}[/PROFILE_DATA]

Start by warmly greeting the user and asking about their main financial goal."""


def chat_onboarding(db: Session, user: User, messages: list) -> dict:
    """Handle a conversational onboarding exchange."""
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    api_messages = []
    for msg in messages:
        api_messages.append({"role": msg["role"], "content": msg["content"]})

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        system=ONBOARDING_SYSTEM_PROMPT,
        messages=api_messages,
    )

    assistant_text = response.content[0].text.strip()
    is_complete = "[ONBOARDING_COMPLETE]" in assistant_text

    # Extract profile data if complete
    profile_data = None
    display_text = assistant_text
    if is_complete:
        display_text = assistant_text.split("[ONBOARDING_COMPLETE]")[0].strip()
        try:
            start = assistant_text.index("[PROFILE_DATA]") + len("[PROFILE_DATA]")
            end = assistant_text.index("[/PROFILE_DATA]")
            profile_json = assistant_text[start:end]
            profile_data = json.loads(profile_json)

            # Save to profile
            _save_profile(db, user, profile_data)
        except (ValueError, json.JSONDecodeError):
            logger.warning("Failed to parse onboarding profile data")

    return {
        "message": display_text,
        "is_complete": is_complete,
        "profile_data": profile_data,
    }


def _save_profile(db: Session, user: User, data: dict) -> None:
    """Save extracted onboarding data to the user's financial profile."""
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    if not profile:
        profile = FinancialProfile(user_id=user.id)
        db.add(profile)

    field_map = {
        "investment_goals": "investment_goals",
        "experience_level": "experience_level",
        "risk_tolerance": "risk_tolerance",
        "annual_income": "annual_income",
        "monthly_expenses": "monthly_expenses",
        "total_savings": "total_savings",
        "total_debt": "total_debt",
        "investment_timeline": "investment_timeline",
        "interested_topics": "interested_topics",
        "communication_level": "communication_level",
        "advisor_tone": "advisor_tone",
    }

    for json_key, db_field in field_map.items():
        value = data.get(json_key)
        if value is not None:
            setattr(profile, db_field, value)

    profile.onboarding_completed = True
    db.commit()
