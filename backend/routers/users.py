from fastapi import APIRouter, Request, HTTPException
from db.db_session import db_admin
from model.user import UserProfile, UpdateRolesRequest, UpdateRolesResponse, CreativeSetupRequest, CreativeSetupResponse, ClientSetupRequest, ClientSetupResponse, AdvocateSetupResponse, SetupStatusResponse, BatchSetupRequest, BatchSetupResponse
from typing import List
import re
from core.limiter import limiter

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

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
@limiter.limit("2 per second")
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
@limiter.limit("2 per second")
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
        
        # Get current user data to check existing roles
        current_user = db_admin.table('users').select('roles').eq('user_id', user_id).single().execute()
        current_roles = current_user.data['roles'] if current_user.data else []
        
        # Clean up profile data for roles that are being removed
        removed_roles = [role for role in current_roles if role not in selected_roles]
        for role in removed_roles:
            if role == 'creative':
                # Delete creative profile if role is removed
                db_admin.table('creatives').delete().eq('user_id', user_id).execute()
            elif role == 'client':
                # Delete client profile if role is removed
                db_admin.table('clients').delete().eq('user_id', user_id).execute()
            elif role == 'advocate':
                # Delete advocate profile if role is removed
                db_admin.table('advocates').delete().eq('user_id', user_id).execute()
        
        # Update user roles (keep first_login as True until setup is completed)
        update_result = db_admin.table('users').update({
            'roles': selected_roles
        }).eq('user_id', user_id).execute()
        
        if not update_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UpdateRolesResponse(
            success=True,
            message="Roles updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user roles: {str(e)}")

