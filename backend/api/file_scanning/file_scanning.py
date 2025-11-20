from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Depends
from typing import List, Dict, Any
from services.file_scanning.scanner_service import ScannerService
from schemas.file_scanning import FileScanResponse, FileScanResult
from core.limiter import limiter
from core.verify import require_auth
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/scan", response_model=FileScanResponse)
@limiter.limit("10 per minute")
async def scan_files(
    request: Request,
    files: List[UploadFile] = File(...),
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Scan multiple files for malware using ClamAV
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        scanner_service = ScannerService()
        results = []
        safe_count = 0
        unsafe_count = 0
        # Check if ClamAV is available (will be False in dev_deploy mode)
        scanner_available = scanner_service.clamav.is_available() if scanner_service.clamav is not None else False
        clamav_skipped = scanner_service.skip_clamav
        skip_reason = "ClamAV scanning disabled in dev_deploy mode" if clamav_skipped else None
        
        for file in files:
            try:
                is_safe, error_message, scan_details = await scanner_service.scan_and_validate(
                    file,
                    max_size=100 * 1024 * 1024,  # 100MB
                    fail_if_scanner_unavailable=False if clamav_skipped else True  # Don't fail if ClamAV is intentionally skipped
                )
                
                result = FileScanResult(
                    filename=file.filename or "unknown",
                    is_safe=is_safe,
                    error_message=error_message,
                    scan_details=scan_details
                )
                
                results.append(result)
                
                if is_safe:
                    safe_count += 1
                else:
                    unsafe_count += 1
                    
            except Exception as e:
                logger.error(f"Error scanning file {file.filename}: {str(e)}", exc_info=True)
                results.append(FileScanResult(
                    filename=file.filename or "unknown",
                    is_safe=False,
                    error_message=f"Scan error: {str(e)}",
                    scan_details=None
                ))
                unsafe_count += 1
        
        return FileScanResponse(
            results=results,
            total_files=len(files),
            safe_files=safe_count,
            unsafe_files=unsafe_count,
            scanner_available=scanner_available,
            clamav_skipped=clamav_skipped,
            skip_reason=skip_reason
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File scanning error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to scan files: {str(e)}")

@router.post("/scan/single", response_model=FileScanResult)
@limiter.limit("20 per minute")
async def scan_single_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Scan a single file for malware using ClamAV
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        scanner_service = ScannerService()
        
        is_safe, error_message, scan_details = await scanner_service.scan_and_validate(
            file,
            max_size=100 * 1024 * 1024,  # 100MB
            fail_if_scanner_unavailable=True
        )
        
        return FileScanResult(
            filename=file.filename or "unknown",
            is_safe=is_safe,
            error_message=error_message,
            scan_details=scan_details
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File scanning error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to scan file: {str(e)}")

