from fastapi import APIRouter, Request, HTTPException
from db.db_session import db_admin
from model.user import UserProfile, UpdateRolesRequest, UpdateRolesResponse, CreativeSetupRequest, CreativeSetupResponse, ClientSetupRequest, ClientSetupResponse, AdvocateSetupResponse
from typing import List
import re

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

def validate_email(email: str) -> bool:
    """Validate email format"""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_pattern, email) is not None

def validate_phone_number(phone: str) -> bool:
    """Validate phone number format - supports various international formats"""
    # Remove all non-digit characters except + for international prefix
    cleaned_phone = re.sub(r'[^\d+]', '', phone)
    
    # Basic phone number patterns
    # Supports formats like: +1234567890, 1234567890, (123) 456-7890, 123-456-7890, etc.
    phone_patterns = [
        r'^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$',  # US/Canada format
        r'^\+?[1-9]\d{1,14}$',  # International format (E.164)
        r'^\d{10}$',  # 10-digit US format
        r'^\d{11}$',  # 11-digit with country code
    ]
    
    return any(re.match(pattern, cleaned_phone) for pattern in phone_patterns)

def validate_contact_field(contact: str) -> tuple[bool, str]:
    """
    Validate a contact field as either email or phone number
    Returns (is_valid, field_type) where field_type is 'email', 'phone', or 'invalid'
    """
    if not contact or not contact.strip():
        return False, 'empty'
    
    contact = contact.strip()
    
    # Check if it looks like an email (contains @)
    if '@' in contact:
        if validate_email(contact):
            return True, 'email'
        else:
            return False, 'invalid_email'
    
    # Check if it looks like a phone number
    elif validate_phone_number(contact):
        return True, 'phone'
    
    return False, 'invalid_format'

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
        
        # Verify user has creative role and get user profile data
        user_result = db_admin.table('users').select('roles, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
        if not user_result.data or 'creative' not in user_result.data['roles']:
            raise HTTPException(status_code=403, detail="User must have creative role to set up creative profile")
        
        # Validate contact fields
        validation_errors = []
        
        if setup_request.primary_contact:
            is_valid, field_type = validate_contact_field(setup_request.primary_contact)
            if not is_valid:
                if field_type == 'invalid_email':
                    validation_errors.append("Primary contact: Invalid email format")
                elif field_type == 'invalid_format':
                    validation_errors.append("Primary contact: Must be a valid email address or phone number")
        
        if setup_request.secondary_contact:
            is_valid, field_type = validate_contact_field(setup_request.secondary_contact)
            if not is_valid:
                if field_type == 'invalid_email':
                    validation_errors.append("Secondary contact: Invalid email format")
                elif field_type == 'invalid_format':
                    validation_errors.append("Secondary contact: Must be a valid email address or phone number")
        
        # Check if at least one contact method is provided
        if not setup_request.primary_contact and not setup_request.secondary_contact:
            validation_errors.append("At least one contact method (primary or secondary) is required")
        
        # If there are validation errors, return them
        if validation_errors:
            raise HTTPException(status_code=422, detail="; ".join(validation_errors))
        
        # Prepare creative profile data
        # If custom_title is provided, use it as the title instead of the selected title
        title_to_use = setup_request.custom_title if setup_request.custom_title else setup_request.title
        
        # Get user's profile picture and avatar source for creative profile
        user_data = user_result.data
        profile_picture_url = user_data.get('profile_picture_url')
        avatar_source = user_data.get('avatar_source', 'google')
        
        # Set storage limit based on subscription tier
        storage_limits = {
            'basic': 10 * 1024 * 1024 * 1024,    # 10GB in bytes
            'growth': 100 * 1024 * 1024 * 1024,  # 100GB in bytes  
            'pro': 1024 * 1024 * 1024 * 1024,    # 1TB in bytes
        }
        storage_limit = storage_limits.get(setup_request.subscription_tier, storage_limits['basic'])
        
        creative_data = {
            'user_id': user_id,
            'display_name': setup_request.display_name,
            'title': title_to_use,
            'bio': setup_request.bio,
            'subscription_tier': setup_request.subscription_tier,
            'primary_contact': setup_request.primary_contact,
            'secondary_contact': setup_request.secondary_contact,
            'profile_banner_url': profile_picture_url,  # Copy profile picture as banner
            'profile_source': avatar_source,  # Copy avatar source as profile source
            'storage_limit_bytes': storage_limit,  # Set storage limit based on plan
        }
        
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

@router.post("/client-setup", response_model=ClientSetupResponse)
async def setup_client_profile(request: Request, setup_request: ClientSetupRequest):
    """Set up client profile in the clients table"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Verify user has client role and get user profile data
        user_result = db_admin.table('users').select('roles, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
        if not user_result.data or 'client' not in user_result.data['roles']:
            raise HTTPException(status_code=403, detail="User must have client role to set up client profile")
        
        # Validate email format
        if not validate_email(setup_request.email):
            raise HTTPException(status_code=422, detail="Invalid email format")
        
        # Prepare client profile data
        # If custom_title is provided, use it as the title instead of the selected title
        title_to_use = setup_request.custom_title if setup_request.custom_title else setup_request.title
        
        # Get user's profile picture and avatar source for client profile
        user_data = user_result.data
        profile_picture_url = user_data.get('profile_picture_url')
        avatar_source = user_data.get('avatar_source', 'google')
        
        client_data = {
            'user_id': user_id,
            'display_name': setup_request.display_name,
            'title': title_to_use,
            'email': setup_request.email,
            'profile_banner_url': profile_picture_url,  # Copy profile picture as banner
            'profile_source': avatar_source,  # Copy avatar source as profile source
        }
        
        # Insert or update client profile (upsert)
        result = db_admin.table('clients').upsert(client_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create client profile")
        
        return ClientSetupResponse(
            success=True,
            message="Client profile created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set up client profile: {str(e)}")

@router.post("/advocate-setup", response_model=AdvocateSetupResponse)
async def setup_advocate_profile(request: Request):
    """Set up advocate profile in the advocates table with hardcoded demo values"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Verify user has advocate role
        user_result = db_admin.table('users').select('roles').eq('user_id', user_id).single().execute()
        if not user_result.data or 'advocate' not in user_result.data['roles']:
            raise HTTPException(status_code=403, detail="User must have advocate role to set up advocate profile")
        
        # Create advocate profile with hardcoded demo data
        advocate_data = {
            'user_id': user_id,
            'tier': 'silver',  # Default tier
            'fp_affiliate_id': f'demo_affiliate_{user_id[:8]}',  # Demo affiliate ID
            'fp_referral_code': f'DEMO{user_id[:6].upper()}',  # Demo referral code
            'fp_referral_link': f'https://ez-web-demo.vercel.app/signup?ref=DEMO{user_id[:6].upper()}',  # Demo referral link
            'active_referrals': 0,  # Starting with 0
            'currency': 'USD',  # Default currency
            'total_earned': 0.00,  # Starting with 0
            'earned_this_month': 0.00,  # Starting with 0
            'total_paid_out': 0.00,  # Starting with 0
            'pending_payout': 0.00,  # Starting with 0
            'last_payout_at': None,  # No payouts yet
            'last_synced_at': None,  # No sync yet (will be used for FirstPromoter later)
            'sync_source': 'firstpromoter',  # Ready for future integration
        }
        
        # Insert or update advocate profile (upsert)
        result = db_admin.table('advocates').upsert(advocate_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create advocate profile")
        
        return AdvocateSetupResponse(
            success=True,
            message="Advocate profile created successfully with demo data"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set up advocate profile: {str(e)}")

