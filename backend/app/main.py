from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.database import Base, engine
from app.models import Achievement, AllocationTarget, Conversation, ExpenseCategory, FinancialPlan, FinancialProfile, Insight, Message, NetWorthEntry, NotificationPreference, PortfolioHolding, PriceAlert, RecurringTransaction, SavingsGoal, Subscription, UsageTracking, User, UserMemory, UserStreak, WatchlistItem, WebhookEvent  # noqa: F401
from app.routers import achievements, allocation, analytics, auth, briefing, budget, calculators, calendar, chat, compare, csv_io, dashboard, education, financial_plan, forecast, goals, health_score, insight, market_data, memory, net_worth, news, notifications, onboarding, portfolio, portfolio_review, price_alert, profile, reports, savings_goals, screener, spending_coach, subscription, subscriptions_tracker, timeline, usage, watchlist

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="WealthWise API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(market_data.router)
app.include_router(chat.router)
app.include_router(profile.router)
app.include_router(subscription.router)
app.include_router(financial_plan.router)
app.include_router(price_alert.router)
app.include_router(insight.router)
app.include_router(usage.router)
app.include_router(briefing.router)
app.include_router(timeline.router)
app.include_router(onboarding.router)
app.include_router(memory.router)
app.include_router(analytics.router)
app.include_router(portfolio.router)
app.include_router(goals.router)
app.include_router(notifications.router)
app.include_router(budget.router)
app.include_router(compare.router)
app.include_router(education.router)
app.include_router(watchlist.router)
app.include_router(net_worth.router)
app.include_router(calculators.router)
app.include_router(news.router)
app.include_router(achievements.router)
app.include_router(dashboard.router)
app.include_router(allocation.router)
app.include_router(subscriptions_tracker.router)
app.include_router(reports.router)
app.include_router(screener.router)
app.include_router(savings_goals.router)
app.include_router(calendar.router)
app.include_router(portfolio_review.router)
app.include_router(csv_io.router)
app.include_router(forecast.router)
app.include_router(health_score.router)
app.include_router(spending_coach.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Add missing columns to existing tables (create_all doesn't alter tables)
    from sqlalchemy import inspect, text
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        inspector = inspect(engine)
        if "financial_profiles" in inspector.get_table_names():
            existing = {c["name"] for c in inspector.get_columns("financial_profiles")}
            migrations = [
                ("experience_level", "VARCHAR(50)"),
                ("investment_timeline", "VARCHAR(50)"),
                ("interested_topics", "TEXT"),
                ("communication_level", "VARCHAR(50) DEFAULT 'college'"),
                ("advisor_tone", "VARCHAR(50) DEFAULT 'professional'"),
                ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
                ("language", "VARCHAR(10) DEFAULT 'en'"),
            ]
            for col_name, col_type in migrations:
                if col_name not in existing:
                    db.execute(text(f"ALTER TABLE financial_profiles ADD COLUMN {col_name} {col_type}"))
            db.commit()
        # Add billing edge case columns to subscriptions if missing
        if "subscriptions" in inspector.get_table_names():
            existing_sub_cols = {c["name"] for c in inspector.get_columns("subscriptions")}
            sub_migrations = [
                ("past_due_since", "TIMESTAMP"),
                ("cancel_at_period_end", "BOOLEAN DEFAULT FALSE"),
            ]
            for col_name, col_type in sub_migrations:
                if col_name not in existing_sub_cols:
                    db.execute(text(f"ALTER TABLE subscriptions ADD COLUMN {col_name} {col_type}"))
            db.commit()
        # Add share_token to financial_plans if missing
        if "financial_plans" in inspector.get_table_names():
            existing_plan_cols = {c["name"] for c in inspector.get_columns("financial_plans")}
            if "share_token" not in existing_plan_cols:
                db.execute(text("ALTER TABLE financial_plans ADD COLUMN share_token VARCHAR(36)"))
                db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/admin/users")
def list_users():
    from app.database import SessionLocal
    from app.models.user import User
    from app.models.subscription import Subscription
    db = SessionLocal()
    try:
        users = db.query(User).all()
        result = []
        for u in users:
            sub = db.query(Subscription).filter(Subscription.user_id == u.id).first()
            result.append({
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "subscribed": sub.status == "active" if sub else False,
                "created_at": str(u.created_at) if hasattr(u, 'created_at') else None,
            })
        return result
    finally:
        db.close()


@app.get("/api/debug/test-anthropic")
def test_anthropic():
    import anthropic
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=10,
            messages=[{"role": "user", "content": "hi"}],
        )
        return {"status": "ok", "response": response.content[0].text}
    except Exception as e:
        return {"status": "error", "error_type": type(e).__name__, "error": str(e), "key_prefix": settings.ANTHROPIC_API_KEY[:10] if settings.ANTHROPIC_API_KEY else "EMPTY"}
