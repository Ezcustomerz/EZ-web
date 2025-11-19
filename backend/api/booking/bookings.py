from fastapi import APIRouter, HTTPException, Request, Depends, File, UploadFile, Response
from typing import Dict, Any, List
import logging
import uuid
import os
from core.limiter import limiter
from core.verify import require_auth
from db.db_session import get_authenticated_client_dep, db_admin
from supabase import Client
from services.booking import BookingController
from services.file_scanning.scanner_service import ScannerService
from services.compliance.compliance_service import ComplianceService
from services.invoice.invoice_service import InvoiceService
from services.stripe.stripe_service import StripeService
from util.storage_setup import ensure_bucket_exists
import stripe
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


@router.post("/upload-deliverables")
@limiter.limit("10 per minute")
async def upload_deliverables(
    request: Request,
    booking_id: str,
    files: List[UploadFile] = File(...),
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Batch upload deliverable files for a booking to Supabase Storage
    Requires authentication - will return 401 if not authenticated.
    - Verifies user is the creative for this booking
    - Validates and scans all files for security
    - Uploads all files to Supabase Storage (booking-deliverables bucket)
    - Returns array of file metadata including storage paths
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Verify booking exists and user is the creative
        booking_result = client.table('bookings')\
            .select('id, creative_user_id')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        if booking.get('creative_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to upload files for this booking")
        
        if not files or len(files) == 0:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Ensure bucket exists before uploading
        bucket_name = "booking-deliverables"
        if not ensure_bucket_exists(bucket_name, is_public=False):
            logger.error(f"Failed to ensure bucket '{bucket_name}' exists")
            raise HTTPException(status_code=500, detail=f"Storage bucket not available. Please contact support.")
        
        # Validate and scan all files
        scanner = ScannerService()
        max_size = 50 * 1024 * 1024  # 50MB limit
        uploaded_files = []
        
        for file in files:
            try:
                # Validate and scan file
                is_safe, error_message, scan_details = await scanner.scan_and_validate(
                    file, 
                    max_size=max_size,
                    allowed_extensions=None,  # Allow all file types except dangerous ones
                    fail_if_scanner_unavailable=False  # Don't fail if scanner is down
                )
                
                if not is_safe:
                    raise HTTPException(status_code=400, detail=f"File '{file.filename}' validation failed: {error_message}")
                
                # Read file content
                content = await file.read()
                file_size = len(content)
                
                # Generate unique filename
                file_extension = os.path.splitext(file.filename)[1] if file.filename and '.' in file.filename else ''
                unique_id = uuid.uuid4().hex
                storage_path = f"{booking_id}/{unique_id}{file_extension}"
                
                # Upload to Supabase Storage
                try:
                    upload_result = db_admin.storage.from_(bucket_name).upload(
                        path=storage_path,
                        file=content,
                        file_options={
                            "content-type": file.content_type or "application/octet-stream",
                            "cache-control": "3600"
                        }
                    )
                except Exception as upload_error:
                    logger.error(f"Failed to upload file {file.filename} to storage: {str(upload_error)}")
                    raise HTTPException(status_code=500, detail=f"Failed to upload file '{file.filename}': {str(upload_error)}")
                
                uploaded_files.append({
                    "file_url": storage_path,
                    "file_name": file.filename,
                    "file_size": file_size,
                    "file_type": file.content_type or "application/octet-stream",
                    "storage_path": storage_path
                })
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error processing file {file.filename}: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to process file '{file.filename}': {str(e)}")
        
        return {
            "success": True,
            "files": uploaded_files,
            "total_files": len(uploaded_files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading deliverables: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload deliverables: {str(e)}")


@router.post("/upload-deliverable")
@limiter.limit("20 per minute")
async def upload_deliverable(
    request: Request,
    booking_id: str,
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Upload a deliverable file for a booking to Supabase Storage
    Requires authentication - will return 401 if not authenticated.
    - Verifies user is the creative for this booking
    - Validates and scans file for security
    - Uploads to Supabase Storage (booking-deliverables bucket)
    - Returns file metadata including storage path
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Verify booking exists and user is the creative
        booking_result = client.table('bookings')\
            .select('id, creative_user_id')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        if booking.get('creative_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to upload files for this booking")
        
        # Validate and scan file
        scanner = ScannerService()
        max_size = 50 * 1024 * 1024  # 50MB limit
        is_safe, error_message, scan_details = await scanner.scan_and_validate(
            file, 
            max_size=max_size,
            allowed_extensions=None,  # Allow all file types except dangerous ones
            fail_if_scanner_unavailable=False  # Don't fail if scanner is down
        )
        
        if not is_safe:
            raise HTTPException(status_code=400, detail=error_message or "File validation failed")
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename and '.' in file.filename else ''
        unique_id = uuid.uuid4().hex
        storage_path = f"{booking_id}/{unique_id}{file_extension}"
        
        # Upload to Supabase Storage
        bucket_name = "booking-deliverables"
        
        # Ensure bucket exists before uploading
        if not ensure_bucket_exists(bucket_name, is_public=False):
            logger.error(f"Failed to ensure bucket '{bucket_name}' exists")
            raise HTTPException(status_code=500, detail=f"Storage bucket not available. Please contact support.")
        
        try:
            upload_result = db_admin.storage.from_(bucket_name).upload(
                path=storage_path,
                file=content,
                file_options={
                    "content-type": file.content_type or "application/octet-stream",
                    "cache-control": "3600"
                }
            )
        except Exception as upload_error:
            logger.error(f"Failed to upload file to storage: {str(upload_error)}")
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(upload_error)}")
        
        # Get the storage path (not public URL - we'll use signed URLs for downloads)
        # Store the path, not a public URL
        file_url = storage_path  # Store path, not public URL
        
        return {
            "success": True,
            "file_url": file_url,
            "file_name": file.filename,
            "file_size": file_size,
            "file_type": file.content_type or "application/octet-stream",
            "storage_path": storage_path
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading deliverable: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload deliverable: {str(e)}")


@router.get("/download-deliverables/{booking_id}")
@limiter.limit("10 per minute")
async def download_deliverables_batch(
    request: Request,
    booking_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Generate signed URLs for all deliverable files in a booking
    Requires authentication - will return 401 if not authenticated.
    - Verifies user is the client for this booking
    - Checks payment status (must be fully paid for locked orders)
    - Generates signed URLs for all files (expires in 1 hour)
    - Returns array of file download info
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get booking to verify client and payment status
        booking_result = client.table('bookings')\
            .select('id, client_user_id, client_status, payment_status, amount_paid, price')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is the client
        if booking.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to download files for this booking")
        
        # Check if payment is required and if it's been paid
        client_status = booking.get('client_status')
        payment_status = booking.get('payment_status')
        amount_paid = float(booking.get('amount_paid', 0))
        price = float(booking.get('price', 0))
        
        # Only allow download if client_status is 'download' or 'completed'
        if client_status not in ['download', 'completed']:
            raise HTTPException(
                status_code=403, 
                detail="Files are not available for download yet. Please complete payment if required."
            )
        
        # Get all deliverables for this booking
        deliverables_result = client.table('booking_deliverables')\
            .select('id, booking_id, file_url, file_name')\
            .eq('booking_id', booking_id)\
            .execute()
        
        if not deliverables_result.data or len(deliverables_result.data) == 0:
            return {
                "success": True,
                "files": [],
                "total_files": 0
            }
        
        # Generate signed URLs for all files
        bucket_name = "booking-deliverables"
        files_with_urls = []
        
        for deliverable in deliverables_result.data:
            try:
                file_path = deliverable.get('file_url')
                if not file_path:
                    logger.warning(f"File path not found for deliverable {deliverable.get('id')}")
                    continue
                
                # Generate signed URL (expires in 1 hour = 3600 seconds)
                signed_url_result = db_admin.storage.from_(bucket_name).create_signed_url(
                    file_path,
                    3600  # expires in 1 hour (seconds)
                )
                
                # Extract signed URL from result
                if isinstance(signed_url_result, dict):
                    signed_url = signed_url_result.get('signedURL') or signed_url_result.get('signed_url') or signed_url_result.get('url')
                elif isinstance(signed_url_result, str):
                    signed_url = signed_url_result
                else:
                    signed_url = getattr(signed_url_result, 'signedURL', None) or getattr(signed_url_result, 'signed_url', None) or getattr(signed_url_result, 'url', None)
                
                if signed_url:
                    files_with_urls.append({
                        "deliverable_id": deliverable.get('id'),
                        "file_name": deliverable.get('file_name'),
                        "signed_url": signed_url,
                        "expires_in": 3600
                    })
                else:
                    logger.error(f"Failed to generate signed URL for deliverable {deliverable.get('id')}")
                    
            except Exception as url_error:
                logger.error(f"Error generating signed URL for deliverable {deliverable.get('id')}: {str(url_error)}")
                # Continue with other files even if one fails
                continue
        
        return {
            "success": True,
            "files": files_with_urls,
            "total_files": len(files_with_urls)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating batch download URLs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate download URLs: {str(e)}")


@router.get("/download-deliverable/{deliverable_id}")
@limiter.limit("30 per minute")
async def download_deliverable(
    request: Request,
    deliverable_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Generate a signed URL for downloading a deliverable file
    Requires authentication - will return 401 if not authenticated.
    - Verifies user is the client for this booking
    - Checks payment status (must be fully paid for locked orders)
    - Generates signed URL (expires in 1 hour)
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get deliverable and booking info
        deliverable_result = client.table('booking_deliverables')\
            .select('id, booking_id, file_url, file_name')\
            .eq('id', deliverable_id)\
            .single()\
            .execute()
        
        if not deliverable_result.data:
            raise HTTPException(status_code=404, detail="Deliverable not found")
        
        deliverable = deliverable_result.data
        booking_id = deliverable.get('booking_id')
        
        # Get booking to verify client and payment status
        booking_result = client.table('bookings')\
            .select('id, client_user_id, client_status, payment_status, amount_paid, price')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is the client
        if booking.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to download this file")
        
        # Check if payment is required and if it's been paid
        client_status = booking.get('client_status')
        payment_status = booking.get('payment_status')
        amount_paid = float(booking.get('amount_paid', 0))
        price = float(booking.get('price', 0))
        
        # If status is 'locked', payment must be fully paid
        if client_status == 'locked':
            if payment_status != 'fully_paid' and amount_paid < price:
                raise HTTPException(
                    status_code=403, 
                    detail="Payment required. Please complete payment to download files."
                )
        
        # Get file path from deliverable
        file_path = deliverable.get('file_url')
        if not file_path:
            raise HTTPException(status_code=404, detail="File path not found")
        
        # Generate signed URL (expires in 1 hour = 3600 seconds)
        bucket_name = "booking-deliverables"
        try:
            # Create signed URL using Supabase Storage
            # The Python client uses create_signed_url method
            signed_url_result = db_admin.storage.from_(bucket_name).create_signed_url(
                file_path,
                3600  # expires in 1 hour (seconds)
            )
            
            # The result should be a dict with 'signedURL' or 'signed_url' key
            if isinstance(signed_url_result, dict):
                signed_url = signed_url_result.get('signedURL') or signed_url_result.get('signed_url') or signed_url_result.get('url')
            elif isinstance(signed_url_result, str):
                signed_url = signed_url_result
            else:
                # Try to get the URL from the result object
                signed_url = getattr(signed_url_result, 'signedURL', None) or getattr(signed_url_result, 'signed_url', None) or getattr(signed_url_result, 'url', None)
            
            if not signed_url:
                raise HTTPException(status_code=500, detail="Failed to generate download URL")
            
            return {
                "success": True,
                "signed_url": signed_url,
                "file_name": deliverable.get('file_name'),
                "expires_in": 3600
            }
            
        except Exception as url_error:
            logger.error(f"Failed to generate signed URL: {str(url_error)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(url_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating download URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")


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


@router.get("/compliance-sheet/{booking_id}")
@limiter.limit("20 per minute")
async def download_compliance_sheet(
    request: Request,
    booking_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Generate and download compliance sheet PDF for a booking
    Requires authentication - will return 401 if not authenticated.
    - Verifies user is the client for this booking
    - Only available for canceled, completed, and download status orders
    - Generates PDF with compliance information
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get booking to verify client and status
        booking_result = client.table('bookings')\
            .select('id, client_user_id, client_status, service_id, order_date, price, payment_option, approved_at, canceled_date, creative_user_id')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is the client
        if booking.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to download the compliance sheet for this booking")
        
        # Check if status allows compliance sheet download
        client_status = booking.get('client_status', '').lower()
        allowed_statuses = ['canceled', 'cancelled', 'completed', 'download']
        if client_status not in allowed_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Compliance sheet is only available for orders with status: canceled, completed, or download. Current status: {client_status}"
            )
        
        # Get service information
        service_id = booking.get('service_id')
        service_result = client.table('creative_services')\
            .select('title, description')\
            .eq('id', service_id)\
            .single()\
            .execute()
        
        service_name = service_result.data.get('title', 'Unknown Service') if service_result.data else 'Unknown Service'
        
        # Get creative information
        creative_user_id = booking.get('creative_user_id')
        creative_result = client.table('creatives')\
            .select('display_name')\
            .eq('user_id', creative_user_id)\
            .single()\
            .execute()
        
        creative_name = creative_result.data.get('display_name', 'Unknown Creative') if creative_result.data else 'Unknown Creative'
        
        # Get user information for creative name fallback
        if not creative_name or creative_name == 'Unknown Creative':
            user_result = client.table('users')\
                .select('name')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            if user_result.data:
                creative_name = user_result.data.get('name', 'Unknown Creative')
        
        # Check for completed_date (this might be in a different field or calculated)
        # For now, we'll use approved_at as a proxy if status is completed
        completed_date = None
        if client_status == 'completed':
            # Try to get from booking updates or use approved_at as fallback
            completed_date = booking.get('approved_at')
        
        # Prepare order data for compliance sheet
        order_data = {
            'id': booking.get('id'),
            'service_name': service_name,
            'creative_name': creative_name,
            'order_date': booking.get('order_date'),
            'price': float(booking.get('price', 0)),
            'payment_option': booking.get('payment_option', 'later'),
            'client_status': booking.get('client_status'),
            'approved_at': booking.get('approved_at'),
            'canceled_date': booking.get('canceled_date'),
            'completed_date': completed_date
        }
        
        # Generate compliance sheet PDF
        pdf_content = ComplianceService.generate_compliance_sheet(order_data)
        
        # Generate filename
        filename = f"EZ_Compliance_Sheet_{booking_id[:8]}.pdf"
        
        # Return PDF as response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating compliance sheet: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate compliance sheet: {str(e)}")


@router.get("/invoices/{booking_id}")
@limiter.limit("20 per minute")
async def get_invoices(
    request: Request,
    booking_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get all invoices (Stripe receipts and EZ invoice) for a booking
    Returns list of available invoices with their types and download URLs
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get booking to verify client and status
        booking_result = client.table('bookings')\
            .select('id, client_user_id, client_status, service_id, order_date, price, payment_option, approved_at, canceled_date, creative_user_id, amount_paid')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is the client
        if booking.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to view invoices for this booking")
        
        # Check if status allows invoice download
        client_status = booking.get('client_status', '').lower()
        allowed_statuses = ['canceled', 'cancelled', 'completed', 'download']
        if client_status not in allowed_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invoices are only available for orders with status: canceled, completed, or download. Current status: {client_status}"
            )
        
        invoices = []
        
        # Get EZ platform invoice (always available)
        invoices.append({
            'type': 'ez_invoice',
            'name': 'EZ Platform Invoice',
            'download_url': f'/api/bookings/invoice/ez/{booking_id}'
        })
        
        # Get Stripe receipts
        try:
            # Get creative's Stripe account ID
            creative_user_id = booking.get('creative_user_id')
            creative_result = client.table('creatives')\
                .select('stripe_account_id')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            
            if creative_result.data and creative_result.data.get('stripe_account_id'):
                stripe_account_id = creative_result.data.get('stripe_account_id')
                
                # List all checkout sessions for this booking
                # We'll search by metadata.booking_id
                checkout_sessions = stripe.checkout.Session.list(
                    limit=100,
                    stripe_account=stripe_account_id
                )
                
                # Filter sessions for this booking_id
                booking_sessions = [
                    session for session in checkout_sessions.data
                    if session.metadata and session.metadata.get('booking_id') == booking_id
                    and session.payment_status == 'paid'
                ]
                
                # For split payments, there should be 2 sessions
                # For upfront/later, there should be 1 session
                payment_option = booking.get('payment_option', 'later').lower()
                
                if payment_option == 'split' and len(booking_sessions) >= 2:
                    # Split payment: 2 Stripe receipts
                    for idx, session in enumerate(booking_sessions[:2], 1):
                        invoices.append({
                            'type': 'stripe_receipt',
                            'name': f'Stripe Receipt - Payment {idx}',
                            'session_id': session.id,
                            'download_url': f'/api/bookings/invoice/stripe/{booking_id}?session_id={session.id}'
                        })
                elif len(booking_sessions) >= 1:
                    # Single payment: 1 Stripe receipt
                    invoices.append({
                        'type': 'stripe_receipt',
                        'name': 'Stripe Receipt',
                        'session_id': booking_sessions[0].id,
                        'download_url': f'/api/bookings/invoice/stripe/{booking_id}?session_id={booking_sessions[0].id}'
                    })
        except Exception as e:
            logger.warning(f"Could not retrieve Stripe receipts: {e}")
            # Continue without Stripe receipts
        
        return {
            'success': True,
            'booking_id': booking_id,
            'invoices': invoices
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invoices: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get invoices: {str(e)}")


@router.get("/invoice/ez/{booking_id}")
@limiter.limit("20 per minute")
async def download_ez_invoice(
    request: Request,
    booking_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Generate and download EZ platform invoice PDF for a booking
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get booking to verify client and status
        booking_result = client.table('bookings')\
            .select('id, client_user_id, client_status, service_id, order_date, price, payment_option, approved_at, canceled_date, creative_user_id, amount_paid, booking_date')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is the client
        if booking.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to download the invoice for this booking")
        
        # Check if status allows invoice download
        client_status = booking.get('client_status', '').lower()
        allowed_statuses = ['canceled', 'cancelled', 'completed', 'download']
        if client_status not in allowed_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invoice is only available for orders with status: canceled, completed, or download. Current status: {client_status}"
            )
        
        # Get service information
        service_id = booking.get('service_id')
        service_result = client.table('creative_services')\
            .select('title, description')\
            .eq('id', service_id)\
            .single()\
            .execute()
        
        service_name = service_result.data.get('title', 'Unknown Service') if service_result.data else 'Unknown Service'
        service_description = service_result.data.get('description', '') if service_result.data else ''
        
        # Get creative information
        creative_user_id = booking.get('creative_user_id')
        creative_result = client.table('creatives')\
            .select('display_name')\
            .eq('user_id', creative_user_id)\
            .single()\
            .execute()
        
        creative_name = creative_result.data.get('display_name', 'Unknown Creative') if creative_result.data else 'Unknown Creative'
        
        # Get user information
        client_user_id = booking.get('client_user_id')
        client_user_result = client.table('users')\
            .select('name, email')\
            .eq('user_id', client_user_id)\
            .single()\
            .execute()
        
        client_name = client_user_result.data.get('name', 'Unknown Client') if client_user_result.data else 'Unknown Client'
        client_email = client_user_result.data.get('email', '') if client_user_result.data else ''
        
        # Get creative user info for email
        creative_user_result = client.table('users')\
            .select('name, email')\
            .eq('user_id', creative_user_id)\
            .single()\
            .execute()
        
        creative_email = creative_user_result.data.get('email', '') if creative_user_result.data else ''
        if not creative_name or creative_name == 'Unknown Creative':
            creative_name = creative_user_result.data.get('name', 'Unknown Creative') if creative_user_result.data else 'Unknown Creative'
        
        # Check for completed_date
        completed_date = None
        if client_status == 'completed':
            completed_date = booking.get('approved_at')
        
        # Prepare order data for invoice
        order_data = {
            'id': booking.get('id'),
            'service_name': service_name,
            'service_description': service_description,
            'creative_name': creative_name,
            'creative_email': creative_email,
            'client_name': client_name,
            'client_email': client_email,
            'order_date': booking.get('order_date'),
            'booking_date': booking.get('booking_date'),
            'price': float(booking.get('price', 0)),
            'payment_option': booking.get('payment_option', 'later'),
            'amount_paid': float(booking.get('amount_paid', 0)),
            'approved_at': booking.get('approved_at'),
            'completed_date': completed_date,
            'description': service_description
        }
        
        # Generate invoice PDF
        pdf_content = InvoiceService.generate_client_invoice(order_data)
        
        # Generate filename
        filename = f"EZ_Invoice_{booking_id[:8]}.pdf"
        
        # Return PDF as response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating invoice: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice: {str(e)}")


@router.get("/invoice/stripe/{booking_id}")
@limiter.limit("20 per minute")
async def download_stripe_receipt(
    request: Request,
    booking_id: str,
    session_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get Stripe receipt URL for a payment session
    Returns the Stripe receipt URL that can be opened in browser
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get booking to verify client
        booking_result = client.table('bookings')\
            .select('id, client_user_id, client_status, creative_user_id')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is the client
        if booking.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to download the receipt for this booking")
        
        # Check if status allows receipt download
        client_status = booking.get('client_status', '').lower()
        allowed_statuses = ['canceled', 'cancelled', 'completed', 'download']
        if client_status not in allowed_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Receipt is only available for orders with status: canceled, completed, or download. Current status: {client_status}"
            )
        
        # Get creative's Stripe account ID
        creative_user_id = booking.get('creative_user_id')
        creative_result = client.table('creatives')\
            .select('stripe_account_id')\
            .eq('user_id', creative_user_id)\
            .single()\
            .execute()
        
        if not creative_result.data:
            raise HTTPException(status_code=404, detail="Creative not found")
        
        stripe_account_id = creative_result.data.get('stripe_account_id')
        if not stripe_account_id:
            raise HTTPException(status_code=400, detail="Creative has not connected their Stripe account")
        
        # Retrieve the checkout session from Stripe
        checkout_session = stripe.checkout.Session.retrieve(
            session_id,
            stripe_account=stripe_account_id
        )
        
        # Verify booking_id in metadata matches
        session_booking_id = checkout_session.metadata.get('booking_id') if checkout_session.metadata else None
        if session_booking_id and session_booking_id != booking_id:
            raise HTTPException(status_code=400, detail="Booking ID mismatch in payment session")
        
        # Get the payment intent from the session
        payment_intent_id = checkout_session.payment_intent
        if not payment_intent_id:
            raise HTTPException(status_code=404, detail="Payment intent not found for this session")
        
        # Retrieve the payment intent
        payment_intent = stripe.PaymentIntent.retrieve(
            payment_intent_id,
            stripe_account=stripe_account_id,
            expand=['charges']
        )
        
        # Get the charge ID from the payment intent
        if payment_intent.charges and len(payment_intent.charges.data) > 0:
            charge_id = payment_intent.charges.data[0].id
            
            # Get the charge to access receipt URL
            charge = stripe.Charge.retrieve(
                charge_id,
                stripe_account=stripe_account_id
            )
            
            # Get receipt URL from charge
            if hasattr(charge, 'receipt_url') and charge.receipt_url:
                receipt_url = charge.receipt_url
            else:
                # Fallback: construct receipt URL
                # Format: https://pay.stripe.com/receipts/{charge_id}
                receipt_url = f"https://pay.stripe.com/receipts/{charge_id}"
        else:
            raise HTTPException(status_code=404, detail="Charge not found for this payment")
        
        return {
            'success': True,
            'receipt_url': receipt_url,
            'session_id': session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Stripe receipt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get Stripe receipt: {str(e)}")
