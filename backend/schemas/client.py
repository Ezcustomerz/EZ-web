from pydantic import BaseModel
from typing import Optional, List

class ClientSetupRequest(BaseModel):
    display_name: str
    title: str
    custom_title: Optional[str] = None
    email: str

class ClientSetupResponse(BaseModel):
    success: bool
    message: str

class ClientCreativeResponse(BaseModel):
    id: str
    name: str
    avatar: Optional[str] = None
    specialty: str
    email: str
    rating: float
    reviewCount: int
    servicesCount: int
    isOnline: bool
    color: str
    status: str

class ClientCreativesListResponse(BaseModel):
    creatives: List[ClientCreativeResponse]
    total_count: int