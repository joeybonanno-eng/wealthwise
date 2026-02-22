from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.subscription import Subscription
from app.models.user import User
from app.models.webhook_event import WebhookEvent

router = APIRouter(prefix="/api/subscription", tags=["subscription"])


@router.get("/status")
def get_subscription_status(user: User = Depends(get_current_user)):
    if not user.subscription:
        return {"status": "inactive", "has_subscription": False}

    sub = user.subscription
    now = datetime.utcnow()

    # Determine effective access
    has_access = sub.status == "active"
    if sub.status == "canceled" and sub.current_period_end and now < sub.current_period_end:
        has_access = True
    if sub.status == "past_due":
        has_access = True  # Grace period handled by entitlement service

    return {
        "status": sub.status,
        "has_subscription": has_access,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "cancel_at_period_end": sub.cancel_at_period_end or False,
    }


@router.post("/webhook/sync")
async def sync_subscription(request: Request, db: Session = Depends(get_db)):
    """Called by the Next.js frontend after Stripe webhook events to sync subscription state."""
    data = await request.json()

    # Idempotency check — skip already-processed events
    stripe_event_id = data.get("stripe_event_id")
    if stripe_event_id:
        existing = db.query(WebhookEvent).filter(
            WebhookEvent.stripe_event_id == stripe_event_id
        ).first()
        if existing:
            return {"status": "ok", "message": "already processed"}

    user_id = data.get("user_id")
    stripe_subscription_id = data.get("stripe_subscription_id")
    status = data.get("status")
    period_start = data.get("current_period_start")
    period_end = data.get("current_period_end")
    stripe_customer_id = data.get("stripe_customer_id")
    cancel_at_period_end = data.get("cancel_at_period_end")

    # Find subscription by stripe_subscription_id first, then by user_id
    subscription = None
    user = None

    if stripe_subscription_id:
        subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        if subscription:
            user = db.query(User).filter(User.id == subscription.user_id).first()

    if not user and user_id:
        user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if stripe_customer_id:
        user.stripe_customer_id = stripe_customer_id

    if not subscription:
        subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not subscription:
        subscription = Subscription(user_id=user.id)
        db.add(subscription)

    if stripe_subscription_id:
        subscription.stripe_subscription_id = stripe_subscription_id

    # Handle status transitions
    if status:
        old_status = subscription.status

        # Track when subscription first goes past_due for grace period
        if status == "past_due" and old_status != "past_due":
            subscription.past_due_since = datetime.utcnow()
        elif status == "active" and old_status == "past_due":
            # Payment recovered — clear past_due tracking
            subscription.past_due_since = None

        subscription.status = status

    if cancel_at_period_end is not None:
        subscription.cancel_at_period_end = cancel_at_period_end

    if period_start:
        subscription.current_period_start = datetime.fromtimestamp(period_start)
    if period_end:
        subscription.current_period_end = datetime.fromtimestamp(period_end)

    # Record event for idempotency
    if stripe_event_id:
        event_record = WebhookEvent(
            stripe_event_id=stripe_event_id,
            event_type=data.get("event_type", "unknown"),
        )
        db.add(event_record)

    db.commit()
    return {"status": "ok"}
