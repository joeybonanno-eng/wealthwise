from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.expense_category import ExpenseCategory
from app.models.recurring_transaction import RecurringTransaction
from app.models.user import User

router = APIRouter(prefix="/api/budget", tags=["budget"])


class TransactionCreate(BaseModel):
    name: str
    amount: float
    category: str = "Other"
    frequency: str = "monthly"
    type: str = "expense"
    next_due: Optional[str] = None


class TransactionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    frequency: Optional[str] = None
    type: Optional[str] = None
    is_active: Optional[bool] = None
    next_due: Optional[str] = None


FREQUENCY_MULTIPLIER = {
    "weekly": 4.33,
    "biweekly": 2.17,
    "monthly": 1.0,
    "yearly": 1.0 / 12.0,
}


@router.get("/")
def get_transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txns = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.user_id == user.id)
        .order_by(RecurringTransaction.created_at.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "name": t.name,
            "amount": t.amount,
            "category": t.category,
            "frequency": t.frequency,
            "type": t.type,
            "is_active": t.is_active,
            "next_due": str(t.next_due) if t.next_due else None,
            "created_at": str(t.created_at),
        }
        for t in txns
    ]


@router.post("/")
def create_transaction(
    data: TransactionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = RecurringTransaction(
        user_id=user.id,
        name=data.name,
        amount=data.amount,
        category=data.category,
        frequency=data.frequency,
        type=data.type,
        next_due=datetime.fromisoformat(data.next_due) if data.next_due else None,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return {
        "id": txn.id,
        "name": txn.name,
        "amount": txn.amount,
        "category": txn.category,
        "frequency": txn.frequency,
        "type": txn.type,
        "is_active": txn.is_active,
    }


@router.put("/{txn_id}")
def update_transaction(
    txn_id: int,
    data: TransactionUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.id == txn_id, RecurringTransaction.user_id == user.id)
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for field in ["name", "amount", "category", "frequency", "type", "is_active"]:
        val = getattr(data, field)
        if val is not None:
            setattr(txn, field, val)
    if data.next_due is not None:
        txn.next_due = datetime.fromisoformat(data.next_due)

    db.commit()
    return {"status": "updated"}


@router.delete("/{txn_id}")
def delete_transaction(
    txn_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.id == txn_id, RecurringTransaction.user_id == user.id)
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(txn)
    db.commit()
    return {"status": "deleted"}


@router.get("/summary")
def get_budget_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txns = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.user_id == user.id, RecurringTransaction.is_active == True)
        .all()
    )

    monthly_income = 0.0
    monthly_expenses = 0.0
    by_category: dict[str, float] = {}

    for t in txns:
        multiplier = FREQUENCY_MULTIPLIER.get(t.frequency, 1.0)
        monthly_amount = t.amount * multiplier

        if t.type == "income":
            monthly_income += monthly_amount
        else:
            monthly_expenses += monthly_amount
            by_category[t.category] = by_category.get(t.category, 0) + monthly_amount

    savings_rate = ((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0

    return {
        "monthly_income": round(monthly_income, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "net_savings": round(monthly_income - monthly_expenses, 2),
        "savings_rate": round(savings_rate, 1),
        "by_category": {k: round(v, 2) for k, v in sorted(by_category.items(), key=lambda x: -x[1])},
        "total_transactions": len(txns),
    }


# --- Expense Category CRUD ---

class CategoryCreate(BaseModel):
    name: str
    monthly_budget: float = 0
    color: str = "#10b981"


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    monthly_budget: Optional[float] = None
    color: Optional[str] = None


@router.get("/categories")
def get_categories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cats = (
        db.query(ExpenseCategory)
        .filter(ExpenseCategory.user_id == user.id)
        .order_by(ExpenseCategory.name)
        .all()
    )
    return [
        {
            "id": c.id,
            "name": c.name,
            "monthly_budget": c.monthly_budget,
            "color": c.color,
        }
        for c in cats
    ]


@router.post("/categories")
def create_category(
    data: CategoryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = ExpenseCategory(
        user_id=user.id,
        name=data.name,
        monthly_budget=data.monthly_budget,
        color=data.color,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"id": cat.id, "name": cat.name, "monthly_budget": cat.monthly_budget, "color": cat.color}


@router.put("/categories/{cat_id}")
def update_category(
    cat_id: int,
    data: CategoryUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = (
        db.query(ExpenseCategory)
        .filter(ExpenseCategory.id == cat_id, ExpenseCategory.user_id == user.id)
        .first()
    )
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if data.name is not None:
        cat.name = data.name
    if data.monthly_budget is not None:
        cat.monthly_budget = data.monthly_budget
    if data.color is not None:
        cat.color = data.color
    db.commit()
    return {"status": "updated"}


@router.delete("/categories/{cat_id}")
def delete_category(
    cat_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = (
        db.query(ExpenseCategory)
        .filter(ExpenseCategory.id == cat_id, ExpenseCategory.user_id == user.id)
        .first()
    )
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"status": "deleted"}


# --- AI Spending Insights ---

@router.get("/insights")
def get_spending_insights(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Use Claude Haiku to analyze spending patterns and provide personalized advice."""
    txns = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.user_id == user.id, RecurringTransaction.is_active == True)
        .all()
    )

    if not txns:
        return {"analysis": "Add some recurring transactions first so I can analyze your spending patterns."}

    # Build spending summary for AI
    lines = []
    for t in txns:
        multiplier = FREQUENCY_MULTIPLIER.get(t.frequency, 1.0)
        monthly = t.amount * multiplier
        lines.append(f"- {t.name}: ${monthly:.2f}/month ({t.category}, {t.type})")

    spending_text = "\n".join(lines)

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": f"""Analyze this person's monthly budget and provide 3-4 actionable insights. Be specific, concise, and encouraging. Focus on savings opportunities, spending patterns, and financial health.

Budget:
{spending_text}

Provide your analysis in plain text, no markdown headers."""
            }],
        )
        analysis = response.content[0].text
    except Exception:
        # Fallback if AI is unavailable
        total_income = sum(t.amount * FREQUENCY_MULTIPLIER.get(t.frequency, 1.0) for t in txns if t.type == "income")
        total_expenses = sum(t.amount * FREQUENCY_MULTIPLIER.get(t.frequency, 1.0) for t in txns if t.type == "expense")
        savings_rate = ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0
        analysis = f"Your monthly income is ${total_income:,.2f} and expenses are ${total_expenses:,.2f}, giving you a savings rate of {savings_rate:.1f}%. "
        if savings_rate >= 20:
            analysis += "Great job! You're saving well above the recommended 20% threshold."
        elif savings_rate >= 0:
            analysis += "Consider looking for ways to reduce expenses or increase income to boost your savings rate toward the recommended 20%."
        else:
            analysis += "You're currently spending more than you earn. Review your expenses for areas where you can cut back."

    return {"analysis": analysis}
