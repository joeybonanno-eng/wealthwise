from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.insight import InsightListResponse, InsightResponse
from app.services.insight_service import (
    accept_insight,
    dismiss_insight,
    generate_insights,
    get_pending_insights,
)

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/", response_model=InsightListResponse)
def list_insights(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    insights = get_pending_insights(db, user.id)
    return InsightListResponse(
        insights=[InsightResponse.model_validate(i) for i in insights],
        total=len(insights),
    )


@router.post("/generate", response_model=InsightListResponse)
def generate_user_insights(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    insights = generate_insights(db, user)
    return InsightListResponse(
        insights=[InsightResponse.model_validate(i) for i in insights],
        total=len(insights),
    )


@router.post("/{insight_id}/accept", response_model=InsightResponse)
def accept_user_insight(
    insight_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    insight = accept_insight(db, insight_id, user.id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    return insight


@router.post("/{insight_id}/dismiss", response_model=InsightResponse)
def dismiss_user_insight(
    insight_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    insight = dismiss_insight(db, insight_id, user.id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    return insight
