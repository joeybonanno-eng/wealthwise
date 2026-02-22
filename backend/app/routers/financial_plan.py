import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_subscription
from app.models.financial_plan import FinancialPlan
from app.models.user import User
from app.schemas.financial_plan import CreatePlanRequest, PlanResponse
from app.services import chat_service

router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.post("/", response_model=PlanResponse)
def create_plan(
    request: CreatePlanRequest,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    # Generate AI plan if not provided
    ai_plan = request.ai_plan
    if not ai_plan:
        try:
            ai_plan = chat_service.generate_financial_plan(db, user, request.data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Plan generation error: {str(e)}")

    plan = FinancialPlan(
        user_id=user.id,
        title=request.title,
        plan_type=request.plan_type,
        data=json.dumps(request.data),
        ai_plan=ai_plan,
        status="active",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/", response_model=List[PlanResponse])
def list_plans(
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    plans = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.user_id == user.id)
        .order_by(FinancialPlan.created_at.desc())
        .all()
    )
    return plans


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(
    plan_id: int,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    plan = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.id == plan_id, FinancialPlan.user_id == user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    plan = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.id == plan_id, FinancialPlan.user_id == user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return {"status": "deleted"}
