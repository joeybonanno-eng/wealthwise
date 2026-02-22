from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.entitlement_service import get_all_usage

router = APIRouter(prefix="/api/usage", tags=["usage"])


@router.get("/")
def get_usage_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_all_usage(db, user)
