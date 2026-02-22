import json
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.services import market_data_service


def execute_tool(
    tool_name: str,
    tool_input: Dict[str, Any],
    db: Optional[Session] = None,
    user_id: Optional[int] = None,
) -> str:
    try:
        # Market data tools
        if tool_name == "get_stock_quote":
            result = market_data_service.get_stock_quote(tool_input["symbol"])
        elif tool_name == "get_price_history":
            result = market_data_service.get_price_history(
                tool_input["symbol"],
                tool_input.get("period", "1mo"),
                tool_input.get("interval", "1d"),
            )
        elif tool_name == "get_company_info":
            result = market_data_service.get_company_info(tool_input["symbol"])
        elif tool_name == "get_sector_performance":
            result = market_data_service.get_sector_performance()

        # Internal tools (require db + user_id)
        elif tool_name == "get_financial_plans":
            result = _get_financial_plans(db, user_id)
        elif tool_name == "get_user_memory":
            result = _get_user_memory(db, user_id)
        elif tool_name == "save_user_memory":
            result = _save_user_memory(db, user_id, tool_input["key"], tool_input["value"])
        elif tool_name == "get_active_alerts":
            result = _get_active_alerts(db, user_id)
        elif tool_name == "get_usage_summary":
            result = _get_usage_summary(db, user_id)
        elif tool_name == "get_pending_insights":
            result = _get_pending_insights(db, user_id)
        else:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})

        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


def _get_financial_plans(db: Optional[Session], user_id: Optional[int]) -> dict:
    if not db or not user_id:
        return {"plans": [], "message": "No session context"}

    from app.models.financial_plan import FinancialPlan

    plans = (
        db.query(FinancialPlan)
        .filter(FinancialPlan.user_id == user_id, FinancialPlan.status == "active")
        .order_by(FinancialPlan.created_at.desc())
        .all()
    )
    return {
        "plans": [
            {
                "id": p.id,
                "title": p.title,
                "type": p.plan_type,
                "created_at": str(p.created_at),
                "summary": (p.ai_plan or "")[:500],
            }
            for p in plans
        ],
        "total": len(plans),
    }


def _get_user_memory(db: Optional[Session], user_id: Optional[int]) -> dict:
    if not db or not user_id:
        return {"memories": []}

    from app.models.user_memory import UserMemory

    memories = (
        db.query(UserMemory)
        .filter(UserMemory.user_id == user_id, ~UserMemory.key.like("conversation_summary_%"))
        .order_by(UserMemory.last_updated.desc())
        .limit(20)
        .all()
    )
    return {
        "memories": [
            {"key": m.key, "value": m.value, "source": m.source}
            for m in memories
        ]
    }


def _save_user_memory(db: Optional[Session], user_id: Optional[int], key: str, value: str) -> dict:
    if not db or not user_id:
        return {"status": "error", "message": "No session context"}

    from app.models.user_memory import UserMemory

    existing = (
        db.query(UserMemory)
        .filter(UserMemory.user_id == user_id, UserMemory.key == key)
        .first()
    )
    if existing:
        if value not in existing.value:
            existing.value = f"{existing.value}, {value}"
        existing.last_updated = datetime.utcnow()
        existing.source = "explicit"
    else:
        db.add(UserMemory(
            user_id=user_id,
            key=key,
            value=value,
            source="explicit",
            confidence=1.0,
        ))
    db.commit()
    return {"status": "saved", "key": key}


def _get_active_alerts(db: Optional[Session], user_id: Optional[int]) -> dict:
    if not db or not user_id:
        return {"alerts": []}

    from app.models.price_alert import PriceAlert

    alerts = (
        db.query(PriceAlert)
        .filter(PriceAlert.user_id == user_id, PriceAlert.is_active == True)
        .order_by(PriceAlert.created_at.desc())
        .all()
    )
    return {
        "alerts": [
            {
                "symbol": a.symbol,
                "condition": a.condition,
                "target_price": float(a.target_price),
                "triggered": a.triggered,
            }
            for a in alerts
        ],
        "total": len(alerts),
    }


def _get_usage_summary(db: Optional[Session], user_id: Optional[int]) -> dict:
    if not db or not user_id:
        return {"error": "No session context"}

    from app.services.entitlement_service import get_all_usage

    return get_all_usage(db, user_id)


def _get_pending_insights(db: Optional[Session], user_id: Optional[int]) -> dict:
    if not db or not user_id:
        return {"insights": []}

    from app.models.insight import Insight

    insights = (
        db.query(Insight)
        .filter(Insight.user_id == user_id, Insight.status.in_(["pending", "delivered"]))
        .order_by(Insight.created_at.desc())
        .limit(5)
        .all()
    )
    return {
        "insights": [
            {
                "type": i.type,
                "title": i.title,
                "body": i.body,
                "urgency": i.urgency,
                "confidence": i.confidence,
            }
            for i in insights
        ],
        "total": len(insights),
    }
