from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.savings_goal import SavingsGoal
from app.models.user import User

router = APIRouter(prefix="/api/savings-goals", tags=["savings-goals"])

CATEGORIES = ["Emergency Fund", "Vacation", "Down Payment", "Car", "Education", "Wedding", "Retirement", "Investment", "General"]


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0
    category: str = "General"
    deadline: Optional[str] = None  # "YYYY-MM-DD"


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    category: Optional[str] = None
    deadline: Optional[str] = None


@router.get("/")
def get_goals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user.id)
        .order_by(SavingsGoal.created_at.desc())
        .all()
    )

    total_target = sum(g.target_amount for g in goals)
    total_saved = sum(g.current_amount for g in goals)

    results = []
    for g in goals:
        pct = round((g.current_amount / g.target_amount * 100) if g.target_amount > 0 else 0, 1)
        remaining = max(g.target_amount - g.current_amount, 0)

        # Calculate monthly needed if deadline exists
        monthly_needed = None
        if g.deadline and remaining > 0:
            today = date.today()
            months_left = (g.deadline.year - today.year) * 12 + (g.deadline.month - today.month)
            if months_left > 0:
                monthly_needed = round(remaining / months_left, 2)

        results.append({
            "id": g.id,
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "category": g.category,
            "deadline": str(g.deadline) if g.deadline else None,
            "progress_pct": pct,
            "remaining": round(remaining, 2),
            "monthly_needed": monthly_needed,
            "created_at": str(g.created_at),
        })

    return {
        "goals": results,
        "summary": {
            "total_goals": len(goals),
            "total_target": round(total_target, 2),
            "total_saved": round(total_saved, 2),
            "overall_progress": round((total_saved / total_target * 100) if total_target > 0 else 0, 1),
        },
        "categories": CATEGORIES,
    }


@router.post("/")
def create_goal(
    data: GoalCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deadline_date = None
    if data.deadline:
        try:
            deadline_date = date.fromisoformat(data.deadline)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")

    goal = SavingsGoal(
        user_id=user.id,
        name=data.name.strip(),
        target_amount=data.target_amount,
        current_amount=data.current_amount,
        category=data.category,
        deadline=deadline_date,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, "name": goal.name, "status": "created"}


@router.put("/{goal_id}")
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if data.name is not None:
        goal.name = data.name.strip()
    if data.target_amount is not None:
        goal.target_amount = data.target_amount
    if data.current_amount is not None:
        goal.current_amount = data.current_amount
    if data.category is not None:
        goal.category = data.category
    if data.deadline is not None:
        try:
            goal.deadline = date.fromisoformat(data.deadline) if data.deadline else None
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")

    db.commit()
    return {"status": "updated"}


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"status": "deleted"}
