import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.financial_plan import FinancialPlan
from app.models.user import User

router = APIRouter(prefix="/api/timeline", tags=["timeline"])


@router.get("/")
def get_timeline(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plans = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.user_id == user.id, FinancialPlan.status == "active")
        .order_by(FinancialPlan.created_at)
        .all()
    )

    milestones = []
    for plan in plans:
        plan_data = {}
        try:
            plan_data = json.loads(plan.data) if plan.data else {}
        except (json.JSONDecodeError, TypeError):
            pass

        timeline = plan_data.get("timeline", "")

        milestones.append({
            "id": plan.id,
            "title": plan.title,
            "type": plan.plan_type,
            "timeline": timeline,
            "status": plan.status,
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
        })

    return {"milestones": milestones}
