from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    annual_income: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    monthly_expenses: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_savings: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_debt: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_tolerance: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    investment_goals: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    portfolio_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    experience_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    investment_timeline: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    interested_topics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    communication_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="college")
    advisor_tone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="professional")
    onboarding_completed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="financial_profile")
