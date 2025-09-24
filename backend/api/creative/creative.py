from fastapi import APIRouter, Request, HTTPException, UploadFile, File
from services.creative.creative_service import CreativeController
from schemas.creative import CreativeClientsListResponse, CreativeServicesListResponse, CreateServiceRequest, CreateServiceResponse, DeleteServiceResponse, UpdateServiceResponse, CreativeProfileSettingsRequest, CreativeProfileSettingsResponse, ProfilePhotoUploadResponse, CreateBundleRequest, CreateBundleResponse, CreativeBundlesListResponse, UpdateBundleRequest, UpdateBundleResponse, DeleteBundleResponse, PublicServicesAndBundlesResponse

router = APIRouter()


@router.get("/profile")
async def get_creative_profile(request: Request):
    """Get the current user's creative profile"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.get_creative_profile(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative profile: {str(e)}")


@router.get("/profile/{user_id}")
async def get_creative_profile_by_id(user_id: str):
    """Get a creative profile by user ID (public endpoint for invite links)"""
    try:
        return await CreativeController.get_creative_profile(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative profile: {str(e)}")


@router.get("/clients", response_model=CreativeClientsListResponse)
async def get_creative_clients(request: Request):
    """Get all clients associated with the current creative"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.get_creative_clients(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative clients: {str(e)}")


@router.get("/services", response_model=PublicServicesAndBundlesResponse)
async def get_creative_services_and_bundles(request: Request):
    """Get all services and bundles associated with the current creative"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.get_creative_services_and_bundles(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative services and bundles: {str(e)}")


@router.get("/services/{user_id}", response_model=PublicServicesAndBundlesResponse)
async def get_creative_services_by_id(user_id: str):
    """Get all public services and bundles associated with a creative by user ID (public endpoint for invite links)"""
    try:
        return await CreativeController.get_public_creative_services_and_bundles(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative services and bundles: {str(e)}")


@router.post("/services", response_model=CreateServiceResponse)
async def create_service(request: Request, service_request: CreateServiceRequest):
    """Create a new service for the current creative"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.create_service(user_id, service_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create service: {str(e)}")


@router.post("/services/with-photos", response_model=CreateServiceResponse)
async def create_service_with_photos(request: Request):
    """Create a new service with photos in a single request"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.create_service_with_photos(user_id, request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create service: {str(e)}")


@router.delete("/services/{service_id}", response_model=DeleteServiceResponse)
async def delete_service(request: Request, service_id: str):
    """Soft delete a service for the current creative"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.delete_service(user_id, service_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete service: {str(e)}")




@router.put("/services/{service_id}", response_model=UpdateServiceResponse)
async def update_service(request: Request, service_id: str, service_request: CreateServiceRequest):
    """Update an existing service for the current creative"""
    try:
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        return await CreativeController.update_service(user_id, service_id, service_request)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update service: {str(e)}")


@router.get("/services/{service_id}/calendar")
async def get_service_calendar_settings(request: Request, service_id: str):
    """Get calendar settings for a specific service"""
    try:
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        calendar_settings = await CreativeController.get_calendar_settings(service_id, user_id)
        
        return {
            "success": True,
            "calendar_settings": calendar_settings
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get calendar settings: {str(e)}")


@router.put("/profile/settings", response_model=CreativeProfileSettingsResponse)
async def update_creative_profile_settings(request: Request, settings_request: CreativeProfileSettingsRequest):
    """Update creative profile settings including highlights, service display, and avatar settings"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.update_profile_settings(user_id, settings_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile settings: {str(e)}")


@router.post("/profile/upload-photo", response_model=ProfilePhotoUploadResponse)
async def upload_profile_photo(request: Request, file: UploadFile = File(...)):
    """Upload a profile photo for the creative"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.upload_profile_photo(user_id, file)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload profile photo: {str(e)}")


# Bundle endpoints
@router.post("/bundles", response_model=CreateBundleResponse)
async def create_bundle(request: Request, bundle_request: CreateBundleRequest):
    """Create a new bundle for the current creative"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.create_bundle(user_id, bundle_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bundle: {str(e)}")




@router.put("/bundles/{bundle_id}", response_model=UpdateBundleResponse)
async def update_bundle(request: Request, bundle_id: str, bundle_request: UpdateBundleRequest):
    """Update a bundle by ID"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.update_bundle(user_id, bundle_id, bundle_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bundle: {str(e)}")

@router.delete("/bundles/{bundle_id}", response_model=DeleteBundleResponse)
async def delete_bundle(request: Request, bundle_id: str):
    """Delete a bundle by ID"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.delete_bundle(user_id, bundle_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete bundle: {str(e)}")