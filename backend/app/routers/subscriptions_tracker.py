from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.recurring_transaction import RecurringTransaction
from app.models.user import User

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions-tracker"])

# Frequency multipliers to get annual cost
FREQ_TO_ANNUAL = {
    "weekly": 52,
    "biweekly": 26,
    "monthly": 12,
    "yearly": 1,
}

# Common subscription categories
SUB_CATEGORIES = [
    "Streaming", "Music", "Software", "Cloud Storage", "Fitness",
    "News", "Gaming", "Food Delivery", "Insurance", "Other",
]


@router.get("/")
def get_subscriptions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get all expense transactions that look like subscriptions,
    with annual cost projections and summary stats.
    """
    transactions = (
        db.query(RecurringTransaction)
        .filter(
            RecurringTransaction.user_id == user.id,
            RecurringTransaction.type == "expense",
            RecurringTransaction.is_active == True,
        )
        .order_by(RecurringTransaction.amount.desc())
        .all()
    )

    subs = []
    total_monthly = 0.0
    total_annual = 0.0
    by_category: dict[str, float] = {}

    for t in transactions:
        freq = t.frequency or "monthly"
        annual_mult = FREQ_TO_ANNUAL.get(freq, 12)
        monthly_mult = annual_mult / 12
        monthly_cost = t.amount * monthly_mult
        annual_cost = t.amount * annual_mult

        total_monthly += monthly_cost
        total_annual += annual_cost
        by_category[t.category] = by_category.get(t.category, 0) + annual_cost

        subs.append({
            "id": t.id,
            "name": t.name,
            "amount": t.amount,
            "frequency": freq,
            "category": t.category,
            "monthly_cost": round(monthly_cost, 2),
            "annual_cost": round(annual_cost, 2),
            "next_due": str(t.next_due) if t.next_due else None,
            "is_active": t.is_active,
        })

    return {
        "subscriptions": subs,
        "summary": {
            "count": len(subs),
            "total_monthly": round(total_monthly, 2),
            "total_annual": round(total_annual, 2),
            "daily_cost": round(total_annual / 365, 2),
            "by_category": {k: round(v, 2) for k, v in sorted(by_category.items(), key=lambda x: -x[1])},
        },
        "categories": SUB_CATEGORIES,
    }
