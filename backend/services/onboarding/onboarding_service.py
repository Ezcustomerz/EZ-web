from fastapi import HTTPException
from supabase import Client
from typing import Dict, List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Onboarding data structure (stored in profile_highlight_values JSONB under '_onboarding' key)
DEFAULT_ONBOARDING = {
    "completed": False,
    "current_step": 0,
    "skipped_sections": [],
    "version": "1.0",
    "last_seen_at": None,
    "mini_tours": {}
}


class OnboardingService:
    """Service for managing onboarding tours using existing profile_highlight_values JSONB column"""
    
    @staticmethod
    def _get_profile_data(user_id: str, client: Client) -> Dict:
        """Helper to get profile_highlight_values JSONB data"""
        result = client.table('creatives').select('profile_highlight_values').eq('user_id', user_id).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Creative profile not found")
        
        # Get existing data or default to empty dict
        return result.data.get('profile_highlight_values') or {}
    
    @staticmethod
    def _update_profile_data(user_id: str, data: Dict, client: Client):
        """Helper to update profile_highlight_values JSONB data"""
        result = client.table('creatives').update({
            'profile_highlight_values': data
        }).eq('user_id', user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Creative profile not found")
    
    @staticmethod
    async def get_onboarding_status(user_id: str, client: Client) -> Dict:
        """Get the current onboarding status from JSONB column
        
        Returns onboarding data structure with defaults if not exists
        """
        if not client:
            raise ValueError("Authenticated client is required")
        
        try:
            profile_data = OnboardingService._get_profile_data(user_id, client)
            
            # Extract onboarding data (under '_onboarding' key)
            onboarding_data = profile_data.get('_onboarding', DEFAULT_ONBOARDING.copy())
            
            # Ensure all fields exist (backward compatibility)
            for key, default_value in DEFAULT_ONBOARDING.items():
                if key not in onboarding_data:
                    onboarding_data[key] = default_value
            
            return onboarding_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching onboarding status for user_id {user_id}: {str(e)}")
            if 'PGRST116' in str(e) or 'permission denied' in str(e).lower():
                raise HTTPException(status_code=401, detail="Authentication failed")
            raise HTTPException(status_code=500, detail=f"Failed to fetch onboarding status: {str(e)}")

    @staticmethod
    async def update_main_tour_progress(user_id: str, step: int, client: Client) -> Dict:
        """Update current step in main tour"""
        if not client:
            raise ValueError("Authenticated client is required")
        
        try:
            # Get current profile data
            profile_data = OnboardingService._get_profile_data(user_id, client)
            
            # Get or create onboarding data
            onboarding_data = profile_data.get('_onboarding', DEFAULT_ONBOARDING.copy())
            
            # Update step and timestamp
            onboarding_data['current_step'] = step
            onboarding_data['last_seen_at'] = datetime.utcnow().isoformat()
            
            # Write back to JSONB
            profile_data['_onboarding'] = onboarding_data
            OnboardingService._update_profile_data(user_id, profile_data, client)
            
            return onboarding_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating progress for user_id {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")

    @staticmethod
    async def complete_main_tour(user_id: str, client: Client) -> Dict:
        """Mark main tour as completed"""
        if not client:
            raise ValueError("Authenticated client is required")
        
        try:
            profile_data = OnboardingService._get_profile_data(user_id, client)
            onboarding_data = profile_data.get('_onboarding', DEFAULT_ONBOARDING.copy())
            
            onboarding_data['completed'] = True
            onboarding_data['current_step'] = 8
            onboarding_data['last_seen_at'] = datetime.utcnow().isoformat()
            
            profile_data['_onboarding'] = onboarding_data
            OnboardingService._update_profile_data(user_id, profile_data, client)
            
            return onboarding_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error completing tour for user_id {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to complete tour: {str(e)}")

    @staticmethod
    async def skip_section(user_id: str, section: str, client: Client) -> Dict:
        """Add section to skipped list"""
        if not client:
            raise ValueError("Authenticated client is required")
        
        valid_sections = ['intro', 'bookings', 'portfolio', 'settings']
        if section not in valid_sections:
            raise HTTPException(status_code=400, detail=f"Invalid section: {section}")
        
        try:
            profile_data = OnboardingService._get_profile_data(user_id, client)
            onboarding_data = profile_data.get('_onboarding', DEFAULT_ONBOARDING.copy())
            
            if section not in onboarding_data['skipped_sections']:
                onboarding_data['skipped_sections'].append(section)
                onboarding_data['last_seen_at'] = datetime.utcnow().isoformat()
                
                profile_data['_onboarding'] = onboarding_data
                OnboardingService._update_profile_data(user_id, profile_data, client)
            
            return onboarding_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error skipping section for user_id {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to skip section: {str(e)}")

    @staticmethod
    async def restart_main_tour(user_id: str, client: Client) -> Dict:
        """Reset main tour to beginning"""
        if not client:
            raise ValueError("Authenticated client is required")
        
        try:
            profile_data = OnboardingService._get_profile_data(user_id, client)
            
            # Reset onboarding data
            onboarding_data = DEFAULT_ONBOARDING.copy()
            onboarding_data['last_seen_at'] = datetime.utcnow().isoformat()
            
            profile_data['_onboarding'] = onboarding_data
            OnboardingService._update_profile_data(user_id, profile_data, client)
            
            return onboarding_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error restarting tour for user_id {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to restart tour: {str(e)}")

    @staticmethod
    async def complete_mini_tour(user_id: str, tour_id: str, client: Client) -> Dict:
        """Mark mini-tour as completed"""
        if not client:
            raise ValueError("Authenticated client is required")
        
        valid_tours = ['dashboard', 'activity', 'clients', 'public']
        if tour_id not in valid_tours:
            raise HTTPException(status_code=400, detail=f"Invalid tour_id: {tour_id}")
        
        try:
            profile_data = OnboardingService._get_profile_data(user_id, client)
            onboarding_data = profile_data.get('_onboarding', DEFAULT_ONBOARDING.copy())
            
            if 'mini_tours' not in onboarding_data:
                onboarding_data['mini_tours'] = {}
            
            onboarding_data['mini_tours'][tour_id] = True
            
            profile_data['_onboarding'] = onboarding_data
            OnboardingService._update_profile_data(user_id, profile_data, client)
            
            return onboarding_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error completing mini-tour for user_id {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to complete mini-tour: {str(e)}")

    @staticmethod
    async def restart_mini_tour(user_id: str, tour_id: str, client: Client) -> Dict:
        """Reset specific mini-tour"""
        if not client:
            raise ValueError("Authenticated client is required")
        
        try:
            profile_data = OnboardingService._get_profile_data(user_id, client)
            onboarding_data = profile_data.get('_onboarding', DEFAULT_ONBOARDING.copy())
            
            if 'mini_tours' not in onboarding_data:
                onboarding_data['mini_tours'] = {}
            
            onboarding_data['mini_tours'][tour_id] = False
            
            profile_data['_onboarding'] = onboarding_data
            OnboardingService._update_profile_data(user_id, profile_data, client)
            
            return onboarding_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error restarting mini-tour for user_id {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to restart mini-tour: {str(e)}")
