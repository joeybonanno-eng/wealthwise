from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.user_memory import UserMemory

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("/")
def list_memories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memories = (
        db.query(UserMemory)
        .filter(
            UserMemory.user_id == user.id,
            ~UserMemory.key.like("conversation_summary_%"),
        )
        .order_by(UserMemory.last_updated.desc())
        .all()
    )
    return [
        {
            "id": m.id,
            "key": m.key,
            "value": m.value,
            "source": m.source,
            "confidence": m.confidence,
            "last_updated": str(m.last_updated) if m.last_updated else None,
        }
        for m in memories
    ]


@router.delete("/{key}")
def delete_memory(
    key: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memory = (
        db.query(UserMemory)
        .filter(UserMemory.user_id == user.id, UserMemory.key == key)
        .first()
    )
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    db.delete(memory)
    db.commit()
    return {"status": "deleted"}
