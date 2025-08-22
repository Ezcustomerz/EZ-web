from fastapi import APIRouter, Request, HTTPException
from services.user.user_service import UserController
from schemas.user import BatchSetupRequest, UpdateRolesRequest

router = APIRouter()

@router.post("/batch-setup")
async def batch_setup_profiles(request: Request, setup_request: BatchSetupRequest):
    """Create all profile data at once after all setups are completed"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await UserController.batch_setup_profiles(user_id, setup_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create profiles: {str(e)}")
    

@router.post("/update-roles")
async def update_user_roles(request: Request, role_request: UpdateRolesRequest):
    """Update user roles and set first_login to false"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await UserController.update_user_roles(user_id, role_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user roles: {str(e)}")
    
    
@router.get("/setup-status")
async def get_setup_status(request: Request):
    """Check which role setups are incomplete for the current user"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await UserController.get_setup_status(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check setup status: {str(e)}")