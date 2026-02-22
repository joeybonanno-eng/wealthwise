from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class StockQuote(BaseModel):
    symbol: str
    name: str
    price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[int] = None
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    open: Optional[float] = None
    previous_close: Optional[float] = None


class PriceHistoryPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class PriceHistory(BaseModel):
    symbol: str
    period: str
    interval: str
    data: List[PriceHistoryPoint]


class CompanyInfo(BaseModel):
    symbol: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    pe_ratio: Optional[float] = None
    forward_pe: Optional[float] = None
    dividend_yield: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    beta: Optional[float] = None
    eps: Optional[float] = None
    market_cap: Optional[int] = None


class SectorPerformance(BaseModel):
    sector: str
    etf: str
    price: Optional[float] = None
    change_percent: Optional[float] = None


class TrendingTicker(BaseModel):
    symbol: str
    name: str
    price: Optional[float] = None
    change_percent: Optional[float] = None
