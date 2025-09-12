from pydantic import BaseModel
from typing import Optional, List

class CreativeSetupRequest(BaseModel):
    display_name: str
    title: str
    custom_title: Optional[str] = None
    primary_contact: Optional[str] = None
    secondary_contact: Optional[str] = None
    bio: Optional[str] = None
    subscription_tier: str = 'basic'

class CreativeSetupResponse(BaseModel):
    success: bool
    message: str

class CreativeClientResponse(BaseModel):
    id: str
    name: str
    contact: str
    contactType: str
    status: str
    totalSpent: float
    projects: int

class CreativeClientsListResponse(BaseModel):
    clients: List[CreativeClientResponse]
    total_count: int

class CreativeServiceResponse(BaseModel):
    id: str
    title: str
    description: str
    price: float
    delivery_time: str
    status: str
    color: str
    is_active: bool
    is_enabled: bool
    created_at: str
    updated_at: str

class CreativeServicesListResponse(BaseModel):
    services: List[CreativeServiceResponse]
    total_count: int

class CreateServiceRequest(BaseModel):
    title: str
    description: str
    price: float
    delivery_time: str
    status: str = 'Private'  # Public or Private
    color: str = '#3b82f6'

class CreateServiceResponse(BaseModel):
    success: bool
    message: str
    service_id: Optional[str] = None

class UpdateServiceResponse(BaseModel):
    success: bool
    message: str

class DeleteServiceResponse(BaseModel):
    success: bool
    message: str

class ToggleServiceStatusRequest(BaseModel):
    enabled: bool  # True to enable, False to disable

class ToggleServiceStatusResponse(BaseModel):
    success: bool
    message: str
    enabled: bool