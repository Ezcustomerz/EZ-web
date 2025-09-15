from pydantic import BaseModel
from typing import Optional, List, ForwardRef

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

# Calendar scheduling schemas
class TimeBlockRequest(BaseModel):
    start: str  # Time in HH:MM format
    end: str    # Time in HH:MM format

class TimeSlotRequest(BaseModel):
    time: str   # Time in HH:MM format
    enabled: bool

class WeeklyScheduleRequest(BaseModel):
    day: str    # Day of week (Monday, Tuesday, etc.)
    enabled: bool
    time_blocks: List[TimeBlockRequest]
    time_slots: List[TimeSlotRequest]

class CalendarSettingsRequest(BaseModel):
    is_scheduling_enabled: bool = False
    use_time_slots: bool = False
    session_durations: List[int] = [60]  # Duration in minutes
    default_session_length: int = 60
    min_notice_amount: int = 24
    min_notice_unit: str = 'hours'  # 'hours' or 'days'
    max_advance_amount: int = 30
    max_advance_unit: str = 'days'  # 'days', 'weeks', or 'months'
    buffer_time_amount: int = 15
    buffer_time_unit: str = 'minutes'  # 'minutes' or 'hours'
    weekly_schedule: List[WeeklyScheduleRequest] = []

class CreateServiceRequest(BaseModel):
    title: str
    description: str
    price: float
    delivery_time: str
    status: str = 'Private'  # Public or Private
    color: str = '#3b82f6'
    calendar_settings: Optional[CalendarSettingsRequest] = None

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