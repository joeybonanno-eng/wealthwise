from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.allocation_target import AllocationTarget
from app.models.portfolio_holding import PortfolioHolding
from app.models.user import User
from app.services.market_data_service import get_company_info, get_stock_quote

router = APIRouter(prefix="/api/allocation", tags=["allocation"])

# Map sectors to broader categories
SECTOR_TO_CATEGORY = {
    "Technology": "US Stocks",
    "Healthcare": "US Stocks",
    "Financials": "US Stocks",
    "Consumer Discretionary": "US Stocks",
    "Communication Services": "US Stocks",
    "Industrials": "US Stocks",
    "Consumer Staples": "US Stocks",
    "Energy": "US Stocks",
    "Utilities": "US Stocks",
    "Real Estate": "Real Estate",
    "Materials": "US Stocks",
}

DEFAULT_CATEGORIES = ["US Stocks", "International", "Bonds", "Real Estate", "Cash", "Other"]


class TargetInput(BaseModel):
    targets: List[dict]  # [{"category": "US Stocks", "target_pct": 60}, ...]


@router.get("/targets")
def get_targets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the user's target allocation percentages."""
    targets = (
        db.query(AllocationTarget)
        .filter(AllocationTarget.user_id == user.id)
        .order_by(AllocationTarget.category)
        .all()
    )
    return {
        "targets": [
            {"id": t.id, "category": t.category, "target_pct": t.target_pct}
            for t in targets
        ],
        "categories": DEFAULT_CATEGORIES,
    }


@router.post("/targets")
def set_targets(
    data: TargetInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set target allocation percentages. Replaces all existing targets."""
    total = sum(t.get("target_pct", 0) for t in data.targets)
    if abs(total - 100) > 0.5:
        raise HTTPException(status_code=400, detail=f"Targets must sum to 100% (got {total}%)")

    # Delete existing targets
    db.query(AllocationTarget).filter(AllocationTarget.user_id == user.id).delete()

    for t in data.targets:
        cat = t.get("category", "").strip()
        pct = t.get("target_pct", 0)
        if cat and pct > 0:
            db.add(AllocationTarget(user_id=user.id, category=cat, target_pct=pct))

    db.commit()
    return {"status": "saved"}


@router.get("/analysis")
def get_allocation_analysis(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Compare current portfolio allocation to targets and suggest rebalance trades."""
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()
    targets = db.query(AllocationTarget).filter(AllocationTarget.user_id == user.id).all()

    if not holdings:
        return {"current": {}, "targets": {}, "diffs": {}, "suggestions": [], "total_value": 0}

    # Calculate current allocation by category
    category_values: dict[str, float] = {}
    total_value = 0.0

    for h in holdings:
        sector = "Unknown"
        current_price = 0
        try:
            quote = get_stock_quote(h.symbol)
            current_price = quote.get("price") or 0
            info = get_company_info(h.symbol)
            sector = info.get("sector", "Unknown") or "Unknown"
        except Exception:
            pass

        market_value = current_price * h.shares
        total_value += market_value

        cat = SECTOR_TO_CATEGORY.get(sector, "Other")
        category_values[cat] = category_values.get(cat, 0) + market_value

    # Current allocation percentages
    current_alloc = {}
    for cat, val in category_values.items():
        current_alloc[cat] = round((val / total_value * 100) if total_value > 0 else 0, 1)

    # Target percentages
    target_map = {t.category: t.target_pct for t in targets}

    # Calculate diffs and suggestions
    all_categories = set(list(current_alloc.keys()) + list(target_map.keys()))
    diffs = {}
    suggestions = []

    for cat in sorted(all_categories):
        current_pct = current_alloc.get(cat, 0)
        target_pct = target_map.get(cat, 0)
        diff = round(current_pct - target_pct, 1)
        diffs[cat] = diff

        current_value = category_values.get(cat, 0)
        target_value = total_value * (target_pct / 100) if total_value > 0 else 0
        trade_amount = target_value - current_value

        if abs(diff) >= 2:  # Only suggest if >2% off
            suggestions.append({
                "category": cat,
                "action": "Buy" if trade_amount > 0 else "Sell",
                "amount": round(abs(trade_amount), 2),
                "current_pct": current_pct,
                "target_pct": target_pct,
                "diff_pct": diff,
            })

    suggestions.sort(key=lambda x: abs(x["diff_pct"]), reverse=True)

    return {
        "current": current_alloc,
        "targets": target_map,
        "diffs": diffs,
        "suggestions": suggestions,
        "total_value": round(total_value, 2),
    }
