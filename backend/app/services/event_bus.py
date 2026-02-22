"""Simple in-process event bus for triggering background tasks.

Events are fired-and-forgotten (async handlers run in background threads).
This keeps the main request path fast while enabling reactive behavior.
"""

import logging
import threading
from collections import defaultdict
from typing import Any, Callable, Dict, List

logger = logging.getLogger(__name__)

# Global event registry
_handlers: Dict[str, List[Callable]] = defaultdict(list)


def on(event: str, handler: Callable) -> None:
    """Register a handler for an event."""
    _handlers[event].append(handler)


def emit(event: str, **kwargs: Any) -> None:
    """Emit an event, running all handlers in background threads."""
    handlers = _handlers.get(event, [])
    for handler in handlers:
        thread = threading.Thread(
            target=_safe_call,
            args=(handler, event, kwargs),
            daemon=True,
        )
        thread.start()


def _safe_call(handler: Callable, event: str, kwargs: dict) -> None:
    """Call a handler safely, catching and logging any exceptions."""
    try:
        handler(**kwargs)
    except Exception:
        logger.exception(f"Event handler failed for '{event}': {handler.__name__}")


# ── Event Handlers ──

def _on_messages_milestone(user_id: int, message_count: int, **_: Any) -> None:
    """Auto-generate insights every 5 messages."""
    if message_count % 5 != 0:
        return

    from app.database import SessionLocal
    from app.models.user import User
    from app.services.insight_service import generate_insights

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            generate_insights(db, user)
            logger.info(f"Auto-generated insights for user {user_id} at {message_count} messages")
    except Exception:
        logger.exception(f"Failed to auto-generate insights for user {user_id}")
    finally:
        db.close()


def _on_plan_created(user_id: int, plan_title: str, **_: Any) -> None:
    """Generate insights when a new financial plan is created."""
    from app.database import SessionLocal
    from app.models.user import User
    from app.services.insight_service import generate_insights

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            generate_insights(db, user)
            logger.info(f"Auto-generated insights after plan '{plan_title}' created for user {user_id}")
    except Exception:
        logger.exception(f"Failed to generate insights after plan creation for user {user_id}")
    finally:
        db.close()


def _on_alert_triggered(user_id: int, symbol: str, **_: Any) -> None:
    """Generate insights when a price alert is triggered."""
    from app.database import SessionLocal
    from app.models.user import User
    from app.services.insight_service import generate_insights

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            generate_insights(db, user)
            logger.info(f"Auto-generated insights after alert triggered for {symbol}, user {user_id}")
    except Exception:
        logger.exception(f"Failed to generate insights after alert trigger for user {user_id}")
    finally:
        db.close()


# Register handlers
on("message.sent", _on_messages_milestone)
on("plan.created", _on_plan_created)
on("alert.triggered", _on_alert_triggered)
