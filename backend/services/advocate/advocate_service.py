from fastapi import HTTPException
from db.db_session import db_admin
from schemas.advocate import AdvocateSetupResponse

class AdvocateController:
    @staticmethod
    async def setup_advocate_profile(user_id: str) -> AdvocateSetupResponse:
        """Set up advocate profile in the advocates table with hardcoded demo values"""
        try:
            # Get user profile data including name, profile_picture_url, and avatar_source
            user_result = db_admin.table('users').select('roles, name, email, profile_picture_url, avatar_source').eq('user_id', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_data = user_result.data
            user_roles = user_data.get('roles', [])
            
            # If user doesn't have advocate role, add it
            if 'advocate' not in user_roles:
                user_roles.append('advocate')
                # Update user's roles in the database
                update_result = db_admin.table('users').update({'roles': user_roles}).eq('user_id', user_id).execute()
                if not update_result.data:
                    raise HTTPException(status_code=500, detail="Failed to update user roles")
            
            # Fallbacks: fetch auth user metadata if DB row missing fields
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

            # Create advocate profile with computed data and defaults
            advocate_data = {
                'user_id': user_id,
                'display_name': display_name,
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
            result = db_admin.table('advocates').upsert(advocate_data).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create advocate profile")
            
            return AdvocateSetupResponse(
                success=True,
                message="Advocate profile created successfully with demo data"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to set up advocate profile: {str(e)}")

    @staticmethod
    async def get_advocate_profile(user_id: str) -> dict:
        """Get the current user's advocate profile"""
        try:
            # Query the advocates table
            result = db_admin.table('advocates').select('*').eq('user_id', user_id).single().execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Advocate profile not found")
            
            return result.data
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch advocate profile: {str(e)}")
