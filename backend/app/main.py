from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.models import Conversation, FinancialPlan, FinancialProfile, Message, PriceAlert, Subscription, User  # noqa: F401
from app.routers import auth, chat, financial_plan, market_data, price_alert, profile, subscription

app = FastAPI(title="WealthWise API", version="1.0.0")

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
            ]
            for col_name, col_type in migrations:
                if col_name not in existing:
                    db.execute(text(f"ALTER TABLE financial_profiles ADD COLUMN {col_name} {col_type}"))
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
