from fastapi import HTTPException
from db.db_session import db_admin
from schemas.user import UserProfile, UpdateRolesRequest, UpdateRolesResponse, SetupStatusResponse, BatchSetupRequest, BatchSetupResponse, RoleProfilesResponse
from core.validation import validate_roles
from supabase import Client

class UserController:
    @staticmethod
    async def get_user_profile(user_id: str, client: Client) -> UserProfile:
        """Get the current user's profile from the database
        
        Args:
            user_id: The user ID to fetch profile for
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Query the users table using authenticated client (respects RLS)
            result = client.table('users').select('*').eq('user_id', user_id).single().execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="User profile not found")
            
            return UserProfile(**result.data)
            
        except HTTPException:
            raise
        except Exception as e:
            # Check if it's an RLS/permission error (0 rows returned)
            error_str = str(e)
            if 'PGRST116' in error_str or '0 rows' in error_str.lower():
                # RLS blocked the query - likely authentication issue
                raise HTTPException(
                    status_code=401, 
                    detail="Authentication failed: Unable to access user profile. Please sign in again."
                )
            raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {str(e)}")

    @staticmethod
    async def update_user_roles(user_id: str, role_request: UpdateRolesRequest) -> UpdateRolesResponse:
        """Update user roles and set first_login to false"""
        try:
            # Validate roles
            selected_roles = role_request.selected_roles
            is_valid, error_message = validate_roles(selected_roles)
            
            if not is_valid:
                raise HTTPException(status_code=400, detail=error_message)
            
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

    @staticmethod
    async def get_setup_status(user_id: str) -> SetupStatusResponse:
        """Check which role setups are incomplete for the current user"""
        try:
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

    @staticmethod
    async def batch_setup_profiles(user_id: str, setup_request: BatchSetupRequest) -> BatchSetupResponse:
        """Create all profile data at once after all setups are completed"""
        try:
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
            if not display_name:
                display_name = 'User'
            
            # Ensure profile picture url is never null
            if not profile_picture_url:
                seed = display_name or user_id
                profile_picture_url = f"https://api.dicebear.com/7.x/initials/svg?seed={seed}"
            
            created_profiles = []
            
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
            
            # Mark setup as complete by setting first_login to False
            db_admin.table('users').update({
                'first_login': False
            }).eq('user_id', user_id).execute()
            
            return BatchSetupResponse(
                success=True,
                message=f"Successfully created {len(created_profiles)} profile(s): {', '.join(created_profiles)}"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create profiles: {str(e)}")

    @staticmethod
    async def get_user_role_profiles(user_id: str) -> RoleProfilesResponse:
        """Get minimal role profile data for role switching - optimized with single query"""
        try:
            # Get user's roles first
            user_result = db_admin.table('users').select('roles').eq('user_id', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_roles = user_result.data.get('roles', [])
            role_profiles = {}
            
            # Batch fetch all role profiles in parallel to avoid sequential queries
            if user_roles:
                # Use a single query with UNION to get all role profiles at once
                # This is more efficient than separate queries for each role
                creative_data = None
                client_data = None
                advocate_data = None
                
                # Fetch creative profile if user has creative role
                if 'creative' in user_roles:
                    creative_result = db_admin.table('creatives').select(
                        'user_id, title'
                    ).eq('user_id', user_id).execute()
                    if creative_result.data and len(creative_result.data) > 0:
                        creative_data = creative_result.data[0]
                
                # Fetch client profile if user has client role
                if 'client' in user_roles:
                    client_result = db_admin.table('clients').select(
                        'user_id, title'
                    ).eq('user_id', user_id).execute()
                    if client_result.data and len(client_result.data) > 0:
                        client_data = client_result.data[0]
                
                # Fetch advocate profile if user has advocate role
                if 'advocate' in user_roles:
                    advocate_result = db_admin.table('advocates').select(
                        'user_id, tier'
                    ).eq('user_id', user_id).execute()
                    if advocate_result.data and len(advocate_result.data) > 0:
                        advocate_data = advocate_result.data[0]
                
                # Build response object
                if creative_data:
                    role_profiles['creative'] = creative_data
                if client_data:
                    role_profiles['client'] = client_data
                if advocate_data:
                    role_profiles['advocate'] = advocate_data
            
            return RoleProfilesResponse(**role_profiles)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch role profiles: {str(e)}")
