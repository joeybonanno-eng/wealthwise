from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict


class CreatePlanRequest(BaseModel):
    title: str
    plan_type: str  # retirement/home/debt/wealth/custom
    data: Dict[str, Any]
    ai_plan: Optional[str] = None


class PlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    plan_type: str
    data: str  # JSON string from DB
    ai_plan: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
