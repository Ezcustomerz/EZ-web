from pydantic import BaseModel
from typing import Optional, List

class ClientSetupRequest(BaseModel):
    display_name: str
    email: str

class ClientSetupResponse(BaseModel):
    success: bool
    message: str

class ClientUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None
    profile_banner_url: Optional[str] = None

class ClientUpdateResponse(BaseModel):
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
    description: Optional[str] = None
    primary_contact: Optional[str] = None
    secondary_contact: Optional[str] = None
    availability_location: Optional[str] = None
    profile_highlights: Optional[List[str]] = None
    profile_highlight_values: Optional[dict] = None

class ClientCreativesListResponse(BaseModel):
    creatives: List[ClientCreativeResponse]
    total_count: int