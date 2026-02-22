from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.portfolio_holding import PortfolioHolding
from app.models.user import User
from app.services.market_data_service import get_company_info, get_stock_quote

router = APIRouter(prefix="/api/portfolio", tags=["portfolio-review"])


@router.get("/review")
def get_portfolio_review(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate an AI-powered comprehensive portfolio review."""
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()

    if not holdings:
        return {"review": "You don't have any holdings yet. Add some stocks to get a personalized portfolio review.", "holdings_summary": []}

    # Gather portfolio data
    holdings_data = []
    total_value = 0.0
    total_cost = 0.0
    sectors: dict[str, float] = {}

    for h in holdings:
        try:
            quote = get_stock_quote(h.symbol)
            info = get_company_info(h.symbol)
            price = quote.get("price") or 0
            sector = info.get("sector", "Unknown") or "Unknown"
            beta = info.get("beta") or 1.0
            pe = info.get("pe_ratio")
            div_yield = info.get("dividend_yield")

            mv = price * h.shares
            cb = h.avg_cost * h.shares
            gl = mv - cb
            total_value += mv
            total_cost += cb
            sectors[sector] = sectors.get(sector, 0) + mv

            holdings_data.append({
                "symbol": h.symbol,
                "shares": h.shares,
                "price": round(price, 2),
                "market_value": round(mv, 2),
                "gain_loss": round(gl, 2),
                "gain_loss_pct": round((gl / cb * 100) if cb > 0 else 0, 1),
                "sector": sector,
                "beta": round(beta, 2) if beta else None,
                "pe_ratio": round(pe, 1) if pe else None,
                "dividend_yield": round(div_yield * 100, 2) if div_yield else 0,
            })
        except Exception:
            holdings_data.append({"symbol": h.symbol, "shares": h.shares, "error": "data unavailable"})

    # Build summary for AI
    total_gain = total_value - total_cost
    total_gain_pct = (total_gain / total_cost * 100) if total_cost > 0 else 0
    sector_pcts = {s: round(v / total_value * 100, 1) for s, v in sectors.items()} if total_value > 0 else {}

    portfolio_summary = f"""Portfolio: {len(holdings)} holdings, Total Value: ${total_value:,.2f}, Cost Basis: ${total_cost:,.2f}, Return: {total_gain_pct:+.1f}%
Sectors: {', '.join(f'{s} {p}%' for s, p in sorted(sector_pcts.items(), key=lambda x: -x[1]))}
Holdings:
"""
    for h in holdings_data:
        if "error" not in h:
            portfolio_summary += f"  {h['symbol']}: ${h['market_value']:,.0f} ({h['gain_loss_pct']:+.1f}%), sector={h['sector']}, beta={h.get('beta','?')}, P/E={h.get('pe_ratio','?')}, yield={h.get('dividend_yield',0)}%\n"

    # Call Claude for review
    review_text = ""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[{
                "role": "user",
                "content": f"""You are a financial advisor. Analyze this portfolio and provide a brief review (4-6 paragraphs) covering:
1. Overall assessment (value, diversification, performance)
2. Sector concentration risks
3. Individual holding observations (best/worst performers)
4. Specific actionable recommendations

{portfolio_summary}

Be direct and specific. Use dollar amounts. No disclaimers.""",
            }],
        )
        review_text = response.content[0].text
    except Exception:
        # Fallback: generate a basic review without AI
        top = sorted([h for h in holdings_data if "error" not in h], key=lambda x: x.get("gain_loss_pct", 0), reverse=True)
        worst = sorted([h for h in holdings_data if "error" not in h], key=lambda x: x.get("gain_loss_pct", 0))

        review_text = f"**Portfolio Overview:** Your portfolio contains {len(holdings)} positions worth ${total_value:,.2f} with an overall return of {total_gain_pct:+.1f}%.\n\n"
        review_text += f"**Sector Allocation:** {', '.join(f'{s} ({p}%)' for s, p in sorted(sector_pcts.items(), key=lambda x: -x[1]))}.\n\n"
        if top:
            review_text += f"**Top Performer:** {top[0]['symbol']} at {top[0].get('gain_loss_pct', 0):+.1f}%.\n"
        if worst and worst[0].get("gain_loss_pct", 0) < 0:
            review_text += f"**Underperformer:** {worst[0]['symbol']} at {worst[0].get('gain_loss_pct', 0):+.1f}%.\n"

    return {
        "review": review_text,
        "holdings_summary": holdings_data,
        "portfolio_stats": {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_gain": round(total_gain, 2),
            "total_gain_pct": round(total_gain_pct, 2),
            "positions": len(holdings),
            "sectors": sector_pcts,
        },
    }
