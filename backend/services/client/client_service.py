from fastapi import HTTPException, UploadFile
from db.db_session import db_admin
from schemas.client import ClientSetupRequest, ClientSetupResponse, ClientCreativesListResponse, ClientCreativeResponse, ClientUpdateRequest, ClientUpdateResponse
from core.validation import validate_email
from supabase import Client
import uuid

class ClientController:
    @staticmethod
    async def setup_client_profile(user_id: str, setup_request: ClientSetupRequest, client: Client) -> ClientSetupResponse:
        """Set up client profile in the clients table
        
        Args:
            user_id: The user ID to set up client profile for
            setup_request: The request containing client profile data
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Get user profile data (using authenticated client - respects RLS)
            user_result = client.table('users').select('roles, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_data = user_result.data
            user_roles = user_data.get('roles', [])
            
            # If user doesn't have client role, add it
            if 'client' not in user_roles:
                user_roles.append('client')
                # Update user's roles in the database (using authenticated client - respects RLS)
                update_result = client.table('users').update({'roles': user_roles}).eq('user_id', user_id).execute()
                if not update_result.data:
                    raise HTTPException(status_code=500, detail="Failed to update user roles")
            
            # Validate email format
            if not validate_email(setup_request.email):
                raise HTTPException(status_code=422, detail="Invalid email format")
            
            # Prepare client profile data
            # If custom_title is provided, use it as the title instead of the selected title
            title_to_use = setup_request.custom_title if setup_request.custom_title else setup_request.title
            
            # Get user's profile picture and avatar source for client profile
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
            
            # Insert or update client profile (upsert) (using authenticated client - respects RLS)
            result = client.table('clients').upsert(client_data).execute()
            
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

    @staticmethod
    async def get_client_profile(user_id: str, client: Client) -> dict:
        """Get the current user's client profile
        
        Args:
            user_id: The user ID to fetch client profile for
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Query the clients table using authenticated client (respects RLS)
            result = client.table('clients').select('*').eq('user_id', user_id).single().execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Client profile not found")
            
            return result.data
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch client profile: {str(e)}")

    @staticmethod
    async def update_client_profile(user_id: str, update_data: ClientUpdateRequest, client: Client) -> ClientUpdateResponse:
        """Update the current user's client profile
        
        Args:
            user_id: The user ID to update client profile for
            update_data: The request containing update data
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Build update dictionary with only provided fields
            update_dict = {}
            if update_data.display_name is not None:
                update_dict['display_name'] = update_data.display_name
            if update_data.title is not None:
                update_dict['title'] = update_data.title
            if update_data.email is not None:
                # Validate email format
                if not validate_email(update_data.email):
                    raise HTTPException(status_code=422, detail="Invalid email format")
                update_dict['email'] = update_data.email
            if update_data.profile_banner_url is not None:
                update_dict['profile_banner_url'] = update_data.profile_banner_url
            
            # Only update if there are fields to update
            if not update_dict:
                return ClientUpdateResponse(
                    success=True,
                    message="No changes to update"
                )
            
            # Update the client profile using authenticated client (respects RLS)
            result = client.table('clients').update(update_dict).eq('user_id', user_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Client profile not found")
            
            return ClientUpdateResponse(
                success=True,
                message="Client profile updated successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update client profile: {str(e)}")

    @staticmethod
    async def upload_profile_photo(user_id: str, file: UploadFile, client: Client) -> dict:
        """Upload a profile photo for the client"""
        try:
            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="File must be an image")
            
            # Validate file size (5MB limit)
            content = await file.read()
            file_size = len(content)
            if file_size > 5 * 1024 * 1024:  # 5MB
                raise HTTPException(status_code=400, detail="File size must be less than 5MB")
            
            # Get current profile to find old photo URL
            current_profile = client.table('clients').select('profile_banner_url').eq('user_id', user_id).single().execute()
            old_photo_url = None
            if current_profile.data and current_profile.data.get('profile_banner_url'):
                old_photo_url = current_profile.data['profile_banner_url']
            
            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
            unique_filename = f"{user_id}_{uuid.uuid4().hex}.{file_extension}"
            
            # Upload to Supabase storage
            bucket_name = "profile-photos"
            file_path = f"clients/{unique_filename}"
            
            try:
                upload_result = db_admin.storage.from_(bucket_name).upload(
                    path=file_path,
                    file=content,
                    file_options={"content-type": file.content_type}
                )
            except Exception as upload_error:
                raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(upload_error)}")
            
            # Get the public URL
            public_url = db_admin.storage.from_(bucket_name).get_public_url(file_path)
            
            # Update the client profile with the new photo URL
            update_result = client.table('clients').update({
                'profile_banner_url': public_url,
                'profile_source': 'custom'
            }).eq('user_id', user_id).execute()
            
            if not update_result.data:
                raise HTTPException(status_code=500, detail="Failed to update profile with new photo URL")
            
            # Delete the old profile photo if it exists
            if old_photo_url and 'profile-photos' in old_photo_url:
                try:
                    clean_url = old_photo_url.split('?')[0].split('#')[0]
                    old_file_path = clean_url.split('/profile-photos/')[-1]
                    
                    if old_file_path.startswith('clients/'):
                        try:
                            db_admin.storage.from_(bucket_name).remove([old_file_path])
                        except Exception as delete_error:
                            print(f"Warning: Failed to delete old profile photo: {str(delete_error)}")
                except Exception as delete_error:
                    print(f"Warning: Failed to delete old profile photo: {str(delete_error)}")
            
            return {
                "success": True,
                "message": "Profile photo uploaded successfully",
                "profile_banner_url": public_url
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload profile photo: {str(e)}")

    @staticmethod
    async def get_client_creatives(user_id: str, client: Client) -> ClientCreativesListResponse:
        """Get all creatives connected to this client - simplified approach
        
        Args:
            user_id: The user ID to fetch creatives for
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Get creative user IDs first
            relationships_result = client.table('creative_client_relationships').select(
                'id, status, total_spent, projects_count, creative_user_id'
            ).eq('client_user_id', user_id).order('updated_at', desc=True).execute()
            
            if not relationships_result.data:
                return ClientCreativesListResponse(creatives=[], total_count=0)
            
            creative_user_ids = [rel['creative_user_id'] for rel in relationships_result.data]
            
            # Batch fetch all creative and user data to avoid N+1 queries
            creatives_result = client.table('creatives').select(
                'display_name, title, user_id, avatar_background_color, profile_banner_url, primary_contact, secondary_contact, description, availability_location, profile_highlights, profile_highlight_values'
            ).in_('user_id', creative_user_ids).execute()
            
            users_result = client.table('users').select(
                'name, email, profile_picture_url, user_id'
            ).in_('user_id', creative_user_ids).execute()
            
            # Create lookup maps
            creative_data_map = {c['user_id']: c for c in creatives_result.data}
            user_data_map = {u['user_id']: u for u in users_result.data}
            
            # Get service counts for each creative
            services_count_map = {}
            for creative_user_id in creative_user_ids:
                try:
                    # Try using count parameter instead of counting data length
                    service_count_result = client.table('creative_services').select(
                        'id', count='exact'
                    ).eq('creative_user_id', creative_user_id).eq('is_active', True).execute()
                    
                    # Use the count from the result
                    count = service_count_result.count if hasattr(service_count_result, 'count') else 0
                    services_count_map[creative_user_id] = count
                    print(f"🔍 Creative {creative_user_id} has {count} services (using count)")
                except Exception as e:
                    print(f"Error getting service count for creative {creative_user_id}: {e}")
                    # Fallback to counting data length
                    try:
                        service_count_result = client.table('creative_services').select(
                            'id'
                        ).eq('creative_user_id', creative_user_id).eq('is_active', True).execute()
                        count = len(service_count_result.data) if service_count_result.data else 0
                        services_count_map[creative_user_id] = count
                        print(f"🔍 Creative {creative_user_id} has {count} services (fallback)")
                    except Exception as e2:
                        print(f"Fallback also failed for creative {creative_user_id}: {e2}")
                        services_count_map[creative_user_id] = 0
            
            creatives = []
            for relationship in relationships_result.data:
                creative_user_id = relationship['creative_user_id']
                
                creative_data = creative_data_map.get(creative_user_id)
                user_data = user_data_map.get(creative_user_id)
                
                if not creative_data or not user_data:
                    continue  # Skip if creative or user data not found
                
                # Use display_name if available, otherwise use name
                creative_name = creative_data.get('display_name') or user_data.get('name', 'Unknown Creative')
                
                # Get creative's specialty (title)
                specialty = creative_data.get('title', 'Music Producer')
                
                # Get email from creative's primary_contact (fallback to user email if not set)
                email = creative_data.get('primary_contact') or user_data.get('email', '')
                
                # Get profile picture from creative's profile_banner_url (not user's profile_picture_url)
                avatar = creative_data.get('profile_banner_url')
                
                # Get creative's configured color
                color = creative_data.get('avatar_background_color', '#3B82F6')
                
                # Get creative's description
                description = creative_data.get('description')
                
                # Get contact information
                primary_contact = creative_data.get('primary_contact')
                secondary_contact = creative_data.get('secondary_contact')
                
                # Get location/availability
                availability_location = creative_data.get('availability_location')
                
                # Get profile highlights
                profile_highlights = creative_data.get('profile_highlights', [])
                profile_highlight_values = creative_data.get('profile_highlight_values', {})
                
                # Get service count
                servicesCount = services_count_map.get(creative_user_id, 0)
                print(f"🔍 Final service count for {creative_name} ({creative_user_id}): {servicesCount}")
                
                # For now, use default values for rating, reviewCount, isOnline
                rating = 4.5  # Default rating - no reviews system yet
                reviewCount = 0  # Could be calculated from reviews table when implemented
                isOnline = False  # Could be determined by last activity when implemented
                
                creative = ClientCreativeResponse(
                    id=relationship['id'],
                    name=creative_name,
                    avatar=avatar,
                    specialty=specialty,
                    email=email,
                    rating=rating,
                    reviewCount=reviewCount,
                    servicesCount=servicesCount,
                    isOnline=isOnline,
                    color=color,
                    status=relationship.get('status', 'inactive'),
                    description=description,
                    primary_contact=primary_contact,
                    secondary_contact=secondary_contact,
                    availability_location=availability_location,
                    profile_highlights=profile_highlights,
                    profile_highlight_values=profile_highlight_values
                )
                creatives.append(creative)
            
            return ClientCreativesListResponse(creatives=creatives, total_count=len(creatives))
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch client creatives: {str(e)}")

    @staticmethod
    async def get_connected_services(user_id: str) -> dict:
        """Get all services from creatives connected to this client - optimized with single query"""
        try:
            # Single optimized query with JOIN to get services, creative names, and photos
            # This replaces multiple individual queries with one efficient query
            services_result = db_admin.rpc('get_client_connected_services_with_photos', {
                'client_user_id': user_id
            }).execute()
            
            if not services_result.data:
                return {"services": [], "total_count": 0}
            
            # Process the results
            services = []
            for service_data in services_result.data:
                service = {
                    'id': service_data['id'],
                    'title': service_data['title'],
                    'description': service_data['description'],
                    'price': float(service_data['price']),
                    'delivery_time': service_data['delivery_time'],
                    'status': service_data['status'],
                    'color': service_data['color'],
                    'is_active': service_data['is_active'],
                    'created_at': service_data['created_at'],
                    'updated_at': service_data['updated_at'],
                    'creative_user_id': service_data['creative_user_id'],
                    'creative_name': service_data['creative_name'] or 'Unknown Creative',
                    'requires_booking': service_data['requires_booking'],
                    'photos': service_data['photos'] if service_data['photos'] else [],
                    'payment_option': service_data.get('payment_option'),
                    'split_deposit_amount': float(service_data['split_deposit_amount']) if service_data.get('split_deposit_amount') is not None else None
                }
                services.append(service)
            
            return {"services": services, "total_count": len(services)}
            
        except Exception as e:
            # Fallback to the original method if RPC fails
            try:
                return await ClientController._get_connected_services_fallback(user_id)
            except Exception as fallback_error:
                raise HTTPException(status_code=500, detail=f"Failed to fetch connected services: {str(fallback_error)}")

    @staticmethod
    async def _get_connected_services_fallback(user_id: str) -> dict:
        """Fallback method using optimized batch queries"""
        try:
            # Get creative user IDs
            relationships_result = db_admin.table('creative_client_relationships').select(
                'creative_user_id'
            ).eq('client_user_id', user_id).execute()
            
            if not relationships_result.data:
                return {"services": [], "total_count": 0}
            
            creative_user_ids = [rel['creative_user_id'] for rel in relationships_result.data]
            
            # Get all services from these creatives
            services_result = db_admin.table('creative_services').select(
                'id, title, description, price, delivery_time, status, color, is_active, created_at, updated_at, creative_user_id, requires_booking, payment_option, split_deposit_amount'
            ).in_('creative_user_id', creative_user_ids).eq('is_active', True).order('created_at', desc=True).execute()
            
            if not services_result.data:
                return {"services": [], "total_count": 0}
            
            # Batch fetch creative names to avoid N+1 queries
            creatives_result = db_admin.table('creatives').select(
                'user_id, display_name'
            ).in_('user_id', creative_user_ids).execute()
            
            users_result = db_admin.table('users').select(
                'user_id, name'
            ).in_('user_id', creative_user_ids).execute()
            
            # Create lookup maps
            creative_names = {c['user_id']: c.get('display_name') for c in creatives_result.data}
            user_names = {u['user_id']: u.get('name') for u in users_result.data}
            
            # Get photos for all services
            service_ids = [service['id'] for service in services_result.data]
            photos_result = db_admin.table('service_photos').select(
                'service_id, photo_url, photo_filename, photo_size_bytes, is_primary, display_order'
            ).in_('service_id', service_ids).order('service_id').order('display_order', desc=False).execute()
            
            # Group photos by service_id
            photos_by_service = {}
            if photos_result.data:
                for photo in photos_result.data:
                    service_id = photo['service_id']
                    if service_id not in photos_by_service:
                        photos_by_service[service_id] = []
                    photos_by_service[service_id].append({
                        'photo_url': photo['photo_url'],
                        'photo_filename': photo['photo_filename'],
                        'photo_size_bytes': photo['photo_size_bytes'],
                        'is_primary': photo['is_primary'],
                        'display_order': photo['display_order']
                    })
            
            # Process services
            services = []
            for service_data in services_result.data:
                creative_user_id = service_data['creative_user_id']
                creative_name = creative_names.get(creative_user_id) or user_names.get(creative_user_id) or 'Unknown Creative'
                
                service = {
                    'id': service_data['id'],
                    'title': service_data['title'],
                    'description': service_data['description'],
                    'price': float(service_data['price']),
                    'delivery_time': service_data['delivery_time'],
                    'status': service_data['status'],
                    'color': service_data['color'],
                    'is_active': service_data['is_active'],
                    'created_at': service_data['created_at'],
                    'updated_at': service_data['updated_at'],
                    'creative_user_id': creative_user_id,
                    'creative_name': creative_name,
                    'requires_booking': service_data['requires_booking'],
                    'photos': photos_by_service.get(service_data['id'], []),
                    'payment_option': service_data.get('payment_option'),
                    'split_deposit_amount': float(service_data['split_deposit_amount']) if service_data.get('split_deposit_amount') is not None else None
                }
                services.append(service)
            
            return {"services": services, "total_count": len(services)}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch connected services: {str(e)}")

    @staticmethod
    async def get_connected_services_and_bundles(user_id: str, client: Client) -> dict:
        """Get all services and bundles from creatives connected to this client
        
        Args:
            user_id: The user ID to fetch services and bundles for
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Get creative user IDs that this client is connected to
            relationships_result = client.table('creative_client_relationships').select(
                'creative_user_id'
            ).eq('client_user_id', user_id).execute()
            
            if not relationships_result.data:
                return {"services": [], "bundles": [], "total_count": 0}
            
            creative_user_ids = [rel['creative_user_id'] for rel in relationships_result.data]
            
            # Get all services from these creatives
            services_result = client.table('creative_services').select(
                'id, title, description, price, delivery_time, status, color, payment_option, split_deposit_amount, is_active, created_at, updated_at, creative_user_id, requires_booking'
            ).in_('creative_user_id', creative_user_ids).eq('is_active', True).eq('status', 'Public').order('created_at', desc=True).execute()
            
            # Get all bundles from these creatives
            bundles_result = client.table('creative_bundles').select(
                'id, title, description, color, status, pricing_option, fixed_price, discount_percentage, is_active, created_at, updated_at, creative_user_id'
            ).in_('creative_user_id', creative_user_ids).eq('is_active', True).eq('status', 'Public').order('created_at', desc=True).execute()
            
            if not services_result.data and not bundles_result.data:
                return {"services": [], "bundles": [], "total_count": 0}
            
            # Get creative details for both services and bundles
            all_creative_user_ids = list(set([
                *[service['creative_user_id'] for service in services_result.data or []],
                *[bundle['creative_user_id'] for bundle in bundles_result.data or []]
            ]))
            
            creatives_result = client.table('creatives').select(
                'user_id, display_name, title, profile_banner_url'
            ).in_('user_id', all_creative_user_ids).execute()
            
            # Create creative lookup map
            creatives_map = {c['user_id']: c for c in creatives_result.data}
            
            # Get user details for these creatives
            users_result = client.table('users').select(
                'user_id, name'
            ).in_('user_id', all_creative_user_ids).execute()
            
            # Create user lookup map
            users_map = {u['user_id']: u for u in users_result.data}
            
            # Process services
            services = []
            if services_result.data:
                # Get all service IDs for photo fetching
                service_ids = [service['id'] for service in services_result.data]
                
                # Fetch photos for all services
                photos_result = client.table('service_photos').select(
                    'service_id, photo_url, photo_filename, photo_size_bytes, is_primary, display_order'
                ).in_('service_id', service_ids).order('service_id').order('display_order', desc=False).execute()
                
                # Group photos by service_id
                photos_by_service = {}
                if photos_result.data:
                    for photo in photos_result.data:
                        service_id = photo['service_id']
                        if service_id not in photos_by_service:
                            photos_by_service[service_id] = []
                        photos_by_service[service_id].append({
                            'photo_url': photo['photo_url'],
                            'photo_filename': photo['photo_filename'],
                            'photo_size_bytes': photo['photo_size_bytes'],
                            'is_primary': photo['is_primary'],
                            'display_order': photo['display_order']
                        })
                
                for service_data in services_result.data:
                    creative_user_id = service_data['creative_user_id']
                    creative_data = creatives_map.get(creative_user_id, {})
                    user_data = users_map.get(creative_user_id, {})
                    
                    service = {
                        'id': service_data['id'],
                        'title': service_data['title'],
                        'description': service_data['description'],
                        'price': float(service_data['price']),
                        'delivery_time': service_data['delivery_time'],
                        'status': service_data['status'],
                        'color': service_data['color'],
                        'payment_option': service_data['payment_option'],
                        'split_deposit_amount': float(service_data['split_deposit_amount']) if service_data.get('split_deposit_amount') is not None else None,
                        'is_active': service_data['is_active'],
                        'created_at': service_data['created_at'],
                        'updated_at': service_data['updated_at'],
                        'creative_user_id': creative_user_id,
                        'creative_name': user_data.get('name', 'Creative'),
                        'creative_display_name': creative_data.get('display_name'),
                        'creative_title': creative_data.get('title'),
                        'creative_avatar_url': creative_data.get('profile_banner_url'),
                        'requires_booking': service_data['requires_booking'],
                        'photos': photos_by_service.get(service_data['id'], [])
                    }
                    services.append(service)
            
            # Process bundles
            bundles = []
            if bundles_result.data:
                for bundle_data in bundles_result.data:
                    creative_user_id = bundle_data['creative_user_id']
                    creative_data = creatives_map.get(creative_user_id, {})
                    user_data = users_map.get(creative_user_id, {})
                    
                    # Get services for this bundle
                    bundle_services_result = client.table('bundle_services').select(
                        'service_id'
                    ).eq('bundle_id', bundle_data['id']).execute()
                    
                    service_ids = [bs['service_id'] for bs in bundle_services_result.data] if bundle_services_result.data else []
                    
                    # Get service details
                    bundle_services_data = client.table('creative_services').select(
                        'id, title, description, price, delivery_time, status, color'
                    ).in_('id', service_ids).execute()
                    
                    # Fetch photos for bundle services
                    bundle_photos_result = client.table('service_photos').select(
                        'service_id, photo_url, photo_filename, photo_size_bytes, is_primary, display_order'
                    ).in_('service_id', service_ids).order('service_id').order('display_order', desc=False).execute()
                    
                    # Group photos by service_id
                    bundle_photos_by_service = {}
                    if bundle_photos_result.data:
                        for photo in bundle_photos_result.data:
                            service_id = photo['service_id']
                            if service_id not in bundle_photos_by_service:
                                bundle_photos_by_service[service_id] = []
                            bundle_photos_by_service[service_id].append({
                                'photo_url': photo['photo_url'],
                                'photo_filename': photo['photo_filename'],
                                'photo_size_bytes': photo['photo_size_bytes'],
                                'is_primary': photo['is_primary'],
                                'display_order': photo['display_order']
                            })
                    
                    bundle_services = []
                    total_services_price = 0
                    for service_data in bundle_services_data.data:
                        service_photos = bundle_photos_by_service.get(service_data['id'], [])
                        service = {
                            'id': service_data['id'],
                            'title': service_data['title'],
                            'description': service_data['description'],
                            'price': float(service_data['price']),
                            'delivery_time': service_data['delivery_time'],
                            'status': service_data['status'],
                            'color': service_data['color'],
                            'photos': service_photos
                        }
                        bundle_services.append(service)
                        total_services_price += service['price']
                    
                    # Calculate final price
                    if bundle_data['pricing_option'] == 'fixed':
                        final_price = float(bundle_data['fixed_price']) if bundle_data['fixed_price'] else total_services_price
                    else:  # discount
                        discount_percentage = float(bundle_data['discount_percentage']) if bundle_data['discount_percentage'] else 0
                        discount_amount = total_services_price * (discount_percentage / 100)
                        final_price = total_services_price - discount_amount
                    
                    bundle = {
                        'id': bundle_data['id'],
                        'title': bundle_data['title'],
                        'description': bundle_data['description'],
                        'color': bundle_data['color'],
                        'status': bundle_data['status'],
                        'pricing_option': bundle_data['pricing_option'],
                        'fixed_price': float(bundle_data['fixed_price']) if bundle_data['fixed_price'] else None,
                        'discount_percentage': float(bundle_data['discount_percentage']) if bundle_data['discount_percentage'] else None,
                        'total_services_price': total_services_price,
                        'final_price': final_price,
                        'services': bundle_services,
                        'is_active': bundle_data['is_active'],
                        'created_at': bundle_data['created_at'],
                        'updated_at': bundle_data['updated_at'],
                        'creative_name': user_data.get('name', 'Creative'),
                        'creative_display_name': creative_data.get('display_name'),
                        'creative_title': creative_data.get('title'),
                        'creative_avatar_url': creative_data.get('profile_banner_url')
                    }
                    bundles.append(bundle)
            
            return {"services": services, "bundles": bundles, "total_count": len(services) + len(bundles)}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch connected services and bundles: {str(e)}")
