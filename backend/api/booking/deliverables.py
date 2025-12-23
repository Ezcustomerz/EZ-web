"""Deliverables router for booking endpoints"""
from fastapi import APIRouter, HTTPException, Request, Depends, File, UploadFile, Body
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
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class FileUploadInfo(BaseModel):
    file_name: str
    file_size: int
    file_type: str
    storage_path: str


class RegisterFilesRequest(BaseModel):
    booking_id: str
    files: List[FileUploadInfo]


@router.post("/get-upload-paths")
@limiter.limit("20 per minute")
async def get_upload_paths(
    request: Request,
    booking_id: str,
    file_count: int = Body(...),
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Generate storage paths for direct client-side uploads to Supabase Storage
    Requires authentication - will return 401 if not authenticated.
    - Verifies user is the creative for this booking
    - Generates unique storage paths for each file
    - Returns paths that can be used for direct upload from frontend
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
        
        # Ensure bucket exists
        bucket_name = "booking-deliverables"
        if not ensure_bucket_exists(bucket_name, is_public=False):
            logger.error(f"Failed to ensure bucket '{bucket_name}' exists")
            raise HTTPException(status_code=500, detail="Storage bucket not available. Please contact support.")
        
        # Generate unique storage paths for each file
        upload_paths = []
        for i in range(file_count):
            unique_id = uuid.uuid4().hex
            # Path will be completed with file extension on frontend
            storage_path = f"{booking_id}/{unique_id}"
            upload_paths.append({
                "storage_path": storage_path,
                "unique_id": unique_id
            })
        
        return {
            "success": True,
            "upload_paths": upload_paths,
            "bucket_name": bucket_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating upload paths: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate upload paths: {str(e)}")


@router.post("/register-uploaded-files")
@limiter.limit("20 per minute")
async def register_uploaded_files(
    request: Request,
    register_request: RegisterFilesRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Register files that were uploaded directly to Supabase Storage
    Requires authentication - will return 401 if not authenticated.
    - Verifies user is the creative for this booking
    - Registers file metadata in booking_deliverables table
    - Returns registered file information
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        booking_id = register_request.booking_id
        
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
            raise HTTPException(status_code=403, detail="You are not authorized to register files for this booking")
        
        if not register_request.files or len(register_request.files) == 0:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Register files in database
        registered_files = []
        for file_info in register_request.files:
            # Use the storage path provided (from the upload)
            storage_path = file_info.storage_path
            
            # Insert into booking_deliverables table
            try:
                insert_result = db_admin.table('booking_deliverables').insert({
                    'booking_id': booking_id,
                    'file_url': storage_path,
                    'file_name': file_info.file_name,
                    'file_size_bytes': file_info.file_size,  # Column name is file_size_bytes, not file_size
                    'file_type': file_info.file_type or 'application/octet-stream'
                }).execute()
                
                registered_files.append({
                    "file_url": storage_path,
                    "file_name": file_info.file_name,
                    "file_size": file_info.file_size,
                    "file_type": file_info.file_type or "application/octet-stream",
                    "storage_path": storage_path
                })
            except Exception as insert_error:
                logger.error(f"Failed to register file {file_info.file_name}: {str(insert_error)}")
                raise HTTPException(status_code=500, detail=f"Failed to register file '{file_info.file_name}': {str(insert_error)}")
        
        return {
            "success": True,
            "files": registered_files,
            "total_files": len(registered_files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering uploaded files: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to register files: {str(e)}")


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
        max_size = 30 * 1024 * 1024 * 1024  # 30GB limit
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
        max_size = 30 * 1024 * 1024 * 1024  # 30GB limit
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
        deliverable_ids_to_update = []
        from datetime import datetime, timezone
        
        # Get current timestamp once for all updates
        downloaded_at_iso = datetime.now(timezone.utc).isoformat()
        
        # First pass: Generate all signed URLs and collect deliverable IDs
        for deliverable in deliverables_result.data:
            deliverable_id = deliverable.get('id')
            file_path = deliverable.get('file_url')
            
            if not file_path:
                logger.warning(f"File path not found for deliverable {deliverable_id}")
                continue
            
            try:
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
                
                if not signed_url:
                    logger.error(f"Failed to generate signed URL for deliverable {deliverable_id}")
                    continue
                
                files_with_urls.append({
                    "deliverable_id": deliverable_id,
                    "file_name": deliverable.get('file_name'),
                    "signed_url": signed_url,
                    "expires_in": 3600
                })
                
                # Collect deliverable ID for batch update
                deliverable_ids_to_update.append(deliverable_id)
                    
            except Exception as url_error:
                logger.error(f"Error processing deliverable {deliverable_id} ({deliverable.get('file_name')}): {str(url_error)}", exc_info=True)
                # Continue with other files even if one fails
                continue
        
        # Second pass: Update all files as downloaded in a single batch operation
        if deliverable_ids_to_update:
            try:
                # Update all deliverables at once using IN clause
                update_result = db_admin.table('booking_deliverables')\
                    .update({'downloaded_at': downloaded_at_iso})\
                    .in_('id', deliverable_ids_to_update)\
                    .execute()
                
                logger.info(f"Batch download: Marked {len(deliverable_ids_to_update)} files as downloaded at {downloaded_at_iso} for booking {booking_id}")
                logger.info(f"Batch download: Updated deliverable IDs: {deliverable_ids_to_update}")
            except Exception as batch_update_error:
                # If batch update fails, try individual updates as fallback
                logger.error(f"Batch update failed, attempting individual updates: {str(batch_update_error)}", exc_info=True)
                success_count = 0
                for deliverable_id in deliverable_ids_to_update:
                    try:
                        db_admin.table('booking_deliverables')\
                            .update({'downloaded_at': downloaded_at_iso})\
                            .eq('id', deliverable_id)\
                            .execute()
                        success_count += 1
                        logger.info(f"Fallback: Marked deliverable {deliverable_id} as downloaded")
                    except Exception as individual_error:
                        logger.error(f"CRITICAL: Failed to update deliverable {deliverable_id}: {str(individual_error)}", exc_info=True)
                logger.warning(f"Fallback update: Successfully updated {success_count} of {len(deliverable_ids_to_update)} files")
        
        logger.info(f"Batch download: Generated {len(files_with_urls)} signed URLs for booking {booking_id}")
        
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
            
            # Mark the file as downloaded (update downloaded_at timestamp)
            # Use db_admin to bypass RLS since this is a system tracking update
            from datetime import datetime, timezone
            try:
                # Format timestamp as ISO 8601 string for PostgreSQL
                downloaded_at_iso = datetime.now(timezone.utc).isoformat()
                # Execute update - Supabase Python client may not return data, but update still works
                db_admin.table('booking_deliverables')\
                    .update({'downloaded_at': downloaded_at_iso})\
                    .eq('id', deliverable_id)\
                    .execute()
                logger.info(f"Updated downloaded_at for deliverable {deliverable_id} to {downloaded_at_iso}")
            except Exception as update_error:
                # Log error but don't fail the download
                logger.error(f"Failed to update downloaded_at for deliverable {deliverable_id}: {str(update_error)}", exc_info=True)
            
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


@router.delete("/deliverable/{deliverable_id}")
@limiter.limit("20 per minute")
async def delete_deliverable(
    request: Request,
    deliverable_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Delete a deliverable file from storage and database
    Requires authentication - will return 401 if not authenticated.
    - Verifies user is the creative for the booking
    - Deletes file from Supabase Storage (booking-deliverables bucket)
    - Deletes record from database
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get deliverable info including booking
        deliverable_result = client.table('booking_deliverables')\
            .select('id, booking_id, file_url, file_name')\
            .eq('id', deliverable_id)\
            .single()\
            .execute()
        
        if not deliverable_result.data:
            raise HTTPException(status_code=404, detail="Deliverable not found")
        
        deliverable = deliverable_result.data
        booking_id = deliverable.get('booking_id')
        file_url = deliverable.get('file_url')
        
        if not file_url:
            raise HTTPException(status_code=400, detail="File URL not found for deliverable")
        
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
            raise HTTPException(status_code=403, detail="You are not authorized to delete files for this booking")
        
        # Extract storage path from file_url
        # file_url is stored as a storage path (e.g., "booking_id/filename.ext")
        file_path = file_url
        
        # Delete from storage
        bucket_name = "booking-deliverables"
        try:
            db_admin.storage.from_(bucket_name).remove([file_path])
            logger.info(f"Deleted file from storage: {file_path}")
        except Exception as storage_error:
            logger.error(f"Failed to delete file from storage: {str(storage_error)}")
            # Continue with database delete even if storage delete fails
            # This prevents orphaned database records
        
        # Delete from database
        delete_result = db_admin.table('booking_deliverables')\
            .delete()\
            .eq('id', deliverable_id)\
            .execute()
        
        if not delete_result.data:
            logger.warning(f"Deliverable {deliverable_id} may not have been deleted from database")
        
        return {
            "success": True,
            "message": "Deliverable deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting deliverable: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete deliverable: {str(e)}")

