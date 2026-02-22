from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.net_worth_entry import NetWorthEntry
from app.models.user import User

router = APIRouter(prefix="/api/net-worth", tags=["net-worth"])

ASSET_CATEGORIES = [
    "Cash", "Investments", "Real Estate", "Vehicles", "Retirement Accounts", "Other Assets"
]
LIABILITY_CATEGORIES = [
    "Credit Cards", "Student Loans", "Mortgage", "Auto Loans", "Other Debt"
]


class EntryCreate(BaseModel):
    name: str
    category: str
    amount: float
    entry_type: str  # "asset" or "liability"


class EntryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None


@router.get("/")
def get_entries(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all net worth entries for the user."""
    entries = (
        db.query(NetWorthEntry)
        .filter(NetWorthEntry.user_id == user.id)
        .order_by(NetWorthEntry.created_at.desc())
        .all()
    )
    return [
        {
            "id": e.id,
            "name": e.name,
            "category": e.category,
            "amount": e.amount,
            "entry_type": e.entry_type,
            "created_at": str(e.created_at),
        }
        for e in entries
    ]


@router.post("/")
def create_entry(
    data: EntryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new asset or liability entry."""
    if data.entry_type not in ("asset", "liability"):
        raise HTTPException(status_code=400, detail="entry_type must be 'asset' or 'liability'")

    entry = NetWorthEntry(
        user_id=user.id,
        name=data.name.strip(),
        category=data.category,
        amount=data.amount,
        entry_type=data.entry_type,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {
        "id": entry.id,
        "name": entry.name,
        "category": entry.category,
        "amount": entry.amount,
        "entry_type": entry.entry_type,
        "created_at": str(entry.created_at),
    }


@router.put("/{entry_id}")
def update_entry(
    entry_id: int,
    data: EntryUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing entry."""
    entry = (
        db.query(NetWorthEntry)
        .filter(NetWorthEntry.id == entry_id, NetWorthEntry.user_id == user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    if data.name is not None:
        entry.name = data.name.strip()
    if data.category is not None:
        entry.category = data.category
    if data.amount is not None:
        entry.amount = data.amount

    db.commit()
    return {"status": "updated"}


@router.delete("/{entry_id}")
def delete_entry(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an entry."""
    entry = (
        db.query(NetWorthEntry)
        .filter(NetWorthEntry.id == entry_id, NetWorthEntry.user_id == user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(entry)
    db.commit()
    return {"status": "deleted"}


@router.get("/summary")
def get_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get net worth summary: total assets, liabilities, net worth, breakdown by category."""
    entries = (
        db.query(NetWorthEntry)
        .filter(NetWorthEntry.user_id == user.id)
        .all()
    )

    total_assets = 0.0
    total_liabilities = 0.0
    asset_breakdown: dict[str, float] = {}
    liability_breakdown: dict[str, float] = {}

    for e in entries:
        if e.entry_type == "asset":
            total_assets += e.amount
            asset_breakdown[e.category] = asset_breakdown.get(e.category, 0) + e.amount
        else:
            total_liabilities += e.amount
            liability_breakdown[e.category] = liability_breakdown.get(e.category, 0) + e.amount

    return {
        "total_assets": round(total_assets, 2),
        "total_liabilities": round(total_liabilities, 2),
        "net_worth": round(total_assets - total_liabilities, 2),
        "asset_breakdown": asset_breakdown,
        "liability_breakdown": liability_breakdown,
    }
