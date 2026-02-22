import csv
import io
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.portfolio_holding import PortfolioHolding
from app.models.recurring_transaction import RecurringTransaction
from app.models.net_worth_entry import NetWorthEntry
from app.models.user import User

router = APIRouter(prefix="/api/csv", tags=["csv-io"])


@router.get("/export/portfolio")
def export_portfolio(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export portfolio holdings to CSV."""
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Symbol", "Shares", "Avg Cost", "Notes"])
    for h in holdings:
        writer.writerow([h.symbol, h.shares, h.avg_cost, h.notes or ""])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=portfolio.csv"},
    )


@router.get("/export/budget")
def export_budget(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export recurring transactions to CSV."""
    transactions = db.query(RecurringTransaction).filter(RecurringTransaction.user_id == user.id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Amount", "Category", "Frequency", "Type", "Is Active", "Next Due"])
    for t in transactions:
        writer.writerow([t.name, t.amount, t.category, t.frequency, t.type, t.is_active, str(t.next_due) if t.next_due else ""])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=budget.csv"},
    )


@router.get("/export/net-worth")
def export_net_worth(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export net worth entries to CSV."""
    entries = db.query(NetWorthEntry).filter(NetWorthEntry.user_id == user.id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Category", "Amount", "Type"])
    for e in entries:
        writer.writerow([e.name, e.category, e.amount, e.entry_type])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=net_worth.csv"},
    )


@router.post("/import/portfolio")
async def import_portfolio(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Import portfolio holdings from CSV. Expected columns: Symbol, Shares, Avg Cost, Notes (optional)."""
    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        try:
            symbol = row.get("Symbol", "").strip().upper()
            shares = float(row.get("Shares", 0))
            avg_cost = float(row.get("Avg Cost", 0))
            notes = row.get("Notes", "").strip() or None

            if not symbol or shares <= 0 or avg_cost <= 0:
                errors.append(f"Row {i}: invalid data")
                continue

            # Check if holding already exists — update if so
            existing = (
                db.query(PortfolioHolding)
                .filter(PortfolioHolding.user_id == user.id, PortfolioHolding.symbol == symbol)
                .first()
            )
            if existing:
                existing.shares = shares
                existing.avg_cost = avg_cost
                if notes:
                    existing.notes = notes
            else:
                db.add(PortfolioHolding(user_id=user.id, symbol=symbol, shares=shares, avg_cost=avg_cost, notes=notes))
            imported += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    return {"imported": imported, "errors": errors}


@router.post("/import/budget")
async def import_budget(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Import recurring transactions from CSV. Expected columns: Name, Amount, Category, Frequency, Type."""
    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        try:
            name = row.get("Name", "").strip()
            amount = float(row.get("Amount", 0))
            category = row.get("Category", "Other").strip()
            frequency = row.get("Frequency", "monthly").strip().lower()
            tx_type = row.get("Type", "expense").strip().lower()

            if not name or amount <= 0:
                errors.append(f"Row {i}: invalid data")
                continue

            if frequency not in ("weekly", "biweekly", "monthly", "quarterly", "yearly"):
                frequency = "monthly"
            if tx_type not in ("income", "expense"):
                tx_type = "expense"

            db.add(RecurringTransaction(
                user_id=user.id,
                name=name,
                amount=amount,
                category=category,
                frequency=frequency,
                type=tx_type,
            ))
            imported += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    return {"imported": imported, "errors": errors}
