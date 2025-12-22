from pydantic import BaseModel
from typing import List, Optional

class IncomeDataPoint(BaseModel):
    name: str
    income: Optional[float]  # Can be None for future periods
    is_current: bool

class IncomeOverTimeResponse(BaseModel):
    data: List[IncomeDataPoint]
    total: float
    available_periods: List[int]  # List of available period offsets (0, -1, -2, etc.)
    account_created_at: str

class ServiceBreakdownItem(BaseModel):
    name: str
    value: float
    color: str
    service_id: str

class ServiceBreakdownResponse(BaseModel):
    data: List[ServiceBreakdownItem]
    total: float
    available_periods: List[int]  # List of available period offsets (0, -1, -2, etc.)

class ClientLeaderboardItem(BaseModel):
    id: str  # client_user_id
    name: str
    services_amount: int
    total_paid: float
    last_payment_date: str

class ClientLeaderboardResponse(BaseModel):
    data: List[ClientLeaderboardItem]

