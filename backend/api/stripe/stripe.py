from fastapi import APIRouter, Request, HTTPException, Depends
from services.stripe.stripe_service import StripeService
from core.limiter import limiter
from core.verify import require_auth
from typing import Dict, Any
from db.db_session import get_authenticated_client_dep
from supabase import Client

router = APIRouter()


@router.post("/connect/create-account")
@limiter.limit("2 per second")
async def create_stripe_connect_account(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Create a Stripe Connect Express account for the current creative
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get user email
        user_result = client.table('users').select('email').eq('user_id', user_id).single().execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        email = user_result.data.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="User email is required")
        
        result = await StripeService.create_connect_account(user_id, email, client)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Stripe account: {str(e)}")


@router.get("/connect/account-status")
@limiter.limit("2 per second")
async def get_stripe_account_status(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get the Stripe account status for the current creative
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await StripeService.get_account_status(user_id, client)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get account status: {str(e)}")


@router.post("/connect/create-login-link")
@limiter.limit("2 per second")
async def create_stripe_login_link(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Create a login link for the Stripe Express account dashboard
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await StripeService.create_login_link(user_id, client)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create login link: {str(e)}")


@router.post("/payment/process")
@limiter.limit("10 per minute")
async def process_payment(
    request: Request,
    payment_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Process a payment for a booking
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        booking_id = payment_data.get('booking_id')
        amount = payment_data.get('amount')
        
        if not booking_id:
            raise HTTPException(status_code=400, detail="booking_id is required")
        if not amount or amount <= 0:
            raise HTTPException(status_code=400, detail="amount must be greater than 0")
        
        result = await StripeService.process_payment(booking_id, float(amount), user_id, client)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process payment: {str(e)}")


@router.post("/payment/verify")
@limiter.limit("10 per minute")
async def verify_payment(
    request: Request,
    verify_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Verify a payment session and update booking status
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        session_id = verify_data.get('session_id')
        booking_id = verify_data.get('booking_id')
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
        if not booking_id:
            raise HTTPException(status_code=400, detail="booking_id is required")
        
        # Verify the booking belongs to this user
        booking_result = client.table('bookings')\
            .select('client_user_id')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking_result.data.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to verify this payment")
        
        result = await StripeService.verify_payment_and_update_booking(session_id, booking_id, client)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify payment: {str(e)}")
