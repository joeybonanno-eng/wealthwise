from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.briefing_service import generate_daily_briefing, generate_weekly_briefing

router = APIRouter(prefix="/api/briefing", tags=["briefing"])


@router.get("/daily")
def daily_briefing(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return generate_daily_briefing(db, user)


@router.get("/weekly")
def weekly_briefing(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return generate_weekly_briefing(db, user)
