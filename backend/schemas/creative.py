from pydantic import BaseModel
from typing import Optional, List, ForwardRef, Dict, Any, Literal

class CreativeSetupRequest(BaseModel):
    display_name: str
    title: str
    custom_title: Optional[str] = None
    primary_contact: Optional[str] = None
    secondary_contact: Optional[str] = None
    bio: Optional[str] = None
    subscription_tier_id: str  # UUID of subscription tier

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
    profile_picture_url: Optional[str] = None
    title: Optional[str] = None

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
    payment_option: str
    is_active: bool
    created_at: str
    updated_at: str
    requires_booking: bool
    photos: Optional[List["ServicePhotoRequest"]] = []

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
    session_duration: int = 60  # Duration in minutes
    default_session_length: int = 60
    min_notice_amount: int = 24
    min_notice_unit: str = 'hours'  # 'minutes', 'hours' or 'days'
    max_advance_amount: int = 30
    max_advance_unit: str = 'days'  # 'hours', 'days', 'weeks', or 'months'
    buffer_time_amount: int = 15
    buffer_time_unit: str = 'minutes'  # 'minutes' or 'hours'
    weekly_schedule: List[WeeklyScheduleRequest] = []

class ServicePhotoRequest(BaseModel):
    photo_url: str
    photo_filename: Optional[str] = None
    photo_size_bytes: Optional[int] = None
    is_primary: bool = False
    display_order: int = 0

class CreateServiceRequest(BaseModel):
    title: str
    description: str
    price: float
    delivery_time: Optional[str] = ''
    status: Literal['Public', 'Private', 'Bundle-Only'] = 'Private'
    color: str = '#3b82f6'
    payment_option: Literal['upfront', 'split', 'later'] = 'later'
    calendar_settings: Optional[CalendarSettingsRequest] = None
    photos: Optional[List[ServicePhotoRequest]] = None

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


# Profile settings schemas
class ProfileHighlightValue(BaseModel):
    value: str

class CreativeProfileSettingsRequest(BaseModel):
    # Basic profile info
    display_name: Optional[str] = None
    title: Optional[str] = None
    custom_title: Optional[str] = None
    availability_location: Optional[str] = None
    primary_contact: Optional[str] = None
    secondary_contact: Optional[str] = None
    description: Optional[str] = None
    
    # Profile highlights configuration
    selected_profile_highlights: Optional[List[str]] = None
    profile_highlight_values: Optional[Dict[str, str]] = None
    
    # Service display configuration
    primary_service_id: Optional[str] = None
    secondary_service_id: Optional[str] = None
    
    # Avatar settings
    avatar_background_color: Optional[str] = None

class CreativeProfileSettingsResponse(BaseModel):
    success: bool
    message: str

class CreativeDashboardStatsResponse(BaseModel):
    total_clients: int
    monthly_amount: float
    total_bookings: int
    completed_sessions: int

class ProfilePhotoUploadResponse(BaseModel):
    success: bool
    message: str
    profile_banner_url: str

# Bundle schemas
class CreateBundleRequest(BaseModel):
    title: str
    description: str
    color: str = '#3b82f6'
    status: Literal['Public', 'Private'] = 'Public'
    pricing_option: Literal['fixed', 'discount'] = 'fixed'
    fixed_price: Optional[float] = None
    discount_percentage: Optional[float] = None
    service_ids: List[str]

class CreateBundleResponse(BaseModel):
    success: bool
    message: str
    bundle_id: Optional[str] = None

class BundleServiceResponse(BaseModel):
    id: str
    title: str
    description: str
    price: float
    delivery_time: str
    status: str
    color: str
    photos: Optional[List["ServicePhotoRequest"]] = []

class CreativeBundleResponse(BaseModel):
    id: str
    title: str
    description: str
    color: str
    status: str
    pricing_option: str
    fixed_price: Optional[float] = None
    discount_percentage: Optional[float] = None
    total_services_price: float
    final_price: float
    services: List[BundleServiceResponse]
    is_active: bool
    created_at: str
    updated_at: str

class CreativeBundlesListResponse(BaseModel):
    bundles: List[CreativeBundleResponse]
    total_count: int

class UpdateBundleRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    status: Optional[Literal['Public', 'Private']] = None
    pricing_option: Optional[Literal['fixed', 'discount']] = None
    fixed_price: Optional[float] = None
    discount_percentage: Optional[float] = None
    service_ids: Optional[List[str]] = None

class UpdateBundleResponse(BaseModel):
    success: bool
    message: str

class DeleteBundleResponse(BaseModel):
    success: bool
    message: str

class PublicServicesAndBundlesResponse(BaseModel):
    services: List[CreativeServiceResponse]
    bundles: List[CreativeBundleResponse]
    services_count: int
    bundles_count: int