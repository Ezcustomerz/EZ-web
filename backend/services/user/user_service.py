from fastapi import HTTPException
from db.db_session import db_admin
from schemas.user import UserProfile, UpdateRolesRequest, UpdateRolesResponse, SetupStatusResponse, BatchSetupRequest, BatchSetupResponse
from core.validation import validate_roles

class UserController:
    @staticmethod
    async def get_user_profile(user_id: str) -> UserProfile:
        """Get the current user's profile from the database"""
        try:
            # Query the users table
            result = db_admin.table('users').select('*').eq('user_id', user_id).single().execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="User profile not found")
            
            return UserProfile(**result.data)
            
        except HTTPException:
            raise
        except Exception as e:
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
            
            # If first_login is True, they haven't completed role selection yet
            if first_login:
                return SetupStatusResponse(incomplete_setups=[])
            
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
            # Get user data for profile pictures and avatar source
            user_result = db_admin.table('users').select('roles, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_data = user_result.data
            user_roles = user_data.get('roles', [])
            profile_picture_url = user_data.get('profile_picture_url')
            avatar_source = user_data.get('avatar_source', 'google')
            
            created_profiles = []
            
            # Create creative profile if data provided and user has role
            if setup_request.creative_data is not None and 'creative' in user_roles:
                creative_data = setup_request.creative_data
                
                # Set storage limit based on subscription tier
                storage_limits = {
                    'basic': 10 * 1024 * 1024 * 1024,  # 10GB in bytes
                    'growth': 100 * 1024 * 1024 * 1024,  # 100GB in bytes
                    'pro': 1024 * 1024 * 1024 * 1024,  # 1TB in bytes
                }
                storage_limit = storage_limits.get(creative_data.get('subscription_tier', 'basic'), storage_limits['basic'])
                
                creative_row = {
                    'user_id': user_id,
                    'display_name': creative_data.get('display_name'),
                    'title': creative_data.get('title'),
                    'bio': creative_data.get('bio'),
                    'subscription_tier': creative_data.get('subscription_tier', 'basic'),
                    'primary_contact': creative_data.get('primary_contact'),
                    'secondary_contact': creative_data.get('secondary_contact'),
                    'profile_banner_url': profile_picture_url,
                    'profile_source': avatar_source,
                    'storage_limit_bytes': storage_limit,
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

    @staticmethod
    async def get_user_role_profiles(user_id: str) -> dict:
        """Get all role profiles for the current user"""
        try:
            # Get user's roles first
            user_result = db_admin.table('users').select('roles').eq('user_id', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_roles = user_result.data.get('roles', [])
            role_profiles = {}
            
            # Fetch creative profile if user has creative role
            if 'creative' in user_roles:
                creative_result = db_admin.table('creatives').select('*').eq('user_id', user_id).single().execute()
                if creative_result.data:
                    role_profiles['creative'] = creative_result.data
            
            # Fetch client profile if user has client role
            if 'client' in user_roles:
                client_result = db_admin.table('clients').select('*').eq('user_id', user_id).single().execute()
                if client_result.data:
                    role_profiles['client'] = client_result.data
            
            # Fetch advocate profile if user has advocate role
            if 'advocate' in user_roles:
                advocate_result = db_admin.table('advocates').select('*').eq('user_id', user_id).single().execute()
                if advocate_result.data:
                    role_profiles['advocate'] = advocate_result.data
            
            return role_profiles
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch role profiles: {str(e)}")
