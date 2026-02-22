from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.onboarding_service import chat_onboarding

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


class OnboardingMessage(BaseModel):
    role: str
    content: str


class OnboardingRequest(BaseModel):
    messages: List[OnboardingMessage]


@router.post("/chat")
def onboarding_chat(
    request: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    return chat_onboarding(db, user, messages)
