from fastapi import HTTPException, UploadFile
from db.db_session import db_admin
from schemas.advocate import AdvocateSetupResponse, AdvocateUpdateRequest, AdvocateUpdateResponse
from supabase import Client
from typing import Optional
import uuid
from services.email.email_service import email_service
from core.safe_errors import log_exception_if_dev
import logging

logger = logging.getLogger(__name__)

class AdvocateController:
    @staticmethod
    async def setup_advocate_profile(user_id: str, client: Optional[Client] = None) -> AdvocateSetupResponse:
        """
        Set up advocate profile in the advocates table with hardcoded demo values.
        
        Uses authenticated client for table operations where RLS allows:
        - users table: SELECT/UPDATE own data (user_id = auth.uid())
        - advocates table: INSERT/UPDATE own data (user_id = auth.uid())
        
        Uses db_admin for:
        - auth.admin.get_user_by_id() - Admin auth API requires service role
        """
        # Use authenticated client if provided, otherwise fall back to db_admin
        db_client = client if client else db_admin
        
        try:
            # Get user profile data including name, profile_picture_url, and avatar_source
            # Uses authenticated client - user can SELECT own data via RLS
            user_result = db_client.table('users').select('roles, name, email, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_data = user_result.data
            user_roles = user_data.get('roles', [])
            
            # If user doesn't have advocate role, add it
            if 'advocate' not in user_roles:
                user_roles.append('advocate')
                # Update user's roles in the database
                # Uses authenticated client - user can UPDATE own data via RLS
                update_result = db_client.table('users').update({'roles': user_roles}).eq('user_id', user_id).execute()
                if not update_result.data:
                    raise HTTPException(status_code=500, detail="Failed to update user roles")
            
            # Fallbacks: fetch auth user metadata if DB row missing fields
            # Must use db_admin - auth.admin API requires service role
            fallback_name = None
            fallback_avatar_url = None
            fallback_email = None
            try:
                auth_user = db_admin.auth.admin.get_user_by_id(user_id)
                if getattr(auth_user, 'user', None):
                    metadata = getattr(auth_user.user, 'user_metadata', {}) or {}
                    fallback_name = metadata.get('full_name') or metadata.get('name') or getattr(auth_user.user, 'user_metadata', {}).get('full_name')
                    fallback_avatar_url = metadata.get('avatar_url') or getattr(auth_user.user, 'avatar_url', None)
                    fallback_email = getattr(auth_user.user, 'email', None)
            except Exception:
                # Ignore admin fetch failures; continue with DB-only data
                pass

            # Compute display name and banner url with safe fallbacks
            display_name = user_data.get('name') or fallback_name
            if not display_name:
                email_any = user_data.get('email') or fallback_email
                if email_any:
                    display_name = email_any.split('@')[0]
            if not display_name:
                display_name = 'User'

            profile_banner_url = user_data.get('profile_picture_url') or fallback_avatar_url
            if not profile_banner_url:
                seed = display_name or user_id
                profile_banner_url = f"https://api.dicebear.com/7.x/initials/svg?seed={seed}"

            profile_source = user_data.get('avatar_source') or 'google'
            
            # Get user email with fallback
            user_email = user_data.get('email') or fallback_email

            # Create advocate profile with computed data and defaults
            advocate_data = {
                'user_id': user_id,
                'display_name': display_name,
                'email': user_email,  # Default to Google email
                'profile_banner_url': profile_banner_url,
                'profile_source': profile_source,
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
            
            # Insert or update advocate profile (upsert)
            # Uses authenticated client - user can INSERT/UPDATE own advocate data via RLS
            result = db_client.table('advocates').upsert(advocate_data).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create advocate profile")
            
            # Mark setup as complete by setting first_login to False
            # Uses authenticated client - user can UPDATE own data via RLS
            user_update_result = db_client.table('users').update({'first_login': False}).eq('user_id', user_id).execute()
            
            if not user_update_result.data:
                raise HTTPException(status_code=500, detail="Failed to update user first_login status")
            
            # Send welcome email to the new advocate
            if user_email:
                try:
                    logger.info(f"Sending welcome email to advocate {user_email}")
                    await email_service.send_welcome_email(
                        to_email=user_email,
                        user_name=display_name,
                        user_role='advocate'
                    )
                    logger.info(f"Welcome email sent successfully to {user_email}")
                except Exception as e:
                    # Log the error but don't fail the profile creation; full detail only in dev
                    log_exception_if_dev(logger, "Failed to send welcome email to advocate", e)
            
            return AdvocateSetupResponse(
                success=True,
                message="Advocate profile created successfully with demo data"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Failed to set up advocate profile", e)
            raise HTTPException(status_code=500, detail="Failed to set up advocate profile")

    @staticmethod
    async def get_advocate_profile(user_id: str, client: Optional[Client] = None) -> dict:
        """
        Get the current user's advocate profile.
        
        Uses authenticated client - user can SELECT own advocate data via RLS policy.
        """
        # Use authenticated client if provided, otherwise fall back to db_admin
        db_client = client if client else db_admin
        
        try:
            # Query the advocates table
            # Uses authenticated client - user can SELECT own data via RLS
            result = db_client.table('advocates').select('*').eq('user_id', user_id).single().execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Advocate profile not found")
            
            return result.data
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Failed to fetch advocate profile", e)
            raise HTTPException(status_code=500, detail="Failed to fetch advocate profile")

    @staticmethod
    async def update_advocate_profile(user_id: str, update_data: AdvocateUpdateRequest, client: Optional[Client] = None) -> AdvocateUpdateResponse:
        """
        Update the current user's advocate profile.
        
        Uses authenticated client - user can UPDATE own advocate data via RLS policy.
        """
        # Use authenticated client if provided, otherwise fall back to db_admin
        db_client = client if client else db_admin
        
        try:
            # Build update dictionary with only provided fields
            update_dict = {}
            if update_data.display_name is not None:
                update_dict['display_name'] = update_data.display_name
            if update_data.email is not None:
                update_dict['email'] = update_data.email
            if update_data.profile_banner_url is not None:
                update_dict['profile_banner_url'] = update_data.profile_banner_url
            
            # Only update if there are fields to update
            if not update_dict:
                return AdvocateUpdateResponse(
                    success=True,
                    message="No changes to update"
                )
            
            # Update the advocate profile
            # Uses authenticated client - user can UPDATE own data via RLS
            result = db_client.table('advocates').update(update_dict).eq('user_id', user_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Advocate profile not found")
            
            return AdvocateUpdateResponse(
                success=True,
                message="Advocate profile updated successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Failed to update advocate profile", e)
            raise HTTPException(status_code=500, detail="Failed to update advocate profile")

    @staticmethod
    async def upload_profile_photo(user_id: str, file: UploadFile, client: Optional[Client] = None) -> dict:
        """
        Upload a profile photo for the advocate.
        
        Uses authenticated client for table operations:
        - advocates SELECT/UPDATE own data via RLS
        
        Uses db_admin for storage operations:
        - Storage INSERT has no RLS policy for profile-photos bucket
        - Storage DELETE policy doesn't match current path structure
        - Storage client doesn't have JWT token setup in get_authenticated_client
        """
        # Use authenticated client if provided, otherwise fall back to db_admin
        db_client = client if client else db_admin
        
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
            # Uses authenticated client - user can SELECT own data via RLS
            current_profile = db_client.table('advocates').select('profile_banner_url').eq('user_id', user_id).single().execute()
            old_photo_url = None
            if current_profile.data and current_profile.data.get('profile_banner_url'):
                old_photo_url = current_profile.data['profile_banner_url']
            
            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
            unique_filename = f"{user_id}_{uuid.uuid4().hex}.{file_extension}"
            
            # Upload to Supabase storage
            # Must use db_admin - no INSERT RLS policy for profile-photos bucket
            bucket_name = "profile-photos"
            file_path = f"advocates/{unique_filename}"
            
            try:
                upload_result = db_admin.storage.from_(bucket_name).upload(
                    path=file_path,
                    file=content,
                    file_options={"content-type": file.content_type}
                )
            except Exception as upload_error:
                log_exception_if_dev(logger, "Failed to upload file", upload_error)
                raise HTTPException(status_code=500, detail="Failed to upload file")
            
            # Get the public URL
            # Uses db_admin for consistency with storage operations
            public_url = db_admin.storage.from_(bucket_name).get_public_url(file_path)
            
            # Update the advocate profile with the new photo URL
            # Uses authenticated client - user can UPDATE own data via RLS
            update_result = db_client.table('advocates').update({
                'profile_banner_url': public_url,
                'profile_source': 'custom'
            }).eq('user_id', user_id).execute()
            
            if not update_result.data:
                raise HTTPException(status_code=500, detail="Failed to update profile with new photo URL")
            
            # Delete the old profile photo if it exists
            # Must use db_admin - storage DELETE policy doesn't match path structure
            if old_photo_url and 'profile-photos' in old_photo_url:
                try:
                    clean_url = old_photo_url.split('?')[0].split('#')[0]
                    old_file_path = clean_url.split('/profile-photos/')[-1]
                    
                    if old_file_path.startswith('advocates/'):
                        try:
                            db_admin.storage.from_(bucket_name).remove([old_file_path])
                        except Exception as delete_error:
                            log_exception_if_dev(logger, "Failed to delete old profile photo", delete_error)
                except Exception as delete_error:
                    log_exception_if_dev(logger, "Failed to delete old profile photo", delete_error)
            
            return {
                "success": True,
                "message": "Profile photo uploaded successfully",
                "profile_banner_url": public_url
            }
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Failed to upload profile photo", e)
            raise HTTPException(status_code=500, detail="Failed to upload profile photo")
