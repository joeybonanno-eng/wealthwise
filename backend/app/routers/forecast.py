from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.recurring_transaction import RecurringTransaction
from app.models.user import User

router = APIRouter(prefix="/api/forecast", tags=["forecast"])

FREQUENCY_MULTIPLIER = {
    "weekly": 4.33,
    "biweekly": 2.17,
    "monthly": 1.0,
    "quarterly": 1.0 / 3.0,
    "yearly": 1.0 / 12.0,
}


@router.get("/cashflow")
def get_cashflow_forecast(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Project monthly cash flow for the next 12 months based on recurring transactions."""
    txns = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.user_id == user.id, RecurringTransaction.is_active == True)
        .all()
    )

    if not txns:
        return {"months": [], "summary": {"avg_net": 0, "total_income_12m": 0, "total_expenses_12m": 0, "projected_savings_12m": 0}}

    # Calculate monthly totals
    monthly_income = 0.0
    monthly_expenses = 0.0
    income_by_cat: dict[str, float] = {}
    expense_by_cat: dict[str, float] = {}

    for t in txns:
        mult = FREQUENCY_MULTIPLIER.get(t.frequency, 1.0)
        monthly_amount = t.amount * mult
        if t.type == "income":
            monthly_income += monthly_amount
            income_by_cat[t.category] = income_by_cat.get(t.category, 0) + monthly_amount
        else:
            monthly_expenses += monthly_amount
            expense_by_cat[t.category] = expense_by_cat.get(t.category, 0) + monthly_amount

    net_monthly = monthly_income - monthly_expenses

    # Generate 12-month projection
    today = date.today()
    months = []
    cumulative_savings = 0.0

    for i in range(12):
        month_date = date(today.year + (today.month + i - 1) // 12, (today.month + i - 1) % 12 + 1, 1)
        cumulative_savings += net_monthly
        months.append({
            "month": month_date.strftime("%Y-%m"),
            "label": month_date.strftime("%b %Y"),
            "income": round(monthly_income, 2),
            "expenses": round(monthly_expenses, 2),
            "net": round(net_monthly, 2),
            "cumulative_savings": round(cumulative_savings, 2),
        })

    return {
        "months": months,
        "income_breakdown": {k: round(v, 2) for k, v in sorted(income_by_cat.items(), key=lambda x: -x[1])},
        "expense_breakdown": {k: round(v, 2) for k, v in sorted(expense_by_cat.items(), key=lambda x: -x[1])},
        "summary": {
            "monthly_income": round(monthly_income, 2),
            "monthly_expenses": round(monthly_expenses, 2),
            "avg_net": round(net_monthly, 2),
            "total_income_12m": round(monthly_income * 12, 2),
            "total_expenses_12m": round(monthly_expenses * 12, 2),
            "projected_savings_12m": round(net_monthly * 12, 2),
        },
    }
