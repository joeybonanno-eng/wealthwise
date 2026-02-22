from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.expense_category import ExpenseCategory
    from app.models.financial_plan import FinancialPlan
    from app.models.financial_profile import FinancialProfile
    from app.models.insight import Insight
    from app.models.notification_preference import NotificationPreference
    from app.models.price_alert import PriceAlert
    from app.models.recurring_transaction import RecurringTransaction
    from app.models.subscription import Subscription
    from app.models.usage_tracking import UsageTracking
    from app.models.portfolio_holding import PortfolioHolding
    from app.models.user_memory import UserMemory
    from app.models.watchlist_item import WatchlistItem


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    subscription: Mapped[Optional["Subscription"]] = relationship(back_populates="user", uselist=False)
    financial_profile: Mapped[Optional["FinancialProfile"]] = relationship(back_populates="user", uselist=False)
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    financial_plans: Mapped[list["FinancialPlan"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    price_alerts: Mapped[list["PriceAlert"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    insights: Mapped[list["Insight"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    memories: Mapped[list["UserMemory"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    usage_records: Mapped[list["UsageTracking"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    portfolio_holdings: Mapped[list["PortfolioHolding"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notification_preferences: Mapped[Optional["NotificationPreference"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    recurring_transactions: Mapped[list["RecurringTransaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    expense_categories: Mapped[list["ExpenseCategory"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    watchlist_items: Mapped[list["WatchlistItem"]] = relationship(back_populates="user", cascade="all, delete-orphan")
