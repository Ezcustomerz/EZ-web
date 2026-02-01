from fastapi import APIRouter, Depends, HTTPException, status
from db.db_session import get_authenticated_client_dep
from supabase import Client
from core.verify import require_auth
from typing import Dict, Any
from schemas.subscription import (
    CreateCheckoutSessionRequest,
    CreateCheckoutSessionResponse,
    SubscriptionStatusResponse,
    VerifySubscriptionRequest,
    VerifySubscriptionResponse,
    CancelSubscriptionResponse,
    BillingDetailsResponse,
    CreateBillingPortalRequest,
    CreateBillingPortalResponse,
)
from services.subscriptions.subscription_service import SubscriptionService
from core.safe_errors import log_exception_if_dev
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/subscriptions",
    tags=["subscriptions"],
)


@router.post("/create-checkout-session", response_model=CreateCheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Create a Stripe Checkout Session for subscription payment.
    
    This endpoint creates a Stripe Checkout session that allows users to subscribe
    to a paid subscription tier. The session redirects to success/cancel URLs after completion.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await SubscriptionService.create_checkout_session(
            user_id=user_id,
            subscription_tier_id=request.subscription_tier_id,
            client=client
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error in create_checkout_session endpoint", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )


@router.post("/verify", response_model=VerifySubscriptionResponse)
async def verify_subscription(
    request: VerifySubscriptionRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Verify a subscription payment and activate the subscription.
    
    This endpoint should be called after the user completes payment through
    Stripe Checkout. It verifies the payment was successful and activates
    the user's subscription.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await SubscriptionService.verify_subscription_and_update(
            session_id=request.session_id,
            client=client
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error in verify_subscription endpoint", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify subscription"
        )


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get the current subscription status for the authenticated user.
    
    Returns information about the user's active subscription including
    tier, status, and billing period details.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await SubscriptionService.get_subscription_status(
            user_id=user_id,
            client=client
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error in get_subscription_status endpoint", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subscription status"
        )


@router.post("/cancel", response_model=CancelSubscriptionResponse)
async def cancel_subscription(
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Cancel the user's active subscription.
    
    The subscription will be canceled at the end of the current billing period,
    allowing the user to continue using their paid features until then.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await SubscriptionService.cancel_subscription(
            user_id=user_id,
            client=client
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error in cancel_subscription endpoint", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )


@router.get("/billing-details", response_model=BillingDetailsResponse)
async def get_billing_details(
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get complete billing details for the authenticated user.
    
    Returns subscription information, payment method on file, and recent invoices.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await SubscriptionService.get_billing_details(
            user_id=user_id,
            client=client
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error in get_billing_details endpoint", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get billing details"
        )


@router.post("/create-billing-portal", response_model=CreateBillingPortalResponse)
async def create_billing_portal(
    request: CreateBillingPortalRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Create a Stripe Billing Portal session for managing payment methods.
    
    Redirects users to Stripe's hosted billing portal where they can update
    their payment method, view invoices, and manage their subscription.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await SubscriptionService.create_billing_portal_session(
            user_id=user_id,
            client=client,
            return_url=request.return_url
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error in create_billing_portal endpoint", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create billing portal session"
        )
