from fastapi import HTTPException
from db.db_session import db_admin
from schemas.advocate import AdvocateSetupResponse

class AdvocateController:
    @staticmethod
    async def setup_advocate_profile(user_id: str) -> AdvocateSetupResponse:
        """Set up advocate profile in the advocates table with hardcoded demo values"""
        try:
            # Get user profile data
            user_result = db_admin.table('users').select('roles').eq('user_id', user_id).single().execute()
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
            
            # Create advocate profile with hardcoded demo data
            advocate_data = {
                'user_id': user_id,
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
