from fastapi import HTTPException
from db.db_session import db_admin
from schemas.client import ClientSetupRequest, ClientSetupResponse
from core.validation import validate_email

class ClientController:
    @staticmethod
    async def setup_client_profile(user_id: str, setup_request: ClientSetupRequest) -> ClientSetupResponse:
        """Set up client profile in the clients table"""
        try:
            # Get user profile data
            user_result = db_admin.table('users').select('roles, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_data = user_result.data
            user_roles = user_data.get('roles', [])
            
            # If user doesn't have client role, add it
            if 'client' not in user_roles:
                user_roles.append('client')
                # Update user's roles in the database
                update_result = db_admin.table('users').update({'roles': user_roles}).eq('user_id', user_id).execute()
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

    @staticmethod
    async def get_client_profile(user_id: str) -> dict:
        """Get the current user's client profile"""
        try:
            # Query the clients table
            result = db_admin.table('clients').select('*').eq('user_id', user_id).single().execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Client profile not found")
            
            return result.data
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch client profile: {str(e)}")
