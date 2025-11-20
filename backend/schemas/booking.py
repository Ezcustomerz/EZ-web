from pydantic import BaseModel
from typing import Optional, List


class CreateBookingRequest(BaseModel):
    service_id: str
    booking_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    session_duration: Optional[int] = None
    notes: Optional[str] = None


class CreateBookingResponse(BaseModel):
    success: bool
    message: str
    booking_id: Optional[str] = None
    booking: Optional[dict] = None


class OrderFile(BaseModel):
    id: str
    name: str
    type: str
    size: str

class Invoice(BaseModel):
    type: str  # 'ez_invoice' | 'stripe_receipt'
    name: str
    download_url: str
    session_id: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    service_id: str
    service_name: str
    service_description: Optional[str]
    service_delivery_time: Optional[str]
    service_color: Optional[str]
    creative_id: str
    creative_name: str
    creative_display_name: Optional[str]
    creative_title: Optional[str]
    creative_avatar_url: Optional[str]
    creative_email: Optional[str]
    creative_rating: Optional[float]
    creative_review_count: Optional[int]
    creative_services_count: Optional[int]
    creative_color: Optional[str]
    order_date: str
    booking_date: Optional[str]
    canceled_date: Optional[str]
    approved_at: Optional[str]
    price: float
    payment_option: Optional[str]
    amount_paid: Optional[float] = 0.0
    description: Optional[str]
    status: str
    client_status: Optional[str]
    creative_status: Optional[str]
    files: Optional[List[OrderFile]] = None
    invoices: Optional[List[Invoice]] = None


class OrdersListResponse(BaseModel):
    success: bool
    orders: List[OrderResponse]


class CalendarSessionResponse(BaseModel):
    id: str
    date: str  # yyyy-MM-dd format
    time: str  # HH:MM format
    endTime: str  # HH:MM format
    client: str
    type: str  # service name
    status: str  # 'pending' | 'confirmed' | 'cancelled'
    notes: Optional[str] = None


class CalendarSessionsResponse(BaseModel):
    success: bool
    sessions: List[CalendarSessionResponse]


class ApproveBookingRequest(BaseModel):
    booking_id: str


class ApproveBookingResponse(BaseModel):
    success: bool
    message: str


class RejectBookingRequest(BaseModel):
    booking_id: str


class RejectBookingResponse(BaseModel):
    success: bool
    message: str


class CancelBookingRequest(BaseModel):
    booking_id: str


class CancelBookingResponse(BaseModel):
    success: bool
    message: str


class FinalizeServiceRequest(BaseModel):
    booking_id: str
    files: Optional[List[dict]] = None  # List of file objects with url, name, size, type


class FinalizeServiceResponse(BaseModel):
    success: bool
    message: str
    booking_id: str
