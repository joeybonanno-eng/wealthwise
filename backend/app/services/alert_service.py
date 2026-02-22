from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.models.price_alert import PriceAlert
from app.models.user import User
from app.services.market_data_service import get_stock_quote


def check_alerts(db: Session, user: User) -> List[Dict[str, Any]]:
    """Check all active alerts against live prices. Mark triggered if condition met."""
    active_alerts = (
        db.query(PriceAlert)
        .filter(PriceAlert.user_id == user.id, PriceAlert.is_active == True)  # noqa: E712
        .all()
    )

    results = []
    for alert in active_alerts:
        try:
            quote = get_stock_quote(alert.symbol)
            current_price = quote.get("price")
        except Exception:
            current_price = None

        just_triggered = False
        if current_price is not None and not alert.triggered:
            if alert.condition == "above" and current_price >= alert.target_price:
                alert.triggered = True
                alert.triggered_at = datetime.utcnow()
                just_triggered = True
            elif alert.condition == "below" and current_price <= alert.target_price:
                alert.triggered = True
                alert.triggered_at = datetime.utcnow()
                just_triggered = True

        results.append({
            "alert": alert,
            "current_price": current_price,
            "just_triggered": just_triggered,
        })

    db.commit()
    return results
