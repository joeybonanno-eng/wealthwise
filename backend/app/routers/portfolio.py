from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.portfolio_holding import PortfolioHolding
from app.models.user import User
from app.services.market_data_service import get_company_info, get_stock_quote

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


@router.get("/tax-loss")
def get_tax_loss_harvesting(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Identify tax-loss harvesting opportunities in the portfolio."""
    holdings = (
        db.query(PortfolioHolding)
        .filter(PortfolioHolding.user_id == user.id)
        .all()
    )

    if not holdings:
        return {"opportunities": [], "summary": {"total_unrealized_losses": 0, "estimated_tax_savings": 0, "positions_with_losses": 0}}

    opportunities = []
    total_unrealized_losses = 0.0

    for h in holdings:
        try:
            quote = get_stock_quote(h.symbol)
            current_price = quote.get("price")
            if not current_price:
                continue

            market_value = current_price * h.shares
            cost_basis = h.avg_cost * h.shares
            unrealized_gain = market_value - cost_basis

            if unrealized_gain < 0:
                loss = abs(unrealized_gain)
                total_unrealized_losses += loss
                loss_pct = (unrealized_gain / cost_basis * 100) if cost_basis > 0 else 0

                opportunities.append({
                    "symbol": h.symbol,
                    "shares": h.shares,
                    "avg_cost": h.avg_cost,
                    "current_price": round(current_price, 2),
                    "cost_basis": round(cost_basis, 2),
                    "market_value": round(market_value, 2),
                    "unrealized_loss": round(loss, 2),
                    "loss_pct": round(loss_pct, 2),
                    "estimated_tax_savings_22": round(loss * 0.22, 2),  # 22% bracket
                    "estimated_tax_savings_32": round(loss * 0.32, 2),  # 32% bracket
                })
        except Exception:
            continue

    # Sort by largest loss first
    opportunities.sort(key=lambda x: x["unrealized_loss"], reverse=True)

    return {
        "opportunities": opportunities,
        "summary": {
            "total_unrealized_losses": round(total_unrealized_losses, 2),
            "estimated_tax_savings_22": round(total_unrealized_losses * 0.22, 2),
            "estimated_tax_savings_32": round(total_unrealized_losses * 0.32, 2),
            "positions_with_losses": len(opportunities),
        },
    }


@router.get("/dividends")
def get_dividends(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get dividend analysis for all portfolio holdings."""
    from app.services.market_data_service import _get_info

    holdings = (
        db.query(PortfolioHolding)
        .filter(PortfolioHolding.user_id == user.id)
        .order_by(PortfolioHolding.symbol)
        .all()
    )

    if not holdings:
        return {
            "holdings": [],
            "total_annual_income": 0,
            "total_yield_on_cost": 0,
        }

    results = []
    total_annual_income = 0.0
    total_cost_basis = 0.0

    for h in holdings:
        try:
            info = _get_info(h.symbol)
            dividend_yield = info.get("dividendYield") or 0  # decimal, e.g. 0.005
            dividend_rate = info.get("dividendRate") or 0  # annual $ per share
            ex_date = info.get("exDividendDate")
            current_price = info.get("currentPrice") or info.get("regularMarketPrice") or 0

            annual_income = dividend_rate * h.shares
            total_annual_income += annual_income
            cost_basis = h.avg_cost * h.shares
            total_cost_basis += cost_basis
            yield_on_cost = (dividend_rate / h.avg_cost * 100) if h.avg_cost > 0 and dividend_rate > 0 else 0

            # Guess frequency from rate and price
            frequency = "N/A"
            if dividend_rate > 0 and current_price > 0:
                payout_ratio = dividend_rate / current_price
                if payout_ratio > 0:
                    frequency = "Quarterly"  # most common for US stocks

            results.append({
                "symbol": h.symbol,
                "shares": h.shares,
                "dividend_yield": round(dividend_yield * 100, 2),
                "dividend_rate": round(dividend_rate, 4),
                "annual_income": round(annual_income, 2),
                "yield_on_cost": round(yield_on_cost, 2),
                "frequency": frequency if dividend_rate > 0 else "N/A",
                "ex_dividend_date": ex_date,
            })
        except Exception:
            results.append({
                "symbol": h.symbol,
                "shares": h.shares,
                "dividend_yield": 0,
                "dividend_rate": 0,
                "annual_income": 0,
                "yield_on_cost": 0,
                "frequency": "N/A",
                "ex_dividend_date": None,
            })

    total_yield_on_cost = (total_annual_income / total_cost_basis * 100) if total_cost_basis > 0 else 0

    return {
        "holdings": results,
        "total_annual_income": round(total_annual_income, 2),
        "total_yield_on_cost": round(total_yield_on_cost, 2),
    }


@router.get("/risk")
def get_risk_score(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Calculate a portfolio risk score (0-100) based on beta, concentration, diversification, and volatility."""
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()

    if not holdings:
        return {"risk_score": 0, "risk_level": "N/A", "factors": [], "holdings_risk": []}

    enriched = []
    total_value = 0.0
    sector_values: dict[str, float] = {}

    for h in holdings:
        try:
            quote = get_stock_quote(h.symbol)
            info = get_company_info(h.symbol)
            price = quote.get("price") or 0
            beta = info.get("beta") or 1.0
            sector = info.get("sector", "Unknown") or "Unknown"
            mv = price * h.shares
            total_value += mv
            sector_values[sector] = sector_values.get(sector, 0) + mv
            enriched.append({"symbol": h.symbol, "market_value": mv, "beta": beta, "sector": sector})
        except Exception:
            enriched.append({"symbol": h.symbol, "market_value": 0, "beta": 1.0, "sector": "Unknown"})

    if total_value == 0:
        return {"risk_score": 50, "risk_level": "Medium", "factors": [], "holdings_risk": []}

    # Factor 1: Weighted average beta (0-30 points)
    weighted_beta = sum(e["market_value"] / total_value * e["beta"] for e in enriched if e["market_value"] > 0)
    beta_score = min(max((weighted_beta - 0.5) / 1.5 * 30, 0), 30)

    # Factor 2: Concentration risk — largest position weight (0-30 points)
    max_weight = max(e["market_value"] / total_value for e in enriched) if enriched else 0
    concentration_score = min(max_weight / 0.5 * 30, 30)

    # Factor 3: Sector diversity — fewer sectors = higher risk (0-20 points)
    num_sectors = len(sector_values)
    diversity_score = max(20 - (num_sectors - 1) * 4, 0)

    # Factor 4: Position count — fewer positions = higher risk (0-20 points)
    num_positions = len(enriched)
    position_score = max(20 - (num_positions - 1) * 3, 0)

    risk_score = round(beta_score + concentration_score + diversity_score + position_score)
    risk_score = min(max(risk_score, 0), 100)

    if risk_score <= 30:
        risk_level = "Low"
    elif risk_score <= 60:
        risk_level = "Medium"
    else:
        risk_level = "High"

    factors = [
        {"name": "Beta Risk", "score": round(beta_score, 1), "max": 30, "detail": f"Weighted beta: {weighted_beta:.2f}"},
        {"name": "Concentration", "score": round(concentration_score, 1), "max": 30, "detail": f"Largest position: {max_weight * 100:.1f}%"},
        {"name": "Sector Diversity", "score": round(diversity_score, 1), "max": 20, "detail": f"{num_sectors} sector{'s' if num_sectors != 1 else ''}"},
        {"name": "Position Count", "score": round(position_score, 1), "max": 20, "detail": f"{num_positions} position{'s' if num_positions != 1 else ''}"},
    ]

    holdings_risk = [
        {
            "symbol": e["symbol"],
            "weight": round(e["market_value"] / total_value * 100, 1) if total_value > 0 else 0,
            "beta": round(e["beta"], 2),
            "sector": e["sector"],
        }
        for e in sorted(enriched, key=lambda x: x["market_value"], reverse=True)
    ]

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "weighted_beta": round(weighted_beta, 2),
        "factors": factors,
        "holdings_risk": holdings_risk,
    }


@router.get("/backtest")
def backtest_portfolio(
    years: int = 5,
    investment: float = 10000,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backtest: what if you invested $X in your current portfolio allocation N years ago."""
    import yfinance as yf
    from datetime import datetime, timedelta

    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()
    if not holdings:
        return {"error": "No holdings to backtest", "results": []}

    years = min(max(years, 1), 20)

    # Calculate current allocation weights
    total_cost = sum(h.avg_cost * h.shares for h in holdings)
    if total_cost <= 0:
        return {"error": "Invalid cost basis", "results": []}

    weights = []
    for h in holdings:
        w = (h.avg_cost * h.shares) / total_cost
        weights.append({"symbol": h.symbol, "weight": w})

    end_date = datetime.now()
    start_date = end_date - timedelta(days=years * 365)

    results = []
    total_return = 0.0
    total_final = 0.0

    for w in weights:
        alloc = investment * w["weight"]
        try:
            ticker = yf.Ticker(w["symbol"])
            hist = ticker.history(start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"))
            if len(hist) < 2:
                results.append({"symbol": w["symbol"], "weight": round(w["weight"] * 100, 1), "error": "insufficient data"})
                continue

            start_price = hist["Close"].iloc[0]
            end_price = hist["Close"].iloc[-1]
            ret = (end_price - start_price) / start_price
            final_value = alloc * (1 + ret)
            total_final += final_value

            results.append({
                "symbol": w["symbol"],
                "weight": round(w["weight"] * 100, 1),
                "allocated": round(alloc, 2),
                "start_price": round(float(start_price), 2),
                "end_price": round(float(end_price), 2),
                "return_pct": round(ret * 100, 1),
                "final_value": round(final_value, 2),
                "gain": round(final_value - alloc, 2),
            })
        except Exception:
            results.append({"symbol": w["symbol"], "weight": round(w["weight"] * 100, 1), "error": "data unavailable"})

    valid = [r for r in results if "error" not in r]
    total_invested = sum(r.get("allocated", 0) for r in valid)
    total_final_val = sum(r.get("final_value", 0) for r in valid)
    total_gain = total_final_val - total_invested
    total_return_pct = (total_gain / total_invested * 100) if total_invested > 0 else 0

    return {
        "results": results,
        "summary": {
            "investment": investment,
            "years": years,
            "final_value": round(total_final_val, 2),
            "total_gain": round(total_gain, 2),
            "total_return_pct": round(total_return_pct, 1),
            "annualized_return": round((((total_final_val / investment) ** (1 / years)) - 1) * 100, 1) if investment > 0 and years > 0 and total_final_val > 0 else 0,
        },
    }


@router.get("/analytics")
def get_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get portfolio analytics: sector allocation, top/worst performers, summary metrics."""
    holdings = (
        db.query(PortfolioHolding)
        .filter(PortfolioHolding.user_id == user.id)
        .all()
    )

    if not holdings:
        return {
            "sectors": {},
            "top_performers": [],
            "worst_performers": [],
            "summary": {
                "total_value": 0,
                "total_cost": 0,
                "total_gain_loss": 0,
                "total_gain_loss_pct": 0,
                "positions": 0,
                "best_performer": None,
                "worst_performer": None,
            },
        }

    enriched = []
    sector_values: dict[str, float] = {}
    total_value = 0.0
    total_cost = 0.0

    for h in holdings:
        current_price = None
        sector = "Unknown"
        try:
            quote = get_stock_quote(h.symbol)
            current_price = quote.get("price")
            info = get_company_info(h.symbol)
            sector = info.get("sector", "Unknown") or "Unknown"
        except Exception:
            pass

        market_value = (current_price or 0) * h.shares
        cost_basis = h.avg_cost * h.shares
        gain_loss = market_value - cost_basis if current_price else None
        gain_loss_pct = (gain_loss / cost_basis * 100) if gain_loss is not None and cost_basis > 0 else None

        total_value += market_value
        total_cost += cost_basis
        sector_values[sector] = sector_values.get(sector, 0) + market_value

        enriched.append({
            "symbol": h.symbol,
            "market_value": round(market_value, 2),
            "cost_basis": round(cost_basis, 2),
            "gain_loss": round(gain_loss, 2) if gain_loss is not None else None,
            "gain_loss_pct": round(gain_loss_pct, 2) if gain_loss_pct is not None else None,
            "sector": sector,
        })

    # Sector allocation as percentages
    sectors = {}
    for s, v in sorted(sector_values.items(), key=lambda x: -x[1]):
        sectors[s] = round((v / total_value * 100) if total_value > 0 else 0, 1)

    # Sort by gain_loss_pct for top/worst
    with_pct = [e for e in enriched if e["gain_loss_pct"] is not None]
    with_pct.sort(key=lambda x: x["gain_loss_pct"], reverse=True)

    top_performers = with_pct[:3]
    worst_performers = list(reversed(with_pct[-3:])) if len(with_pct) >= 1 else []

    total_gain = total_value - total_cost
    total_gain_pct = (total_gain / total_cost * 100) if total_cost > 0 else 0

    return {
        "sectors": sectors,
        "top_performers": top_performers,
        "worst_performers": worst_performers,
        "summary": {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_gain_loss": round(total_gain, 2),
            "total_gain_loss_pct": round(total_gain_pct, 2),
            "positions": len(holdings),
            "best_performer": top_performers[0]["symbol"] if top_performers else None,
            "worst_performer": worst_performers[-1]["symbol"] if worst_performers else None,
        },
    }
