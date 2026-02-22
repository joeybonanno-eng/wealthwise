from unittest.mock import MagicMock, patch


def test_get_quote(client):
    mock_info = {
        "shortName": "Apple Inc.",
        "currentPrice": 175.50,
        "regularMarketChange": 2.30,
        "regularMarketChangePercent": 1.33,
        "regularMarketVolume": 50000000,
        "marketCap": 2750000000000,
        "dayHigh": 176.00,
        "dayLow": 173.50,
        "regularMarketOpen": 174.00,
        "regularMarketPreviousClose": 173.20,
    }
    with patch("app.services.market_data_service.yf.Ticker") as mock_ticker:
        mock_ticker.return_value.info = mock_info
        response = client.get("/api/market/quote/AAPL")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert data["price"] == 175.50
        assert data["name"] == "Apple Inc."


def test_get_company_info(client):
    mock_info = {
        "shortName": "Apple Inc.",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "longBusinessSummary": "Apple Inc. designs, manufactures...",
        "trailingPE": 28.5,
        "forwardPE": 26.0,
        "dividendYield": 0.006,
        "fiftyTwoWeekHigh": 200.00,
        "fiftyTwoWeekLow": 130.00,
        "beta": 1.2,
        "trailingEps": 6.13,
        "marketCap": 2750000000000,
    }
    with patch("app.services.market_data_service.yf.Ticker") as mock_ticker:
        mock_ticker.return_value.info = mock_info
        response = client.get("/api/market/info/AAPL")
        assert response.status_code == 200
        data = response.json()
        assert data["sector"] == "Technology"
        assert data["pe_ratio"] == 28.5


def test_get_history(client):
    import pandas as pd

    mock_data = pd.DataFrame(
        {
            "Open": [170.0, 172.0],
            "High": [175.0, 176.0],
            "Low": [169.0, 171.0],
            "Close": [174.0, 175.0],
            "Volume": [50000000, 45000000],
        },
        index=pd.to_datetime(["2024-01-01", "2024-01-02"]),
    )
    with patch("app.services.market_data_service.yf.Ticker") as mock_ticker:
        mock_ticker.return_value.history.return_value = mock_data
        response = client.get("/api/market/history/AAPL?period=1mo&interval=1d")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert len(data["data"]) == 2
        assert data["data"][0]["close"] == 174.0
