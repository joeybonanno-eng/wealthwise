import json
import html as html_lib
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_subscription
from app.models.financial_plan import FinancialPlan
from app.models.user import User
from app.schemas.financial_plan import CreatePlanRequest, PlanResponse
from app.services import chat_service

router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.post("/", response_model=PlanResponse)
def create_plan(
    request: CreatePlanRequest,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    # Generate AI plan if not provided
    ai_plan = request.ai_plan
    if not ai_plan:
        try:
            ai_plan = chat_service.generate_financial_plan(db, user, request.data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Plan generation error: {str(e)}")

    plan = FinancialPlan(
        user_id=user.id,
        title=request.title,
        plan_type=request.plan_type,
        data=json.dumps(request.data),
        ai_plan=ai_plan,
        status="active",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    # Emit event for background insight generation
    try:
        from app.services.event_bus import emit
        emit("plan.created", user_id=user.id, plan_title=request.title)
    except Exception:
        pass

    return plan


@router.get("/", response_model=List[PlanResponse])
def list_plans(
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    plans = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.user_id == user.id)
        .order_by(FinancialPlan.created_at.desc())
        .all()
    )
    return plans


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(
    plan_id: int,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    plan = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.id == plan_id, FinancialPlan.user_id == user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    plan = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.id == plan_id, FinancialPlan.user_id == user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return {"status": "deleted"}


@router.post("/{plan_id}/share")
def share_plan(
    plan_id: int,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    plan = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.id == plan_id, FinancialPlan.user_id == user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if not plan.share_token:
        plan.share_token = str(uuid4())
        db.commit()

    return {"share_token": plan.share_token}


@router.get("/shared/{share_token}")
def get_shared_plan(
    share_token: str,
    db: Session = Depends(get_db),
):
    """Public endpoint — no auth required."""
    plan = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.share_token == share_token)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Shared plan not found")

    return {
        "title": plan.title,
        "plan_type": plan.plan_type,
        "ai_plan": plan.ai_plan,
        "created_at": str(plan.created_at),
    }


@router.get("/{plan_id}/export")
def export_plan_pdf(
    plan_id: int,
    user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    """Export a financial plan as a downloadable HTML document (print-to-PDF ready)."""
    plan = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.id == plan_id, FinancialPlan.user_id == user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Convert markdown-like content to simple HTML
    ai_content = html_lib.escape(plan.ai_plan or "No plan content generated yet.")
    # Basic markdown conversion: headers, bold, bullets
    lines = ai_content.split("\n")
    html_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("### "):
            html_lines.append(f"<h3>{stripped[4:]}</h3>")
        elif stripped.startswith("## "):
            html_lines.append(f"<h2>{stripped[3:]}</h2>")
        elif stripped.startswith("# "):
            html_lines.append(f"<h1>{stripped[2:]}</h1>")
        elif stripped.startswith("- ") or stripped.startswith("* "):
            html_lines.append(f"<li>{stripped[2:]}</li>")
        elif stripped == "":
            html_lines.append("<br/>")
        else:
            html_lines.append(f"<p>{stripped}</p>")

    body = "\n".join(html_lines)

    html_doc = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>{html_lib.escape(plan.title)} - WealthWise</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; line-height: 1.6; }}
  h1 {{ color: #059669; border-bottom: 2px solid #059669; padding-bottom: 8px; }}
  h2 {{ color: #047857; margin-top: 24px; }}
  h3 {{ color: #065f46; }}
  li {{ margin: 4px 0; margin-left: 20px; }}
  .meta {{ color: #6b7280; font-size: 0.875rem; margin-bottom: 24px; }}
  .footer {{ margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 0.75rem; text-align: center; }}
  @media print {{ body {{ padding: 20px; }} }}
</style>
</head>
<body>
<h1>{html_lib.escape(plan.title)}</h1>
<div class="meta">
  <strong>Type:</strong> {html_lib.escape(plan.plan_type.replace('_', ' ').title())} |
  <strong>Status:</strong> {html_lib.escape(plan.status.title())} |
  <strong>Created:</strong> {plan.created_at.strftime('%B %d, %Y') if plan.created_at else 'N/A'}
</div>
{body}
<div class="footer">Generated by WealthWise AI Financial Advisor</div>
</body>
</html>"""

    return Response(
        content=html_doc,
        media_type="text/html",
        headers={
            "Content-Disposition": f'attachment; filename="{plan.title.replace(" ", "_")}_plan.html"',
        },
    )
