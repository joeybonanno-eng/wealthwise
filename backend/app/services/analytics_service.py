from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.conversation import Conversation, Message
from app.models.financial_plan import FinancialPlan
from app.models.insight import Insight
from app.models.subscription import Subscription
from app.models.usage_tracking import UsageTracking
from app.models.user import User


def get_analytics(db: Session) -> dict:
    """Compute admin analytics across the entire platform."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # --- User metrics ---
    total_users = db.query(func.count(User.id)).scalar() or 0

    # Daily active users (users who sent a message today)
    dau = (
        db.query(func.count(func.distinct(Conversation.user_id)))
        .join(Message, Message.conversation_id == Conversation.id)
        .filter(Message.created_at >= today_start, Message.role == "user")
        .scalar()
    ) or 0

    # Weekly active users
    wau = (
        db.query(func.count(func.distinct(Conversation.user_id)))
        .join(Message, Message.conversation_id == Conversation.id)
        .filter(Message.created_at >= week_ago, Message.role == "user")
        .scalar()
    ) or 0

    # New users this week
    new_users_week = (
        db.query(func.count(User.id))
        .filter(User.created_at >= week_ago)
        .scalar()
    ) or 0

    # --- Subscription metrics ---
    active_subs = (
        db.query(func.count(Subscription.id))
        .filter(Subscription.status == "active")
        .scalar()
    ) or 0

    canceled_subs = (
        db.query(func.count(Subscription.id))
        .filter(Subscription.status == "canceled")
        .scalar()
    ) or 0

    past_due_subs = (
        db.query(func.count(Subscription.id))
        .filter(Subscription.status == "past_due")
        .scalar()
    ) or 0

    conversion_rate = round((active_subs / total_users * 100), 1) if total_users > 0 else 0

    # --- Message metrics ---
    total_messages = db.query(func.count(Message.id)).scalar() or 0

    messages_today = (
        db.query(func.count(Message.id))
        .filter(Message.created_at >= today_start, Message.role == "user")
        .scalar()
    ) or 0

    messages_this_week = (
        db.query(func.count(Message.id))
        .filter(Message.created_at >= week_ago, Message.role == "user")
        .scalar()
    ) or 0

    total_conversations = db.query(func.count(Conversation.id)).scalar() or 0

    # --- Insight metrics ---
    total_insights = db.query(func.count(Insight.id)).scalar() or 0

    accepted_insights = (
        db.query(func.count(Insight.id))
        .filter(Insight.status == "accepted")
        .scalar()
    ) or 0

    dismissed_insights = (
        db.query(func.count(Insight.id))
        .filter(Insight.status == "dismissed")
        .scalar()
    ) or 0

    resolved = accepted_insights + dismissed_insights
    insight_acceptance_rate = round((accepted_insights / resolved * 100), 1) if resolved > 0 else 0

    # --- Feature adoption ---
    users_with_plans = (
        db.query(func.count(func.distinct(FinancialPlan.user_id))).scalar()
    ) or 0

    users_with_profiles = (
        db.query(func.count(func.distinct(User.id)))
        .filter(User.financial_profile != None)  # noqa: E711
        .scalar()
    ) or 0

    total_plans = db.query(func.count(FinancialPlan.id)).scalar() or 0

    # --- Daily message volume (last 7 days) ---
    daily_volume = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = (
            db.query(func.count(Message.id))
            .filter(Message.created_at >= day_start, Message.created_at < day_end, Message.role == "user")
            .scalar()
        ) or 0
        daily_volume.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "label": day_start.strftime("%a"),
            "count": count,
        })

    return {
        "users": {
            "total": total_users,
            "dau": dau,
            "wau": wau,
            "new_this_week": new_users_week,
        },
        "subscriptions": {
            "active": active_subs,
            "canceled": canceled_subs,
            "past_due": past_due_subs,
            "conversion_rate": conversion_rate,
        },
        "messages": {
            "total": total_messages,
            "today": messages_today,
            "this_week": messages_this_week,
            "total_conversations": total_conversations,
        },
        "insights": {
            "total": total_insights,
            "accepted": accepted_insights,
            "dismissed": dismissed_insights,
            "acceptance_rate": insight_acceptance_rate,
        },
        "features": {
            "users_with_plans": users_with_plans,
            "users_with_profiles": users_with_profiles,
            "total_plans": total_plans,
            "plan_adoption_rate": round((users_with_plans / total_users * 100), 1) if total_users > 0 else 0,
            "profile_completion_rate": round((users_with_profiles / total_users * 100), 1) if total_users > 0 else 0,
        },
        "daily_volume": daily_volume,
    }
