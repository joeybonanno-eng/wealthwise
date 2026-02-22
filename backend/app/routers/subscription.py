from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.subscription import Subscription
from app.models.user import User

router = APIRouter(prefix="/api/subscription", tags=["subscription"])


@router.get("/status")
def get_subscription_status(user: User = Depends(get_current_user)):
    if not user.subscription:
        return {"status": "inactive", "has_subscription": False}
    return {
        "status": user.subscription.status,
        "has_subscription": user.subscription.status == "active",
        "current_period_end": user.subscription.current_period_end.isoformat() if user.subscription.current_period_end else None,
    }


@router.post("/webhook/sync")
async def sync_subscription(request: Request, db: Session = Depends(get_db)):
    """Called by the Next.js frontend after Stripe webhook events to sync subscription state."""
    data = await request.json()
    user_id = data.get("user_id")
    stripe_subscription_id = data.get("stripe_subscription_id")
    status = data.get("status")
    period_start = data.get("current_period_start")
    period_end = data.get("current_period_end")
    stripe_customer_id = data.get("stripe_customer_id")

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if stripe_customer_id:
        user.stripe_customer_id = stripe_customer_id

    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if not subscription:
        subscription = Subscription(user_id=user_id)
        db.add(subscription)

    if stripe_subscription_id:
        subscription.stripe_subscription_id = stripe_subscription_id
    if status:
        subscription.status = status
    if period_start:
        subscription.current_period_start = datetime.fromtimestamp(period_start)
    if period_end:
        subscription.current_period_end = datetime.fromtimestamp(period_end)

    db.commit()
    return {"status": "ok"}
