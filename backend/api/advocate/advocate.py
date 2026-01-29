from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File
from services.advocate.advocate_service import AdvocateController
from schemas.advocate import AdvocateUpdateRequest, AdvocateUpdateResponse
from core.limiter import limiter
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from typing import Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/profile")
@limiter.limit("2 per second")
async def get_advocate_profile(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Get the current user's advocate profile
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await AdvocateController.get_advocate_profile(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to fetch advocate profile", e)
        raise HTTPException(status_code=500, detail="Failed to fetch advocate profile")

@router.put("/profile", response_model=AdvocateUpdateResponse)
@limiter.limit("2 per second")
async def update_advocate_profile(
    request: Request,
    update_data: AdvocateUpdateRequest,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Update the current user's advocate profile
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await AdvocateController.update_advocate_profile(user_id, update_data)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to update advocate profile", e)
        raise HTTPException(status_code=500, detail="Failed to update advocate profile")

@router.post("/profile/upload-photo")
@limiter.limit("2 per second")
async def upload_profile_photo(
    request: Request,
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Upload a profile photo for the advocate
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await AdvocateController.upload_profile_photo(user_id, file)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to upload profile photo", e)
        raise HTTPException(status_code=500, detail="Failed to upload profile photo")