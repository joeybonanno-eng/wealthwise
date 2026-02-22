TOOLS = [
    {
        "name": "get_stock_quote",
        "description": "Get a real-time stock quote including current price, change, volume, and market cap. Use this when the user asks about a stock's current price or trading activity.",
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "The stock ticker symbol (e.g., AAPL, MSFT, GOOGL)",
                },
            },
            "required": ["symbol"],
        },
    },
    {
        "name": "get_price_history",
        "description": "Get historical OHLCV price data for trend analysis and charting. Use this when the user asks about price trends, historical performance, or wants to analyze a stock's movement over time.",
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "The stock ticker symbol",
                },
                "period": {
                    "type": "string",
                    "description": "Time period for history. Options: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, ytd, max",
                    "default": "1mo",
                },
                "interval": {
                    "type": "string",
                    "description": "Data interval. Options: 1d, 1wk, 1mo",
                    "default": "1d",
                },
            },
            "required": ["symbol"],
        },
    },
    {
        "name": "get_company_info",
        "description": "Get fundamental company information including P/E ratio, sector, industry, description, 52-week range, beta, and EPS. Use this when the user asks about a company's fundamentals, what a company does, or its financial metrics.",
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "The stock ticker symbol",
                },
            },
            "required": ["symbol"],
        },
    },
    {
        "name": "get_sector_performance",
        "description": "Get performance data for all major market sectors via their ETFs (XLK, XLV, XLF, etc.). Use this when the user asks about sector trends, market overview, or which sectors are performing well.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
]
