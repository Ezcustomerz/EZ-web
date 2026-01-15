from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SubscriptionTierResponse(BaseModel):
    """Response model for subscription tier"""
    id: str
    name: str
    price: float
    storage_amount_bytes: int
    storage_display: str
    description: Optional[str] = None
    fee_percentage: float
    is_active: bool
    tier_level: int
    stripe_product_id: Optional[str] = None
    stripe_price_id: Optional[str] = None


class CreateCheckoutSessionRequest(BaseModel):
    """Request to create a Stripe Checkout session for subscription"""
    subscription_tier_id: str = Field(..., description="ID of the subscription tier to subscribe to")


class CreateCheckoutSessionResponse(BaseModel):
    """Response with Stripe Checkout session URL"""
    checkout_url: str
    session_id: str


class SubscriptionStatusResponse(BaseModel):
    """Response with current subscription status"""
    has_subscription: bool
    subscription_tier_id: Optional[str] = None
    subscription_tier_name: Optional[str] = None
    status: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: Optional[bool] = None
    stripe_customer_id: Optional[str] = None


class VerifySubscriptionRequest(BaseModel):
    """Request to verify a subscription payment"""
    session_id: str = Field(..., description="Stripe Checkout session ID")


class VerifySubscriptionResponse(BaseModel):
    """Response after verifying subscription"""
    success: bool
    message: str
    subscription_tier_id: Optional[str] = None
    subscription_status: Optional[str] = None


class CancelSubscriptionResponse(BaseModel):
    """Response after canceling subscription"""
    success: bool
    message: str
    canceled_at_period_end: bool


class PaymentMethodDetails(BaseModel):
    """Payment method details"""
    id: str
    brand: Optional[str] = None
    last4: Optional[str] = None
    exp_month: Optional[int] = None
    exp_year: Optional[int] = None
    is_default: bool = False


class InvoiceDetails(BaseModel):
    """Invoice details"""
    id: str
    number: Optional[str] = None
    amount_due: int
    amount_paid: int
    status: str
    created: datetime
    invoice_pdf: Optional[str] = None
    hosted_invoice_url: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class BillingDetailsResponse(BaseModel):
    """Complete billing details for a subscription"""
    # Subscription info
    has_subscription: bool
    subscription_tier: Optional[SubscriptionTierResponse] = None
    subscription_status: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: Optional[bool] = None
    canceled_at: Optional[datetime] = None
    
    # Payment method
    payment_method: Optional[PaymentMethodDetails] = None
    
    # Invoices
    invoices: List[InvoiceDetails] = []
    
    # Tier info
    is_top_tier: bool = False
    stripe_customer_id: Optional[str] = None


class CreateBillingPortalRequest(BaseModel):
    """Request to create a billing portal session"""
    return_url: str = Field(..., description="URL to return to after managing payment methods")


class CreateBillingPortalResponse(BaseModel):
    """Response with billing portal URL"""
    portal_url: str
