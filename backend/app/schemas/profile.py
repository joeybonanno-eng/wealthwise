from typing import Optional

from pydantic import BaseModel, ConfigDict


class FinancialProfileRequest(BaseModel):
    age: Optional[int] = None
    annual_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    total_savings: Optional[float] = None
    total_debt: Optional[float] = None
    risk_tolerance: Optional[str] = None
    investment_goals: Optional[str] = None
    portfolio_description: Optional[str] = None


class FinancialProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    age: Optional[int] = None
    annual_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    total_savings: Optional[float] = None
    total_debt: Optional[float] = None
    risk_tolerance: Optional[str] = None
    investment_goals: Optional[str] = None
    portfolio_description: Optional[str] = None
