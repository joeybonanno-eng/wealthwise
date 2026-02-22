from fastapi import APIRouter, Query

from app.services.market_data_service import get_company_info, get_stock_quote

router = APIRouter(prefix="/api/compare", tags=["compare"])


@router.get("/")
def compare_stocks(symbols: str = Query(..., description="Comma-separated symbols, up to 4")):
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()][:4]

    if len(symbol_list) < 2:
        return {"error": "Provide at least 2 symbols to compare", "results": []}

    results = []
    for sym in symbol_list:
        try:
            quote = get_stock_quote(sym)
            info = get_company_info(sym)
            results.append({
                "symbol": sym,
                "name": quote.get("name", "N/A"),
                "price": quote.get("price"),
                "change_percent": quote.get("change_percent"),
                "market_cap": quote.get("market_cap"),
                "pe_ratio": info.get("pe_ratio"),
                "forward_pe": info.get("forward_pe"),
                "dividend_yield": info.get("dividend_yield"),
                "fifty_two_week_high": info.get("fifty_two_week_high"),
                "fifty_two_week_low": info.get("fifty_two_week_low"),
                "sector": info.get("sector", "N/A"),
                "beta": info.get("beta"),
                "eps": info.get("eps"),
            })
        except Exception:
            results.append({
                "symbol": sym,
                "name": "N/A",
                "error": f"Could not fetch data for {sym}",
            })

    return {"results": results}
