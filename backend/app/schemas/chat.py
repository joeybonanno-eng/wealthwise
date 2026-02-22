from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class SendMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    tool_results: Optional[List[Dict[str, Any]]] = None


class ChatResponse(BaseModel):
    conversation_id: int
    message: MessageResponse


class ConversationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: str
    updated_at: str


class ConversationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    messages: List[MessageResponse]
