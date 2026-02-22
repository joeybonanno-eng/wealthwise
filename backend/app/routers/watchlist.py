from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.watchlist_item import WatchlistItem
from app.models.user import User
from app.services.market_data_service import get_stock_quote

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


class WatchlistCreate(BaseModel):
    symbol: str
    target_buy_price: Optional[float] = None
    notes: Optional[str] = None


class WatchlistUpdate(BaseModel):
    target_buy_price: Optional[float] = None
    notes: Optional[str] = None


@router.get("/")
def get_watchlist(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user.id)
        .order_by(WatchlistItem.added_at.desc())
        .all()
    )

    results = []
    for item in items:
        current_price = None
        change_percent = None
        name = None
        try:
            quote = get_stock_quote(item.symbol)
            current_price = quote.get("price")
            change_percent = quote.get("change_percent")
            name = quote.get("name")
        except Exception:
            pass

        distance_pct = None
        buy_signal = False
        if current_price and item.target_buy_price:
            distance_pct = round(((current_price - item.target_buy_price) / item.target_buy_price) * 100, 2)
            buy_signal = current_price <= item.target_buy_price

        results.append({
            "id": item.id,
            "symbol": item.symbol,
            "name": name,
            "target_buy_price": item.target_buy_price,
            "notes": item.notes,
            "current_price": current_price,
            "change_percent": change_percent,
            "distance_pct": distance_pct,
            "buy_signal": buy_signal,
            "added_at": str(item.added_at),
        })

    return results


@router.post("/")
def add_to_watchlist(
    data: WatchlistCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = WatchlistItem(
        user_id=user.id,
        symbol=data.symbol.upper().strip(),
        target_buy_price=data.target_buy_price,
        notes=data.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id,
        "symbol": item.symbol,
        "target_buy_price": item.target_buy_price,
        "notes": item.notes,
    }


@router.put("/{item_id}")
def update_watchlist_item(
    item_id: int,
    data: WatchlistUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.id == item_id, WatchlistItem.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")

    if data.target_buy_price is not None:
        item.target_buy_price = data.target_buy_price
    if data.notes is not None:
        item.notes = data.notes

    db.commit()
    return {"status": "updated"}


@router.delete("/{item_id}")
def remove_from_watchlist(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.id == item_id, WatchlistItem.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    db.delete(item)
    db.commit()
    return {"status": "deleted"}
