from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.analytics_service import get_analytics

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/analytics")
def admin_analytics(db: Session = Depends(get_db)):
    """Admin analytics endpoint. Returns platform-wide metrics.
    Note: In production, this should be protected with an admin auth check.
    """
    return get_analytics(db)
