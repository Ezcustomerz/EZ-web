from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File
from services.client.client_service import ClientController
from schemas.client import ClientCreativesListResponse, ClientUpdateRequest, ClientUpdateResponse
from core.limiter import limiter
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from typing import Dict, Any
from db.db_session import get_authenticated_client_dep
from supabase import Client
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/profile")
@limiter.limit("2 per second")
async def get_client_profile(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get the current user's client profile
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ClientController.get_client_profile(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to fetch client profile", e)
        raise HTTPException(status_code=500, detail="Failed to fetch client profile")

@router.put("/profile", response_model=ClientUpdateResponse)
@limiter.limit("2 per second")
async def update_client_profile(
    request: Request,
    update_data: ClientUpdateRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Update the current user's client profile
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ClientController.update_client_profile(user_id, update_data, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to update client profile", e)
        raise HTTPException(status_code=500, detail="Failed to update client profile")

@router.post("/profile/upload-photo")
@limiter.limit("2 per second")
async def upload_profile_photo(
    request: Request,
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Upload a profile photo for the client
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ClientController.upload_profile_photo(user_id, file, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to upload profile photo", e)
        raise HTTPException(status_code=500, detail="Failed to upload profile photo")

@router.get("/creatives", response_model=ClientCreativesListResponse)
@limiter.limit("2 per second")
async def get_client_creatives(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get all creatives connected to the current client
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ClientController.get_client_creatives(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to fetch client creatives", e)
        raise HTTPException(status_code=500, detail="Failed to fetch client creatives")

@router.get("/services", response_model=dict)
@limiter.limit("2 per second")
async def get_connected_services_and_bundles(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get all services and bundles from creatives connected to the current client
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ClientController.get_connected_services_and_bundles(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to fetch connected services and bundles", e)
        raise HTTPException(status_code=500, detail="Failed to fetch connected services and bundles")