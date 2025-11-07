from fastapi import APIRouter, Request, HTTPException, Depends
from services.user.user_service import UserController
from schemas.user import RoleProfilesResponse
from core.limiter import limiter
from core.verify import require_auth
from typing import Dict, Any
from db.db_session import get_authenticated_client_dep, db_client
from supabase import Client

router = APIRouter()

@router.get("/profile")
@limiter.limit("2 per second")
async def get_user_profile(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get the current user's profile from the database
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await UserController.get_user_profile(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        # Check if it's an authentication-related error
        error_str = str(e).lower()
        if 'auth' in error_str or 'unauthorized' in error_str or 'permission' in error_str:
            raise HTTPException(status_code=401, detail="Authentication failed: Sign in was unsuccessful")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {str(e)}")

@router.get("/role-profiles", response_model=RoleProfilesResponse)
@limiter.limit("2 per second")
async def get_user_role_profiles(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get minimal role profile data for role switching
    Requires authentication - will return 401 if not authenticated.
    Uses RLS policies to ensure users can only access their own role profiles.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await UserController.get_user_role_profiles(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        # Check if it's an authentication-related error
        error_str = str(e).lower()
        if 'auth' in error_str or 'unauthorized' in error_str or 'permission' in error_str or 'PGRST116' in error_str:
            raise HTTPException(status_code=401, detail="Authentication failed: Unable to access role profiles")
        raise HTTPException(status_code=500, detail=f"Failed to fetch role profiles: {str(e)}")

@router.get("/subscription-tiers")
@limiter.limit("10 per second")
async def get_subscription_tiers(request: Request):
    """Get all active subscription tiers
    Public endpoint - no authentication required (for pricing/landing pages).
    Uses RLS policies to ensure only active tiers are returned.
    """
    try:
        # Use db_client (respects RLS) - public read policy allows anonymous access
        return await UserController.get_subscription_tiers(db_client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch subscription tiers: {str(e)}")