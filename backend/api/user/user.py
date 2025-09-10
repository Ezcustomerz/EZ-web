from fastapi import APIRouter, Request, HTTPException
from services.user.user_service import UserController
from schemas.user import RoleProfilesResponse

router = APIRouter()

@router.get("/profile")
async def get_user_profile(request: Request):
    """Get the current user's profile from the database"""
    try:
        # Get user ID from JWT token (set by middleware)
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await UserController.get_user_profile(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {str(e)}")

@router.get("/role-profiles", response_model=RoleProfilesResponse)
async def get_user_role_profiles(request: Request):
    """Get minimal role profile data for role switching"""
    try:
        # Get user ID from JWT token (set by middleware)
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await UserController.get_user_role_profiles(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch role profiles: {str(e)}")