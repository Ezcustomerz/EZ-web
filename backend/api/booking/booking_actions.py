"""Booking actions router for booking endpoints"""
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict, Any
import logging
from core.limiter import limiter
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from db.db_session import get_authenticated_client_dep
from supabase import Client
from services.booking.booking_management_service import BookingManagementService
from services.booking.finalization_service import FinalizationService
from schemas.booking import (
    CreateBookingRequest, CreateBookingResponse,
    ApproveBookingRequest, ApproveBookingResponse,
    RejectBookingRequest, RejectBookingResponse,
    CancelBookingRequest, CancelBookingResponse,
    FinalizeServiceRequest, FinalizeServiceResponse,
    MarkDownloadCompleteRequest, MarkDownloadCompleteResponse,
    SendPaymentReminderRequest, SendPaymentReminderResponse
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
        
        return await BookingManagementService.create_booking(user_id, booking_data, client)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error creating booking", e)
        raise HTTPException(status_code=500, detail="Failed to create booking")


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
        
        return await BookingManagementService.approve_booking(user_id, approve_data.booking_id, client)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error approving booking", e)
        raise HTTPException(status_code=500, detail="Failed to approve booking")


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
        
        return await BookingManagementService.reject_booking(user_id, reject_data.booking_id, client)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error rejecting booking", e)
        raise HTTPException(status_code=500, detail="Failed to reject booking")


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
    - Only allowed while booking is pending creative approval (business rule)
    - Updates client_status to 'cancelled' (creative_status remains unchanged)
    - Sets canceled_date to track when the booking was canceled
    
    Note: This maintains symmetry with reject_booking which only updates creative_status.
    The distinction preserves who initiated the cancellation.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BookingManagementService.cancel_booking(user_id, cancel_data.booking_id, client)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error canceling booking", e)
        raise HTTPException(status_code=500, detail="Failed to cancel booking")


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
        
        return await FinalizationService.finalize_service(user_id, finalize_data, client)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error finalizing service", e)
        raise HTTPException(status_code=500, detail="Failed to finalize service")


@router.post("/mark-download-complete", response_model=MarkDownloadCompleteResponse)
@limiter.limit("10 per minute")
async def mark_download_complete(
    request: Request,
    complete_data: MarkDownloadCompleteRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Mark a booking as complete after all files are downloaded
    Requires authentication - will return 401 if not authenticated.
    - Verifies the booking belongs to the client
    - Verifies the booking is in 'download' status
    - Updates client_status to 'completed'
    - Keeps creative_status unchanged
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await FinalizationService.mark_download_complete(user_id, complete_data.booking_id, client)
        return MarkDownloadCompleteResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error marking download as complete", e)
        raise HTTPException(status_code=500, detail="Failed to mark download as complete")


@router.post("/send-payment-reminder", response_model=SendPaymentReminderResponse)
@limiter.limit("10 per minute")
async def send_payment_reminder(
    request: Request,
    reminder_data: SendPaymentReminderRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Send a payment reminder notification to the client for a booking
    Requires authentication - will return 401 if not authenticated.
    - Verifies the booking belongs to the creative
    - Creates a payment reminder notification for the client
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await BookingManagementService.send_payment_reminder(user_id, reminder_data.booking_id, client)
        return SendPaymentReminderResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error sending payment reminder", e)
        raise HTTPException(status_code=500, detail="Failed to send payment reminder")

