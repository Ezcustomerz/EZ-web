from fastapi import HTTPException
from db.db_session import db_admin
from schemas.creative import CreativeSetupRequest, CreativeSetupResponse
from core.validation import validate_contact_field

class CreativeController:
    @staticmethod
    async def setup_creative_profile(user_id: str, setup_request: CreativeSetupRequest) -> CreativeSetupResponse:
        """Set up creative profile in the creatives table"""
        try:
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
