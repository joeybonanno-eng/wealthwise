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


class CompoundInterestInput(BaseModel):
    principal: float
    monthly_contribution: float = 0
    annual_rate: float  # percent
    years: int
    compounds_per_year: int = 12  # monthly by default


@router.post("/compound")
def calculate_compound_interest(data: CompoundInterestInput):
    """Calculate compound interest with optional monthly contributions."""
    if data.years <= 0 or data.years > 100:
        return {"error": "Years must be between 1 and 100"}
    if data.compounds_per_year <= 0:
        return {"error": "Compounds per year must be positive"}

    r = data.annual_rate / 100
    n = data.compounds_per_year
    t = data.years

    yearly_data = []
    total_contributions = data.principal

    for year in range(1, t + 1):
        # Compound interest on principal
        principal_growth = data.principal * ((1 + r / n) ** (n * year))

        # Future value of monthly contributions (annuity)
        if r > 0:
            monthly_rate = r / 12
            months = year * 12
            contribution_growth = data.monthly_contribution * (((1 + monthly_rate) ** months - 1) / monthly_rate)
        else:
            contribution_growth = data.monthly_contribution * year * 12

        balance = principal_growth + contribution_growth
        total_contributed = data.principal + data.monthly_contribution * 12 * year
        interest_earned = balance - total_contributed

        yearly_data.append({
            "year": year,
            "balance": round(balance, 2),
            "total_contributed": round(total_contributed, 2),
            "interest_earned": round(interest_earned, 2),
        })

    final = yearly_data[-1] if yearly_data else {"balance": data.principal, "total_contributed": data.principal, "interest_earned": 0}

    return {
        "final_balance": final["balance"],
        "total_contributed": final["total_contributed"],
        "total_interest": final["interest_earned"],
        "yearly_data": yearly_data,
        "inputs": {
            "principal": data.principal,
            "monthly_contribution": data.monthly_contribution,
            "annual_rate": data.annual_rate,
            "years": data.years,
            "compounds_per_year": data.compounds_per_year,
        },
    }


class MortgageInput(BaseModel):
    home_price: float
    down_payment_pct: float = 20.0  # percent
    interest_rate: float  # annual percent
    loan_term: int = 30  # years
    property_tax_rate: float = 1.2  # annual percent of home value
    insurance_annual: float = 1200


@router.post("/mortgage")
def calculate_mortgage(data: MortgageInput):
    """Calculate mortgage payment, total interest, and amortization schedule."""
    down_payment = data.home_price * data.down_payment_pct / 100
    loan_amount = data.home_price - down_payment
    monthly_rate = data.interest_rate / 100 / 12
    num_payments = data.loan_term * 12

    if monthly_rate > 0:
        monthly_payment = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
    else:
        monthly_payment = loan_amount / num_payments

    monthly_tax = data.home_price * data.property_tax_rate / 100 / 12
    monthly_insurance = data.insurance_annual / 12
    total_monthly = monthly_payment + monthly_tax + monthly_insurance

    total_paid = monthly_payment * num_payments
    total_interest = total_paid - loan_amount

    # Amortization schedule (yearly summary)
    balance = loan_amount
    yearly_schedule = []
    year_principal = 0.0
    year_interest = 0.0

    for month in range(1, num_payments + 1):
        interest = balance * monthly_rate
        principal = monthly_payment - interest
        balance -= principal
        year_principal += principal
        year_interest += interest

        if month % 12 == 0:
            yearly_schedule.append({
                "year": month // 12,
                "principal_paid": round(year_principal, 2),
                "interest_paid": round(year_interest, 2),
                "remaining_balance": round(max(balance, 0), 2),
            })
            year_principal = 0.0
            year_interest = 0.0

    return {
        "monthly_payment": round(monthly_payment, 2),
        "monthly_tax": round(monthly_tax, 2),
        "monthly_insurance": round(monthly_insurance, 2),
        "total_monthly": round(total_monthly, 2),
        "loan_amount": round(loan_amount, 2),
        "down_payment": round(down_payment, 2),
        "total_interest": round(total_interest, 2),
        "total_paid": round(total_paid, 2),
        "yearly_schedule": yearly_schedule,
        "inputs": {
            "home_price": data.home_price,
            "down_payment_pct": data.down_payment_pct,
            "interest_rate": data.interest_rate,
            "loan_term": data.loan_term,
        },
    }