@router.post("/creative-setup", response_model=CreativeSetupResponse)
@limiter.limit("2 per second")
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
        
        # Validate subscription_tier_id and get storage limit from subscription_tier
        subscription_result = db_admin.table('subscription_tiers').select(
            'id, storage_amount_bytes, is_active'
        ).eq('id', setup_request.subscription_tier_id).single().execute()
        
        if not subscription_result.data:
            raise HTTPException(status_code=404, detail="Subscription tier not found")
        
        if not subscription_result.data.get('is_active', True):
            raise HTTPException(status_code=400, detail="Subscription tier is not active")
        
        creative_data = {
            'user_id': user_id,
            'display_name': setup_request.display_name,
            'title': title_to_use,
            'bio': setup_request.bio,
            'subscription_tier_id': setup_request.subscription_tier_id,
            'primary_contact': setup_request.primary_contact,
            'secondary_contact': setup_request.secondary_contact,
            'profile_banner_url': profile_picture_url,  # Copy profile picture as banner
            'profile_source': avatar_source,  # Copy avatar source as profile source
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
@limiter.limit("2 per second")
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
@limiter.limit("2 per second")
async def setup_advocate_profile(request: Request):
    """Set up advocate profile and copy display/avatar from user with fallbacks"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Verify user has advocate role and fetch fields
        user_result = db_admin.table('users').select('roles, name, email, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        if 'advocate' not in user_result.data['roles']:
            raise HTTPException(status_code=403, detail="User must have advocate role to set up advocate profile")
        
        # Compute fields with fallbacks
        user_data = user_result.data
        display_name = user_data.get('name')
        if not display_name:
            email_any = user_data.get('email')
            if email_any:
                display_name = email_any.split('@')[0]
        avatar_source = user_data.get('avatar_source', 'google')
        profile_banner_url = user_data.get('profile_picture_url')
        if not profile_banner_url:
            seed = display_name or user_id
            profile_banner_url = f"https://api.dicebear.com/7.x/initials/svg?seed={seed}"

        # Create advocate profile with data
        advocate_data = {
            'user_id': user_id,
            'display_name': display_name,
            'profile_banner_url': profile_banner_url,
            'profile_source': avatar_source,
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
        
        # Insert or update advocate profile (upsert) then force-update core fields
        result = db_admin.table('advocates').upsert(advocate_data).execute()
        try:
            db_admin.table('advocates').update({
                'display_name': display_name,
                'profile_banner_url': profile_banner_url,
                'profile_source': avatar_source,
            }).eq('user_id', user_id).execute()
        except Exception:
            pass
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create advocate profile")
        
        return AdvocateSetupResponse(success=True, message="Advocate profile created successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set up advocate profile: {str(e)}")

@router.get("/setup-status", response_model=SetupStatusResponse)
@limiter.limit("2 per second")
async def get_setup_status(request: Request):
    """Check which role setups are incomplete for the current user"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Get user's roles
        user_result = db_admin.table('users').select('roles, first_login').eq('user_id', user_id).single().execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_roles = user_result.data['roles']
        first_login = user_result.data['first_login']
        
        # If first_login is True, they haven't completed setup yet
        # Check if they have roles selected (setup in progress) or no roles (need role selection)
        if first_login:
            if not user_roles or len(user_roles) == 0:
                # No roles selected yet - need role selection
                return SetupStatusResponse(incomplete_setups=[])
            else:
                # Roles selected but setup not complete - return incomplete setups
                pass  # Continue to check which setups are incomplete
        
        incomplete_setups = []
        
        # Check each role to see if setup is complete
        for role in user_roles:
            if role == 'creative':
                # Check if creative profile exists
                creative_result = db_admin.table('creatives').select('user_id').eq('user_id', user_id).execute()
                if not creative_result.data:
                    incomplete_setups.append('creative')
            
            elif role == 'client':
                # Check if client profile exists
                client_result = db_admin.table('clients').select('user_id').eq('user_id', user_id).execute()
                if not client_result.data:
                    incomplete_setups.append('client')
            
            elif role == 'advocate':
                # Check if advocate profile exists
                advocate_result = db_admin.table('advocates').select('user_id').eq('user_id', user_id).execute()
                if not advocate_result.data:
                    incomplete_setups.append('advocate')
        
        return SetupStatusResponse(incomplete_setups=incomplete_setups)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check setup status: {str(e)}")

@router.post("/batch-setup", response_model=BatchSetupResponse)
@limiter.limit("2 per second")
async def batch_setup_profiles(request: Request, setup_request: BatchSetupRequest):
    """Create all profile data at once after all setups are completed"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Get user data for profile fields
        user_result = db_admin.table('users').select('roles, name, email, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_result.data
        user_roles = user_data.get('roles', [])
        profile_picture_url = user_data.get('profile_picture_url')
        avatar_source = user_data.get('avatar_source', 'google')
        # Compute display name with safe fallbacks
        display_name = user_data.get('name')
        if not display_name:
            email_any = user_data.get('email')
            if email_any:
                display_name = email_any.split('@')[0]
        if not profile_picture_url:
            # Deterministic placeholder if avatar missing
            seed = display_name or user_id
            profile_picture_url = f"https://api.dicebear.com/7.x/initials/svg?seed={seed}"
        
        created_profiles = []
        
        # Debug logging
        print(f"Batch setup request: creative_data={setup_request.creative_data}, client_data={setup_request.client_data}, advocate_data={setup_request.advocate_data}")
        print(f"User roles: {user_roles}")
        
        # Create creative profile if data provided and user has role
        if setup_request.creative_data is not None and 'creative' in user_roles:
            creative_data = setup_request.creative_data
            
            # Get subscription_tier_id from creative_data (should be UUID)
            subscription_tier_id = creative_data.get('subscription_tier_id')
            if not subscription_tier_id:
                raise HTTPException(status_code=422, detail="subscription_tier_id is required")
            
            # Validate subscription_tier_id and get storage limit from subscription_tier
            subscription_result = db_admin.table('subscription_tiers').select(
                'id, storage_amount_bytes, is_active'
            ).eq('id', subscription_tier_id).single().execute()
            
            if not subscription_result.data:
                raise HTTPException(status_code=404, detail="Subscription tier not found")
            
            if not subscription_result.data.get('is_active', True):
                raise HTTPException(status_code=400, detail="Subscription tier is not active")
            
            creative_row = {
                'user_id': user_id,
                'display_name': creative_data.get('display_name'),
                'title': creative_data.get('title'),
                'bio': creative_data.get('bio'),
                'subscription_tier_id': subscription_tier_id,
                'primary_contact': creative_data.get('primary_contact'),
                'secondary_contact': creative_data.get('secondary_contact'),
                'profile_banner_url': profile_picture_url,
                'profile_source': avatar_source,
            }
            
            result = db_admin.table('creatives').upsert(creative_row).execute()
            if result.data:
                created_profiles.append('creative')
        
        # Create client profile if data provided and user has role
        if setup_request.client_data is not None and 'client' in user_roles:
            client_data = setup_request.client_data
            
            client_row = {
                'user_id': user_id,
                'display_name': client_data.get('display_name'),
                'title': client_data.get('title'),
                'email': client_data.get('email'),
                'profile_banner_url': profile_picture_url,
                'profile_source': avatar_source,
            }
            
            result = db_admin.table('clients').upsert(client_row).execute()
            if result.data:
                created_profiles.append('client')
        
        # Create advocate profile if data provided and user has role
        if setup_request.advocate_data is not None and 'advocate' in user_roles:
            advocate_row = {
                'user_id': user_id,
                'display_name': display_name,
                'profile_banner_url': profile_picture_url,
                'profile_source': avatar_source,
                'tier': 'silver',
                'fp_affiliate_id': f'demo_affiliate_{user_id[:8]}',
                'fp_referral_code': f'DEMO{user_id[:6].upper()}',
                'fp_referral_link': f'https://ez-web-demo.vercel.app/signup?ref=DEMO{user_id[:6].upper()}',
                'active_referrals': 0,
                'currency': 'USD',
                'total_earned': 0.00,
                'earned_this_month': 0.00,
                'total_paid_out': 0.00,
                'pending_payout': 0.00,
                'last_payout_at': None,
                'last_synced_at': None,
                'sync_source': 'firstpromoter',
            }
            
            result = db_admin.table('advocates').upsert(advocate_row).execute()
            if result.data:
                created_profiles.append('advocate')
        
        return BatchSetupResponse(
            success=True,
            message=f"Successfully created {len(created_profiles)} profile(s): {', '.join(created_profiles)}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create profiles: {str(e)}")

