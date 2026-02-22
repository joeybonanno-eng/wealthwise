from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.dependencies import get_current_user
from app.models.user import User
from app.services.market_data_service import _get_info

router = APIRouter(prefix="/api/screener", tags=["screener"])

# Universe of popular stocks to screen from
SCREENER_UNIVERSE = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "JPM",
    "JNJ", "V", "PG", "MA", "UNH", "HD", "DIS", "BAC", "XOM", "PFE", "KO",
    "CSCO", "PEP", "ABT", "MRK", "TMO", "AVGO", "COST", "NKE", "WMT", "LLY",
    "ORCL", "MCD", "INTC", "AMD", "QCOM", "T", "VZ", "CRM", "NFLX", "ADBE",
    "TXN", "PM", "UPS", "RTX", "LOW", "SBUX", "GS", "CAT", "DE", "BLK",
]


@router.get("/")
def screen_stocks(
    min_pe: Optional[float] = Query(None, description="Minimum P/E ratio"),
    max_pe: Optional[float] = Query(None, description="Maximum P/E ratio"),
    min_yield: Optional[float] = Query(None, description="Minimum dividend yield (%)"),
    max_yield: Optional[float] = Query(None, description="Maximum dividend yield (%)"),
    min_cap: Optional[float] = Query(None, description="Minimum market cap (billions)"),
    max_cap: Optional[float] = Query(None, description="Maximum market cap (billions)"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    sort_by: Optional[str] = Query("market_cap", description="Sort field"),
    user: User = Depends(get_current_user),
):
    """Screen stocks from a universe of 50 popular tickers by various criteria."""
    results = []

    for symbol in SCREENER_UNIVERSE:
        try:
            info = _get_info(symbol)

            pe = info.get("trailingPE")
            forward_pe = info.get("forwardPE")
            div_yield = info.get("dividendYield")  # decimal
            div_yield_pct = round(div_yield * 100, 2) if div_yield else 0
            mkt_cap = info.get("marketCap")
            mkt_cap_b = round(mkt_cap / 1e9, 1) if mkt_cap else None
            stock_sector = info.get("sector", "Unknown")
            price = info.get("currentPrice") or info.get("regularMarketPrice")
            change_pct = info.get("regularMarketChangePercent")

            # Apply filters
            if min_pe is not None and (pe is None or pe < min_pe):
                continue
            if max_pe is not None and (pe is None or pe > max_pe):
                continue
            if min_yield is not None and div_yield_pct < min_yield:
                continue
            if max_yield is not None and div_yield_pct > max_yield:
                continue
            if min_cap is not None and (mkt_cap_b is None or mkt_cap_b < min_cap):
                continue
            if max_cap is not None and (mkt_cap_b is None or mkt_cap_b > max_cap):
                continue
            if sector and stock_sector.lower() != sector.lower():
                continue

            results.append({
                "symbol": symbol,
                "name": info.get("shortName", "N/A"),
                "price": round(price, 2) if price else None,
                "change_pct": round(change_pct, 2) if change_pct is not None else None,
                "pe_ratio": round(pe, 2) if pe else None,
                "forward_pe": round(forward_pe, 2) if forward_pe else None,
                "dividend_yield": div_yield_pct,
                "market_cap_b": mkt_cap_b,
                "sector": stock_sector,
                "beta": round(info.get("beta", 0) or 0, 2),
                "eps": round(info.get("trailingEps", 0) or 0, 2),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
            })
        except Exception:
            continue

    # Sort
    sort_key_map = {
        "market_cap": lambda x: x["market_cap_b"] or 0,
        "pe_ratio": lambda x: x["pe_ratio"] or 9999,
        "dividend_yield": lambda x: x["dividend_yield"] or 0,
        "price": lambda x: x["price"] or 0,
        "change_pct": lambda x: x["change_pct"] or 0,
    }
    sort_fn = sort_key_map.get(sort_by, sort_key_map["market_cap"])
    reverse = sort_by != "pe_ratio"
    results.sort(key=sort_fn, reverse=reverse)

    # Collect available sectors for the filter dropdown
    sectors = sorted(set(r["sector"] for r in results if r["sector"] != "Unknown"))

    return {
        "results": results,
        "total": len(results),
        "sectors": sectors,
    }
