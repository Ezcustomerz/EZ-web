"""Services router for creative endpoints"""
import logging
import json
from fastapi import APIRouter, Request, HTTPException, Depends
from services.creative.service_service import ServiceService
from services.creative.calendar_service import CalendarService
from schemas.creative import (
    CreateServiceRequest, CreateServiceResponse, DeleteServiceResponse,
    UpdateServiceResponse, PublicServicesAndBundlesResponse, CalendarSettingsRequest
)
from core.limiter import limiter
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from typing import Dict, Any
from db.db_session import get_authenticated_client_dep
from supabase import Client

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/services", response_model=PublicServicesAndBundlesResponse)
@limiter.limit("2 per second")
async def get_creative_services_and_bundles(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get all services and bundles associated with the current creative
    Requires authentication - will return 401 if not authenticated.
    Uses authenticated client to respect RLS policies.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ServiceService.get_creative_services_and_bundles(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to fetch creative services and bundles", e)
        raise HTTPException(status_code=500, detail="Failed to fetch creative services and bundles")


@router.get("/services/{user_id}", response_model=PublicServicesAndBundlesResponse)
@limiter.limit("2 per second")
async def get_creative_services_by_id(
    user_id: str, 
    request: Request,
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get all public services and bundles associated with a creative by user ID (public endpoint for invite links)
    Public endpoint - authentication is optional but will use authenticated client if available.
    """
    try:
        return await ServiceService.get_creative_services_and_bundles(user_id, client, public_only=True)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to fetch creative services and bundles", e)
        raise HTTPException(status_code=500, detail="Failed to fetch creative services and bundles")


@router.post("/services", response_model=CreateServiceResponse)
@limiter.limit("2 per second")
async def create_service(
    request: Request,
    service_request: CreateServiceRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Create a new service for the current creative
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ServiceService.create_service(user_id, service_request, request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to create service", e)
        raise HTTPException(status_code=500, detail="Failed to create service")


@router.post("/services/with-photos", response_model=CreateServiceResponse)
@limiter.limit("2 per second")
async def create_service_with_photos(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Create a new service with photos in a single request
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ServiceService.create_service_with_photos(user_id, request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to create service", e)
        raise HTTPException(status_code=500, detail="Failed to create service")


@router.delete("/services/{service_id}", response_model=DeleteServiceResponse)
@limiter.limit("2 per second")
async def delete_service(
    request: Request,
    service_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Soft delete a service for the current creative
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ServiceService.delete_service(user_id, service_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to delete service", e)
        raise HTTPException(status_code=500, detail="Failed to delete service")


@router.put("/services/{service_id}", response_model=UpdateServiceResponse)
@limiter.limit("2 per second")
async def update_service(
    request: Request,
    service_id: str,
    service_request: CreateServiceRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Update an existing service for the current creative
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")

        return await ServiceService.update_service(user_id, service_id, service_request, request, client)

    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to update service", e)
        raise HTTPException(status_code=500, detail="Failed to update service")


@router.put("/services/{service_id}/photos", response_model=UpdateServiceResponse)
@limiter.limit("2 per second")
async def update_service_with_photos(
    request: Request,
    service_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Update service photos with file uploads
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")

        # Get the form data
        form = await request.form()
        
        # Extract service data
        service_data = {
            'title': form.get('title'),
            'description': form.get('description'),
            'price': float(form.get('price', 0)),
            'delivery_time': form.get('delivery_time'),
            'status': form.get('status'),
            'color': form.get('color'),
            'payment_option': form.get('payment_option', 'later'),
            'split_deposit_amount': float(form.get('split_deposit_amount')) if form.get('split_deposit_amount') else None
        }
        
        # Extract calendar settings if provided
        calendar_settings = None
        calendar_settings_json = form.get('calendar_settings')
        if calendar_settings_json:
            try:
                calendar_data = json.loads(calendar_settings_json)
                calendar_settings = CalendarSettingsRequest(**calendar_data)
            except (json.JSONDecodeError, ValueError) as e:
                log_exception_if_dev(logger, "Failed to parse calendar settings", e)
                calendar_settings = None
        
        # Extract existing photos to keep (sent as JSON array from frontend)
        existing_photos_to_keep = []
        existing_photos_json = form.get('existing_photos')
        if existing_photos_json:
            try:
                existing_photos_to_keep = json.loads(existing_photos_json)
            except (json.JSONDecodeError, ValueError) as e:
                log_exception_if_dev(logger, "Failed to parse existing_photos", e)
                existing_photos_to_keep = []
        
        # Get photo files
        photo_files = []
        for key, value in form.items():
            if key.startswith('photo_') and hasattr(value, 'file'):
                photo_files.append(value)
        
        return await ServiceService.update_service_with_photos(user_id, service_id, service_data, photo_files, calendar_settings, request, client, existing_photos_to_keep)

    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to update service photos", e)
        raise HTTPException(status_code=500, detail="Failed to update service photos")


@router.get("/services/{service_id}/calendar")
@limiter.limit("2 per second")
async def get_service_calendar_settings(
    request: Request,
    service_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get calendar settings for a specific service
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")

        calendar_settings = await CalendarService.get_calendar_settings(service_id, user_id, client)
        
        return {
            "success": True,
            "calendar_settings": calendar_settings
        }

    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to get calendar settings", e)
        raise HTTPException(status_code=500, detail="Failed to get calendar settings")