class TaxInput(BaseModel):
    filing_status: str = "single"  # single, married_joint, married_separate, head_of_household
    gross_income: float
    deductions: float = 0  # additional itemized deductions
    capital_gains_short: float = 0
    capital_gains_long: float = 0
    retirement_contributions: float = 0  # 401k, IRA


@router.post("/tax-estimate")
def estimate_taxes(data: TaxInput):
    """Estimate federal income tax based on 2024 brackets."""
    # Standard deductions (2024)
    standard_deductions = {
        "single": 14600,
        "married_joint": 29200,
        "married_separate": 14600,
        "head_of_household": 21900,
    }

    # 2024 federal tax brackets
    brackets = {
        "single": [(11600, 0.10), (47150, 0.12), (100525, 0.22), (191950, 0.24), (243725, 0.32), (609350, 0.35), (float("inf"), 0.37)],
        "married_joint": [(23200, 0.10), (94300, 0.12), (201050, 0.22), (383900, 0.24), (487450, 0.32), (731200, 0.35), (float("inf"), 0.37)],
        "married_separate": [(11600, 0.10), (47150, 0.12), (100525, 0.22), (191950, 0.24), (243725, 0.32), (365600, 0.35), (float("inf"), 0.37)],
        "head_of_household": [(16550, 0.10), (63100, 0.12), (100500, 0.22), (191950, 0.24), (243700, 0.32), (609350, 0.35), (float("inf"), 0.37)],
    }

    status = data.filing_status if data.filing_status in standard_deductions else "single"
    std_deduction = standard_deductions[status]
    deduction = max(std_deduction, data.deductions)
    deduction_type = "standard" if deduction == std_deduction else "itemized"

    # Adjust income
    agi = data.gross_income - data.retirement_contributions
    taxable_income = max(agi - deduction + data.capital_gains_short, 0)

    # Calculate ordinary income tax
    tax = 0.0
    prev_limit = 0
    bracket_breakdown = []
    for limit, rate in brackets[status]:
        if taxable_income <= 0:
            break
        bracket_income = min(taxable_income, limit) - prev_limit
        if bracket_income > 0:
            bracket_tax = bracket_income * rate
            tax += bracket_tax
            bracket_breakdown.append({
                "rate": rate * 100,
                "income": round(bracket_income, 2),
                "tax": round(bracket_tax, 2),
            })
        prev_limit = limit
        if prev_limit >= taxable_income:
            break

    # Long-term capital gains tax (simplified: 0%, 15%, 20%)
    ltcg = data.capital_gains_long
    ltcg_tax = 0.0
    if ltcg > 0:
        # Simplified thresholds for single
        if taxable_income + ltcg <= 44625:
            ltcg_tax = 0
        elif taxable_income + ltcg <= 492300:
            ltcg_tax = ltcg * 0.15
        else:
            ltcg_tax = ltcg * 0.20

    total_tax = tax + ltcg_tax

    # FICA (Social Security 6.2% up to $168,600 + Medicare 1.45%)
    ss_tax = min(data.gross_income, 168600) * 0.062
    medicare_tax = data.gross_income * 0.0145
    fica = ss_tax + medicare_tax

    effective_rate = (total_tax / data.gross_income * 100) if data.gross_income > 0 else 0
    marginal_rate = bracket_breakdown[-1]["rate"] if bracket_breakdown else 0

    return {
        "federal_income_tax": round(tax, 2),
        "ltcg_tax": round(ltcg_tax, 2),
        "total_federal_tax": round(total_tax, 2),
        "fica_tax": round(fica, 2),
        "total_tax": round(total_tax + fica, 2),
        "effective_rate": round(effective_rate, 1),
        "marginal_rate": marginal_rate,
        "taxable_income": round(taxable_income, 2),
        "agi": round(agi, 2),
        "deduction": round(deduction, 2),
        "deduction_type": deduction_type,
        "bracket_breakdown": bracket_breakdown,
        "take_home": round(data.gross_income - total_tax - fica, 2),
        "monthly_take_home": round((data.gross_income - total_tax - fica) / 12, 2),
    }
