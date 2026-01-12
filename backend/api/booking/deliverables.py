"""Deliverables router for booking endpoints"""
from fastapi import APIRouter, HTTPException, Request, Depends, File, UploadFile, Body
from typing import Dict, Any, List
import logging
import uuid
import os
from urllib.parse import urlparse
from core.limiter import limiter
from core.verify import require_auth
from db.db_session import get_authenticated_client_dep, db_admin
from supabase import Client
from services.file_scanning.scanner_service import ScannerService
from util.storage_setup import ensure_bucket_exists
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


def check_file_exists_in_storage(bucket_name: str, file_path: str) -> bool:
    """
    Check if a file exists in Supabase Storage by attempting to list it.
    
    Args:
        bucket_name: Name of the storage bucket
        file_path: Path to the file in the bucket
        
    Returns:
        True if file exists, False otherwise
    """
    try:
        # Try to list the file - if it exists, it will be in the result
        # We'll list the parent directory and check if our file is there
        path_parts = file_path.split('/')
        if len(path_parts) > 1:
            # List files in the parent directory (booking_id folder)
            parent_dir = '/'.join(path_parts[:-1])
            file_name = path_parts[-1]
            
            try:
                files = db_admin.storage.from_(bucket_name).list(parent_dir)
                # Check if our file is in the list
                if files:
                    # files might be a list of file objects or a dict
                    if isinstance(files, list):
                        file_names = [f.name if hasattr(f, 'name') else str(f) for f in files]
                    elif isinstance(files, dict) and 'data' in files:
                        file_names = [f.get('name', '') if isinstance(f, dict) else (f.name if hasattr(f, 'name') else str(f)) for f in files.get('data', [])]
                    else:
                        # Try to get data attribute
                        file_names = [f.name if hasattr(f, 'name') else str(f) for f in getattr(files, 'data', [])]
                    
                    return file_name in file_names
            except Exception as list_error:
                logger.debug(f"Could not list directory {parent_dir}: {list_error}")
                # If listing fails, we'll assume file doesn't exist
                return False
        return False
    except Exception as e:
        logger.debug(f"Error checking file existence for {file_path}: {e}")
        return False


def format_storage_size(bytes: int) -> str:
    """Format bytes to human-readable size"""
    if bytes == 0:
        return "0 B"
    k = 1024
    sizes = ['B', 'KB', 'MB', 'GB']
    i = int(bytes.bit_length() / 10) if bytes > 0 else 0
    i = min(i, len(sizes) - 1)
    return f"{(bytes / (k ** i)):.2f} {sizes[i]}"


