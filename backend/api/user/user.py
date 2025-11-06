from fastapi import APIRouter, Request, HTTPException, Depends
from services.user.user_service import UserController
from schemas.user import RoleProfilesResponse
from core.limiter import limiter
from core.verify import require_auth
from typing import Dict, Any
from db.db_session import get_authenticated_client

router = APIRouter()

@router.get("/profile")
@limiter.limit("2 per second")
async def get_user_profile(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Get the current user's profile from the database
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get authenticated Supabase client (respects RLS policies)
        try:
            client = get_authenticated_client(request)
        except Exception as auth_error:
            # If we can't create authenticated client, return 401
            raise HTTPException(status_code=401, detail="Authentication failed: Unable to create authenticated session")
        
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
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Get minimal role profile data for role switching
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await UserController.get_user_role_profiles(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch role profiles: {str(e)}")

@router.get("/subscription-tiers")
@limiter.limit("10 per second")
async def get_subscription_tiers(request: Request):
    """Get all active subscription tiers"""
    try:
        result = db_admin.table('subscription_tiers').select(
            'id, name, price, storage_amount_bytes, description, fee_percentage'
        ).eq('is_active', True).order('price', desc=False).execute()
        
        if not result.data:
            return []
        
        # Format the response
        tiers = []
        for tier in result.data:
            # Convert storage from bytes to human-readable format
            storage_bytes = tier['storage_amount_bytes']
            if storage_bytes >= 1024 * 1024 * 1024 * 1024:  # 1TB or more
                storage_display = f"{storage_bytes / (1024 * 1024 * 1024 * 1024):.0f}TB"
            elif storage_bytes >= 100 * 1024 * 1024 * 1024:  # 100GB or more
                storage_display = f"{storage_bytes / (1024 * 1024 * 1024):.0f}GB"
            elif storage_bytes >= 50 * 1024 * 1024 * 1024:  # 50GB or more
                storage_display = f"50-100GB"
            else:  # Less than 50GB
                storage_display = f"{storage_bytes / (1024 * 1024 * 1024):.0f}GB"
            
            tiers.append({
                'id': tier['id'],
                'name': tier['name'],
                'price': float(tier['price']),
                'storage_amount_bytes': tier['storage_amount_bytes'],
                'storage_display': storage_display,
                'description': tier['description'],
                'fee_percentage': float(tier['fee_percentage']),
            })
        
        return tiers
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch subscription tiers: {str(e)}")