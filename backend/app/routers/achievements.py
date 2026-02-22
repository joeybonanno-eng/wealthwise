from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.achievement import Achievement
from app.models.user import User
from app.models.user_streak import UserStreak

router = APIRouter(prefix="/api/achievements", tags=["achievements"])

# Badge definitions
BADGES = {
    "first-chat": {
        "name": "First Chat",
        "description": "Send your first message to the AI advisor",
        "icon": "💬",
    },
    "first-plan": {
        "name": "First Plan",
        "description": "Create your first financial plan",
        "icon": "📋",
    },
    "first-holding": {
        "name": "First Holding",
        "description": "Add your first portfolio holding",
        "icon": "📈",
    },
    "budget-master": {
        "name": "Budget Master",
        "description": "Track 10+ budget transactions",
        "icon": "💰",
    },
    "diversified": {
        "name": "Diversified",
        "description": "Hold 5+ different stocks in your portfolio",
        "icon": "🎯",
    },
    "streak-7": {
        "name": "Week Warrior",
        "description": "Maintain a 7-day login streak",
        "icon": "🔥",
    },
    "streak-30": {
        "name": "Monthly Master",
        "description": "Maintain a 30-day login streak",
        "icon": "⭐",
    },
    "education-complete": {
        "name": "Scholar",
        "description": "View all 8 education lessons",
        "icon": "🎓",
    },
    "watchlist-pro": {
        "name": "Watchlist Pro",
        "description": "Add 5+ items to your watchlist",
        "icon": "👀",
    },
}


def _check_and_award(user_id: int, badge_key: str, db: Session) -> bool:
    """Award a badge if not already earned. Returns True if newly awarded."""
    existing = (
        db.query(Achievement)
        .filter(Achievement.user_id == user_id, Achievement.badge_key == badge_key)
        .first()
    )
    if existing:
        return False
    achievement = Achievement(user_id=user_id, badge_key=badge_key)
    db.add(achievement)
    return True


@router.get("/")
def get_achievements(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all earned and available badges, plus streak info."""
    earned = (
        db.query(Achievement)
        .filter(Achievement.user_id == user.id)
        .all()
    )
    earned_keys = {a.badge_key for a in earned}
    earned_map = {a.badge_key: str(a.unlocked_at) for a in earned}

    streak = db.query(UserStreak).filter(UserStreak.user_id == user.id).first()

    badges = []
    for key, info in BADGES.items():
        badges.append({
            "key": key,
            "name": info["name"],
            "description": info["description"],
            "icon": info["icon"],
            "earned": key in earned_keys,
            "unlocked_at": earned_map.get(key),
        })

    return {
        "badges": badges,
        "earned_count": len(earned_keys),
        "total_count": len(BADGES),
        "streak": {
            "current": streak.current_streak if streak else 0,
            "longest": streak.longest_streak if streak else 0,
            "last_active": str(streak.last_active_date) if streak and streak.last_active_date else None,
        },
    }


@router.post("/check-in")
def check_in(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Update login streak and check for newly earned achievements.
    Called silently on app load.
    """
    today = date.today()
    newly_earned = []

    # Update streak
    streak = db.query(UserStreak).filter(UserStreak.user_id == user.id).first()
    if not streak:
        streak = UserStreak(user_id=user.id, current_streak=1, longest_streak=1, last_active_date=today)
        db.add(streak)
    else:
        if streak.last_active_date == today:
            pass  # already checked in today
        elif streak.last_active_date == today - timedelta(days=1):
            streak.current_streak += 1
            if streak.current_streak > streak.longest_streak:
                streak.longest_streak = streak.current_streak
        else:
            streak.current_streak = 1
        streak.last_active_date = today

    # Check for achievements based on current state
    from app.models.conversation import Conversation
    from app.models.financial_plan import FinancialPlan
    from app.models.portfolio_holding import PortfolioHolding
    from app.models.recurring_transaction import RecurringTransaction
    from app.models.watchlist_item import WatchlistItem

    # first-chat
    chat_count = db.query(Conversation).filter(Conversation.user_id == user.id).count()
    if chat_count >= 1:
        if _check_and_award(user.id, "first-chat", db):
            newly_earned.append("first-chat")

    # first-plan
    plan_count = db.query(FinancialPlan).filter(FinancialPlan.user_id == user.id).count()
    if plan_count >= 1:
        if _check_and_award(user.id, "first-plan", db):
            newly_earned.append("first-plan")

    # first-holding
    holding_count = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).count()
    if holding_count >= 1:
        if _check_and_award(user.id, "first-holding", db):
            newly_earned.append("first-holding")

    # budget-master (10+ transactions)
    tx_count = db.query(RecurringTransaction).filter(RecurringTransaction.user_id == user.id).count()
    if tx_count >= 10:
        if _check_and_award(user.id, "budget-master", db):
            newly_earned.append("budget-master")

    # diversified (5+ holdings)
    if holding_count >= 5:
        if _check_and_award(user.id, "diversified", db):
            newly_earned.append("diversified")

    # streak-7
    if streak.current_streak >= 7:
        if _check_and_award(user.id, "streak-7", db):
            newly_earned.append("streak-7")

    # streak-30
    if streak.current_streak >= 30:
        if _check_and_award(user.id, "streak-30", db):
            newly_earned.append("streak-30")

    # watchlist-pro (5+ items)
    watchlist_count = db.query(WatchlistItem).filter(WatchlistItem.user_id == user.id).count()
    if watchlist_count >= 5:
        if _check_and_award(user.id, "watchlist-pro", db):
            newly_earned.append("watchlist-pro")

    db.commit()

    return {
        "streak": {
            "current": streak.current_streak,
            "longest": streak.longest_streak,
        },
        "newly_earned": newly_earned,
    }
