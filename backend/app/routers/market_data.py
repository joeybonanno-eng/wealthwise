from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.schemas.market import CompanyInfo, PriceHistory, SectorPerformance, StockQuote, TrendingTicker
from app.services import market_data_service

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/quote/{symbol}", response_model=StockQuote)
def get_quote(symbol: str):
    try:
        return market_data_service.get_stock_quote(symbol)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch quote for {symbol}: {str(e)}")


@router.get("/history/{symbol}", response_model=PriceHistory)
def get_history(
    symbol: str,
    period: str = Query("1mo", pattern="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|10y|ytd|max)$"),
    interval: str = Query("1d", pattern="^(1m|2m|5m|15m|30m|60m|90m|1h|1d|5d|1wk|1mo|3mo)$"),
):
    try:
        return market_data_service.get_price_history(symbol, period, interval)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch history for {symbol}: {str(e)}")


@router.get("/info/{symbol}", response_model=CompanyInfo)
def get_info(symbol: str):
    try:
        return market_data_service.get_company_info(symbol)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch info for {symbol}: {str(e)}")


@router.get("/sectors", response_model=List[SectorPerformance])
def get_sectors():
    try:
        return market_data_service.get_sector_performance()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch sector data: {str(e)}")


@router.get("/trending", response_model=List[TrendingTicker])
def get_trending():
    try:
        return market_data_service.get_trending_tickers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch trending data: {str(e)}")
