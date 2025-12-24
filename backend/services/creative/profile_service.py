"""Profile service for creative profiles"""
from fastapi import HTTPException, UploadFile
from db.db_session import db_admin
from schemas.creative import (
    CreativeSetupRequest, CreativeSetupResponse,
    CreativeProfileSettingsRequest, CreativeProfileSettingsResponse,
    ProfilePhotoUploadResponse
)
from core.validation import validate_contact_field
from supabase import Client
import re
import uuid


class ProfileService:
    """Service for handling creative profile operations"""
    
    @staticmethod
    async def setup_creative_profile(user_id: str, setup_request: CreativeSetupRequest, client: Client) -> CreativeSetupResponse:
        """Set up creative profile in the creatives table"""
        try:
            # Get user profile data (using authenticated client - respects RLS)
            user_result = client.table('users').select('roles, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_data = user_result.data
            user_roles = user_data.get('roles', [])
            
            # If user doesn't have creative role, add it
            if 'creative' not in user_roles:
                user_roles.append('creative')
                update_result = client.table('users').update({'roles': user_roles}).eq('user_id', user_id).execute()
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
            
            if not setup_request.primary_contact and not setup_request.secondary_contact:
                validation_errors.append("At least one contact method (primary or secondary) is required")
            
            if validation_errors:
                raise HTTPException(status_code=422, detail="; ".join(validation_errors))
            
            # Prepare creative profile data
            title_to_use = setup_request.custom_title if setup_request.custom_title else setup_request.title
            profile_picture_url = user_data.get('profile_picture_url')
            avatar_source = user_data.get('avatar_source', 'google')
            
            # Validate subscription_tier_id
            subscription_result = client.table('subscription_tiers').select(
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
                'profile_banner_url': profile_picture_url,
                'profile_source': avatar_source,
            }
            
            result = client.table('creatives').upsert(creative_data).execute()
            
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
    async def get_creative_profile(user_id: str, client: Client) -> dict:
        """Get the current user's creative profile with subscription tier data"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            creative_result = client.table('creatives').select('*').eq('user_id', user_id).single().execute()
            
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found")
            
            profile_data = creative_result.data
            
            # Fetch subscription tier data
            subscription_tier_id = profile_data.get('subscription_tier_id')
            if subscription_tier_id:
                subscription_result = client.table('subscription_tiers').select(
                    'storage_amount_bytes, name, fee_percentage'
                ).eq('id', subscription_tier_id).single().execute()
                
                if subscription_result.data:
                    tier_name = subscription_result.data.get('name', 'basic')
                    tier_name_display = tier_name.capitalize() if tier_name else 'Basic'
                    profile_data['storage_limit_bytes'] = subscription_result.data.get('storage_amount_bytes', 0)
                    profile_data['subscription_tier'] = tier_name_display
                    profile_data['subscription_tier_name'] = tier_name_display
                    profile_data['subscription_tier_fee_percentage'] = float(subscription_result.data.get('fee_percentage', 0))
            
            return profile_data
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative profile: {str(e)}")

    @staticmethod
    async def update_profile_settings(user_id: str, settings_request: CreativeProfileSettingsRequest, client: Client) -> CreativeProfileSettingsResponse:
        """Update creative profile settings including highlights, service display, and avatar settings"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
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
                service_exists = False
                bundle_exists = False
                
                try:
                    service_result = client.table('creative_services').select('id').eq('id', settings_request.primary_service_id).eq('creative_user_id', user_id).eq('is_active', True).execute()
                    service_exists = service_result.data and len(service_result.data) > 0
                except Exception:
                    service_exists = False
                
                try:
                    bundle_result = client.table('creative_bundles').select('id').eq('id', settings_request.primary_service_id).eq('creative_user_id', user_id).eq('is_active', True).execute()
                    bundle_exists = bundle_result.data and len(bundle_result.data) > 0
                except Exception:
                    bundle_exists = False
                
                if not service_exists and not bundle_exists:
                    validation_errors.append("Primary service: Service or bundle not found or doesn't belong to you")
            
            if settings_request.secondary_service_id:
                service_exists = False
                bundle_exists = False
                
                try:
                    service_result = client.table('creative_services').select('id').eq('id', settings_request.secondary_service_id).eq('creative_user_id', user_id).eq('is_active', True).execute()
                    service_exists = service_result.data and len(service_result.data) > 0
                except Exception:
                    service_exists = False
                
                try:
                    bundle_result = client.table('creative_bundles').select('id').eq('id', settings_request.secondary_service_id).eq('creative_user_id', user_id).eq('is_active', True).execute()
                    bundle_exists = bundle_result.data and len(bundle_result.data) > 0
                except Exception:
                    bundle_exists = False
                
                if not service_exists and not bundle_exists:
                    validation_errors.append("Secondary service: Service or bundle not found or doesn't belong to you")
            
            if (settings_request.primary_service_id and settings_request.secondary_service_id and 
                settings_request.primary_service_id == settings_request.secondary_service_id):
                validation_errors.append("Primary and secondary services must be different")
            
            if validation_errors:
                raise HTTPException(status_code=422, detail="; ".join(validation_errors))
            
            # Prepare update data
            update_data = {}

            if settings_request.display_name is not None:
                if len(settings_request.display_name) > 100:
                    raise HTTPException(status_code=422, detail="Display name must be 100 characters or less")
                update_data['display_name'] = settings_request.display_name

            if settings_request.title is not None:
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
            
            # Check if creative profile exists
            try:
                existing_profile = client.table('creatives').select('user_id').eq('user_id', user_id).execute()
                profile_exists = existing_profile.data and len(existing_profile.data) > 0
            except:
                profile_exists = False
            
            if not profile_exists:
                create_data = {
                    'user_id': user_id,
                    **update_data
                }
                try:
                    result = client.table('creatives').insert(create_data).execute()
                    if not result.data:
                        raise HTTPException(status_code=500, detail="Failed to create creative profile")
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to create creative profile: {str(e)}")
            else:
                try:
                    result = client.table('creatives').update(update_data).eq('user_id', user_id).execute()
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
    async def upload_profile_photo(user_id: str, file: UploadFile, client: Client) -> ProfilePhotoUploadResponse:
        """Upload a profile photo for the creative"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
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
            current_profile = client.table('creatives').select('profile_banner_url').eq('user_id', user_id).single().execute()
            old_photo_url = None
            if current_profile.data and current_profile.data.get('profile_banner_url'):
                old_photo_url = current_profile.data['profile_banner_url']
            
            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
            unique_filename = f"{user_id}_{uuid.uuid4().hex}.{file_extension}"
            
            # Upload to Supabase storage
            bucket_name = "profile-photos"
            file_path = f"creatives/{unique_filename}"
            
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
            update_result = client.table('creatives').update({
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
                    
                    if old_file_path.startswith('creatives/'):
                        try:
                            db_admin.storage.from_(bucket_name).remove([old_file_path])
                        except Exception as delete_error:
                            print(f"Warning: Failed to delete old profile photo: {str(delete_error)}")
                except Exception as delete_error:
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

