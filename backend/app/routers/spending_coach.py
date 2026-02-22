from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.recurring_transaction import RecurringTransaction
from app.models.expense_category import ExpenseCategory
from app.models.savings_goal import SavingsGoal
from app.models.user import User

router = APIRouter(prefix="/api/spending-coach", tags=["spending-coach"])

FREQUENCY_MULTIPLIER = {
    "weekly": 4.33,
    "biweekly": 2.17,
    "monthly": 1.0,
    "quarterly": 1.0 / 3.0,
    "yearly": 1.0 / 12.0,
}


@router.get("/")
def get_spending_coach(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """AI-powered spending analysis with personalized recommendations."""
    txns = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.user_id == user.id, RecurringTransaction.is_active == True)
        .all()
    )

    if not txns:
        return {
            "coaching": "Add your recurring transactions in the Budget page first, and I'll analyze your spending patterns with personalized advice.",
            "tips": [],
            "stats": None,
        }

    # Build detailed spending profile
    income_items = []
    expense_items = []
    by_category: dict[str, float] = {}

    for t in txns:
        mult = FREQUENCY_MULTIPLIER.get(t.frequency, 1.0)
        monthly = t.amount * mult
        entry = {"name": t.name, "monthly": monthly, "category": t.category, "frequency": t.frequency}
        if t.type == "income":
            income_items.append(entry)
        else:
            expense_items.append(entry)
            by_category[t.category] = by_category.get(t.category, 0) + monthly

    total_income = sum(i["monthly"] for i in income_items)
    total_expenses = sum(e["monthly"] for e in expense_items)
    net = total_income - total_expenses
    savings_rate = (net / total_income * 100) if total_income > 0 else 0

    # Get budget limits
    categories = db.query(ExpenseCategory).filter(ExpenseCategory.user_id == user.id).all()
    budget_limits = {c.name: c.monthly_budget for c in categories if c.monthly_budget > 0}

    # Get savings goals
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id).all()
    goals_text = ""
    if goals:
        goals_text = "\nSavings Goals:\n" + "\n".join(
            f"- {g.name}: ${g.current_amount:,.0f} / ${g.target_amount:,.0f} ({g.category})"
            for g in goals
        )

    # Over-budget categories
    over_budget = []
    for cat, spent in by_category.items():
        if cat in budget_limits and spent > budget_limits[cat]:
            over_budget.append({"category": cat, "spent": round(spent, 2), "budget": budget_limits[cat], "over_by": round(spent - budget_limits[cat], 2)})

    # Build AI prompt
    spending_text = "Income:\n" + "\n".join(f"- {i['name']}: ${i['monthly']:.2f}/mo ({i['category']})" for i in income_items)
    spending_text += "\n\nExpenses:\n" + "\n".join(f"- {e['name']}: ${e['monthly']:.2f}/mo ({e['category']})" for e in sorted(expense_items, key=lambda x: -x["monthly"]))
    spending_text += f"\n\nTotal Monthly Income: ${total_income:,.2f}"
    spending_text += f"\nTotal Monthly Expenses: ${total_expenses:,.2f}"
    spending_text += f"\nNet Savings: ${net:,.2f}/mo ({savings_rate:.1f}%)"

    if budget_limits:
        spending_text += "\n\nBudget Limits:\n" + "\n".join(f"- {cat}: ${lim:.2f}/mo (actual: ${by_category.get(cat, 0):.2f})" for cat, lim in budget_limits.items())

    if over_budget:
        spending_text += "\n\nOVER BUDGET: " + ", ".join(f"{o['category']} by ${o['over_by']:.2f}" for o in over_budget)

    spending_text += goals_text

    coaching = ""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[{
                "role": "user",
                "content": f"""You are a personal spending coach. Analyze this person's budget and provide:
1. A brief overall assessment (2-3 sentences)
2. 3-5 specific, actionable tips to optimize spending
3. A motivational closing sentence

Be direct, specific with dollar amounts, and encouraging. No disclaimers.

{spending_text}""",
            }],
        )
        coaching = response.content[0].text
    except Exception:
        # Fallback
        coaching = f"Your monthly income is ${total_income:,.2f} with expenses of ${total_expenses:,.2f}, giving you a savings rate of {savings_rate:.1f}%.\n\n"
        if savings_rate >= 20:
            coaching += "You're doing great — saving above the recommended 20% threshold. "
        elif savings_rate >= 0:
            coaching += "Your savings rate is positive but below the recommended 20%. Look for opportunities to reduce your largest expense categories. "
        else:
            coaching += "You're currently spending more than you earn. Focus on cutting non-essential expenses immediately. "

        if expense_items:
            top = sorted(expense_items, key=lambda x: -x["monthly"])[:3]
            top_strs = ["{} (${:.0f}/mo)".format(e["name"], e["monthly"]) for e in top]
            coaching += "\n\nYour top expenses are: " + ", ".join(top_strs) + "."

        if over_budget:
            ob_strs = [o["category"] for o in over_budget]
            coaching += "\n\nYou're over budget in: " + ", ".join(ob_strs) + "."

    # Generate quick tips
    tips = []
    sorted_expenses = sorted(expense_items, key=lambda x: -x["monthly"])
    if sorted_expenses:
        biggest = sorted_expenses[0]
        tips.append(f"Your biggest expense is {biggest['name']} at ${biggest['monthly']:,.0f}/mo — can you negotiate a lower rate?")
    if savings_rate < 20 and total_income > 0:
        gap = total_income * 0.20 - net
        if gap > 0:
            tips.append(f"To reach a 20% savings rate, find ${gap:,.0f}/mo in savings or extra income.")
    for o in over_budget[:2]:
        tips.append(f"You're ${o['over_by']:,.0f} over budget in {o['category']} — review for easy cuts.")
    if not tips:
        tips.append("You're in great shape! Consider increasing investment contributions.")

    return {
        "coaching": coaching,
        "tips": tips,
        "over_budget": over_budget,
        "stats": {
            "monthly_income": round(total_income, 2),
            "monthly_expenses": round(total_expenses, 2),
            "net_savings": round(net, 2),
            "savings_rate": round(savings_rate, 1),
            "expense_categories": len(by_category),
            "income_sources": len(income_items),
        },
    }
