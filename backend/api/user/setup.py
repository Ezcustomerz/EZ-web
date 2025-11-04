from fastapi import APIRouter, Request, HTTPException, Depends
from services.user.user_service import UserController
from schemas.user import BatchSetupRequest, UpdateRolesRequest
from core.verify import require_auth
from typing import Dict, Any

router = APIRouter()

@router.post("/batch-setup")
async def batch_setup_profiles(
    request: Request,
    setup_request: BatchSetupRequest,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Create all profile data at once after all setups are completed
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await UserController.batch_setup_profiles(user_id, setup_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create profiles: {str(e)}")
    

@router.post("/update-roles")
async def update_user_roles(
    request: Request,
    role_request: UpdateRolesRequest,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Update user roles and set first_login to false
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await UserController.update_user_roles(user_id, role_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user roles: {str(e)}")
    
    
@router.get("/setup-status")
async def get_setup_status(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Check which role setups are incomplete for the current user
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await UserController.get_setup_status(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check setup status: {str(e)}")