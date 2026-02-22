from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.net_worth_entry import NetWorthEntry
from app.models.portfolio_holding import PortfolioHolding
from app.models.recurring_transaction import RecurringTransaction
from app.models.savings_goal import SavingsGoal
from app.models.user import User
from app.services.market_data_service import get_company_info, get_stock_quote

router = APIRouter(prefix="/api/health-score", tags=["health-score"])


@router.get("/")
def get_financial_health_score(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Calculate a comprehensive financial health score (0-100) from multiple factors."""

    factors = []

    # --- Factor 1: Savings Rate (0-25 pts) ---
    txns = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == user.id, RecurringTransaction.is_active == True
    ).all()

    freq_mult = {"weekly": 4.33, "biweekly": 2.17, "monthly": 1.0, "quarterly": 1.0 / 3.0, "yearly": 1.0 / 12.0}
    monthly_income = sum(t.amount * freq_mult.get(t.frequency, 1.0) for t in txns if t.type == "income")
    monthly_expenses = sum(t.amount * freq_mult.get(t.frequency, 1.0) for t in txns if t.type == "expense")
    savings_rate = ((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0

    # 20%+ savings rate = full marks
    savings_score = min(max(savings_rate / 20 * 25, 0), 25)
    factors.append({
        "name": "Savings Rate",
        "score": round(savings_score, 1),
        "max": 25,
        "detail": f"{savings_rate:.1f}% (target: 20%+)",
        "status": "good" if savings_rate >= 20 else "warning" if savings_rate >= 10 else "poor",
    })

    # --- Factor 2: Debt-to-Income Ratio (0-25 pts) ---
    nw_entries = db.query(NetWorthEntry).filter(NetWorthEntry.user_id == user.id).all()
    total_debt = sum(e.amount for e in nw_entries if e.entry_type == "liability")
    annual_income = monthly_income * 12

    if annual_income > 0:
        dti = total_debt / annual_income * 100
        # 0% DTI = 25 pts, 100%+ DTI = 0 pts
        dti_score = max(25 - (dti / 100 * 25), 0)
    else:
        dti = 0
        dti_score = 12.5  # neutral if no income data
    factors.append({
        "name": "Debt-to-Income",
        "score": round(dti_score, 1),
        "max": 25,
        "detail": f"{dti:.0f}% (target: <36%)",
        "status": "good" if dti < 36 else "warning" if dti < 50 else "poor",
    })

    # --- Factor 3: Emergency Fund (0-25 pts) ---
    total_cash = sum(e.amount for e in nw_entries if e.entry_type == "asset" and e.category in ("Cash", "Savings"))
    months_covered = (total_cash / monthly_expenses) if monthly_expenses > 0 else 0

    # 6+ months = full marks
    ef_score = min(months_covered / 6 * 25, 25)
    factors.append({
        "name": "Emergency Fund",
        "score": round(ef_score, 1),
        "max": 25,
        "detail": f"{months_covered:.1f} months (target: 6+)",
        "status": "good" if months_covered >= 6 else "warning" if months_covered >= 3 else "poor",
    })

    # --- Factor 4: Investment Diversification (0-25 pts) ---
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()
    sectors = set()
    total_value = 0.0
    max_weight = 0.0

    for h in holdings:
        try:
            quote = get_stock_quote(h.symbol)
            info = get_company_info(h.symbol)
            price = quote.get("price") or 0
            sector = info.get("sector", "Unknown") or "Unknown"
            mv = price * h.shares
            total_value += mv
            sectors.add(sector)
        except Exception:
            pass

    if holdings:
        # More sectors and positions = better
        num_positions = len(holdings)
        num_sectors = len(sectors)
        position_pts = min(num_positions / 10 * 12.5, 12.5)
        sector_pts = min(num_sectors / 5 * 12.5, 12.5)
        div_score = position_pts + sector_pts
    else:
        div_score = 0

    factors.append({
        "name": "Diversification",
        "score": round(div_score, 1),
        "max": 25,
        "detail": f"{len(holdings)} positions, {len(sectors)} sectors",
        "status": "good" if div_score >= 18 else "warning" if div_score >= 10 else "poor",
    })

    # --- Total Score ---
    total_score = round(sum(f["score"] for f in factors))
    total_score = min(max(total_score, 0), 100)

    if total_score >= 80:
        grade = "A"
        label = "Excellent"
    elif total_score >= 60:
        grade = "B"
        label = "Good"
    elif total_score >= 40:
        grade = "C"
        label = "Fair"
    elif total_score >= 20:
        grade = "D"
        label = "Needs Work"
    else:
        grade = "F"
        label = "Critical"

    # Top recommendations
    recommendations = []
    worst = sorted(factors, key=lambda f: f["score"] / f["max"])
    for f in worst[:2]:
        if f["status"] != "good":
            if f["name"] == "Savings Rate":
                recommendations.append("Increase your savings rate by reducing discretionary spending or boosting income.")
            elif f["name"] == "Debt-to-Income":
                recommendations.append("Focus on paying down high-interest debt to lower your debt-to-income ratio.")
            elif f["name"] == "Emergency Fund":
                recommendations.append("Build your emergency fund to cover at least 6 months of expenses.")
            elif f["name"] == "Diversification":
                recommendations.append("Diversify your portfolio across more sectors and positions.")

    return {
        "score": total_score,
        "grade": grade,
        "label": label,
        "factors": factors,
        "recommendations": recommendations,
        "metrics": {
            "savings_rate": round(savings_rate, 1),
            "debt_to_income": round(dti, 1),
            "emergency_months": round(months_covered, 1),
            "positions": len(holdings),
            "sectors": len(sectors),
        },
    }
