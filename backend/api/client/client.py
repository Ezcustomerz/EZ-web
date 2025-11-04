from fastapi import APIRouter, Request, HTTPException, Depends
from services.client.client_service import ClientController
from schemas.client import ClientCreativesListResponse
from core.limiter import limiter
from core.verify import require_auth
from typing import Dict, Any

router = APIRouter()

@router.get("/profile")
@limiter.limit("2 per second")
async def get_client_profile(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Get the current user's client profile
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await ClientController.get_client_profile(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch client profile: {str(e)}")

@router.get("/creatives", response_model=ClientCreativesListResponse)
@limiter.limit("2 per second")
async def get_client_creatives(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Get all creatives connected to the current client
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await ClientController.get_client_creatives(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch client creatives: {str(e)}")

@router.get("/services", response_model=dict)
@limiter.limit("2 per second")
async def get_connected_services_and_bundles(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Get all services and bundles from creatives connected to the current client
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await ClientController.get_connected_services_and_bundles(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch connected services and bundles: {str(e)}")