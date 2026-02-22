import json
from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.schemas.chat import ChatResponse, ConversationDetail, ConversationSummary, MessageResponse, SendMessageRequest
from app.services import chat_service
from app.services.entitlement_service import check_entitlement, increment_usage

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/send", response_model=ChatResponse)
@limiter.limit("20/minute")
def send_message(
    request: Request,
    body: SendMessageRequest = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check message entitlement
    entitlement = check_entitlement(db, user, "messages")
    if not entitlement["allowed"]:
        raise HTTPException(
            status_code=403,
            detail=f"You've used all {entitlement['limit']} free messages this month. Upgrade to Pro for unlimited conversations.",
        )

    try:
        result = chat_service.send_message(db, user, body.conversation_id, body.message)
        # Increment usage after successful send
        increment_usage(db, user.id, "messages")
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Chat error: {type(e).__name__}: {str(e)} | Traceback: {tb[-500:]}")


@router.get("/conversations", response_model=List[ConversationSummary])
def list_conversations(
    user: User = Depends(get_current_user),
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
    user: User = Depends(get_current_user),
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
    user: User = Depends(get_current_user),
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


@router.get("/search")
def search_conversations(
    q: str = Query(..., min_length=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search across all conversation messages for the current user."""
    messages = (
        db.query(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == user.id, Message.content.ilike(f"%{q}%"))
        .order_by(Message.created_at.desc())
        .limit(50)
        .all()
    )

    results = []
    for msg in messages:
        conv = db.query(Conversation).filter(Conversation.id == msg.conversation_id).first()
        results.append({
            "conversation_id": msg.conversation_id,
            "conversation_title": conv.title if conv else "Unknown",
            "message_id": msg.id,
            "content": msg.content[:300],
            "role": msg.role,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        })

    return {"results": results}
