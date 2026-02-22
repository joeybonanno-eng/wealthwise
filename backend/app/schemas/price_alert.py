from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CreateAlertRequest(BaseModel):
    symbol: str
    condition: str  # above/below
    target_price: float
    message: Optional[str] = None


class UpdateAlertRequest(BaseModel):
    is_active: Optional[bool] = None
    target_price: Optional[float] = None
    condition: Optional[str] = None
    message: Optional[str] = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    symbol: str
    condition: str
    target_price: float
    message: Optional[str] = None
    is_active: bool
    triggered: bool
    triggered_at: Optional[datetime] = None
    created_at: datetime


class AlertCheckResult(BaseModel):
    alert: AlertResponse
    current_price: Optional[float] = None
    just_triggered: bool = False


class AlertCheckResponse(BaseModel):
    results: list[AlertCheckResult]
