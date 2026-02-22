import json
import logging
from datetime import datetime
from typing import List

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


def generate_insights(db: Session, user: User) -> List[Insight]:
    """Generate AI-powered insights for a user based on their financial context."""
    # Gather context
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    plans = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.user_id == user.id, FinancialPlan.status == "active")
        .all()
    )
    recent_conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .limit(5)
        .all()
    )
    memories = db.query(UserMemory).filter(UserMemory.user_id == user.id).all()

    # Build context sections
    profile_ctx = "No financial profile set up yet."
    if profile:
        profile_ctx = json.dumps({
            "age": profile.age,
            "annual_income": profile.annual_income,
            "monthly_expenses": profile.monthly_expenses,
            "total_savings": profile.total_savings,
            "total_debt": profile.total_debt,
            "risk_tolerance": profile.risk_tolerance,
            "investment_goals": profile.investment_goals,
            "experience_level": profile.experience_level,
            "investment_timeline": profile.investment_timeline,
        }, default=str)

    plans_ctx = "No active financial plans."
    if plans:
        plans_ctx = json.dumps([
            {"id": p.id, "title": p.title, "type": p.plan_type}
            for p in plans
        ])

    conversations_ctx = "No recent conversations."
    if recent_conversations:
        conversations_ctx = json.dumps([c.title for c in recent_conversations])

    memory_ctx = "No behavioral memory yet."
    if memories:
        memory_ctx = json.dumps([
            {"key": m.key, "value": m.value, "source": m.source}
            for m in memories
        ])

    # Get market snapshot
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

    system_prompt = f"""You are a proactive AI financial advisor. Analyze the user's financial situation and generate 1-3 actionable insights.

USER PROFILE:
{profile_ctx}

ACTIVE FINANCIAL PLANS:
{plans_ctx}

RECENT CONVERSATION TOPICS:
{conversations_ctx}

BEHAVIORAL MEMORY:
{memory_ctx}

CURRENT MARKET SNAPSHOT:
{market_ctx}

Generate insights that are specific, actionable, and relevant. Each insight should help the user make better financial decisions.

Return a JSON array of 1-3 insights. Each insight must have:
- type: one of "opportunity", "warning", "suggestion", "milestone", "nudge"
- title: short headline (max 80 chars)
- body: 2-3 sentence explanation
- reasoning: why this insight is relevant to this specific user
- confidence: float 0.0-1.0 (how confident you are this is useful)
- urgency: one of "low", "medium", "high", "critical"
- impact: one of "low", "medium", "high"
- trigger: what data point triggered this insight
- actions: JSON array of 1-2 suggested action strings

Return ONLY the JSON array, no other text."""

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": "Generate financial insights for me based on my profile and current situation."}],
        system=system_prompt,
    )

    # Parse response
    response_text = response.content[0].text.strip()
    # Handle markdown code blocks
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[1]
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

    try:
        insights_data = json.loads(response_text)
    except json.JSONDecodeError:
        logger.error("Failed to parse Claude insight response: %s", response_text)
        return []

    created_insights = []
    for data in insights_data:
        insight = Insight(
            user_id=user.id,
            type=data.get("type", "suggestion"),
            title=data.get("title", "Financial Insight"),
            body=data.get("body", ""),
            reasoning=data.get("reasoning", ""),
            confidence=float(data.get("confidence", 0.7)),
            urgency=data.get("urgency", "medium"),
            impact=data.get("impact", "medium"),
            actions=json.dumps(data.get("actions", [])),
            trigger=data.get("trigger", "profile_analysis"),
            status="pending",
        )
        db.add(insight)
        created_insights.append(insight)

    db.commit()
    for i in created_insights:
        db.refresh(i)

    return created_insights


def get_pending_insights(db: Session, user_id: int) -> List[Insight]:
    """Get pending/delivered insights for a user, ordered by urgency and recency."""
    urgency_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}

    insights = (
        db.query(Insight)
        .filter(Insight.user_id == user_id, Insight.status.in_(["pending", "delivered"]))
        .all()
    )

    # Sort by urgency then created_at desc
    insights.sort(key=lambda i: (urgency_order.get(i.urgency, 2), -(i.created_at.timestamp() if i.created_at else 0)))
    insights = insights[:10]

    # Mark as delivered
    now = datetime.utcnow()
    for insight in insights:
        if insight.status == "pending":
            insight.status = "delivered"
            insight.delivered_at = now

    db.commit()
    return insights


def accept_insight(db: Session, insight_id: str, user_id: int) -> Insight:
    """Mark an insight as accepted."""
    insight = (
        db.query(Insight)
        .filter(Insight.id == insight_id, Insight.user_id == user_id)
        .first()
    )
    if not insight:
        return None
    insight.status = "accepted"
    insight.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(insight)
    return insight


def dismiss_insight(db: Session, insight_id: str, user_id: int) -> Insight:
    """Mark an insight as dismissed."""
    insight = (
        db.query(Insight)
        .filter(Insight.id == insight_id, Insight.user_id == user_id)
        .first()
    )
    if not insight:
        return None
    insight.status = "dismissed"
    insight.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(insight)
    return insight
