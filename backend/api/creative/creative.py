from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Depends
from services.creative.creative_service import CreativeController
from schemas.creative import CreativeClientsListResponse, CreativeServicesListResponse, CreateServiceRequest, CreateServiceResponse, DeleteServiceResponse, UpdateServiceResponse, CreativeProfileSettingsRequest, CreativeProfileSettingsResponse, ProfilePhotoUploadResponse, CreateBundleRequest, CreateBundleResponse, CreativeBundlesListResponse, UpdateBundleRequest, UpdateBundleResponse, DeleteBundleResponse, PublicServicesAndBundlesResponse, CalendarSettingsRequest
from core.limiter import limiter
from core.verify import require_auth
from typing import Dict, Any
from db.db_session import get_authenticated_client_dep
from supabase import Client

router = APIRouter()


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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.get_creative_profile(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative profile: {str(e)}")


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
        # Client is always provided via dependency - authenticated if token exists, anon otherwise
        # If user is authenticated, they get benefits of authenticated RLS policies
        return await CreativeController.get_creative_profile(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative profile: {str(e)}")


@router.get("/clients", response_model=CreativeClientsListResponse)
@limiter.limit("2 per second")
async def get_creative_clients(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get all clients associated with the current creative
    Requires authentication - will return 401 if not authenticated.
    Uses authenticated client to respect RLS policies.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.get_creative_clients(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative clients: {str(e)}")


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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.get_creative_services_and_bundles(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative services and bundles: {str(e)}")


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
        # Client is always provided via dependency - authenticated if token exists, anon otherwise
        # Public read policy allows anonymous access
        return await CreativeController.get_creative_services_and_bundles(user_id, client, public_only=True)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative services and bundles: {str(e)}")


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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.create_service(user_id, service_request, request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create service: {str(e)}")


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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.create_service_with_photos(user_id, request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create service: {str(e)}")


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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.delete_service(user_id, service_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete service: {str(e)}")




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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")

        return await CreativeController.update_service(user_id, service_id, service_request, request, client)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update service: {str(e)}")


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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
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
            'payment_option': form.get('payment_option', 'later')
        }
        
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
        
        # Extract existing photos to keep (sent as JSON array from frontend)
        existing_photos_to_keep = []
        existing_photos_json = form.get('existing_photos')
        if existing_photos_json:
            try:
                import json
                existing_photos_to_keep = json.loads(existing_photos_json)
            except (json.JSONDecodeError, ValueError) as e:
                print(f"Warning: Failed to parse existing_photos: {e}")
                existing_photos_to_keep = []
        
        # Get photo files
        photo_files = []
        for key, value in form.items():
            if key.startswith('photo_') and hasattr(value, 'file'):
                photo_files.append(value)
        
        return await CreativeController.update_service_with_photos(user_id, service_id, service_data, photo_files, calendar_settings, request, client, existing_photos_to_keep)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update service photos: {str(e)}")


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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")

        calendar_settings = await CreativeController.get_calendar_settings(service_id, user_id, client)
        
        return {
            "success": True,
            "calendar_settings": calendar_settings
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get calendar settings: {str(e)}")


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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.update_profile_settings(user_id, settings_request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile settings: {str(e)}")


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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.upload_profile_photo(user_id, file, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload profile photo: {str(e)}")


# Bundle endpoints
@router.post("/bundles", response_model=CreateBundleResponse)
@limiter.limit("2 per second")
async def create_bundle(
    request: Request,
    bundle_request: CreateBundleRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Create a new bundle for the current creative
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.create_bundle(user_id, bundle_request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bundle: {str(e)}")




@router.put("/bundles/{bundle_id}", response_model=UpdateBundleResponse)
@limiter.limit("2 per second")
async def update_bundle(
    request: Request,
    bundle_id: str,
    bundle_request: UpdateBundleRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Update a bundle by ID
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.update_bundle(user_id, bundle_id, bundle_request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bundle: {str(e)}")

@router.delete("/bundles/{bundle_id}", response_model=DeleteBundleResponse)
@limiter.limit("2 per second")
async def delete_bundle(
    request: Request,
    bundle_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Delete a bundle by ID
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.delete_bundle(user_id, bundle_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete bundle: {str(e)}")