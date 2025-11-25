"""Deliverables router for booking endpoints"""
from fastapi import APIRouter, HTTPException, Request, Depends, File, UploadFile
from typing import Dict, Any, List
import logging
import uuid
import os
from core.limiter import limiter
from core.verify import require_auth
from db.db_session import get_authenticated_client_dep, db_admin
from supabase import Client
from services.file_scanning.scanner_service import ScannerService
from util.storage_setup import ensure_bucket_exists

logger = logging.getLogger(__name__)
router = APIRouter()


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

