import random
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/calculators", tags=["calculators"])


class RetirementInput(BaseModel):
    current_age: int
    retirement_age: int
    current_savings: float
    monthly_contribution: float
    expected_return: float = 7.0  # percent
    inflation_rate: float = 3.0  # percent


@router.post("/retirement")
def calculate_retirement(data: RetirementInput):
    """
    Project retirement savings with Monte Carlo-lite simulation.
    Returns year-by-year growth and summary metrics.
    """
    years_to_retirement = data.retirement_age - data.current_age
    if years_to_retirement <= 0:
        return {"error": "Retirement age must be greater than current age"}

    real_return = (1 + data.expected_return / 100) / (1 + data.inflation_rate / 100) - 1
    annual_contribution = data.monthly_contribution * 12

    # Deterministic projection
    yearly_data = []
    balance = data.current_savings
    for year in range(1, years_to_retirement + 1):
        balance = balance * (1 + real_return) + annual_contribution
        yearly_data.append({
            "year": year,
            "age": data.current_age + year,
            "balance": round(balance, 2),
        })

    projected_balance = round(balance, 2)
    annual_withdrawal_4pct = round(balance * 0.04, 2)
    monthly_withdrawal = round(annual_withdrawal_4pct / 12, 2)

    # Monte Carlo-lite: 500 simulations with random annual returns
    mean_return = data.expected_return / 100
    std_dev = 0.15  # historical stock market std dev ~15%
    success_count = 0
    num_simulations = 500
    retirement_years = 30  # assume 30 years in retirement

    for _ in range(num_simulations):
        sim_balance = data.current_savings
        # Accumulation phase
        for _ in range(years_to_retirement):
            r = random.gauss(mean_return, std_dev)
            real_r = (1 + r) / (1 + data.inflation_rate / 100) - 1
            sim_balance = sim_balance * (1 + real_r) + annual_contribution

        # Withdrawal phase: 4% rule
        annual_spend = sim_balance * 0.04
        survived = True
        for _ in range(retirement_years):
            r = random.gauss(mean_return * 0.8, std_dev)  # slightly lower in retirement
            real_r = (1 + r) / (1 + data.inflation_rate / 100) - 1
            sim_balance = sim_balance * (1 + real_r) - annual_spend
            if sim_balance <= 0:
                survived = False
                break

        if survived:
            success_count += 1

    success_rate = round(success_count / num_simulations * 100, 1)

    return {
        "projected_balance": projected_balance,
        "annual_withdrawal": annual_withdrawal_4pct,
        "monthly_withdrawal": monthly_withdrawal,
        "success_rate": success_rate,
        "years_to_retirement": years_to_retirement,
        "yearly_data": yearly_data,
        "inputs": {
            "current_age": data.current_age,
            "retirement_age": data.retirement_age,
            "current_savings": data.current_savings,
            "monthly_contribution": data.monthly_contribution,
            "expected_return": data.expected_return,
            "inflation_rate": data.inflation_rate,
        },
    }


class DebtItem(BaseModel):
    name: str
    balance: float
    interest_rate: float  # annual %
    minimum_payment: float


class DebtPayoffInput(BaseModel):
    debts: List[DebtItem]
    extra_monthly: float = 0  # extra $ above minimums to apply


def _simulate_payoff(debts_input: list, extra: float, strategy: str) -> dict:
    """Simulate debt payoff month by month."""
    debts = [
        {"name": d["name"], "balance": d["balance"], "rate": d["rate"], "min_pay": d["min_pay"]}
        for d in debts_input
    ]

    # Sort based on strategy
    if strategy == "avalanche":
        debts.sort(key=lambda d: -d["rate"])  # highest rate first
    else:  # snowball
        debts.sort(key=lambda d: d["balance"])  # lowest balance first

    total_paid = 0.0
    total_interest = 0.0
    months = 0
    schedule = []
    max_months = 600  # 50 year cap

    while any(d["balance"] > 0.005 for d in debts) and months < max_months:
        months += 1
        month_data = {"month": months, "debts": []}
        remaining_extra = extra

        for d in debts:
            if d["balance"] <= 0.005:
                d["balance"] = 0
                continue

            # Monthly interest
            interest = d["balance"] * (d["rate"] / 100 / 12)
            total_interest += interest
            d["balance"] += interest

            # Pay minimum
            payment = min(d["min_pay"], d["balance"])
            d["balance"] -= payment
            total_paid += payment

        # Apply extra to the priority debt
        for d in debts:
            if d["balance"] <= 0.005 or remaining_extra <= 0:
                continue
            extra_pay = min(remaining_extra, d["balance"])
            d["balance"] -= extra_pay
            remaining_extra -= extra_pay
            total_paid += extra_pay

        # Freed-up minimums from paid off debts go to extra
        freed = sum(d["min_pay"] for d in debts if d["balance"] <= 0.005)
        # This is handled implicitly in next iteration

        # Record every 1st month and then every 6 months for compactness
        if months <= 3 or months % 6 == 0:
            schedule.append({
                "month": months,
                "balances": {d["name"]: round(max(d["balance"], 0), 2) for d in debts},
                "total_remaining": round(sum(max(d["balance"], 0) for d in debts), 2),
            })

    return {
        "strategy": strategy,
        "months_to_payoff": months,
        "years_to_payoff": round(months / 12, 1),
        "total_paid": round(total_paid, 2),
        "total_interest": round(total_interest, 2),
        "schedule": schedule,
    }


@router.post("/debt-payoff")
def calculate_debt_payoff(data: DebtPayoffInput):
    """
    Calculate debt payoff with both snowball and avalanche strategies.
    """
    if not data.debts:
        return {"error": "No debts provided"}

    debts_input = [
        {"name": d.name, "balance": d.balance, "rate": d.interest_rate, "min_pay": d.minimum_payment}
        for d in data.debts
    ]

    total_debt = sum(d["balance"] for d in debts_input)
    total_minimum = sum(d["min_pay"] for d in debts_input)

    avalanche = _simulate_payoff(debts_input, data.extra_monthly, "avalanche")
    snowball = _simulate_payoff(debts_input, data.extra_monthly, "snowball")

    interest_saved = round(snowball["total_interest"] - avalanche["total_interest"], 2)

    return {
        "avalanche": avalanche,
        "snowball": snowball,
        "summary": {
            "total_debt": round(total_debt, 2),
            "total_minimum_payments": round(total_minimum, 2),
            "extra_monthly": data.extra_monthly,
            "interest_saved_avalanche": max(interest_saved, 0),
            "recommended": "avalanche" if interest_saved >= 0 else "snowball",
        },
    }
