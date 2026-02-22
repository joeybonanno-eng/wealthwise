from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_subscription
from app.models.price_alert import PriceAlert
from app.models.user import User
from app.schemas.price_alert import (
    AlertCheckResponse,
    AlertCheckResult,
    AlertResponse,
    CreateAlertRequest,
    UpdateAlertRequest,
)
from app.services.alert_service import check_alerts

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.post("/", response_model=AlertResponse)
def create_alert(
    request: CreateAlertRequest,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    if request.condition not in ("above", "below"):
        raise HTTPException(status_code=400, detail="Condition must be 'above' or 'below'")

    alert = PriceAlert(
        user_id=user.id,
        symbol=request.symbol.upper(),
        condition=request.condition,
        target_price=request.target_price,
        message=request.message,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/", response_model=List[AlertResponse])
def list_alerts(
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    alerts = (
        db.query(PriceAlert)
        .filter(PriceAlert.user_id == user.id)
        .order_by(PriceAlert.created_at.desc())
        .all()
    )
    return alerts


@router.get("/check", response_model=AlertCheckResponse)
def check_user_alerts(
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    results = check_alerts(db, user)
    return AlertCheckResponse(
        results=[
            AlertCheckResult(
                alert=AlertResponse.model_validate(r["alert"]),
                current_price=r["current_price"],
                just_triggered=r["just_triggered"],
            )
            for r in results
        ]
    )


@router.put("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: int,
    request: UpdateAlertRequest,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    alert = (
        db.query(PriceAlert)
        .filter(PriceAlert.id == alert_id, PriceAlert.user_id == user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if request.is_active is not None:
        alert.is_active = request.is_active
        if request.is_active:
            # Re-activate: reset triggered state
            alert.triggered = False
            alert.triggered_at = None
    if request.target_price is not None:
        alert.target_price = request.target_price
    if request.condition is not None:
        alert.condition = request.condition
    if request.message is not None:
        alert.message = request.message

    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    alert = (
        db.query(PriceAlert)
        .filter(PriceAlert.id == alert_id, PriceAlert.user_id == user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"status": "deleted"}
