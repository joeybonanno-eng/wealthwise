import json
import logging

import anthropic
from sqlalchemy.orm import Session

from app.config import settings
from app.models.conversation import Conversation
from app.models.financial_plan import FinancialPlan
from app.models.financial_profile import FinancialProfile
from app.models.insight import Insight
from app.models.user import User
from app.models.user_memory import UserMemory

logger = logging.getLogger(__name__)


def generate_daily_briefing(db: Session, user: User) -> dict:
    """Generate a spoken-friendly daily briefing covering markets, goals, and insights."""
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    plans = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.user_id == user.id, FinancialPlan.status == "active")
        .all()
    )
    pending_insights = (
        db.query(Insight)
        .filter(Insight.user_id == user.id, Insight.status.in_(["pending", "delivered"]))
        .order_by(Insight.created_at.desc())
        .limit(3)
        .all()
    )
    memories = db.query(UserMemory).filter(UserMemory.user_id == user.id).all()
    recent_conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .limit(3)
        .all()
    )

    # Build context
    profile_ctx = "No profile set up."
    if profile:
        profile_ctx = json.dumps({
            "age": profile.age,
            "annual_income": profile.annual_income,
            "monthly_expenses": profile.monthly_expenses,
            "total_savings": profile.total_savings,
            "total_debt": profile.total_debt,
            "risk_tolerance": profile.risk_tolerance,
            "investment_goals": profile.investment_goals,
        }, default=str)

    plans_ctx = "No active plans."
    if plans:
        plans_ctx = json.dumps([
            {"title": p.title, "type": p.plan_type} for p in plans
        ])

    insights_ctx = "No pending insights."
    if pending_insights:
        insights_ctx = json.dumps([
            {"type": i.type, "title": i.title, "body": i.body, "urgency": i.urgency}
            for i in pending_insights
        ])

    memory_ctx = "No behavioral memory."
    if memories:
        memory_ctx = json.dumps([
            {"key": m.key, "value": m.value} for m in memories
        ])

    market_ctx = "Market data unavailable."
    try:
        from app.services.market_data_service import get_stock_quote
        spy = get_stock_quote("SPY")
        market_ctx = json.dumps({
            "sp500_price": spy.get("price"),
            "sp500_change_pct": spy.get("change_percent"),
            "sp500_name": spy.get("name"),
        })
    except Exception:
        pass

    # Determine tone
    tone = "professional"
    if profile:
        tone = getattr(profile, "advisor_tone", None) or "professional"

    system_prompt = f"""You are WealthWise, a personal AI financial advisor delivering a daily morning briefing.

Tone: {tone}
Keep it conversational, warm, and spoken-friendly (this will be read aloud via text-to-speech).
Do NOT use markdown formatting, bullet points, or special characters. Write in natural paragraphs as if speaking.
Keep it under 200 words.

Structure:
1. Quick greeting with the user's situation in mind
2. Market snapshot (S&P 500 movement and what it means)
3. Goal update (reference their active plans if any)
4. Top insight or action item
5. Encouraging sign-off

USER PROFILE: {profile_ctx}
ACTIVE PLANS: {plans_ctx}
PENDING INSIGHTS: {insights_ctx}
BEHAVIORAL MEMORY: {memory_ctx}
MARKET SNAPSHOT: {market_ctx}
RECENT TOPICS: {json.dumps([c.title for c in recent_conversations]) if recent_conversations else "None"}"""

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system=system_prompt,
        messages=[{"role": "user", "content": "Give me my morning briefing."}],
    )

    briefing_text = response.content[0].text.strip()

    return {
        "briefing": briefing_text,
        "market": json.loads(market_ctx) if market_ctx != "Market data unavailable." else None,
        "active_plans": len(plans),
        "pending_insights": len(pending_insights),
    }
