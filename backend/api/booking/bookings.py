from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict, Any
import logging
from core.limiter import limiter
from core.verify import require_auth
from db.db_session import get_authenticated_client_dep
from supabase import Client
from services.booking import BookingController
from schemas.booking import (
    CreateBookingRequest, CreateBookingResponse,
    OrdersListResponse,
    CalendarSessionsResponse,
    ApproveBookingRequest, ApproveBookingResponse,
    RejectBookingRequest, RejectBookingResponse,
    CancelBookingRequest, CancelBookingResponse,
    FinalizeServiceRequest, FinalizeServiceResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create", response_model=CreateBookingResponse)
@limiter.limit("10 per minute")
async def create_booking(
    request: Request,
    booking_data: CreateBookingRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Create a new booking/order
    Requires authentication - will return 401 if not authenticated.
    - Fetches service details (creative_user_id, price, payment_option)
    - Creates booking with proper status tracking
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.create_booking(user_id, booking_data, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating booking: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create booking: {str(e)}")


@router.get("/client", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get all orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with client_status = 'placed' (and other statuses)
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.get_client_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client orders: {str(e)}")


@router.get("/client/in-progress", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_in_progress_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get in-progress orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with client_status = 'in_progress'
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.get_client_in_progress_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client in-progress orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client in-progress orders: {str(e)}")


@router.get("/client/action-needed", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_action_needed_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get action-needed orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with statuses: payment_required, locked, download
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.get_client_action_needed_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client action-needed orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client action-needed orders: {str(e)}")


@router.get("/client/history", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_history_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get history orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with statuses: completed, canceled
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.get_client_history_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client history orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client history orders: {str(e)}")


@router.get("/creative", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get all orders for the current creative user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with creative_status = 'pending_approval' (and other statuses)
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.get_creative_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative orders: {str(e)}")


@router.get("/creative/current", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_current_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get current orders for the current creative user
    Requires authentication - will return 401 if not authenticated.
    Returns orders excluding 'complete', 'rejected', and 'canceled' statuses
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.get_creative_current_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative current orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative current orders: {str(e)}")


@router.get("/creative/past", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_past_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get past orders for the current creative user
    Requires authentication - will return 401 if not authenticated.
    Returns only orders with creative_status = 'complete', 'rejected', or 'canceled'
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.get_creative_past_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative past orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative past orders: {str(e)}")


@router.get("/creative/calendar", response_model=CalendarSessionsResponse)
@limiter.limit("20 per minute")
async def get_creative_calendar_sessions(
    request: Request,
    year: int,
    month: int,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get calendar sessions for the current creative user for a specific month
    Requires authentication - will return 401 if not authenticated.
    Returns bookings with calendar-specific format
    Status mapping:
    - pending_approval -> pending
    - in_progress, awaiting_payment -> confirmed
    - rejected -> cancelled
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.get_creative_calendar_sessions(user_id, year, month, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative calendar sessions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendar sessions: {str(e)}")


@router.get("/creative/calendar/week", response_model=CalendarSessionsResponse)
@limiter.limit("20 per minute")
async def get_creative_calendar_sessions_week(
    request: Request,
    start_date: str,
    end_date: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get calendar sessions for the current creative user for a specific week (date range)
    Requires authentication - will return 401 if not authenticated.
    Returns bookings with calendar-specific format
    Status mapping:
    - pending_approval -> pending
    - in_progress, awaiting_payment -> confirmed
    - rejected -> cancelled
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.get_creative_calendar_sessions_week(user_id, start_date, end_date, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative calendar sessions for week: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendar sessions: {str(e)}")


@router.post("/approve", response_model=ApproveBookingResponse)
@limiter.limit("10 per minute")
async def approve_booking(
    request: Request,
    approve_data: ApproveBookingRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Approve a booking/order
    Requires authentication - will return 401 if not authenticated.
    - Verifies the booking belongs to the creative
    - Updates status based on payment option:
      * Free or 'later' payment: creative_status='in_progress', client_status='in_progress'
      * 'upfront' or 'split' payment: creative_status='awaiting_payment', client_status='payment_required'
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.approve_booking(user_id, approve_data.booking_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving booking: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve booking: {str(e)}")


@router.post("/reject", response_model=RejectBookingResponse)
@limiter.limit("10 per minute")
async def reject_booking(
    request: Request,
    reject_data: RejectBookingRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Reject a booking/order
    Requires authentication - will return 401 if not authenticated.
    - Verifies the booking belongs to the creative
    - Updates creative_status to 'rejected'
    - client_status remains unchanged (stays as 'placed')
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.reject_booking(user_id, reject_data.booking_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting booking: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject booking: {str(e)}")


@router.post("/cancel", response_model=CancelBookingResponse)
@limiter.limit("10 per minute")
async def cancel_booking(
    request: Request,
    cancel_data: CancelBookingRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Cancel a booking/order (client-initiated)
    Requires authentication - will return 401 if not authenticated.
    - Verifies the booking belongs to the client
    - Updates both client_status and creative_status to 'canceled'
    - Sets canceled_date to track when the booking was canceled
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.cancel_booking(user_id, cancel_data.booking_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling booking: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel booking: {str(e)}")


@router.post("/finalize", response_model=FinalizeServiceResponse)
@limiter.limit("10 per minute")
async def finalize_service(
    request: Request,
    finalize_data: FinalizeServiceRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Finalize a service - update statuses based on payment type and file presence
    Requires authentication - will return 401 if not authenticated.
    
    Status flow:
    - Free + File: Creative = "completed", Client = "download"
    - Free + No file: Both = "completed"
    - Payment upfront + File: Creative = "completed", Client = "download"
    - Payment upfront + No file: Both = "completed"
    - Split payment + File: Creative = "awaiting_payment" (if not fully paid) or "completed" (if fully paid), Client = "locked" (if not fully paid) or "download" (if fully paid)
    - Split payment + No file: Creative = "awaiting_payment" (if not fully paid) or "completed" (if fully paid), Client = "payment_required" (if not fully paid) or "completed" (if fully paid)
    - Payment later + File: Creative = "awaiting_payment" (if not fully paid) or "completed" (if fully paid), Client = "locked" (if not fully paid) or "download" (if fully paid)
    - Payment later + No file: Creative = "awaiting_payment" (if not fully paid) or "completed" (if fully paid), Client = "payment_required" (if not fully paid) or "completed" (if fully paid)
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingController.finalize_service(user_id, finalize_data, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finalizing service: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to finalize service: {str(e)}")