async def check_storage_limit(
    user_id: str,
    new_files_size: int,
    client: Client
) -> tuple[bool, str]:
    """
    Check if uploading new files would exceed storage limit.
    Returns (is_allowed, error_message)
    """
    try:
        # Get creative profile with subscription tier
        creative_result = client.table('creatives')\
            .select('subscription_tier_id')\
            .eq('user_id', user_id)\
            .single()\
            .execute()
        
        if not creative_result.data:
            # No creative profile found, allow upload (shouldn't happen but be safe)
            return True, ""
        
        subscription_tier_id = creative_result.data.get('subscription_tier_id')
        if not subscription_tier_id:
            # No subscription tier, allow upload
            return True, ""
        
        # Get storage limit from subscription tier
        tier_result = client.table('subscription_tiers')\
            .select('storage_amount_bytes')\
            .eq('id', subscription_tier_id)\
            .single()\
            .execute()
        
        if not tier_result.data:
            # No tier data, allow upload
            return True, ""
        
        storage_limit_bytes = tier_result.data.get('storage_amount_bytes', 0)
        if storage_limit_bytes == 0:
            # No storage limit set, allow upload
            return True, ""
        
        # Calculate actual storage used from deliverables (deduplicated by file_url)
        bookings_result = client.table('bookings')\
            .select('id')\
            .eq('creative_user_id', user_id)\
            .execute()
        
        if not bookings_result.data:
            # No bookings, storage used is 0
            current_storage_used = 0
        else:
            booking_ids = [b['id'] for b in bookings_result.data]
            
            # Get all deliverables
            deliverables_result = db_admin.table('booking_deliverables')\
                .select('file_size_bytes, file_url')\
                .in_('booking_id', booking_ids)\
                .execute()
            
            # Deduplicate by file_url (same logic as frontend)
            seen_file_urls = set()
            unique_deliverables = []
            for deliverable in (deliverables_result.data or []):
                file_url = deliverable.get('file_url')
                if file_url and file_url not in seen_file_urls:
                    seen_file_urls.add(file_url)
                    unique_deliverables.append(deliverable)
            
            # Calculate total storage used
            current_storage_used = sum(
                d.get('file_size_bytes', 0) or 0
                for d in unique_deliverables
                if isinstance(d.get('file_size_bytes'), (int, float))
            )
        
        # Check if adding new files would exceed limit
        total_after_upload = current_storage_used + new_files_size
        
        if total_after_upload > storage_limit_bytes:
            overage = total_after_upload - storage_limit_bytes
            remaining = max(0, storage_limit_bytes - current_storage_used)
            error_msg = (
                f"Uploading these files would exceed your storage limit by {format_storage_size(overage)}. "
                f"You have {format_storage_size(remaining)} remaining out of {format_storage_size(storage_limit_bytes)} total storage."
            )
            return False, error_msg
        
        return True, ""
    
    except Exception as e:
        logger.error(f"Error checking storage limit: {e}", exc_info=True)
        # On error, allow upload (fail open) but log the error
        return True, ""


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
        
        # Check storage limit before registering files
        total_new_files_size = sum(f.file_size for f in register_request.files)
        is_allowed, error_message = await check_storage_limit(user_id, total_new_files_size, client)
        if not is_allowed:
            raise HTTPException(status_code=403, detail=error_message)
        
        # Register files in database
        registered_files = []
        for file_info in register_request.files:
            # Use the storage path provided (from the upload)
            storage_path = file_info.storage_path
            
            # Check if file with this file_url already exists for this booking
            # This prevents duplicate entries if the endpoint is called multiple times
            existing_file = db_admin.table('booking_deliverables')\
                .select('id')\
                .eq('booking_id', booking_id)\
                .eq('file_url', storage_path)\
                .limit(1)\
                .execute()
            
            if existing_file.data and len(existing_file.data) > 0:
                # File already exists, skip insertion
                logger.warning(f"File with file_url '{storage_path}' already exists for booking {booking_id}, skipping duplicate registration")
                registered_files.append({
                    "file_url": storage_path,
                    "file_name": file_info.file_name,
                    "file_size": file_info.file_size,
                    "file_type": file_info.file_type or "application/octet-stream",
                    "storage_path": storage_path,
                    "already_exists": True
                })
                continue
            
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
                error_str = str(insert_error)
                # Check if it's a unique constraint violation (duplicate file_url)
                if 'unique' in error_str.lower() or 'duplicate' in error_str.lower() or 'already exists' in error_str.lower():
                    logger.warning(f"File with file_url '{storage_path}' already exists for booking {booking_id}, skipping duplicate registration")
                    registered_files.append({
                        "file_url": storage_path,
                        "file_name": file_info.file_name,
                        "file_size": file_info.file_size,
                        "file_type": file_info.file_type or "application/octet-stream",
                        "storage_path": storage_path,
                        "already_exists": True
                    })
                else:
                    logger.error(f"Failed to register file {file_info.file_name}: {error_str}")
                    raise HTTPException(status_code=500, detail=f"Failed to register file '{file_info.file_name}': {error_str}")
        
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
        
        # First pass: read all files to get sizes for storage check
        # We need to read files first to check storage, but files can only be read once
        # So we'll read into memory, check storage, then process
        from io import BytesIO
        file_data = []
        total_new_files_size = 0
        
        for file in files:
            try:
                content = await file.read()
                file_size = len(content)
                total_new_files_size += file_size
                file_data.append({
                    'file': file,
                    'content': content,
                    'file_size': file_size,
                    'filename': file.filename,
                    'content_type': file.content_type
                })
            except Exception as e:
                logger.error(f"Error reading file {file.filename}: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to read file '{file.filename}': {str(e)}")
        
        # Check storage limit before processing files
        is_allowed, error_message = await check_storage_limit(user_id, total_new_files_size, client)
        if not is_allowed:
            raise HTTPException(status_code=403, detail=error_message)
        
        # Validate and scan all files, then upload
        scanner = ScannerService()
        max_size = 30 * 1024 * 1024 * 1024  # 30GB limit
        uploaded_files = []
        
        for file_info in file_data:
            try:
                # Create a file-like object for scanning
                from io import BytesIO
                
                # Create a mock UploadFile-like object for the scanner
                class FileWrapper:
                    def __init__(self, filename, content, content_type):
                        self.filename = filename
                        self._content = content
                        self.content_type = content_type
                        self._read = False
                    
                    async def read(self):
                        if self._read:
                            return b''
                        self._read = True
                        return self._content
                
                file_wrapper = FileWrapper(
                    file_info['filename'],
                    file_info['content'],
                    file_info['content_type']
                )
                
                # Validate and scan file
                is_safe, error_message, scan_details = await scanner.scan_and_validate(
                    file_wrapper, 
                    max_size=max_size,
                    allowed_extensions=None,  # Allow all file types except dangerous ones
                    fail_if_scanner_unavailable=False  # Don't fail if scanner is down
                )
                
                if not is_safe:
                    raise HTTPException(status_code=400, detail=f"File '{file_info['filename']}' validation failed: {error_message}")
                
                # Generate unique filename
                file_extension = os.path.splitext(file_info['filename'])[1] if file_info['filename'] and '.' in file_info['filename'] else ''
                unique_id = uuid.uuid4().hex
                storage_path = f"{booking_id}/{unique_id}{file_extension}"
                
                # Upload to Supabase Storage
                try:
                    upload_result = db_admin.storage.from_(bucket_name).upload(
                        path=storage_path,
                        file=file_info['content'],
                        file_options={
                            "content-type": file_info['content_type'] or "application/octet-stream",
                            "cache-control": "3600"
                        }
                    )
                except Exception as upload_error:
                    logger.error(f"Failed to upload file {file_info['filename']} to storage: {str(upload_error)}")
                    raise HTTPException(status_code=500, detail=f"Failed to upload file '{file_info['filename']}': {str(upload_error)}")
                
                uploaded_files.append({
                    "file_url": storage_path,
                    "file_name": file_info['filename'],
                    "file_size": file_info['file_size'],
                    "file_type": file_info['content_type'] or "application/octet-stream",
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
        
        # Check storage limit before uploading
        is_allowed, error_message = await check_storage_limit(user_id, file_size, client)
        if not is_allowed:
            raise HTTPException(status_code=403, detail=error_message)
        
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
        failed_files = []
        for deliverable in deliverables_result.data:
            deliverable_id = deliverable.get('id')
            file_path = deliverable.get('file_url')
            file_name = deliverable.get('file_name', 'Unknown')
            
            if not file_path:
                logger.warning(f"File path not found for deliverable {deliverable_id} ({file_name})")
                failed_files.append({
                    "deliverable_id": deliverable_id,
                    "file_name": file_name,
                    "error": "File path not found in database"
                })
                continue
            
            # Normalize file path - remove any leading slashes or bucket prefixes
            # file_path should be in format: "booking_id/filename.ext"
            normalized_path = file_path.strip()
            
            # Remove leading slashes
            normalized_path = normalized_path.lstrip('/')
            
            # Remove bucket name prefix if present
            if normalized_path.startswith(f"{bucket_name}/"):
                normalized_path = normalized_path[len(f"{bucket_name}/"):]
            
            # If it looks like a full URL, try to extract the path
            # This handles cases where file_url might have been stored as a URL
            if normalized_path.startswith('http://') or normalized_path.startswith('https://'):
                # Try to extract path from URL
                # Format: https://project.supabase.co/storage/v1/object/public/bucket/path
                # or: https://project.supabase.co/storage/v1/object/sign/bucket/path
                try:
                    parsed = urlparse(normalized_path)
                    # Extract path after bucket name
                    path_parts = parsed.path.split('/')
                    if bucket_name in path_parts:
                        bucket_index = path_parts.index(bucket_name)
                        if bucket_index + 1 < len(path_parts):
                            normalized_path = '/'.join(path_parts[bucket_index + 1:])
                except Exception as parse_error:
                    logger.warning(f"Failed to parse URL path for deliverable {deliverable_id}: {parse_error}")
                    # Keep original path and let it fail with a clear error
            
            try:
                logger.debug(f"Attempting to generate signed URL for deliverable {deliverable_id}: {normalized_path}")
                
                # Generate signed URL (expires in 1 hour = 3600 seconds)
                signed_url_result = db_admin.storage.from_(bucket_name).create_signed_url(
                    normalized_path,
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
                    logger.error(f"Failed to generate signed URL for deliverable {deliverable_id} ({file_name}): No URL in response")
                    failed_files.append({
                        "deliverable_id": deliverable_id,
                        "file_name": file_name,
                        "error": "Failed to generate signed URL"
                    })
                    continue
                
                files_with_urls.append({
                    "deliverable_id": deliverable_id,
                    "file_name": file_name,
                    "signed_url": signed_url,
                    "expires_in": 3600
                })
                
                # Collect deliverable ID for batch update
                deliverable_ids_to_update.append(deliverable_id)
                logger.debug(f"Successfully generated signed URL for deliverable {deliverable_id} ({file_name})")
                    
            except Exception as url_error:
                error_msg = str(url_error)
                # Check if it's a 404/not found error and provide a clearer message
                if '404' in error_msg or 'not_found' in error_msg.lower() or 'Object not found' in error_msg:
                    clear_error = "File not found in storage. The file may have been deleted or never uploaded successfully."
                    logger.warning(f"File missing from storage for deliverable {deliverable_id} ({file_name}): {normalized_path}")
                else:
                    clear_error = f"Failed to generate download URL: {error_msg}"
                    logger.error(f"Error processing deliverable {deliverable_id} ({file_name}) with path '{normalized_path}': {error_msg}", exc_info=True)
                
                failed_files.append({
                    "deliverable_id": deliverable_id,
                    "file_name": file_name,
                    "error": clear_error,
                    "file_path": normalized_path,
                    "raw_error": error_msg
                })
                # Continue with other files even if one fails
                continue
        
        # Log summary of failed files
        if failed_files:
            logger.warning(f"Batch download: {len(failed_files)} files failed to generate signed URLs out of {len(deliverables_result.data)} total files")
            for failed in failed_files:
                logger.warning(f"  - {failed.get('file_name')} (ID: {failed.get('deliverable_id')}): {failed.get('error')}")
        
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
        
        # Log final summary
        total_deliverables = len(deliverables_result.data)
        successful_files = len(files_with_urls)
        failed_count = len(failed_files)
        
        logger.info(f"Batch download summary for booking {booking_id}: {successful_files} successful, {failed_count} failed out of {total_deliverables} total files")
        
        if successful_files == 0 and total_deliverables > 0:
            logger.error(f"CRITICAL: All {total_deliverables} files failed to generate signed URLs for booking {booking_id}. This may indicate files are missing from storage.")
        
        # Include failed files in response with error status so frontend can show them
        unavailable_files = []
        for failed in failed_files:
            unavailable_files.append({
                "deliverable_id": failed.get("deliverable_id"),
                "file_name": failed.get("file_name"),
                "error": failed.get("error"),
                "file_path": failed.get("file_path"),
                "available": False
            })
        
        return {
            "success": True,
            "files": files_with_urls,
            "unavailable_files": unavailable_files,  # Files that exist in DB but not in storage
            "total_files": len(files_with_urls),
            "total_deliverables": total_deliverables,
            "failed_count": failed_count,
            "available_count": successful_files
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


@router.get("/creative-deliverables")
@limiter.limit("20 per minute")
async def get_creative_deliverables(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get all deliverables for the authenticated creative user
    Requires authentication - will return 401 if not authenticated.
    - Fetches all deliverables with booking, service, and client info
    - Deduplicates by file_url
    - Returns optimized data structure for frontend
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Single optimized query: Get deliverables with booking and service info
        deliverables_result = client.table('booking_deliverables')\
            .select('''
                id,
                booking_id,
                file_name,
                file_type,
                file_size_bytes,
                file_url,
                created_at,
                bookings!inner(
                    id,
                    client_user_id,
                    created_at,
                    creative_user_id,
                    creative_services!inner(
                        title
                    )
                )
            ''')\
            .eq('bookings.creative_user_id', user_id)\
            .execute()
        
        if not deliverables_result.data or len(deliverables_result.data) == 0:
            return {
                "deliverables": []
            }
        
        deliverables_data = deliverables_result.data
        
        # Sort by created_at descending (most recent first)
        deliverables_data.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        # Extract unique client user IDs
        client_user_ids = list(set([
            d['bookings']['client_user_id'] 
            for d in deliverables_data 
            if d.get('bookings') and d['bookings'].get('client_user_id')
        ]))
        
        # Fetch client names (only if we have client IDs)
        users_map = {}
        if client_user_ids:
            users_result = client.table('users')\
                .select('user_id, name')\
                .in_('user_id', client_user_ids)\
                .execute()
            
            if users_result.data:
                users_map = {u['user_id']: u['name'] for u in users_result.data}
        
        # Deduplicate deliverables by file_url (keep first occurrence, most recent due to ordering)
        seen_file_urls = set()
        unique_deliverables = []
        
        for deliverable in deliverables_data:
            file_url = deliverable.get('file_url')
            if not file_url or file_url in seen_file_urls:
                continue
            
            seen_file_urls.add(file_url)
            booking = deliverable.get('bookings', {})
            service_title = booking.get('creative_services', {}).get('title', 'Service') if booking.get('creative_services') else 'Service'
            client_user_id = booking.get('client_user_id')
            
            unique_deliverables.append({
                "id": deliverable.get('id'),
                "booking_id": deliverable.get('booking_id'),
                "file_name": deliverable.get('file_name'),
                "file_type": deliverable.get('file_type'),
                "file_size_bytes": deliverable.get('file_size_bytes'),
                "file_url": deliverable.get('file_url'),
                "booking": {
                    "id": booking.get('id'),
                    "service_name": service_title,
                    "client_name": users_map.get(client_user_id, 'Unknown Client') if client_user_id else 'Unknown Client',
                    "created_at": booking.get('created_at')
                } if booking else None
            })
        
        return {
            "deliverables": unique_deliverables
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative deliverables: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch deliverables: {str(e)}")


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

