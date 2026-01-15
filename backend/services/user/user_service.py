from fastapi import HTTPException
from schemas.user import UserProfile, UpdateRolesRequest, UpdateRolesResponse, SetupStatusResponse, BatchSetupRequest, BatchSetupResponse, RoleProfilesResponse
from core.validation import validate_roles
from supabase import Client

class UserController:
    @staticmethod
    async def get_user_profile(user_id: str, client: Client) -> UserProfile:
        """Get the current user's profile from the database
        
        Args:
            user_id: The user ID to fetch profile for
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
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
    async def update_user_roles(user_id: str, role_request: UpdateRolesRequest, client: Client) -> UpdateRolesResponse:
        """Update user roles and set first_login to false
        
        Args:
            user_id: The user ID to update roles for
            role_request: The request containing selected roles
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Validate roles
            selected_roles = role_request.selected_roles
            is_valid, error_message = validate_roles(selected_roles)
            
            if not is_valid:
                raise HTTPException(status_code=400, detail=error_message)
            
            # Get current user data to check existing roles (using authenticated client - respects RLS)
            current_user = client.table('users').select('roles').eq('user_id', user_id).single().execute()
            current_roles = current_user.data['roles'] if current_user.data else []
            
            # Clean up profile data for roles that are being removed (using authenticated client - respects RLS)
            removed_roles = [role for role in current_roles if role not in selected_roles]
            for role in removed_roles:
                if role == 'creative':
                    # Delete creative profile if role is removed (RLS ensures user can only delete their own)
                    client.table('creatives').delete().eq('user_id', user_id).execute()
                elif role == 'client':
                    # Delete client profile if role is removed (RLS ensures user can only delete their own)
                    client.table('clients').delete().eq('user_id', user_id).execute()
                elif role == 'advocate':
                    # Delete advocate profile if role is removed (RLS ensures user can only delete their own)
                    client.table('advocates').delete().eq('user_id', user_id).execute()
            
            # Update user roles (keep first_login as True until setup is completed)
            # Using authenticated client - RLS ensures user can only update their own record
            update_result = client.table('users').update({
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
            # Check if it's an RLS/permission error
            error_str = str(e)
            if 'PGRST116' in error_str or '0 rows' in error_str.lower() or 'permission' in error_str.lower():
                raise HTTPException(
                    status_code=403,
                    detail="Permission denied: Unable to update user roles. Please ensure you are authenticated."
                )
            raise HTTPException(status_code=500, detail=f"Failed to update user roles: {str(e)}")

    @staticmethod
    async def get_setup_status(user_id: str, client: Client) -> SetupStatusResponse:
        """Check which role setups are incomplete for the current user
        
        Args:
            user_id: The user ID to check setup status for
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Get user's roles (using authenticated client - respects RLS)
            user_result = client.table('users').select('roles, first_login').eq('user_id', user_id).single().execute()
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
            
            # Check each role to see if setup is complete (using authenticated client - respects RLS)
            for role in user_roles:
                if role == 'creative':
                    # Check if creative profile exists
                    creative_result = client.table('creatives').select('user_id').eq('user_id', user_id).execute()
                    if not creative_result.data:
                        incomplete_setups.append('creative')
                
                elif role == 'client':
                    # Check if client profile exists
                    client_result = client.table('clients').select('user_id').eq('user_id', user_id).execute()
                    if not client_result.data:
                        incomplete_setups.append('client')
                
                elif role == 'advocate':
                    # Check if advocate profile exists
                    advocate_result = client.table('advocates').select('user_id').eq('user_id', user_id).execute()
                    if not advocate_result.data:
                        incomplete_setups.append('advocate')
            
            return SetupStatusResponse(incomplete_setups=incomplete_setups)
            
        except HTTPException:
            raise
        except Exception as e:
            # Check if it's an RLS/permission error
            error_str = str(e)
            if 'PGRST116' in error_str or '0 rows' in error_str.lower() or 'permission' in error_str.lower():
                raise HTTPException(
                    status_code=403,
                    detail="Permission denied: Unable to check setup status. Please ensure you are authenticated."
                )
            raise HTTPException(status_code=500, detail=f"Failed to check setup status: {str(e)}")

    @staticmethod
    async def batch_setup_profiles(user_id: str, setup_request: BatchSetupRequest, client: Client) -> BatchSetupResponse:
        """Create all profile data at once after all setups are completed
        
        Args:
            user_id: The user ID to create profiles for
            setup_request: The request containing profile data for each role
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Get user data for profile fields (using authenticated client - respects RLS)
            user_result = client.table('users').select('roles, name, email, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
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
                # Using authenticated client - RLS allows authenticated users to read subscription_tiers
                subscription_result = client.table('subscription_tiers').select(
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
                
                # Using authenticated client - RLS ensures user can only create their own profile
                result = client.table('creatives').upsert(creative_row).execute()
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
                
                # Using authenticated client - RLS ensures user can only create their own profile
                result = client.table('clients').upsert(client_row).execute()
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
                
                # Using authenticated client - RLS ensures user can only create their own profile
                result = client.table('advocates').upsert(advocate_row).execute()
                if result.data:
                    created_profiles.append('advocate')
            
            # Mark setup as complete by setting first_login to False
            # Using authenticated client - RLS ensures user can only update their own record
            client.table('users').update({
                'first_login': False
            }).eq('user_id', user_id).execute()
            
            return BatchSetupResponse(
                success=True,
                message=f"Successfully created {len(created_profiles)} profile(s): {', '.join(created_profiles)}"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            # Check if it's an RLS/permission error
            error_str = str(e)
            if 'PGRST116' in error_str or '0 rows' in error_str.lower() or 'permission' in error_str.lower():
                raise HTTPException(
                    status_code=403,
                    detail="Permission denied: Unable to create profiles. Please ensure you are authenticated and have the correct roles."
                )
            raise HTTPException(status_code=500, detail=f"Failed to create profiles: {str(e)}")

    @staticmethod
    async def get_user_role_profiles(user_id: str, client: Client) -> RoleProfilesResponse:
        """Get minimal role profile data for role switching - optimized with single query
        
        Args:
            user_id: The user ID to fetch role profiles for
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Get user's roles first using authenticated client (respects RLS)
            user_result = client.table('users').select('roles').eq('user_id', user_id).single().execute()
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
                
                # Fetch creative profile if user has creative role (using authenticated client - respects RLS)
                if 'creative' in user_roles:
                    creative_result = client.table('creatives').select(
                        'user_id, title'
                    ).eq('user_id', user_id).execute()
                    if creative_result.data and len(creative_result.data) > 0:
                        creative_data = creative_result.data[0]
                
                # Fetch client profile if user has client role (using authenticated client - respects RLS)
                if 'client' in user_roles:
                    client_result = client.table('clients').select(
                        'user_id, title'
                    ).eq('user_id', user_id).execute()
                    if client_result.data and len(client_result.data) > 0:
                        client_data = client_result.data[0]
                
                # Fetch advocate profile if user has advocate role (using authenticated client - respects RLS)
                if 'advocate' in user_roles:
                    advocate_result = client.table('advocates').select(
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
            # Check if it's an RLS/permission error (0 rows returned)
            error_str = str(e)
            if 'PGRST116' in error_str or '0 rows' in error_str.lower():
                # RLS blocked the query - likely authentication issue
                raise HTTPException(
                    status_code=401, 
                    detail="Authentication failed: Unable to access role profiles. Please sign in again."
                )
            raise HTTPException(status_code=500, detail=f"Failed to fetch role profiles: {str(e)}")

    @staticmethod
    async def get_subscription_tiers(client: Client) -> list[dict]:
        """Get all active subscription tiers with formatted storage display
        
        Args:
            client: Authenticated Supabase client (required, respects RLS policies)
        
        Returns:
            List of subscription tiers with formatted storage display
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Query subscription tiers (respects RLS - public read policy allows anonymous access)
            result = client.table('subscription_tiers').select(
                'id, name, price, storage_amount_bytes, description, fee_percentage, tier_level'
            ).eq('is_active', True).order('tier_level', desc=True).order('price', desc=False).execute()
            
            if not result.data:
                return []
            
            # Format the response with human-readable storage
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
                    'tier_level': tier.get('tier_level', 0),
                })
            
            return tiers
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch subscription tiers: {str(e)}")