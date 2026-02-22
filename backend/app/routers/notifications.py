from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.notification_preference import NotificationPreference
from app.models.user import User

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NotificationPrefUpdate(BaseModel):
    email_briefing: Optional[bool] = None
    email_alerts: Optional[bool] = None
    email_insights: Optional[bool] = None
    push_enabled: Optional[bool] = None
    briefing_frequency: Optional[str] = None


@router.get("/preferences")
def get_preferences(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user.id
    ).first()

    if not pref:
        # Return defaults
        return {
            "email_briefing": True,
            "email_alerts": True,
            "email_insights": True,
            "push_enabled": False,
            "briefing_frequency": "daily",
        }

    return {
        "email_briefing": pref.email_briefing,
        "email_alerts": pref.email_alerts,
        "email_insights": pref.email_insights,
        "push_enabled": pref.push_enabled,
        "briefing_frequency": pref.briefing_frequency,
    }


@router.put("/preferences")
def update_preferences(
    data: NotificationPrefUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user.id
    ).first()

    if not pref:
        pref = NotificationPreference(user_id=user.id)
        db.add(pref)

    if data.email_briefing is not None:
        pref.email_briefing = data.email_briefing
    if data.email_alerts is not None:
        pref.email_alerts = data.email_alerts
    if data.email_insights is not None:
        pref.email_insights = data.email_insights
    if data.push_enabled is not None:
        pref.push_enabled = data.push_enabled
    if data.briefing_frequency is not None:
        pref.briefing_frequency = data.briefing_frequency

    db.commit()
    return {"status": "updated"}
