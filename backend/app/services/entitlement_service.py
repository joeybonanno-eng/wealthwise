from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.usage_tracking import UsageTracking
from app.models.user import User

FREE_LIMITS = {
    "messages": 5,       # per month
    "plans": 1,
    "alerts": 3,
    "insights": 1,       # per day
}

PRO_LIMITS = {
    "messages": -1,      # unlimited
    "plans": -1,
    "alerts": -1,
    "insights": 5,       # per day
}


def _has_active_subscription(user: User) -> bool:
    return user.subscription is not None and user.subscription.status == "active"


def _get_current_period(feature: str) -> tuple[datetime, datetime]:
    """Return (period_start, period_end) for the current billing period."""
    now = datetime.utcnow()
    if feature == "insights":
        # Daily limit
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
    else:
        # Monthly limit
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            end = start.replace(year=now.year + 1, month=1)
        else:
            end = start.replace(month=now.month + 1)
    return start, end


def get_usage(db: Session, user_id: int, feature: str) -> int:
    """Get current usage count for a feature in the current period."""
    period_start, period_end = _get_current_period(feature)

    record = (
        db.query(UsageTracking)
        .filter(
            UsageTracking.user_id == user_id,
            UsageTracking.feature == feature,
            UsageTracking.period_start == period_start,
        )
        .first()
    )
    return record.count if record else 0


def increment_usage(db: Session, user_id: int, feature: str) -> int:
    """Increment usage count and return new count."""
    period_start, period_end = _get_current_period(feature)

    record = (
        db.query(UsageTracking)
        .filter(
            UsageTracking.user_id == user_id,
            UsageTracking.feature == feature,
            UsageTracking.period_start == period_start,
        )
        .first()
    )

    if record:
        record.count += 1
        db.commit()
        return record.count
    else:
        record = UsageTracking(
            user_id=user_id,
            feature=feature,
            count=1,
            period_start=period_start,
            period_end=period_end,
        )
        db.add(record)
        db.commit()
        return 1


def check_entitlement(db: Session, user: User, feature: str) -> dict:
    """Check if user can use a feature. Returns dict with allowed, usage, limit, is_pro."""
    is_pro = _has_active_subscription(user)
    limits = PRO_LIMITS if is_pro else FREE_LIMITS
    limit = limits.get(feature, 0)
    usage = get_usage(db, user.id, feature)

    allowed = limit == -1 or usage < limit
    return {
        "allowed": allowed,
        "usage": usage,
        "limit": limit,
        "is_pro": is_pro,
    }


def get_all_usage(db: Session, user: User) -> dict:
    """Get usage summary for all features."""
    is_pro = _has_active_subscription(user)
    limits = PRO_LIMITS if is_pro else FREE_LIMITS

    result = {}
    for feature in FREE_LIMITS:
        usage = get_usage(db, user.id, feature)
        limit = limits[feature]
        result[feature] = {
            "usage": usage,
            "limit": limit,
            "remaining": max(0, limit - usage) if limit != -1 else -1,
        }

    result["is_pro"] = is_pro
    return result
