from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.insight import InsightListResponse, InsightResponse
from app.services.entitlement_service import check_entitlement, increment_usage
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
    # Check insight entitlement (throttling)
    entitlement = check_entitlement(db, user, "insights")
    if not entitlement["allowed"]:
        limit = entitlement["limit"]
        raise HTTPException(
            status_code=403,
            detail=f"You've reached your daily limit of {limit} insight generation{'s' if limit != 1 else ''}. {'Upgrade to Pro for more.' if not entitlement['is_pro'] else 'Try again tomorrow.'}",
        )

    insights = generate_insights(db, user)
    increment_usage(db, user.id, "insights")
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
