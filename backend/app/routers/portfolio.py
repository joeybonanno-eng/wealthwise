from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.portfolio_holding import PortfolioHolding
from app.models.user import User
from app.services.market_data_service import get_stock_quote

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


class HoldingCreate(BaseModel):
    symbol: str
    shares: float
    avg_cost: float
    notes: Optional[str] = None


class HoldingUpdate(BaseModel):
    shares: Optional[float] = None
    avg_cost: Optional[float] = None
    notes: Optional[str] = None


@router.get("/")
def get_holdings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all portfolio holdings with live market data."""
    holdings = (
        db.query(PortfolioHolding)
        .filter(PortfolioHolding.user_id == user.id)
        .order_by(PortfolioHolding.symbol)
        .all()
    )

    results = []
    total_value = 0.0
    total_cost = 0.0

    for h in holdings:
        current_price = None
        change_percent = None
        try:
            quote = get_stock_quote(h.symbol)
            current_price = quote.get("price")
            change_percent = quote.get("change_percent")
        except Exception:
            pass

        market_value = (current_price or 0) * h.shares
        cost_basis = h.avg_cost * h.shares
        gain_loss = market_value - cost_basis if current_price else None
        gain_loss_pct = (gain_loss / cost_basis * 100) if gain_loss is not None and cost_basis > 0 else None

        total_value += market_value
        total_cost += cost_basis

        results.append({
            "id": h.id,
            "symbol": h.symbol,
            "shares": h.shares,
            "avg_cost": h.avg_cost,
            "notes": h.notes,
            "current_price": current_price,
            "change_percent": change_percent,
            "market_value": round(market_value, 2),
            "cost_basis": round(cost_basis, 2),
            "gain_loss": round(gain_loss, 2) if gain_loss is not None else None,
            "gain_loss_pct": round(gain_loss_pct, 2) if gain_loss_pct is not None else None,
        })

    total_gain = total_value - total_cost
    total_gain_pct = (total_gain / total_cost * 100) if total_cost > 0 else 0

    return {
        "holdings": results,
        "summary": {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_gain_loss": round(total_gain, 2),
            "total_gain_loss_pct": round(total_gain_pct, 2),
            "positions": len(results),
        },
    }


@router.post("/")
def add_holding(
    data: HoldingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new holding to the portfolio."""
    holding = PortfolioHolding(
        user_id=user.id,
        symbol=data.symbol.upper().strip(),
        shares=data.shares,
        avg_cost=data.avg_cost,
        notes=data.notes,
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return {
        "id": holding.id,
        "symbol": holding.symbol,
        "shares": holding.shares,
        "avg_cost": holding.avg_cost,
        "notes": holding.notes,
    }


@router.put("/{holding_id}")
def update_holding(
    holding_id: int,
    data: HoldingUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing holding."""
    holding = (
        db.query(PortfolioHolding)
        .filter(PortfolioHolding.id == holding_id, PortfolioHolding.user_id == user.id)
        .first()
    )
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")

    if data.shares is not None:
        holding.shares = data.shares
    if data.avg_cost is not None:
        holding.avg_cost = data.avg_cost
    if data.notes is not None:
        holding.notes = data.notes

    db.commit()
    return {"status": "updated"}


@router.delete("/{holding_id}")
def delete_holding(
    holding_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a holding from the portfolio."""
    holding = (
        db.query(PortfolioHolding)
        .filter(PortfolioHolding.id == holding_id, PortfolioHolding.user_id == user.id)
        .first()
    )
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")

    db.delete(holding)
    db.commit()
    return {"status": "deleted"}
