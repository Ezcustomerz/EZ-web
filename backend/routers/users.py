from fastapi import APIRouter, Request, HTTPException
from db.db_session import db_admin
from model.user import UserProfile, UpdateRolesRequest, UpdateRolesResponse, CreativeSetupRequest, CreativeSetupResponse
from typing import List

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(request: Request):
    """Get the current user's profile from the database"""
    try:
        # Get user ID from JWT token (set by middleware)
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Query the users table
        result = db_admin.table('users').select('*').eq('user_id', user_id).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return UserProfile(**result.data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {str(e)}")

@router.post("/update-roles", response_model=UpdateRolesResponse)
async def update_user_roles(request: Request, role_request: UpdateRolesRequest):
    """Update user roles and set first_login to false"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Validate roles
        valid_roles = ['client', 'creative', 'advocate']
        selected_roles = role_request.selected_roles
        
        if not selected_roles or len(selected_roles) == 0:
            raise HTTPException(status_code=400, detail="Must select at least one role")
        
        if len(selected_roles) > 3:
            raise HTTPException(status_code=400, detail="Cannot select more than 3 roles")
        
        for role in selected_roles:
            if role not in valid_roles:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid role '{role}'. Valid roles are: {', '.join(valid_roles)}"
                )
        
        # Update user roles and first_login flag
        update_result = db_admin.table('users').update({
            'roles': selected_roles,
            'first_login': False
        }).eq('user_id', user_id).execute()
        
        if not update_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Fetch updated profile
        profile_result = db_admin.table('users').select('*').eq('user_id', user_id).single().execute()
        
        return UpdateRolesResponse(
            success=True,
            message="Roles updated successfully",
            user_profile=UserProfile(**profile_result.data)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user roles: {str(e)}")

@router.post("/creative-setup", response_model=CreativeSetupResponse)
async def setup_producer_profile(request: Request, setup_request: CreativeSetupRequest):
    """Set up creative profile in the creatives table"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Verify user has creative role
        user_result = db_admin.table('users').select('roles').eq('user_id', user_id).single().execute()
        if not user_result.data or 'creative' not in user_result.data['roles']:
            raise HTTPException(status_code=403, detail="User must have creative role to set up creative profile")
        
        # Prepare creative profile data
        creative_data = {
            'user_id': user_id,
            'display_name': setup_request.display_name,
            'title': setup_request.title,
            'bio': setup_request.bio,
            'subscription_tier': setup_request.subscription_tier,
            'primary_contact': setup_request.primary_contact,
            'secondary_contact': setup_request.secondary_contact,
        }
        
        # Add custom title if provided
        if setup_request.custom_title:
            creative_data['custom_title'] = setup_request.custom_title
        
        # Insert or update creative profile (upsert)
        result = db_admin.table('creatives').upsert(creative_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create creative profile")
        
        return CreativeSetupResponse(
            success=True,
            message="Creative profile created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set up creative profile: {str(e)}")

