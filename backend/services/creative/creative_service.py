from fastapi import HTTPException, UploadFile
from db.db_session import db_admin
from schemas.creative import CreativeSetupRequest, CreativeSetupResponse, CreativeClientsListResponse, CreativeClientResponse, CreativeServicesListResponse, CreativeServiceResponse, CreateServiceRequest, CreateServiceResponse, DeleteServiceResponse, UpdateServiceResponse, CreativeProfileSettingsRequest, CreativeProfileSettingsResponse, ProfilePhotoUploadResponse, CreateBundleRequest, CreateBundleResponse, CreativeBundleResponse, CreativeBundlesListResponse, BundleServiceResponse, UpdateBundleRequest, UpdateBundleResponse, DeleteBundleResponse, PublicServicesAndBundlesResponse, CalendarSettingsRequest
from core.validation import validate_contact_field
import re
import uuid
import os
from datetime import datetime
from fastapi import Request
from core.timezone_utils import (
    convert_time_blocks_to_utc, 
    convert_time_slots_to_utc,
    convert_time_blocks_from_utc,
    convert_time_slots_from_utc,
    get_user_timezone_from_request
)

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
        """Get all clients associated with the creative - optimized with batch queries"""
        try:
            # Get creative_client_relationships for this creative
            relationships_result = db_admin.table('creative_client_relationships').select(
                'id, status, total_spent, projects_count, client_user_id'
            ).eq('creative_user_id', user_id).order('updated_at', desc=True).execute()
            
            if not relationships_result.data:
                return CreativeClientsListResponse(clients=[], total_count=0)
            
            client_user_ids = [rel['client_user_id'] for rel in relationships_result.data]
            
            # Batch fetch client and user data to avoid N+1 queries
            clients_result = db_admin.table('clients').select(
                'user_id, display_name, email'
            ).in_('user_id', client_user_ids).execute()
            
            users_result = db_admin.table('users').select(
                'user_id, name'
            ).in_('user_id', client_user_ids).execute()
            
            # Create lookup maps
            client_data_map = {c['user_id']: c for c in clients_result.data}
            user_data_map = {u['user_id']: u for u in users_result.data}
            
            clients = []
            for relationship in relationships_result.data:
                client_user_id = relationship['client_user_id']
                
                client_data = client_data_map.get(client_user_id)
                user_data = user_data_map.get(client_user_id)
                
                if not client_data or not user_data:
                    continue  # Skip if client or user data not found
                
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
                    status=relationship.get('status', 'inactive'),
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
                'id, title, description, price, delivery_time, status, color, is_active, created_at, updated_at, requires_booking, is_time_slot_booking'
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
                    updated_at=service_data['updated_at'],
                    requires_booking=service_data['requires_booking'],
                    is_time_slot_booking=service_data.get('is_time_slot_booking')
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
    async def create_service(user_id: str, service_request: CreateServiceRequest, request: Request = None) -> CreateServiceResponse:
        """Create a new service for the creative"""
        try:
            # Validate that the user has a creative profile
            creative_result = db_admin.table('creatives').select('user_id').eq('user_id', user_id).single().execute()
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found. Please complete your creative setup first.")
            
            # Validate price is non-negative (allow free services at $0)
            if service_request.price < 0:
                raise HTTPException(status_code=422, detail="Price cannot be negative")
            
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
                'payment_option': service_request.payment_option,
                'is_active': True,
                'requires_booking': service_request.calendar_settings is not None,
                'is_time_slot_booking': service_request.calendar_settings.use_time_slots if service_request.calendar_settings else None
            }
            
            # Insert the service
            result = db_admin.table('creative_services').insert(service_data).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create service")
            
            service_id = result.data[0]['id']
            
            # Handle calendar settings if provided
            if service_request.calendar_settings:
                await CreativeController._save_calendar_settings(service_id, service_request.calendar_settings, request)
            
            # Handle photos if provided
            if service_request.photos:
                await CreativeController._save_service_photos(service_id, service_request.photos)
            
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
    async def create_service_with_photos(user_id: str, request) -> CreateServiceResponse:
        """Create a new service with photos in a single request"""
        try:
            # Parse multipart form data
            form = await request.form()
            
            # Extract service data
            title = form.get('title', '').strip()
            description = form.get('description', '').strip()
            price = float(form.get('price', 0))
            delivery_time = form.get('delivery_time', '').strip()
            status = form.get('status', 'Private')
            color = form.get('color', '#3b82f6')
            payment_option = form.get('payment_option', 'later')
            
            # Extract calendar settings if provided
            calendar_settings = None
            calendar_settings_json = form.get('calendar_settings')
            if calendar_settings_json:
                try:
                    import json
                    calendar_data = json.loads(calendar_settings_json)
                    calendar_settings = CalendarSettingsRequest(**calendar_data)
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Warning: Failed to parse calendar settings: {e}")
                    calendar_settings = None
            
            # Validate that the user has a creative profile
            creative_result = db_admin.table('creatives').select('user_id').eq('user_id', user_id).single().execute()
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found. Please complete your creative setup first.")
            
            # Validate price is positive
            if price <= 0:
                raise HTTPException(status_code=422, detail="Price must be greater than 0")
            
            # Validate status
            if status not in ['Public', 'Private', 'Bundle-Only']:
                raise HTTPException(status_code=422, detail="Status must be either 'Public', 'Private', or 'Bundle-Only'")
            
            # Prepare service data
            service_data = {
                'creative_user_id': user_id,
                'title': title,
                'description': description,
                'price': price,
                'delivery_time': delivery_time,
                'status': status,
                'color': color,
                'payment_option': payment_option,
                'is_active': True,
                'requires_booking': calendar_settings is not None,
                'is_time_slot_booking': calendar_settings.use_time_slots if calendar_settings else None
            }
            
            # Insert the service
            result = db_admin.table('creative_services').insert(service_data).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create service")
            
            service_id = result.data[0]['id']
            
            # Handle calendar settings if provided
            if calendar_settings:
                await CreativeController._save_calendar_settings(service_id, calendar_settings)
            
            # Handle photos if provided
            photos = form.getlist('photos')
            if photos:
                await CreativeController._save_service_photos_from_files(service_id, photos)
            
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
    async def _save_calendar_settings(service_id: str, calendar_settings, request: Request = None):
        """Save calendar settings for a service"""
        try:
            # Get user timezone from request headers
            user_timezone = 'UTC'  # Default to UTC
            if request:
                user_timezone = get_user_timezone_from_request(dict(request.headers))
                print(f"DEBUG: User timezone detected: {user_timezone}")
                print(f"DEBUG: Request headers: {dict(request.headers)}")
            
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
                    
                    # Save time blocks (convert to UTC)
                    if day_schedule.time_blocks:
                        time_blocks_data = []
                        # Convert time blocks to UTC
                        utc_time_blocks = convert_time_blocks_to_utc(
                            [{'start': block.start, 'end': block.end} for block in day_schedule.time_blocks],
                            user_timezone
                        )
                        for block in utc_time_blocks:
                            time_blocks_data.append({
                                'weekly_schedule_id': weekly_schedule_id,
                                'start_time': block['start'],
                                'end_time': block['end']
                            })
                        
                        if time_blocks_data:
                            db_admin.table('time_blocks').insert(time_blocks_data).execute()
                    
                    # Save time slots (if using time slot mode, convert to UTC)
                    if calendar_settings.use_time_slots and day_schedule.time_slots:
                        time_slots_data = []
                        # Convert time slots to UTC
                        utc_time_slots = convert_time_slots_to_utc(
                            [{'time': slot.time, 'enabled': slot.enabled} for slot in day_schedule.time_slots],
                            user_timezone
                        )
                        for slot in utc_time_slots:
                            time_slots_data.append({
                                'weekly_schedule_id': weekly_schedule_id,
                                'slot_time': slot['time'],
                                'is_enabled': slot['enabled']
                            })
                        
                        if time_slots_data:
                            db_admin.table('time_slots').insert(time_slots_data).execute()
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save calendar settings: {str(e)}")

    @staticmethod
    async def _save_service_photos(service_id: str, photos):
        """Save service photos for a service"""
        try:
            # First, delete existing photos from both storage and database
            await CreativeController._delete_service_photos(service_id)
            
            # Insert new photos
            if photos:
                photos_data = []
                for i, photo in enumerate(photos):
                    photos_data.append({
                        'service_id': service_id,
                        'photo_url': photo.photo_url,
                        'photo_filename': photo.photo_filename,
                        'photo_size_bytes': photo.photo_size_bytes,
                        'is_primary': photo.is_primary,
                        'display_order': photo.display_order if photo.display_order > 0 else i
                    })
                
                if photos_data:
                    db_admin.table('service_photos').insert(photos_data).execute()
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save service photos: {str(e)}")

    @staticmethod
    async def _save_service_photos_from_files(service_id: str, photo_files):
        """Save service photos from uploaded files with parallel processing"""
        try:
            # First, delete existing photos from both storage and database
            await CreativeController._delete_service_photos(service_id)
            
            # Upload photos to Supabase Storage and save metadata
            if photo_files:
                import asyncio
                from supabase import create_client, Client
                import os
                
                supabase_url = os.getenv("SUPABASE_URL")
                supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
                
                if not supabase_url or not supabase_key:
                    raise HTTPException(status_code=500, detail="Storage configuration missing")
                
                supabase: Client = create_client(supabase_url, supabase_key)
                
                async def upload_single_photo(photo_file, index):
                    """Upload a single photo and return metadata"""
                    if not photo_file or not hasattr(photo_file, 'filename') or not photo_file.filename:
                        return None
                    
                    try:
                        # Read file content
                        file_content = await photo_file.read()
                        file_extension = photo_file.filename.split('.')[-1] if '.' in photo_file.filename else 'jpg'
                        filename = f"service-photos/{service_id}/{index}_{photo_file.filename}"
                        
                        # Upload file to storage
                        result = supabase.storage.from_("creative-assets").upload(
                            filename, 
                            file_content,
                            file_options={
                                "content-type": photo_file.content_type or "image/jpeg",
                                "cache-control": "3600"
                            }
                        )
                        
                        if result:
                            # Get public URL
                            public_url = supabase.storage.from_("creative-assets").get_public_url(filename)
                            
                            return {
                                'service_id': service_id,
                                'photo_url': public_url,
                                'photo_filename': photo_file.filename,
                                'photo_size_bytes': len(file_content),
                                'is_primary': index == 0,  # First photo is primary
                                'display_order': index
                            }
                    except Exception as e:
                        print(f"Failed to upload photo {index}: {str(e)}")
                        return None
                
                # Upload all photos in parallel with error handling
                upload_tasks = [
                    upload_single_photo(photo_file, i) 
                    for i, photo_file in enumerate(photo_files)
                ]
                
                # Wait for all uploads to complete with return_exceptions to handle individual failures
                photos_data = await asyncio.gather(*upload_tasks, return_exceptions=True)
                
                # Filter out exceptions and None results
                photos_data = [
                    photo for photo in photos_data 
                    if photo is not None and not isinstance(photo, Exception)
                ]
                
                # Batch insert all photo metadata
                if photos_data:
                    db_admin.table('service_photos').insert(photos_data).execute()
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save service photos: {str(e)}")

    @staticmethod
    async def _delete_service_photos(service_id: str):
        """Delete all photos associated with a service from storage and database"""
        try:
            # Get all photos for this service BEFORE deleting from database
            photos_result = db_admin.table('service_photos').select('photo_url, photo_filename').eq('service_id', service_id).execute()
            
            print(f"Found {len(photos_result.data) if photos_result.data else 0} photos to delete for service {service_id}")
            
            if photos_result.data:
                import re
                
                # Use the existing db_admin client for storage operations
                # Extract file paths from URLs and delete from storage
                files_to_delete = []
                
                for photo in photos_result.data:
                    photo_url = photo['photo_url']
                    print(f"Processing photo URL: {photo_url}")
                    if photo_url:
                        # Extract the file path from the URL
                        # URL format: https://project.supabase.co/storage/v1/object/public/creative-assets/path/to/file
                        match = re.search(r'/storage/v1/object/public/creative-assets/(.+)', photo_url)
                        if match:
                            file_path = match.group(1)
                            # Clean the file path - remove any query parameters
                            file_path = file_path.split('?')[0]
                            print(f"Extracted file path: {file_path}")
                            files_to_delete.append(file_path)
                        else:
                            print(f"Could not extract file path from URL: {photo_url}")
                            # Try alternative URL patterns
                            # Check if it's a different URL format
                            alt_match = re.search(r'/storage/v1/object/public/([^/]+)/(.+)', photo_url)
                            if alt_match:
                                bucket_name = alt_match.group(1)
                                file_path = alt_match.group(2)
                                print(f"Alternative pattern - bucket: {bucket_name}, file path: {file_path}")
                                files_to_delete.append(file_path)
                
                # Delete all files at once if we have any
                if files_to_delete:
                    print(f"Attempting to delete {len(files_to_delete)} files from storage: {files_to_delete}")
                    
                    # First, let's try to list files in the bucket to see what's there
                    try:
                        list_result = db_admin.storage.from_("creative-assets").list()
                        print(f"Files in bucket before deletion: {list_result}")
                    except Exception as e:
                        print(f"Failed to list files in bucket: {e}")
                    
                    try:
                        # Try to delete files from storage
                        result = db_admin.storage.from_("creative-assets").remove(files_to_delete)
                        print(f"Storage deletion result: {result}")
                        print(f"Storage deletion result type: {type(result)}")
                        print(f"Storage deletion result dir: {dir(result)}")
                        
                        # Check if the deletion was successful
                        if hasattr(result, 'data') and result.data:
                            print(f"Successfully deleted files: {result.data}")
                        else:
                            print(f"Deletion may have failed - no data returned: {result}")
                            
                        # Check for errors in the response
                        if hasattr(result, 'error') and result.error:
                            print(f"Storage deletion error: {result.error}")
                        
                        # Try to get more information about the result
                        if hasattr(result, '__dict__'):
                            print(f"Result attributes: {result.__dict__}")
                        
                        # List files again to see if they were actually deleted
                        try:
                            list_result_after = db_admin.storage.from_("creative-assets").list()
                            print(f"Files in bucket after deletion: {list_result_after}")
                        except Exception as e:
                            print(f"Failed to list files after deletion: {e}")
                            
                    except Exception as e:
                        print(f"Failed to delete photos from storage: {files_to_delete}, error: {str(e)}")
                        print(f"Error type: {type(e)}")
                        # Try to get more details about the error
                        if hasattr(e, 'response'):
                            print(f"Error response: {e.response}")
                        if hasattr(e, 'details'):
                            print(f"Error details: {e.details}")
                        if hasattr(e, 'message'):
                            print(f"Error message: {e.message}")
                        if hasattr(e, 'args'):
                            print(f"Error args: {e.args}")
                else:
                    print("No files to delete from storage")
                
                # Delete photo records from database AFTER storage cleanup
                print(f"Deleting photo records from database for service {service_id}")
                db_admin.table('service_photos').delete().eq('service_id', service_id).execute()
                print(f"Successfully deleted photo records from database")
            
        except Exception as e:
            print(f"Failed to delete service photos for service {service_id}: {str(e)}")
            # Don't raise exception here as service deletion should still succeed even if photo cleanup fails

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
            
            # Get weekly schedule
            weekly_result = db_admin.table('weekly_schedule').select(
                'id, day_of_week, is_enabled'
            ).eq('calendar_setting_id', calendar_setting_id).execute()
            
            # Get time blocks for each weekly schedule entry
            time_blocks_result = db_admin.table('time_blocks').select(
                'weekly_schedule_id, start_time, end_time'
            ).in_('weekly_schedule_id', [ws['id'] for ws in weekly_result.data] if weekly_result.data else []).execute()
            
            # Get time slots for each weekly schedule entry
            time_slots_result = db_admin.table('time_slots').select(
                'weekly_schedule_id, slot_time, is_enabled'
            ).in_('weekly_schedule_id', [ws['id'] for ws in weekly_result.data] if weekly_result.data else []).execute()
            
            # Group time blocks and slots by weekly_schedule_id
            time_blocks_by_ws = {}
            for tb in time_blocks_result.data or []:
                ws_id = tb['weekly_schedule_id']
                if ws_id not in time_blocks_by_ws:
                    time_blocks_by_ws[ws_id] = []
                # Convert time format from HH:MM:SS to HH:MM
                start_time = str(tb['start_time'])[:5] if tb['start_time'] else '09:00'
                end_time = str(tb['end_time'])[:5] if tb['end_time'] else '17:00'
                time_blocks_by_ws[ws_id].append({
                    'start': start_time,
                    'end': end_time
                })
            
            time_slots_by_ws = {}
            for ts in time_slots_result.data or []:
                ws_id = ts['weekly_schedule_id']
                if ws_id not in time_slots_by_ws:
                    time_slots_by_ws[ws_id] = []
                # Convert time format from HH:MM:SS to HH:MM
                slot_time = str(ts['slot_time'])[:5] if ts['slot_time'] else '09:00'
                time_slots_by_ws[ws_id].append({
                    'time': slot_time,
                    'enabled': ts['is_enabled']
                })
            
            # Build weekly schedule with nested data
            weekly_schedule = []
            for ws in weekly_result.data or []:
                ws_id = ws['id']
                weekly_schedule.append({
                    'day': ws['day_of_week'],
                    'enabled': ws['is_enabled'],
                    'time_blocks': time_blocks_by_ws.get(ws_id, []),
                    'time_slots': time_slots_by_ws.get(ws_id, [])
                })
            
            calendar_data['weekly_schedule'] = weekly_schedule
            
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
            
            # Delete associated photos from storage and database
            await CreativeController._delete_service_photos(service_id)
            
            return DeleteServiceResponse(
                success=True,
                message=f"Service '{service_data['title']}' has been deleted successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete service: {str(e)}")


    @staticmethod
    async def update_service(user_id: str, service_id: str, service_request: CreateServiceRequest, request: Request = None) -> UpdateServiceResponse:
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
                'payment_option': service_request.payment_option,
                'updated_at': 'now()',
                'requires_booking': service_request.calendar_settings is not None,
                'is_time_slot_booking': service_request.calendar_settings.use_time_slots if service_request.calendar_settings else None
            }

            result = db_admin.table('creative_services').update(update_data).eq('id', service_id).execute()
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to update service")

            # Handle calendar settings if provided
            if service_request.calendar_settings:
                await CreativeController._save_calendar_settings(service_id, service_request.calendar_settings, request)
            
            # Handle photos if provided
            if service_request.photos:
                await CreativeController._save_service_photos(service_id, service_request.photos)

            return UpdateServiceResponse(success=True, message="Service updated successfully")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update service: {str(e)}")

    @staticmethod
    async def update_service_with_photos(user_id: str, service_id: str, service_data: dict, photo_files, calendar_settings=None) -> UpdateServiceResponse:
        """Update an existing service with new photos"""
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

            if service_data['price'] <= 0:
                raise HTTPException(status_code=422, detail="Price must be greater than 0")

            if service_data['status'] not in ['Public', 'Private', 'Bundle-Only']:
                raise HTTPException(status_code=422, detail="Status must be either 'Public', 'Private', or 'Bundle-Only'")

            # Update service data
            update_data = {
                'title': service_data['title'].strip(),
                'description': service_data['description'].strip(),
                'price': service_data['price'],
                'delivery_time': service_data['delivery_time'],
                'status': service_data['status'],
                'color': service_data['color'],
                'payment_option': service_data.get('payment_option', 'later'),
                'updated_at': 'now()',
                'requires_booking': calendar_settings is not None,
                'is_time_slot_booking': calendar_settings.use_time_slots if calendar_settings else None
            }

            result = db_admin.table('creative_services').update(update_data).eq('id', service_id).execute()
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to update service")

            # Handle calendar settings if provided
            if calendar_settings:
                await CreativeController._save_calendar_settings(service_id, calendar_settings)
            
            # Always delete existing photos first, then handle new photos if provided
            await CreativeController._delete_service_photos(service_id)
            
            # Handle new photos if provided
            if photo_files:
                await CreativeController._save_service_photos_from_files(service_id, photo_files)

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
        """Get all bundles associated with the creative - optimized with batch queries"""
        try:
            # Query the creative_bundles table for this creative user
            bundles_result = db_admin.table('creative_bundles').select(
                'id, title, description, color, status, pricing_option, fixed_price, discount_percentage, is_active, created_at, updated_at'
            ).eq('creative_user_id', user_id).eq('is_active', True).order('created_at', desc=True).execute()
            
            if not bundles_result.data:
                return CreativeBundlesListResponse(bundles=[], total_count=0)
            
            bundle_ids = [bundle['id'] for bundle in bundles_result.data]
            
            # Batch fetch all bundle services to avoid N+1 queries
            bundle_services_result = db_admin.table('bundle_services').select(
                'bundle_id, service_id'
            ).in_('bundle_id', bundle_ids).execute()
            
            # Group service IDs by bundle ID
            bundle_service_map = {}
            all_service_ids = set()
            for bs in bundle_services_result.data:
                bundle_id = bs['bundle_id']
                service_id = bs['service_id']
                if bundle_id not in bundle_service_map:
                    bundle_service_map[bundle_id] = []
                bundle_service_map[bundle_id].append(service_id)
                all_service_ids.add(service_id)
            
            # Batch fetch all service details
            services_result = db_admin.table('creative_services').select(
                'id, title, description, price, delivery_time, status, color'
            ).in_('id', list(all_service_ids)).execute()
            
            # Create service lookup map
            service_data_map = {s['id']: s for s in services_result.data}
            
            # Fetch photos for all bundle services
            bundle_photos_result = db_admin.table('service_photos').select(
                'service_id, photo_url, photo_filename, photo_size_bytes, is_primary, display_order'
            ).in_('service_id', list(all_service_ids)).order('service_id').order('display_order', desc=False).execute()
            
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
            
            bundles = []
            for bundle_data in bundles_result.data:
                bundle_id = bundle_data['id']
                service_ids = bundle_service_map.get(bundle_id, [])
                
                services = []
                total_services_price = 0
                for service_id in service_ids:
                    service_data = service_data_map.get(service_id)
                    if service_data:
                        service_photos = bundle_photos_by_service.get(service_id, [])
                        service = BundleServiceResponse(
                            id=service_data['id'],
                            title=service_data['title'],
                            description=service_data['description'],
                            price=float(service_data['price']),
                            delivery_time=service_data['delivery_time'],
                            status=service_data['status'],
                            color=service_data['color'],
                            photos=service_photos
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
                'id, title, description, price, delivery_time, status, color, payment_option, is_active, created_at, updated_at, requires_booking, is_time_slot_booking'
            ).eq('creative_user_id', user_id).eq('is_active', True).order('created_at', desc=True).execute()
            
            services = []
            if services_result.data:
                # Get service IDs for photo lookup
                service_ids = [service['id'] for service in services_result.data]
                
                # Get photos for all services
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
                
                for service_data in services_result.data:
                    service = CreativeServiceResponse(
                        id=service_data['id'],
                        title=service_data['title'],
                        description=service_data['description'],
                        price=float(service_data['price']),
                        delivery_time=service_data['delivery_time'],
                        status=service_data['status'],
                        color=service_data['color'],
                        payment_option=service_data['payment_option'],
                        is_active=service_data['is_active'],
                        created_at=service_data['created_at'],
                        updated_at=service_data['updated_at'],
                        requires_booking=service_data['requires_booking'],
                        is_time_slot_booking=service_data.get('is_time_slot_booking'),
                        photos=photos_by_service.get(service_data['id'], [])
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
                    
                    # Fetch photos for bundle services
                    bundle_photos_result = db_admin.table('service_photos').select(
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
                    for service_data in services_result.data:
                        service_photos = bundle_photos_by_service.get(service_data['id'], [])
                        service = BundleServiceResponse(
                            id=service_data['id'],
                            title=service_data['title'],
                            description=service_data['description'],
                            price=float(service_data['price']),
                            delivery_time=service_data['delivery_time'],
                            status=service_data['status'],
                            color=service_data['color'],
                            photos=service_photos
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
                'id, title, description, price, delivery_time, status, color, payment_option, is_active, created_at, updated_at, requires_booking'
            ).eq('creative_user_id', user_id).eq('is_active', True).eq('status', 'Public').order('created_at', desc=True).execute()
            
            services = []
            if services_result.data:
                # Get all service IDs for photo fetching
                service_ids = [service['id'] for service in services_result.data]
                
                # Fetch photos for all services
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
                
                for service_data in services_result.data:
                    service_photos = photos_by_service.get(service_data['id'], [])
                    
                    service = CreativeServiceResponse(
                        id=service_data['id'],
                        title=service_data['title'],
                        description=service_data['description'],
                        price=float(service_data['price']),
                        delivery_time=service_data['delivery_time'],
                        status=service_data['status'],
                        color=service_data['color'],
                        payment_option=service_data['payment_option'],
                        is_active=service_data['is_active'],
                        created_at=service_data['created_at'],
                        updated_at=service_data['updated_at'],
                        requires_booking=service_data['requires_booking'],
                        photos=service_photos
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
                    
                    # Fetch photos for bundle services
                    bundle_photos_result = db_admin.table('service_photos').select(
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
                    for service_data in services_result.data:
                        service_photos = bundle_photos_by_service.get(service_data['id'], [])
                        service = BundleServiceResponse(
                            id=service_data['id'],
                            title=service_data['title'],
                            description=service_data['description'],
                            price=float(service_data['price']),
                            delivery_time=service_data['delivery_time'],
                            status=service_data['status'],
                            color=service_data['color'],
                            photos=service_photos
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
