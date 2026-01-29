"""Profile router for creative endpoints"""
import logging
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Depends
from services.creative.profile_service import ProfileService
from schemas.creative import (
    CreativeProfileSettingsRequest, CreativeProfileSettingsResponse,
    ProfilePhotoUploadResponse, CreativeDashboardStatsResponse
)
from services.booking.order_service import OrderService
from core.limiter import limiter
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from typing import Dict, Any
from db.db_session import get_authenticated_client_dep
from supabase import Client

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/profile")
@limiter.limit("2 per second")
async def get_creative_profile(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get the current user's creative profile
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ProfileService.get_creative_profile(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to fetch creative profile", e)
        raise HTTPException(status_code=500, detail="Failed to fetch creative profile")


@router.get("/profile/{user_id}")
@limiter.limit("2 per second")
async def get_creative_profile_by_id(
    user_id: str, 
    request: Request,
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get a creative profile by user ID (public endpoint for invite links)
    Public endpoint - authentication is optional but will use authenticated client if available.
    """
    try:
        return await ProfileService.get_creative_profile(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to fetch creative profile", e)
        raise HTTPException(status_code=500, detail="Failed to fetch creative profile")


@router.put("/profile/settings", response_model=CreativeProfileSettingsResponse)
@limiter.limit("2 per second")
async def update_creative_profile_settings(
    request: Request,
    settings_request: CreativeProfileSettingsRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Update creative profile settings including highlights, service display, and avatar settings
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ProfileService.update_profile_settings(user_id, settings_request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to update profile settings", e)
        raise HTTPException(status_code=500, detail="Failed to update profile settings")


@router.post("/profile/upload-photo", response_model=ProfilePhotoUploadResponse)
@limiter.limit("2 per second")
async def upload_profile_photo(
    request: Request,
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Upload a profile photo for the creative
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ProfileService.upload_profile_photo(user_id, file, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to upload profile photo", e)
        raise HTTPException(status_code=500, detail="Failed to upload profile photo")


@router.get("/dashboard/stats", response_model=CreativeDashboardStatsResponse)
@limiter.limit("20 per minute")
async def get_creative_dashboard_stats(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get dashboard statistics for the current creative user (current month only)
    Requires authentication - will return 401 if not authenticated.
    Returns:
    - total_clients: Number of new clients this month
    - monthly_amount: Net income from Stripe for current month
    - total_bookings: Number of bookings created this month
    - completed_sessions: Number of sessions completed this month
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        stats = await OrderService.get_creative_dashboard_stats(user_id, client)
        return CreativeDashboardStatsResponse(**stats)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to fetch dashboard stats", e)
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard stats")

