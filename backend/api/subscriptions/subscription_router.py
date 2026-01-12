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
)
from services.subscriptions.subscription_service import SubscriptionService
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
        logger.error(f"Error in create_checkout_session endpoint: {str(e)}")
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
        logger.error(f"Error in verify_subscription endpoint: {str(e)}")
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
        logger.error(f"Error in get_subscription_status endpoint: {str(e)}")
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
        logger.error(f"Error in cancel_subscription endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )
