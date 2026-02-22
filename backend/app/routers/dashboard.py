from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/")
def get_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aggregate key metrics from all features into one dashboard view."""
    from app.models.achievement import Achievement
    from app.models.insight import Insight
    from app.models.net_worth_entry import NetWorthEntry
    from app.models.portfolio_holding import PortfolioHolding
    from app.models.price_alert import PriceAlert
    from app.models.recurring_transaction import RecurringTransaction
    from app.models.user_streak import UserStreak
    from app.models.watchlist_item import WatchlistItem

    # Portfolio summary
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()
    portfolio_value = 0.0
    portfolio_cost = 0.0
    for h in holdings:
        try:
            from app.services.market_data_service import get_stock_quote
            quote = get_stock_quote(h.symbol)
            price = quote.get("price") or 0
            portfolio_value += price * h.shares
        except Exception:
            pass
        portfolio_cost += h.avg_cost * h.shares
    portfolio_gain = portfolio_value - portfolio_cost
    portfolio_gain_pct = (portfolio_gain / portfolio_cost * 100) if portfolio_cost > 0 else 0

    # Net worth
    nw_entries = db.query(NetWorthEntry).filter(NetWorthEntry.user_id == user.id).all()
    total_assets = sum(e.amount for e in nw_entries if e.entry_type == "asset")
    total_liabilities = sum(e.amount for e in nw_entries if e.entry_type == "liability")
    net_worth = total_assets - total_liabilities

    # Budget summary
    transactions = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == user.id,
        RecurringTransaction.is_active == True,
    ).all()
    monthly_income = sum(t.amount for t in transactions if t.type == "income")
    monthly_expenses = sum(t.amount for t in transactions if t.type == "expense")
    savings_rate = round(((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0, 1)

    # Streak & badges
    streak = db.query(UserStreak).filter(UserStreak.user_id == user.id).first()
    badge_count = db.query(Achievement).filter(Achievement.user_id == user.id).count()

    # Watchlist buy signals
    watchlist_items = db.query(WatchlistItem).filter(WatchlistItem.user_id == user.id).all()
    buy_signals = 0
    for item in watchlist_items:
        if item.target_buy_price:
            try:
                from app.services.market_data_service import get_stock_quote
                quote = get_stock_quote(item.symbol)
                price = quote.get("price")
                if price and price <= item.target_buy_price:
                    buy_signals += 1
            except Exception:
                pass

    # Pending insights
    pending_insights = db.query(Insight).filter(
        Insight.user_id == user.id,
        Insight.status == "pending",
    ).count()

    # Active alerts
    active_alerts = db.query(PriceAlert).filter(
        PriceAlert.user_id == user.id,
        PriceAlert.is_active == True,
    ).count()

    return {
        "portfolio": {
            "total_value": round(portfolio_value, 2),
            "total_gain": round(portfolio_gain, 2),
            "total_gain_pct": round(portfolio_gain_pct, 2),
            "positions": len(holdings),
        },
        "net_worth": {
            "total_assets": round(total_assets, 2),
            "total_liabilities": round(total_liabilities, 2),
            "net_worth": round(net_worth, 2),
        },
        "budget": {
            "monthly_income": round(monthly_income, 2),
            "monthly_expenses": round(monthly_expenses, 2),
            "savings_rate": savings_rate,
        },
        "streak": {
            "current": streak.current_streak if streak else 0,
            "longest": streak.longest_streak if streak else 0,
        },
        "badges_earned": badge_count,
        "watchlist_buy_signals": buy_signals,
        "pending_insights": pending_insights,
        "active_alerts": active_alerts,
    }
