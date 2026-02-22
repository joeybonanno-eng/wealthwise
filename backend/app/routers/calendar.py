from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/")
def get_financial_calendar(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aggregate upcoming financial events into a calendar view."""
    from app.models.portfolio_holding import PortfolioHolding
    from app.models.price_alert import PriceAlert
    from app.models.recurring_transaction import RecurringTransaction
    from app.models.savings_goal import SavingsGoal
    from app.services.market_data_service import _get_info

    events = []
    today = date.today()

    # Upcoming bill due dates from recurring transactions
    transactions = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.user_id == user.id, RecurringTransaction.is_active == True)
        .all()
    )
    for t in transactions:
        if t.next_due:
            due_date = t.next_due.date() if hasattr(t.next_due, 'date') else t.next_due
            if due_date >= today:
                events.append({
                    "date": str(due_date),
                    "type": "bill",
                    "title": f"{t.name} due",
                    "detail": f"${t.amount:.2f} ({t.type})",
                    "category": t.category,
                })

    # Ex-dividend dates from portfolio holdings
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()
    for h in holdings:
        try:
            info = _get_info(h.symbol)
            ex_date_ts = info.get("exDividendDate")
            if ex_date_ts:
                from datetime import datetime as dt
                ex_date = dt.fromtimestamp(ex_date_ts).date() if isinstance(ex_date_ts, (int, float)) else None
                if ex_date and ex_date >= today:
                    div_rate = info.get("dividendRate") or 0
                    events.append({
                        "date": str(ex_date),
                        "type": "dividend",
                        "title": f"{h.symbol} ex-dividend",
                        "detail": f"${div_rate:.2f}/share x {h.shares} shares",
                        "category": "Dividends",
                    })
        except Exception:
            continue

    # Savings goal deadlines
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id).all()
    for g in goals:
        if g.deadline and g.deadline >= today:
            pct = round((g.current_amount / g.target_amount * 100) if g.target_amount > 0 else 0)
            events.append({
                "date": str(g.deadline),
                "type": "goal",
                "title": f"{g.name} deadline",
                "detail": f"{pct}% complete (${g.current_amount:,.0f} / ${g.target_amount:,.0f})",
                "category": g.category,
            })

    # Active price alerts (show as ongoing reminders)
    alerts = (
        db.query(PriceAlert)
        .filter(PriceAlert.user_id == user.id, PriceAlert.is_active == True)
        .all()
    )
    for a in alerts:
        events.append({
            "date": str(today),
            "type": "alert",
            "title": f"{a.symbol} price alert",
            "detail": f"{a.condition} ${a.target_price:.2f}",
            "category": "Alerts",
        })

    # Sort by date
    events.sort(key=lambda e: e["date"])

    # Group by date
    grouped: dict[str, list] = {}
    for e in events:
        d = e["date"]
        if d not in grouped:
            grouped[d] = []
        grouped[d].append(e)

    return {
        "events": events,
        "grouped": grouped,
        "total": len(events),
    }
