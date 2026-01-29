import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from services.user.user_service import UserController
from schemas.user import BatchSetupRequest, UpdateRolesRequest
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from db.db_session import get_authenticated_client_dep
from typing import Dict, Any
from supabase import Client

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/batch-setup")
async def batch_setup_profiles(
    request: Request,
    setup_request: BatchSetupRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Create all profile data at once after all setups are completed
    Requires authentication - will return 401 if not authenticated.
    Uses authenticated client to respect RLS policies.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await UserController.batch_setup_profiles(user_id, setup_request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error in batch_setup_profiles", e)
        raise HTTPException(status_code=500, detail="Failed to create profiles")
    

@router.post("/update-roles")
async def update_user_roles(
    request: Request,
    role_request: UpdateRolesRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Update user roles and set first_login to false
    Requires authentication - will return 401 if not authenticated.
    Uses authenticated client to respect RLS policies.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await UserController.update_user_roles(user_id, role_request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error in update_user_roles", e)
        raise HTTPException(status_code=500, detail="Failed to update user roles")
    
    
@router.get("/setup-status")
async def get_setup_status(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Check which role setups are incomplete for the current user
    Requires authentication - will return 401 if not authenticated.
    Uses authenticated client to respect RLS policies.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await UserController.get_setup_status(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error in get_setup_status", e)
        raise HTTPException(status_code=500, detail="Failed to check setup status")