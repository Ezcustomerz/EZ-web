from fastapi import HTTPException, UploadFile
from db.db_session import db_admin
from schemas.creative import CreativeSetupRequest, CreativeSetupResponse, CreativeClientsListResponse, CreativeClientResponse, CreativeServicesListResponse, CreativeServiceResponse, CreateServiceRequest, CreateServiceResponse, DeleteServiceResponse, UpdateServiceResponse, CreativeProfileSettingsRequest, CreativeProfileSettingsResponse, ProfilePhotoUploadResponse, CreateBundleRequest, CreateBundleResponse, CreativeBundleResponse, CreativeBundlesListResponse, BundleServiceResponse, UpdateBundleRequest, UpdateBundleResponse, DeleteBundleResponse, PublicServicesAndBundlesResponse
from core.validation import validate_contact_field
import re
import uuid
import os
from datetime import datetime

class CreativeController:
    @staticmethod
    async def setup_creative_profile(user_id: str, setup_request: CreativeSetupRequest) -> CreativeSetupResponse:
        """Set up creative profile in the creatives table"""
        try:
            # Get user profile data
            user_result = db_admin.table('users').select('roles, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_data = user_result.data
            user_roles = user_data.get('roles', [])
            
            # If user doesn't have creative role, add it
            if 'creative' not in user_roles:
                user_roles.append('creative')
                # Update user's roles in the database
                update_result = db_admin.table('users').update({'roles': user_roles}).eq('user_id', user_id).execute()
                if not update_result.data:
                    raise HTTPException(status_code=500, detail="Failed to update user roles")
            
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

    @staticmethod
    async def get_creative_profile(user_id: str) -> dict:
        """Get the current user's creative profile"""
        try:
            # Query the creatives table
            result = db_admin.table('creatives').select('*').eq('user_id', user_id).single().execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found")
            
            return result.data
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative profile: {str(e)}")

    @staticmethod
    async def get_creative_clients(user_id: str) -> CreativeClientsListResponse:
        """Get all clients associated with the creative"""
        try:
            # First get the creative_client_relationships for this creative
            relationships_result = db_admin.table('creative_client_relationships').select(
                'id, status, total_spent, projects_count, client_user_id'
            ).eq('creative_user_id', user_id).order('updated_at', desc=True).execute()
            
            if not relationships_result.data:
                return CreativeClientsListResponse(clients=[], total_count=0)
            
            clients = []
            for relationship in relationships_result.data:
                client_user_id = relationship['client_user_id']
                
                # Get client details
                client_result = db_admin.table('clients').select(
                    'display_name, email'
                ).eq('user_id', client_user_id).single().execute()
                
                # Get user details
                user_result = db_admin.table('users').select(
                    'name'
                ).eq('user_id', client_user_id).single().execute()
                
                if not client_result.data or not user_result.data:
                    continue  # Skip if client or user data not found
                
                client_data = client_result.data
                user_data = user_result.data
                
                # Determine contact type and primary contact
                contact = client_data.get('email', '')
                contact_type = 'email'
                
                # If no email, we might need to check for phone in the future
                if not contact:
                    contact = 'No contact info'
                    contact_type = 'email'
                
                # Use display_name if available, otherwise use name
                client_name = client_data.get('display_name') or user_data.get('name', 'Unknown Client')
                
                client = CreativeClientResponse(
                    id=relationship['id'],
                    name=client_name,
                    contact=contact,
                    contactType=contact_type,
                    status=relationship.get('status', 'active'),
                    totalSpent=float(relationship.get('total_spent', 0)),
                    projects=int(relationship.get('projects_count', 0))
                )
                clients.append(client)
            
            return CreativeClientsListResponse(
                clients=clients,
                total_count=len(clients)
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative clients: {str(e)}")

    @staticmethod
    async def get_creative_services(user_id: str) -> CreativeServicesListResponse:
        """Get all services associated with the creative"""
        try:
            # Query the creative_services table for this creative user
            result = db_admin.table('creative_services').select(
                'id, title, description, price, delivery_time, status, color, is_active, created_at, updated_at'
            ).eq('creative_user_id', user_id).eq('is_active', True).order('created_at', desc=True).execute()
            
            if not result.data:
                return CreativeServicesListResponse(services=[], total_count=0)
            
            services = []
            for service_data in result.data:
                service = CreativeServiceResponse(
                    id=service_data['id'],
                    title=service_data['title'],
                    description=service_data['description'],
                    price=float(service_data['price']),
                    delivery_time=service_data['delivery_time'],
                    status=service_data['status'],
                    color=service_data['color'],
                    is_active=service_data['is_active'],
                    created_at=service_data['created_at'],
                    updated_at=service_data['updated_at']
                )
                services.append(service)
            
            return CreativeServicesListResponse(
                services=services,
                total_count=len(services)
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative services: {str(e)}")

    @staticmethod
    async def create_service(user_id: str, service_request: CreateServiceRequest) -> CreateServiceResponse:
        """Create a new service for the creative"""
        try:
            # Validate that the user has a creative profile
            creative_result = db_admin.table('creatives').select('user_id').eq('user_id', user_id).single().execute()
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found. Please complete your creative setup first.")
            
            # Validate price is positive
            if service_request.price <= 0:
                raise HTTPException(status_code=422, detail="Price must be greater than 0")
            
            # Validate status
            if service_request.status not in ['Public', 'Private', 'Bundle-Only']:
                raise HTTPException(status_code=422, detail="Status must be either 'Public', 'Private', or 'Bundle-Only'")
            
            # Prepare service data
            service_data = {
                'creative_user_id': user_id,
                'title': service_request.title.strip(),
                'description': service_request.description.strip(),
                'price': service_request.price,
                'delivery_time': service_request.delivery_time,
                'status': service_request.status,
                'color': service_request.color,
                'is_active': True
            }
            
            # Insert the service
            result = db_admin.table('creative_services').insert(service_data).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create service")
            
            service_id = result.data[0]['id']
            
            # Handle calendar settings if provided
            if service_request.calendar_settings:
                await CreativeController._save_calendar_settings(service_id, service_request.calendar_settings)
            
            return CreateServiceResponse(
                success=True,
                message="Service created successfully",
                service_id=service_id
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create service: {str(e)}")

    @staticmethod
    async def _save_calendar_settings(service_id: str, calendar_settings):
        """Save calendar settings for a service"""
        try:
            # First, delete existing calendar settings for this service
            db_admin.table('calendar_settings').delete().eq('service_id', service_id).execute()
            
            # Insert new calendar settings
            calendar_data = {
                'service_id': service_id,
                'is_scheduling_enabled': calendar_settings.is_scheduling_enabled,
                'use_time_slots': calendar_settings.use_time_slots,
                'session_durations': calendar_settings.session_durations,
                'default_session_length': calendar_settings.default_session_length,
                'min_notice_amount': calendar_settings.min_notice_amount,
                'min_notice_unit': calendar_settings.min_notice_unit,
                'max_advance_amount': calendar_settings.max_advance_amount,
                'max_advance_unit': calendar_settings.max_advance_unit,
                'buffer_time_amount': calendar_settings.buffer_time_amount,
                'buffer_time_unit': calendar_settings.buffer_time_unit,
                'is_active': True
            }
            
            calendar_result = db_admin.table('calendar_settings').insert(calendar_data).execute()
            if not calendar_result.data:
                raise HTTPException(status_code=500, detail="Failed to save calendar settings")
            
            calendar_setting_id = calendar_result.data[0]['id']
            
            # Save weekly schedule
            for day_schedule in calendar_settings.weekly_schedule:
                if day_schedule.enabled:  # Only save enabled days
                    # Insert weekly schedule entry
                    weekly_data = {
                        'calendar_setting_id': calendar_setting_id,
                        'day_of_week': day_schedule.day,
                        'is_enabled': day_schedule.enabled
                    }
                    
                    weekly_result = db_admin.table('weekly_schedule').insert(weekly_data).execute()
                    if not weekly_result.data:
                        continue  # Skip this day if insertion fails
                    
                    weekly_schedule_id = weekly_result.data[0]['id']
                    
                    # Save time blocks
                    if day_schedule.time_blocks:
                        time_blocks_data = []
                        for block in day_schedule.time_blocks:
                            time_blocks_data.append({
                                'weekly_schedule_id': weekly_schedule_id,
                                'start_time': block.start,
                                'end_time': block.end
                            })
                        
                        if time_blocks_data:
                            db_admin.table('time_blocks').insert(time_blocks_data).execute()
                    
                    # Save time slots (if using time slot mode)
                    if calendar_settings.use_time_slots and day_schedule.time_slots:
                        time_slots_data = []
                        for slot in day_schedule.time_slots:
                            time_slots_data.append({
                                'weekly_schedule_id': weekly_schedule_id,
                                'slot_time': slot.time,
                                'is_enabled': slot.enabled
                            })
                        
                        if time_slots_data:
                            db_admin.table('time_slots').insert(time_slots_data).execute()
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save calendar settings: {str(e)}")

    @staticmethod
    async def get_calendar_settings(service_id: str, user_id: str):
        """Get active calendar settings for a service"""
        try:
            # Verify service exists and belongs to user
            service_result = db_admin.table('creative_services').select(
                'id, creative_user_id, is_active'
            ).eq('id', service_id).single().execute()
            
            if not service_result.data:
                raise HTTPException(status_code=404, detail="Service not found")
            
            if service_result.data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to view this service")
            
            if not service_result.data['is_active']:
                raise HTTPException(status_code=400, detail="Cannot access calendar settings for deleted service")
            
            # Get calendar settings
            calendar_result = db_admin.table('calendar_settings').select(
                '*'
            ).eq('service_id', service_id).eq('is_active', True).execute()
            
            if not calendar_result.data:
                return None  # No calendar settings configured
            
            calendar_data = calendar_result.data[0]
            calendar_setting_id = calendar_data['id']
            
            # Get weekly schedule with time blocks and time slots
            weekly_result = db_admin.table('weekly_schedule').select(
                '*, time_blocks(*), time_slots(*)'
            ).eq('calendar_setting_id', calendar_setting_id).execute()
            
            calendar_data['weekly_schedule'] = weekly_result.data if weekly_result.data else []
            
            return calendar_data
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get calendar settings: {str(e)}")

    @staticmethod
    async def delete_service(user_id: str, service_id: str) -> DeleteServiceResponse:
        """Soft delete a service by setting is_active to False"""
        try:
            # First, verify the service exists and belongs to the user
            service_result = db_admin.table('creative_services').select(
                'id, creative_user_id, is_active, title'
            ).eq('id', service_id).single().execute()
            
            if not service_result.data:
                raise HTTPException(status_code=404, detail="Service not found")
            
            service_data = service_result.data
            
            # Check if the service belongs to the current user
            if service_data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to delete this service")
            
            # Check if service is already deleted
            if not service_data['is_active']:
                raise HTTPException(status_code=400, detail="Service is already deleted")
            
            # Soft delete by setting is_active to False and updating timestamp
            result = db_admin.table('creative_services').update({
                'is_active': False,
                'updated_at': 'now()'
            }).eq('id', service_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to delete service")
            
            # Also deactivate calendar settings for this service
            db_admin.table('calendar_settings').update({
                'is_active': False,
                'updated_at': 'now()'
            }).eq('service_id', service_id).execute()
            
            return DeleteServiceResponse(
                success=True,
                message=f"Service '{service_data['title']}' has been deleted successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete service: {str(e)}")

    @staticmethod
    async def update_service(user_id: str, service_id: str, service_request: CreateServiceRequest) -> UpdateServiceResponse:
        """Update an existing service (same fields as create)."""
        try:
            # Verify the service exists and belongs to the user
            service_result = db_admin.table('creative_services').select(
                'id, creative_user_id, is_active'
            ).eq('id', service_id).single().execute()

            if not service_result.data:
                raise HTTPException(status_code=404, detail="Service not found")

            if service_result.data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to edit this service")

            if not service_result.data['is_active']:
                raise HTTPException(status_code=400, detail="Cannot edit a deleted service")

            if service_request.price <= 0:
                raise HTTPException(status_code=422, detail="Price must be greater than 0")

            if service_request.status not in ['Public', 'Private', 'Bundle-Only']:
                raise HTTPException(status_code=422, detail="Status must be either 'Public', 'Private', or 'Bundle-Only'")

            update_data = {
                'title': service_request.title.strip(),
                'description': service_request.description.strip(),
                'price': service_request.price,
                'delivery_time': service_request.delivery_time,
                'status': service_request.status,
                'color': service_request.color,
                'updated_at': 'now()'
            }

            result = db_admin.table('creative_services').update(update_data).eq('id', service_id).execute()
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to update service")

            # Handle calendar settings if provided
            if service_request.calendar_settings:
                await CreativeController._save_calendar_settings(service_id, service_request.calendar_settings)

            return UpdateServiceResponse(success=True, message="Service updated successfully")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update service: {str(e)}")

    @staticmethod
    async def update_profile_settings(user_id: str, settings_request: CreativeProfileSettingsRequest) -> CreativeProfileSettingsResponse:
        """Update creative profile settings including highlights, service display, and avatar settings"""
        try:
            # Validate contact fields if provided
            validation_errors = []
            
            if settings_request.primary_contact:
                is_valid, field_type = validate_contact_field(settings_request.primary_contact)
                if not is_valid:
                    if field_type == 'invalid_email':
                        validation_errors.append("Primary contact: Invalid email format")
                    elif field_type == 'invalid_format':
                        validation_errors.append("Primary contact: Must be a valid email address or phone number")
            
            if settings_request.secondary_contact:
                is_valid, field_type = validate_contact_field(settings_request.secondary_contact)
                if not is_valid:
                    if field_type == 'invalid_email':
                        validation_errors.append("Secondary contact: Invalid email format")
                    elif field_type == 'invalid_format':
                        validation_errors.append("Secondary contact: Must be a valid email address or phone number")
            
            # Validate avatar background color format if provided
            if settings_request.avatar_background_color:
                if not re.match(r'^#[0-9A-Fa-f]{6}$', settings_request.avatar_background_color):
                    validation_errors.append("Avatar background color: Must be a valid hex color (e.g., #3B82F6)")
            
            # Validate service/bundle IDs if provided
            if settings_request.primary_service_id:
                # Check if it's a service or bundle that exists and belongs to the user
                service_exists = False
                bundle_exists = False
                
                # Check services
                try:
                    service_result = db_admin.table('creative_services').select('id').eq('id', settings_request.primary_service_id).eq('creative_user_id', user_id).eq('is_active', True).execute()
                    service_exists = service_result.data and len(service_result.data) > 0
                except Exception as e:
                    print(f"Service validation error: {e}")
                    service_exists = False
                
                # Check bundles
                try:
                    bundle_result = db_admin.table('creative_bundles').select('id').eq('id', settings_request.primary_service_id).eq('creative_user_id', user_id).eq('is_active', True).execute()
                    bundle_exists = bundle_result.data and len(bundle_result.data) > 0
                except Exception as e:
                    print(f"Bundle validation error: {e}")
                    bundle_exists = False
                
                if not service_exists and not bundle_exists:
                    validation_errors.append("Primary service: Service or bundle not found or doesn't belong to you")
            
            if settings_request.secondary_service_id:
                # Check if it's a service or bundle that exists and belongs to the user
                service_exists = False
                bundle_exists = False
                
                # Check services
                try:
                    service_result = db_admin.table('creative_services').select('id').eq('id', settings_request.secondary_service_id).eq('creative_user_id', user_id).eq('is_active', True).execute()
                    service_exists = service_result.data and len(service_result.data) > 0
                except Exception as e:
                    print(f"Service validation error: {e}")
                    service_exists = False
                
                # Check bundles
                try:
                    bundle_result = db_admin.table('creative_bundles').select('id').eq('id', settings_request.secondary_service_id).eq('creative_user_id', user_id).eq('is_active', True).execute()
                    bundle_exists = bundle_result.data and len(bundle_result.data) > 0
                except Exception as e:
                    print(f"Bundle validation error: {e}")
                    bundle_exists = False
                
                if not service_exists and not bundle_exists:
                    validation_errors.append("Secondary service: Service or bundle not found or doesn't belong to you")
            
            # Check if primary and secondary services are different
            if (settings_request.primary_service_id and settings_request.secondary_service_id and 
                settings_request.primary_service_id == settings_request.secondary_service_id):
                validation_errors.append("Primary and secondary services must be different")
            
            # If there are validation errors, return them
            if validation_errors:
                raise HTTPException(status_code=422, detail="; ".join(validation_errors))
            
            # Prepare update data - only include fields that are provided
            update_data = {}

            if settings_request.display_name is not None:
                # Validate display name length
                if len(settings_request.display_name) > 100:
                    raise HTTPException(status_code=422, detail="Display name must be 100 characters or less")
                update_data['display_name'] = settings_request.display_name

            if settings_request.title is not None:
                # If custom_title is provided, use it as the title instead of the selected title
                if settings_request.custom_title:
                    update_data['title'] = settings_request.custom_title
                else:
                    update_data['title'] = settings_request.title
            
            if settings_request.availability_location is not None:
                update_data['availability_location'] = settings_request.availability_location
            
            if settings_request.primary_contact is not None:
                update_data['primary_contact'] = settings_request.primary_contact
            
            if settings_request.secondary_contact is not None:
                update_data['secondary_contact'] = settings_request.secondary_contact
            
            if settings_request.description is not None:
                # Validate description length
                if len(settings_request.description) > 500:
                    raise HTTPException(status_code=422, detail="Description must be 500 characters or less")
                update_data['description'] = settings_request.description
            
            if settings_request.selected_profile_highlights is not None:
                update_data['profile_highlights'] = settings_request.selected_profile_highlights
            
            if settings_request.profile_highlight_values is not None:
                update_data['profile_highlight_values'] = settings_request.profile_highlight_values
            
            if settings_request.primary_service_id is not None:
                update_data['primary_service_id'] = settings_request.primary_service_id
            
            if settings_request.secondary_service_id is not None:
                update_data['secondary_service_id'] = settings_request.secondary_service_id
            
            if settings_request.avatar_background_color is not None:
                update_data['avatar_background_color'] = settings_request.avatar_background_color
            
            # Check if creative profile exists, if not create it
            try:
                existing_profile = db_admin.table('creatives').select('user_id').eq('user_id', user_id).execute()
                profile_exists = existing_profile.data and len(existing_profile.data) > 0
            except:
                profile_exists = False
            
            if not profile_exists:
                # Create new creative profile with the update data
                create_data = {
                    'user_id': user_id,
                    **update_data
                }
                try:
                    result = db_admin.table('creatives').insert(create_data).execute()
                    if not result.data:
                        raise HTTPException(status_code=500, detail="Failed to create creative profile")
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to create creative profile: {str(e)}")
            else:
                # Update existing creative profile
                try:
                    result = db_admin.table('creatives').update(update_data).eq('user_id', user_id).execute()
                    if not result.data:
                        raise HTTPException(status_code=404, detail="Creative profile not found")
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to update creative profile: {str(e)}")
            
            return CreativeProfileSettingsResponse(
                success=True,
                message="Profile settings updated successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update profile settings: {str(e)}")

    @staticmethod
    async def upload_profile_photo(user_id: str, file: UploadFile) -> ProfilePhotoUploadResponse:
        """Upload a profile photo for the creative"""
        try:
            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="File must be an image")
            
            # Validate file size (5MB limit)
            file_size = 0
            content = await file.read()
            file_size = len(content)
            if file_size > 5 * 1024 * 1024:  # 5MB
                raise HTTPException(status_code=400, detail="File size must be less than 5MB")
            
            # Get current profile to find old photo URL
            current_profile = db_admin.table('creatives').select('profile_banner_url').eq('user_id', user_id).single().execute()
            old_photo_url = None
            if current_profile.data and current_profile.data.get('profile_banner_url'):
                old_photo_url = current_profile.data['profile_banner_url']
            
            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
            unique_filename = f"{user_id}_{uuid.uuid4().hex}.{file_extension}"
            
            # Upload to Supabase storage
            bucket_name = "profile-photos"
            file_path = f"creatives/{unique_filename}"
            
            # Upload the new file
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
            
            # Update the creative profile with the new photo URL
            update_result = db_admin.table('creatives').update({
                'profile_banner_url': public_url,
                'profile_source': 'custom'
            }).eq('user_id', user_id).execute()
            
            if not update_result.data:
                raise HTTPException(status_code=500, detail="Failed to update profile with new photo URL")
            
            # Delete the old profile photo if it exists and is from our storage bucket
            if old_photo_url and 'profile-photos' in old_photo_url:
                try:
                    # Clean the URL - remove any query parameters or fragments
                    clean_url = old_photo_url.split('?')[0].split('#')[0]
                    
                    # Extract the file path from the old URL
                    # URL format: https://project.supabase.co/storage/v1/object/public/profile-photos/creatives/filename
                    old_file_path = clean_url.split('/profile-photos/')[-1]
                    
                    if old_file_path.startswith('creatives/'):
                        # Only delete files from our creatives folder for safety
                        try:
                            db_admin.storage.from_(bucket_name).remove([old_file_path])
                        except Exception as delete_error:
                            # Don't fail the upload if deletion fails, just log it
                            print(f"Warning: Failed to delete old profile photo: {str(delete_error)}")
                except Exception as delete_error:
                    # Don't fail the upload if deletion fails, just log it
                    print(f"Warning: Failed to delete old profile photo: {str(delete_error)}")
            
            return ProfilePhotoUploadResponse(
                success=True,
                message="Profile photo uploaded successfully",
                profile_banner_url=public_url
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload profile photo: {str(e)}")

    @staticmethod
    async def create_bundle(user_id: str, bundle_request: CreateBundleRequest) -> CreateBundleResponse:
        """Create a new bundle for the creative"""
        try:
            # Validate that the user has a creative profile
            creative_result = db_admin.table('creatives').select('user_id').eq('user_id', user_id).single().execute()
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found. Please complete your creative setup first.")
            
            # Validate that all services exist and belong to the user
            if not bundle_request.service_ids or len(bundle_request.service_ids) < 2:
                raise HTTPException(status_code=422, detail="Bundle must contain at least 2 services")
            
            # Check that all services exist and belong to the user
            services_result = db_admin.table('creative_services').select(
                'id, title, price, status'
            ).eq('creative_user_id', user_id).eq('is_active', True).in_('id', bundle_request.service_ids).execute()
            
            if not services_result.data or len(services_result.data) != len(bundle_request.service_ids):
                raise HTTPException(status_code=422, detail="One or more services not found or don't belong to you")
            
            # Validate that all services are either Public or Bundle-Only
            for service in services_result.data:
                if service['status'] not in ['Public', 'Bundle-Only']:
                    raise HTTPException(status_code=422, detail=f"Service '{service['title']}' cannot be included in bundles (must be Public or Bundle-Only)")
            
            # Calculate total services price
            total_services_price = sum(float(service['price']) for service in services_result.data)
            
            # Calculate final price based on pricing option
            if bundle_request.pricing_option == 'fixed':
                if bundle_request.fixed_price is None or bundle_request.fixed_price <= 0:
                    raise HTTPException(status_code=422, detail="Fixed price must be greater than 0")
                final_price = bundle_request.fixed_price
            else:  # discount
                if bundle_request.discount_percentage is None or bundle_request.discount_percentage < 0 or bundle_request.discount_percentage > 100:
                    raise HTTPException(status_code=422, detail="Discount percentage must be between 0 and 100")
                discount_amount = total_services_price * (bundle_request.discount_percentage / 100)
                final_price = total_services_price - discount_amount
            
            # Prepare bundle data
            bundle_data = {
                'creative_user_id': user_id,
                'title': bundle_request.title.strip(),
                'description': bundle_request.description.strip(),
                'color': bundle_request.color,
                'status': bundle_request.status,
                'pricing_option': bundle_request.pricing_option,
                'fixed_price': bundle_request.fixed_price,
                'discount_percentage': bundle_request.discount_percentage,
                'is_active': True
            }
            
            # Insert the bundle
            bundle_result = db_admin.table('creative_bundles').insert(bundle_data).execute()
            
            if not bundle_result.data:
                raise HTTPException(status_code=500, detail="Failed to create bundle")
            
            bundle_id = bundle_result.data[0]['id']
            
            # Insert bundle-service relationships
            bundle_services_data = [
                {'bundle_id': bundle_id, 'service_id': service_id}
                for service_id in bundle_request.service_ids
            ]
            
            bundle_services_result = db_admin.table('bundle_services').insert(bundle_services_data).execute()
            
            if not bundle_services_result.data:
                # If bundle services insertion fails, clean up the bundle
                db_admin.table('creative_bundles').delete().eq('id', bundle_id).execute()
                raise HTTPException(status_code=500, detail="Failed to associate services with bundle")
            
            return CreateBundleResponse(
                success=True,
                message="Bundle created successfully",
                bundle_id=bundle_id
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create bundle: {str(e)}")

    @staticmethod
    async def get_creative_bundles(user_id: str) -> CreativeBundlesListResponse:
        """Get all bundles associated with the creative"""
        try:
            # Query the creative_bundles table for this creative user
            bundles_result = db_admin.table('creative_bundles').select(
                'id, title, description, color, status, pricing_option, fixed_price, discount_percentage, is_active, created_at, updated_at'
            ).eq('creative_user_id', user_id).eq('is_active', True).order('created_at', desc=True).execute()
            
            if not bundles_result.data:
                return CreativeBundlesListResponse(bundles=[], total_count=0)
            
            bundles = []
            for bundle_data in bundles_result.data:
                # Get services for this bundle
                bundle_services_result = db_admin.table('bundle_services').select(
                    'service_id'
                ).eq('bundle_id', bundle_data['id']).execute()
                
                service_ids = [bs['service_id'] for bs in bundle_services_result.data] if bundle_services_result.data else []
                
                # Get service details
                services_result = db_admin.table('creative_services').select(
                    'id, title, description, price, delivery_time, status, color'
                ).in_('id', service_ids).execute()
                
                services = []
                total_services_price = 0
                for service_data in services_result.data:
                    service = BundleServiceResponse(
                        id=service_data['id'],
                        title=service_data['title'],
                        description=service_data['description'],
                        price=float(service_data['price']),
                        delivery_time=service_data['delivery_time'],
                        status=service_data['status'],
                        color=service_data['color']
                    )
                    services.append(service)
                    total_services_price += service.price
                
                # Calculate final price
                if bundle_data['pricing_option'] == 'fixed':
                    final_price = float(bundle_data['fixed_price']) if bundle_data['fixed_price'] else total_services_price
                else:  # discount
                    discount_percentage = float(bundle_data['discount_percentage']) if bundle_data['discount_percentage'] else 0
                    discount_amount = total_services_price * (discount_percentage / 100)
                    final_price = total_services_price - discount_amount
                
                bundle = CreativeBundleResponse(
                    id=bundle_data['id'],
                    title=bundle_data['title'],
                    description=bundle_data['description'],
                    color=bundle_data['color'],
                    status=bundle_data['status'],
                    pricing_option=bundle_data['pricing_option'],
                    fixed_price=float(bundle_data['fixed_price']) if bundle_data['fixed_price'] else None,
                    discount_percentage=float(bundle_data['discount_percentage']) if bundle_data['discount_percentage'] else None,
                    total_services_price=total_services_price,
                    final_price=final_price,
                    services=services,
                    is_active=bundle_data['is_active'],
                    created_at=bundle_data['created_at'],
                    updated_at=bundle_data['updated_at']
                )
                bundles.append(bundle)
            
            return CreativeBundlesListResponse(
                bundles=bundles,
                total_count=len(bundles)
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative bundles: {str(e)}")

    @staticmethod
    async def get_creative_services_and_bundles(user_id: str) -> PublicServicesAndBundlesResponse:
        """Get all services and bundles associated with the creative"""
        try:
            # Get services
            services_result = db_admin.table('creative_services').select(
                'id, title, description, price, delivery_time, status, color, is_active, created_at, updated_at'
            ).eq('creative_user_id', user_id).eq('is_active', True).order('created_at', desc=True).execute()
            
            services = []
            if services_result.data:
                for service_data in services_result.data:
                    service = CreativeServiceResponse(
                        id=service_data['id'],
                        title=service_data['title'],
                        description=service_data['description'],
                        price=float(service_data['price']),
                        delivery_time=service_data['delivery_time'],
                        status=service_data['status'],
                        color=service_data['color'],
                        is_active=service_data['is_active'],
                        created_at=service_data['created_at'],
                        updated_at=service_data['updated_at']
                    )
                    services.append(service)
            
            # Get bundles
            bundles_result = db_admin.table('creative_bundles').select(
                'id, title, description, color, status, pricing_option, fixed_price, discount_percentage, is_active, created_at, updated_at'
            ).eq('creative_user_id', user_id).eq('is_active', True).order('created_at', desc=True).execute()
            
            bundles = []
            if bundles_result.data:
                for bundle_data in bundles_result.data:
                    # Get services for this bundle
                    bundle_services_result = db_admin.table('bundle_services').select(
                        'service_id'
                    ).eq('bundle_id', bundle_data['id']).execute()
                    
                    service_ids = [bs['service_id'] for bs in bundle_services_result.data] if bundle_services_result.data else []
                    
                    # Get service details
                    services_result = db_admin.table('creative_services').select(
                        'id, title, description, price, delivery_time, status, color'
                    ).in_('id', service_ids).execute()
                    
                    bundle_services = []
                    total_services_price = 0
                    for service_data in services_result.data:
                        service = BundleServiceResponse(
                            id=service_data['id'],
                            title=service_data['title'],
                            description=service_data['description'],
                            price=float(service_data['price']),
                            delivery_time=service_data['delivery_time'],
                            status=service_data['status'],
                            color=service_data['color']
                        )
                        bundle_services.append(service)
                        total_services_price += service.price
                    
                    # Calculate final price
                    if bundle_data['pricing_option'] == 'fixed':
                        final_price = float(bundle_data['fixed_price']) if bundle_data['fixed_price'] else total_services_price
                    else:  # discount
                        discount_percentage = float(bundle_data['discount_percentage']) if bundle_data['discount_percentage'] else 0
                        discount_amount = total_services_price * (discount_percentage / 100)
                        final_price = total_services_price - discount_amount
                    
                    bundle = CreativeBundleResponse(
                        id=bundle_data['id'],
                        title=bundle_data['title'],
                        description=bundle_data['description'],
                        color=bundle_data['color'],
                        status=bundle_data['status'],
                        pricing_option=bundle_data['pricing_option'],
                        fixed_price=float(bundle_data['fixed_price']) if bundle_data['fixed_price'] else None,
                        discount_percentage=float(bundle_data['discount_percentage']) if bundle_data['discount_percentage'] else None,
                        total_services_price=total_services_price,
                        final_price=final_price,
                        services=bundle_services,
                        is_active=bundle_data['is_active'],
                        created_at=bundle_data['created_at'],
                        updated_at=bundle_data['updated_at']
                    )
                    bundles.append(bundle)
            
            return PublicServicesAndBundlesResponse(
                services=services,
                bundles=bundles,
                services_count=len(services),
                bundles_count=len(bundles)
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative services and bundles: {str(e)}")

    @staticmethod
    async def update_bundle(user_id: str, bundle_id: str, bundle_request: UpdateBundleRequest) -> UpdateBundleResponse:
        """Update an existing bundle"""
        try:
            # Verify the bundle exists and belongs to the user
            bundle_result = db_admin.table('creative_bundles').select(
                'id, creative_user_id, is_active'
            ).eq('id', bundle_id).single().execute()

            if not bundle_result.data:
                raise HTTPException(status_code=404, detail="Bundle not found")

            if bundle_result.data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to edit this bundle")

            if not bundle_result.data['is_active']:
                raise HTTPException(status_code=400, detail="Cannot edit a deleted bundle")

            # Prepare update data - only include fields that are provided
            update_data = {}

            if bundle_request.title is not None:
                update_data['title'] = bundle_request.title.strip()

            if bundle_request.description is not None:
                update_data['description'] = bundle_request.description.strip()

            if bundle_request.color is not None:
                update_data['color'] = bundle_request.color

            if bundle_request.status is not None:
                update_data['status'] = bundle_request.status

            if bundle_request.pricing_option is not None:
                update_data['pricing_option'] = bundle_request.pricing_option

            if bundle_request.fixed_price is not None:
                update_data['fixed_price'] = bundle_request.fixed_price

            if bundle_request.discount_percentage is not None:
                update_data['discount_percentage'] = bundle_request.discount_percentage

            # If service_ids are provided, validate and update them
            if bundle_request.service_ids is not None:
                if len(bundle_request.service_ids) < 2:
                    raise HTTPException(status_code=422, detail="Bundle must contain at least 2 services")

                # Check that all services exist and belong to the user
                services_result = db_admin.table('creative_services').select(
                    'id, title, price, status'
                ).eq('creative_user_id', user_id).eq('is_active', True).in_('id', bundle_request.service_ids).execute()

                if not services_result.data or len(services_result.data) != len(bundle_request.service_ids):
                    raise HTTPException(status_code=422, detail="One or more services not found or don't belong to you")

                # Validate that all services are either Public or Bundle-Only
                for service in services_result.data:
                    if service['status'] not in ['Public', 'Bundle-Only']:
                        raise HTTPException(status_code=422, detail=f"Service '{service['title']}' cannot be included in bundles (must be Public or Bundle-Only)")

            # Update the bundle
            if update_data:
                update_data['updated_at'] = 'now()'
                result = db_admin.table('creative_bundles').update(update_data).eq('id', bundle_id).execute()
                if not result.data:
                    raise HTTPException(status_code=500, detail="Failed to update bundle")

            # Update bundle-service relationships if service_ids are provided
            if bundle_request.service_ids is not None:
                # Delete existing bundle-service relationships
                db_admin.table('bundle_services').delete().eq('bundle_id', bundle_id).execute()

                # Insert new bundle-service relationships
                bundle_services_data = [
                    {'bundle_id': bundle_id, 'service_id': service_id}
                    for service_id in bundle_request.service_ids
                ]

                bundle_services_result = db_admin.table('bundle_services').insert(bundle_services_data).execute()

                if not bundle_services_result.data:
                    raise HTTPException(status_code=500, detail="Failed to update bundle services")

            return UpdateBundleResponse(success=True, message="Bundle updated successfully")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update bundle: {str(e)}")

    @staticmethod
    async def delete_bundle(user_id: str, bundle_id: str) -> DeleteBundleResponse:
        """Soft delete a bundle by setting is_active to False"""
        try:
            # First, verify the bundle exists and belongs to the user
            bundle_result = db_admin.table('creative_bundles').select(
                'id, creative_user_id, is_active, title'
            ).eq('id', bundle_id).single().execute()
            
            if not bundle_result.data:
                raise HTTPException(status_code=404, detail="Bundle not found")
            
            bundle_data = bundle_result.data
            
            # Check if the bundle belongs to the current user
            if bundle_data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to delete this bundle")
            
            # Check if bundle is already deleted
            if not bundle_data['is_active']:
                raise HTTPException(status_code=400, detail="Bundle is already deleted")
            
            # Soft delete by setting is_active to False and updating timestamp
            result = db_admin.table('creative_bundles').update({
                'is_active': False,
                'updated_at': 'now()'
            }).eq('id', bundle_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to delete bundle")
            
            return DeleteBundleResponse(
                success=True,
                message=f"Bundle '{bundle_data['title']}' has been deleted successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete bundle: {str(e)}")

    @staticmethod
    async def get_public_creative_services_and_bundles(user_id: str) -> dict:
        """Get all public services and bundles for a creative (for public viewing)"""
        try:
            # Get public services
            services_result = db_admin.table('creative_services').select(
                'id, title, description, price, delivery_time, status, color, is_active, created_at, updated_at'
            ).eq('creative_user_id', user_id).eq('is_active', True).eq('status', 'Public').order('created_at', desc=True).execute()
            
            services = []
            if services_result.data:
                for service_data in services_result.data:
                    service = CreativeServiceResponse(
                        id=service_data['id'],
                        title=service_data['title'],
                        description=service_data['description'],
                        price=float(service_data['price']),
                        delivery_time=service_data['delivery_time'],
                        status=service_data['status'],
                        color=service_data['color'],
                        is_active=service_data['is_active'],
                        created_at=service_data['created_at'],
                        updated_at=service_data['updated_at']
                    )
                    services.append(service)
            
            # Get public bundles
            bundles_result = db_admin.table('creative_bundles').select(
                'id, title, description, color, status, pricing_option, fixed_price, discount_percentage, is_active, created_at, updated_at'
            ).eq('creative_user_id', user_id).eq('is_active', True).eq('status', 'Public').order('created_at', desc=True).execute()
            
            bundles = []
            if bundles_result.data:
                for bundle_data in bundles_result.data:
                    # Get services for this bundle
                    bundle_services_result = db_admin.table('bundle_services').select(
                        'service_id'
                    ).eq('bundle_id', bundle_data['id']).execute()
                    
                    service_ids = [bs['service_id'] for bs in bundle_services_result.data] if bundle_services_result.data else []
                    
                    # Get service details
                    services_result = db_admin.table('creative_services').select(
                        'id, title, description, price, delivery_time, status, color'
                    ).in_('id', service_ids).execute()
                    
                    bundle_services = []
                    total_services_price = 0
                    for service_data in services_result.data:
                        service = BundleServiceResponse(
                            id=service_data['id'],
                            title=service_data['title'],
                            description=service_data['description'],
                            price=float(service_data['price']),
                            delivery_time=service_data['delivery_time'],
                            status=service_data['status'],
                            color=service_data['color']
                        )
                        bundle_services.append(service)
                        total_services_price += service.price
                    
                    # Calculate final price
                    if bundle_data['pricing_option'] == 'fixed':
                        final_price = float(bundle_data['fixed_price']) if bundle_data['fixed_price'] else total_services_price
                    else:  # discount
                        discount_percentage = float(bundle_data['discount_percentage']) if bundle_data['discount_percentage'] else 0
                        discount_amount = total_services_price * (discount_percentage / 100)
                        final_price = total_services_price - discount_amount
                    
                    bundle = CreativeBundleResponse(
                        id=bundle_data['id'],
                        title=bundle_data['title'],
                        description=bundle_data['description'],
                        color=bundle_data['color'],
                        status=bundle_data['status'],
                        pricing_option=bundle_data['pricing_option'],
                        fixed_price=float(bundle_data['fixed_price']) if bundle_data['fixed_price'] else None,
                        discount_percentage=float(bundle_data['discount_percentage']) if bundle_data['discount_percentage'] else None,
                        total_services_price=total_services_price,
                        final_price=final_price,
                        services=bundle_services,
                        is_active=bundle_data['is_active'],
                        created_at=bundle_data['created_at'],
                        updated_at=bundle_data['updated_at']
                    )
                    bundles.append(bundle)
            
            return {
                'services': services,
                'bundles': bundles,
                'services_count': len(services),
                'bundles_count': len(bundles)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch public services and bundles: {str(e)}")
