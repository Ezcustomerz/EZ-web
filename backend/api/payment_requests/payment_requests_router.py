from fastapi import APIRouter, Request, HTTPException, Depends
from core.limiter import limiter
from core.verify import require_auth
from typing import Dict, Any, Optional
from db.db_session import get_authenticated_client_dep
from supabase import Client
from services.payment_requests.payment_request_service import PaymentRequestService
from pydantic import BaseModel

router = APIRouter()


class CreatePaymentRequestRequest(BaseModel):
    client_user_id: Optional[str] = None
    amount: float
    notes: Optional[str] = None
    booking_id: Optional[str] = None


@router.post("")
@limiter.limit("10 per minute")
async def create_payment_request(
    request: Request,
    payment_request_data: CreatePaymentRequestRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Create a new payment request
    Requires authentication - will return 401 if not authenticated.
    Must be authenticated as a creative.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Verify user is a creative
        creative_result = client.table('creatives')\
            .select('user_id')\
            .eq('user_id', user_id)\
            .single()\
            .execute()
        
        if not creative_result.data:
            raise HTTPException(status_code=403, detail="Only creatives can create payment requests")
        
        # Validate that either client_user_id or booking_id is provided
        if not payment_request_data.client_user_id and not payment_request_data.booking_id:
            raise HTTPException(status_code=400, detail="Either client_user_id or booking_id must be provided")
        
        # Convert None to None explicitly (not string "None")
        client_user_id = payment_request_data.client_user_id if payment_request_data.client_user_id else None
        notes = payment_request_data.notes if payment_request_data.notes else None
        booking_id = payment_request_data.booking_id if payment_request_data.booking_id else None
        
        result = await PaymentRequestService.create_payment_request(
            creative_user_id=user_id,
            client_user_id=client_user_id,
            amount=payment_request_data.amount,
            notes=notes,
            booking_id=booking_id,
            client=client
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment request: {str(e)}")


@router.get("/client")
@limiter.limit("20 per minute")
async def get_client_payment_requests(
    request: Request,
    page: int = 1,
    page_size: int = 10,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get payment requests for the current client with pagination
    Requires authentication - will return 401 if not authenticated.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (default: 10, max: 50)
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 10
        if page_size > 50:
            page_size = 50
        
        result = await PaymentRequestService.get_client_payment_requests(
            client_user_id=user_id,
            client=client,
            page=page,
            page_size=page_size
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment requests: {str(e)}")


@router.get("/creative")
@limiter.limit("20 per minute")
async def get_creative_payment_requests(
    request: Request,
    page: int = 1,
    page_size: int = 10,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get payment requests for the current creative with pagination
    Requires authentication - will return 401 if not authenticated.
    Must be authenticated as a creative.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (default: 10, max: 50)
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Verify user is a creative
        creative_result = client.table('creatives')\
            .select('user_id')\
            .eq('user_id', user_id)\
            .single()\
            .execute()
        
        if not creative_result.data:
            raise HTTPException(status_code=403, detail="Only creatives can view their payment requests")
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 10
        if page_size > 50:
            page_size = 50
        
        result = await PaymentRequestService.get_creative_payment_requests(
            creative_user_id=user_id,
            client=client,
            page=page,
            page_size=page_size
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment requests: {str(e)}")


@router.get("/client/count")
@limiter.limit("20 per minute")
async def get_pending_payment_requests_count(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get count of pending payment requests for the current client
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        count = await PaymentRequestService.get_pending_count(
            client_user_id=user_id,
            client=client
        )
        
        return {'pending': count, 'total': count}  # For now, just return pending count
        
    except HTTPException:
        raise
    except Exception as e:
        return {'pending': 0, 'total': 0}  # Return 0 on error to avoid breaking UI


@router.post("/{payment_request_id}/process")
@limiter.limit("10 per minute")
async def process_payment_request(
    request: Request,
    payment_request_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Process a payment request - creates a Stripe Checkout Session
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await PaymentRequestService.process_payment_request(
            payment_request_id=payment_request_id,
            client_user_id=user_id,
            client=client
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process payment: {str(e)}")


class VerifyPaymentRequestRequest(BaseModel):
    session_id: str
    payment_request_id: str


@router.post("/verify")
@limiter.limit("10 per minute")
async def verify_payment_request(
    request: Request,
    verify_data: VerifyPaymentRequestRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Verify a payment session and update payment request status
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        session_id = verify_data.session_id
        payment_request_id = verify_data.payment_request_id
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
        if not payment_request_id:
            raise HTTPException(status_code=400, detail="payment_request_id is required")
        
        # Verify the payment request belongs to this user - only select field we need
        pr_result = client.table('payment_requests')\
            .select('client_user_id')\
            .eq('id', payment_request_id)\
            .single()\
            .execute()
        
        if not pr_result.data:
            raise HTTPException(status_code=404, detail="Payment request not found")
        
        if pr_result.data.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to verify this payment")
        
        result = await PaymentRequestService.verify_payment_request(
            session_id=session_id,
            payment_request_id=payment_request_id,
            client=client
        )
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify payment: {str(e)}")

