from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.financial_plan import FinancialPlan
from app.models.financial_profile import FinancialProfile
from app.models.portfolio_holding import PortfolioHolding
from app.models.user import User

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("/drift")
def check_goal_drift(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Detect drift between stated financial goals and actual behavior."""
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    plans = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.user_id == user.id, FinancialPlan.status == "active")
        .all()
    )
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()

    drifts = []

    # Check risk tolerance vs portfolio composition
    if profile and profile.risk_tolerance and holdings:
        total_positions = len(holdings)
        risk_tolerance = (profile.risk_tolerance or "").lower()

        if risk_tolerance == "conservative" and total_positions > 10:
            drifts.append({
                "goal": "Conservative risk tolerance",
                "expected": "Concentrated, stable portfolio (fewer positions)",
                "actual": f"Portfolio has {total_positions} positions — may indicate over-diversification or speculative holdings",
                "severity": "medium",
                "suggestion": "Review holdings and consider consolidating into fewer, lower-risk positions like index funds or bonds.",
            })

        if risk_tolerance == "aggressive" and total_positions <= 2:
            drifts.append({
                "goal": "Aggressive growth strategy",
                "expected": "Diversified portfolio with growth exposure",
                "actual": f"Only {total_positions} position(s) — under-diversified for an aggressive strategy",
                "severity": "medium",
                "suggestion": "Consider adding growth-oriented ETFs or stocks to diversify your portfolio.",
            })

    # Check savings goals vs profile
    if profile and profile.investment_goals:
        goals_lower = profile.investment_goals.lower()

        if "retire" in goals_lower and profile.total_savings and profile.annual_income:
            savings_rate = (profile.total_savings / profile.annual_income) if profile.annual_income > 0 else 0
            if savings_rate < 0.1:
                drifts.append({
                    "goal": "Retirement planning",
                    "expected": "Savings-to-income ratio of at least 10%+",
                    "actual": f"Current savings-to-income ratio is {savings_rate:.1%}",
                    "severity": "high",
                    "suggestion": "Consider increasing your savings rate. Aim to save at least 15-20% of your annual income for retirement.",
                })

        if "debt" in goals_lower and profile.total_debt and profile.total_debt > 0:
            if profile.annual_income and profile.total_debt > profile.annual_income * 0.5:
                debt_ratio = profile.total_debt / profile.annual_income
                drifts.append({
                    "goal": "Debt reduction",
                    "expected": "Debt-to-income ratio below 50%",
                    "actual": f"Current debt-to-income ratio is {debt_ratio:.0%}",
                    "severity": "high",
                    "suggestion": "Focus on paying down high-interest debt before increasing investments.",
                })

    # Check if there are active plans but no portfolio
    if plans and not holdings:
        drifts.append({
            "goal": "Active financial plans",
            "expected": "Investment portfolio aligned with plans",
            "actual": "No portfolio holdings found",
            "severity": "medium",
            "suggestion": "Start building your portfolio to align with your financial plans. Even small regular investments can compound significantly.",
        })

    # Check for missing profile data
    if not profile or not profile.investment_goals:
        drifts.append({
            "goal": "Financial goal tracking",
            "expected": "Clear investment goals set in profile",
            "actual": "No investment goals defined",
            "severity": "low",
            "suggestion": "Set your investment goals in your financial profile so we can better track your progress.",
        })

    # Determine overall status
    severities = [d["severity"] for d in drifts]
    if "high" in severities:
        overall = "needs_attention"
    elif "medium" in severities:
        overall = "minor_drift"
    elif drifts:
        overall = "on_track_with_notes"
    else:
        overall = "on_track"

    return {
        "drifts": drifts,
        "overall_status": overall,
    }
