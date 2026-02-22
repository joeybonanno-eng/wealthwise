from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class FinancialPlan(Base):
    __tablename__ = "financial_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    plan_type: Mapped[str] = mapped_column(String(50), nullable=False)  # retirement/home/debt/wealth/custom
    data: Mapped[str] = mapped_column(Text, nullable=False)  # JSON text — wizard answers
    ai_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # generated plan markdown
    status: Mapped[str] = mapped_column(String(20), default="active")  # active/archived
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="financial_plans")
