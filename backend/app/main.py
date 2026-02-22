from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.models import Conversation, FinancialProfile, Message, Subscription, User  # noqa: F401
from app.routers import auth, chat, market_data, profile, subscription

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


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


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
