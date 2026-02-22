import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_subscription
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.schemas.chat import ChatResponse, ConversationDetail, ConversationSummary, MessageResponse, SendMessageRequest
from app.services import chat_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/send", response_model=ChatResponse)
def send_message(
    request: SendMessageRequest,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    try:
        result = chat_service.send_message(db, user, request.conversation_id, request.message)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Chat error: {type(e).__name__}: {str(e)} | Traceback: {tb[-500:]}")


@router.get("/conversations", response_model=List[ConversationSummary])
def list_conversations(
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [
        ConversationSummary(
            id=c.id,
            title=c.title,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
        )
        for c in conversations
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: int,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = []
    for msg in conversation.messages:
        tool_results = None
        if msg.tool_results:
            tool_results = json.loads(msg.tool_results)
        messages.append(
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                tool_results=tool_results,
            )
        )

    return ConversationDetail(id=conversation.id, title=conversation.title, messages=messages)


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conversation)
    db.commit()
    return {"status": "deleted"}
