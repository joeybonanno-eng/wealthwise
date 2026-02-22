import random
from fastapi import APIRouter
from pydantic import BaseModel

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
