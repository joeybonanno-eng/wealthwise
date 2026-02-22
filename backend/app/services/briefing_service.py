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


def generate_weekly_briefing(db: Session, user: User) -> dict:
    """Generate a comprehensive weekly recap covering the past week's activity."""
    from datetime import datetime, timedelta
    from app.models.usage_tracking import UsageTracking

    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    plans = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.user_id == user.id, FinancialPlan.status == "active")
        .all()
    )

    one_week_ago = datetime.utcnow() - timedelta(days=7)

    # Insights from this week
    week_insights = (
        db.query(Insight)
        .filter(Insight.user_id == user.id, Insight.created_at >= one_week_ago)
        .all()
    )
    accepted = [i for i in week_insights if i.status == "accepted"]
    dismissed = [i for i in week_insights if i.status == "dismissed"]

    # Conversations this week
    week_conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id, Conversation.created_at >= one_week_ago)
        .all()
    )

    # Behavioral memory
    memories = db.query(UserMemory).filter(UserMemory.user_id == user.id).limit(10).all()

    # Usage this period
    usage_records = (
        db.query(UsageTracking)
        .filter(UsageTracking.user_id == user.id)
        .all()
    )

    # Market snapshot
    market_ctx = "Market data unavailable."
    try:
        from app.services.market_data_service import get_stock_quote
        spy = get_stock_quote("SPY")
        market_ctx = json.dumps({
            "sp500_price": spy.get("price"),
            "sp500_change_pct": spy.get("change_percent"),
        })
    except Exception:
        pass

    # Build context
    profile_ctx = "No profile."
    if profile:
        profile_ctx = json.dumps({
            "annual_income": profile.annual_income,
            "total_savings": profile.total_savings,
            "total_debt": profile.total_debt,
            "risk_tolerance": profile.risk_tolerance,
            "investment_goals": profile.investment_goals,
        }, default=str)

    tone = "professional"
    if profile:
        tone = getattr(profile, "advisor_tone", None) or "professional"

    system_prompt = f"""You are WealthWise, delivering a weekly financial recap to your user.

Tone: {tone}
Write in natural, spoken-friendly paragraphs (this will be read aloud). No markdown or bullet points.
Keep it under 300 words.

Structure:
1. Warm weekly greeting
2. This week's activity summary ({len(week_conversations)} conversations, {len(week_insights)} insights generated, {len(accepted)} accepted, {len(dismissed)} dismissed)
3. Market recap for the week
4. Progress toward financial goals (reference active plans)
5. Key behavioral patterns you've noticed
6. Top recommendation for next week
7. Motivational sign-off

USER PROFILE: {profile_ctx}
ACTIVE PLANS: {json.dumps([{"title": p.title, "type": p.plan_type} for p in plans]) if plans else "None"}
ACCEPTED INSIGHTS THIS WEEK: {json.dumps([{"title": i.title, "body": i.body} for i in accepted]) if accepted else "None"}
CONVERSATIONS THIS WEEK: {json.dumps([c.title for c in week_conversations]) if week_conversations else "None"}
BEHAVIORAL MEMORY: {json.dumps([{"key": m.key, "value": m.value} for m in memories]) if memories else "None"}
USAGE: {json.dumps([{"feature": u.feature, "count": u.count} for u in usage_records]) if usage_records else "None"}
MARKET SNAPSHOT: {market_ctx}"""

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=800,
        system=system_prompt,
        messages=[{"role": "user", "content": "Give me my weekly recap."}],
    )

    return {
        "briefing": response.content[0].text.strip(),
        "stats": {
            "conversations": len(week_conversations),
            "insights_generated": len(week_insights),
            "insights_accepted": len(accepted),
            "insights_dismissed": len(dismissed),
            "active_plans": len(plans),
        },
        "market": json.loads(market_ctx) if market_ctx != "Market data unavailable." else None,
    }
