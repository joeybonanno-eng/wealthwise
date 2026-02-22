from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class InsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: int
    type: str
    title: str
    body: str
    reasoning: str
    confidence: float
    urgency: str
    impact: str
    actions: Optional[str] = None
    source_goals: Optional[str] = None
    trigger: str
    status: str
    created_at: datetime
    delivered_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None


class InsightListResponse(BaseModel):
    insights: list[InsightResponse]
    total: int
