from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

import yfinance as yf

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/news", tags=["news"])


def _get_sentiment(headline: str) -> str:
    """Quick sentiment classification using keyword heuristics (no API call needed)."""
    headline_lower = headline.lower()
    bullish_words = [
        "surge", "soar", "rally", "gain", "jump", "rise", "high", "record",
        "beat", "upgrade", "bull", "grow", "profit", "boom", "breakout",
        "strong", "outperform", "buy", "positive", "upbeat", "recovery",
    ]
    bearish_words = [
        "fall", "drop", "crash", "plunge", "sink", "decline", "low", "miss",
        "downgrade", "bear", "loss", "cut", "slump", "weak", "sell",
        "negative", "warning", "fear", "risk", "layoff", "recession",
    ]

    bull_score = sum(1 for w in bullish_words if w in headline_lower)
    bear_score = sum(1 for w in bearish_words if w in headline_lower)

    if bull_score > bear_score:
        return "bullish"
    elif bear_score > bull_score:
        return "bearish"
    return "neutral"


@router.get("/")
def get_news(
    symbols: Optional[str] = Query(None, description="Comma-separated symbols"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch news for given symbols. If no symbols provided, uses user's portfolio symbols.
    """
    symbol_list = []
    if symbols:
        symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]

    # Fallback to user's portfolio symbols
    if not symbol_list:
        from app.models.portfolio_holding import PortfolioHolding
        holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()
        symbol_list = [h.symbol for h in holdings]

    if not symbol_list:
        symbol_list = ["SPY"]  # default to market news

    all_news = []
    seen_titles = set()

    for sym in symbol_list[:10]:  # limit to 10 symbols
        try:
            ticker = yf.Ticker(sym)
            news_items = ticker.news or []
            for item in news_items[:5]:  # top 5 per symbol
                title = item.get("title", "")
                if title in seen_titles:
                    continue
                seen_titles.add(title)

                all_news.append({
                    "symbol": sym,
                    "title": title,
                    "publisher": item.get("publisher", ""),
                    "link": item.get("link", ""),
                    "published": item.get("providerPublishTime", 0),
                    "sentiment": _get_sentiment(title),
                })
        except Exception:
            continue

    # Sort by publish time descending
    all_news.sort(key=lambda x: x["published"], reverse=True)

    return {"articles": all_news[:30]}  # cap at 30 articles
