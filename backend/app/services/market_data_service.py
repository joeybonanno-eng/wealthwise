import time
from typing import Any, Dict, List

import yfinance as yf

# Simple in-memory cache to avoid rate limits
_cache: Dict[str, Dict[str, Any]] = {}
_cache_ttl = 60  # seconds


def _get_info(symbol: str) -> Dict[str, Any]:
    key = f"info:{symbol.upper()}"
    now = time.time()
    if key in _cache and now - _cache[key]["_ts"] < _cache_ttl:
        return _cache[key]
    ticker = yf.Ticker(symbol)
    info = ticker.info
    info["_ts"] = now
    _cache[key] = info
    return info


def get_stock_quote(symbol: str) -> Dict[str, Any]:
    info = _get_info(symbol)
    return {
        "symbol": symbol.upper(),
        "name": info.get("shortName", "N/A"),
        "price": info.get("currentPrice") or info.get("regularMarketPrice"),
        "change": info.get("regularMarketChange"),
        "change_percent": info.get("regularMarketChangePercent"),
        "volume": info.get("regularMarketVolume"),
        "market_cap": info.get("marketCap"),
        "day_high": info.get("dayHigh"),
        "day_low": info.get("dayLow"),
        "open": info.get("regularMarketOpen"),
        "previous_close": info.get("regularMarketPreviousClose"),
    }


def get_price_history(symbol: str, period: str = "1mo", interval: str = "1d") -> Dict[str, Any]:
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period, interval=interval)
    if hist.empty:
        return {"symbol": symbol.upper(), "period": period, "interval": interval, "data": []}
    records = []
    for date, row in hist.iterrows():
        records.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "close": round(row["Close"], 2),
            "volume": int(row["Volume"]),
        })
    return {
        "symbol": symbol.upper(),
        "period": period,
        "interval": interval,
        "data": records[-50:],
    }


def get_company_info(symbol: str) -> Dict[str, Any]:
    info = _get_info(symbol)
    return {
        "symbol": symbol.upper(),
        "name": info.get("shortName", "N/A"),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "description": info.get("longBusinessSummary", "N/A"),
        "pe_ratio": info.get("trailingPE"),
        "forward_pe": info.get("forwardPE"),
        "dividend_yield": info.get("dividendYield"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "beta": info.get("beta"),
        "eps": info.get("trailingEps"),
        "market_cap": info.get("marketCap"),
    }


SECTOR_ETFS = {
    "Technology": "XLK",
    "Healthcare": "XLV",
    "Financials": "XLF",
    "Consumer Discretionary": "XLY",
    "Communication Services": "XLC",
    "Industrials": "XLI",
    "Consumer Staples": "XLP",
    "Energy": "XLE",
    "Utilities": "XLU",
    "Real Estate": "XLRE",
    "Materials": "XLB",
}


def get_sector_performance() -> List[Dict[str, Any]]:
    results = []
    for sector_name, etf_symbol in SECTOR_ETFS.items():
        try:
            info = _get_info(etf_symbol)
            results.append({
                "sector": sector_name,
                "etf": etf_symbol,
                "price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "change_percent": info.get("regularMarketChangePercent"),
            })
        except Exception:
            results.append({"sector": sector_name, "etf": etf_symbol, "price": None, "change_percent": None})
    return results


def get_trending_tickers() -> List[Dict[str, Any]]:
    popular = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "SPY", "QQQ"]
    results = []
    for symbol in popular:
        try:
            info = _get_info(symbol)
            results.append({
                "symbol": symbol,
                "name": info.get("shortName", "N/A"),
                "price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "change_percent": info.get("regularMarketChangePercent"),
            })
        except Exception:
            continue
    return results
