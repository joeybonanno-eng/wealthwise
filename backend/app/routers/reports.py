from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/monthly")
def get_monthly_report(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate a comprehensive monthly financial snapshot."""
    from app.models.achievement import Achievement
    from app.models.conversation import Conversation
    from app.models.financial_plan import FinancialPlan
    from app.models.insight import Insight
    from app.models.net_worth_entry import NetWorthEntry
    from app.models.portfolio_holding import PortfolioHolding
    from app.models.price_alert import PriceAlert
    from app.models.recurring_transaction import RecurringTransaction
    from app.models.user_streak import UserStreak
    from app.models.watchlist_item import WatchlistItem

    now = datetime.utcnow()

    # --- Portfolio ---
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()
    portfolio_value = 0.0
    portfolio_cost = 0.0
    holdings_data = []
    for h in holdings:
        try:
            from app.services.market_data_service import get_stock_quote
            quote = get_stock_quote(h.symbol)
            price = quote.get("price") or 0
            mv = price * h.shares
            cb = h.avg_cost * h.shares
            portfolio_value += mv
            portfolio_cost += cb
            holdings_data.append({
                "symbol": h.symbol,
                "shares": h.shares,
                "market_value": round(mv, 2),
                "gain_loss": round(mv - cb, 2),
            })
        except Exception:
            portfolio_cost += h.avg_cost * h.shares

    portfolio_gain = portfolio_value - portfolio_cost
    portfolio_gain_pct = (portfolio_gain / portfolio_cost * 100) if portfolio_cost > 0 else 0

    # --- Net Worth ---
    nw_entries = db.query(NetWorthEntry).filter(NetWorthEntry.user_id == user.id).all()
    total_assets = sum(e.amount for e in nw_entries if e.entry_type == "asset")
    total_liabilities = sum(e.amount for e in nw_entries if e.entry_type == "liability")
    net_worth = total_assets - total_liabilities

    # --- Budget ---
    transactions = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == user.id,
        RecurringTransaction.is_active == True,
    ).all()
    freq_mult = {"weekly": 4.33, "biweekly": 2.17, "monthly": 1.0, "yearly": 1 / 12}
    monthly_income = sum(t.amount * freq_mult.get(t.frequency, 1.0) for t in transactions if t.type == "income")
    monthly_expenses = sum(t.amount * freq_mult.get(t.frequency, 1.0) for t in transactions if t.type == "expense")
    savings_rate = round(((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0, 1)

    expense_by_category: dict[str, float] = {}
    for t in transactions:
        if t.type == "expense":
            amt = t.amount * freq_mult.get(t.frequency, 1.0)
            expense_by_category[t.category] = expense_by_category.get(t.category, 0) + amt

    # --- Activity counts ---
    conversation_count = db.query(Conversation).filter(Conversation.user_id == user.id).count()
    plan_count = db.query(FinancialPlan).filter(FinancialPlan.user_id == user.id).count()
    insight_count = db.query(Insight).filter(Insight.user_id == user.id).count()
    alert_count = db.query(PriceAlert).filter(PriceAlert.user_id == user.id).count()
    watchlist_count = db.query(WatchlistItem).filter(WatchlistItem.user_id == user.id).count()
    badge_count = db.query(Achievement).filter(Achievement.user_id == user.id).count()

    streak = db.query(UserStreak).filter(UserStreak.user_id == user.id).first()

    return {
        "generated_at": now.isoformat(),
        "month": now.strftime("%B %Y"),
        "portfolio": {
            "total_value": round(portfolio_value, 2),
            "total_cost": round(portfolio_cost, 2),
            "total_gain": round(portfolio_gain, 2),
            "total_gain_pct": round(portfolio_gain_pct, 2),
            "positions": len(holdings),
            "top_holdings": sorted(holdings_data, key=lambda x: x["market_value"], reverse=True)[:5],
        },
        "net_worth": {
            "total_assets": round(total_assets, 2),
            "total_liabilities": round(total_liabilities, 2),
            "net_worth": round(net_worth, 2),
        },
        "budget": {
            "monthly_income": round(monthly_income, 2),
            "monthly_expenses": round(monthly_expenses, 2),
            "net_savings": round(monthly_income - monthly_expenses, 2),
            "savings_rate": savings_rate,
            "top_expenses": dict(sorted(expense_by_category.items(), key=lambda x: -x[1])[:5]),
        },
        "activity": {
            "conversations": conversation_count,
            "plans": plan_count,
            "insights": insight_count,
            "alerts": alert_count,
            "watchlist_items": watchlist_count,
            "badges_earned": badge_count,
            "current_streak": streak.current_streak if streak else 0,
            "longest_streak": streak.longest_streak if streak else 0,
        },
    }
