from fastapi import APIRouter, Request, HTTPException
from services.creative.creative_service import CreativeController
from schemas.creative import CreativeClientsListResponse, CreativeServicesListResponse, CreateServiceRequest, CreateServiceResponse, DeleteServiceResponse, ToggleServiceStatusRequest, ToggleServiceStatusResponse, UpdateServiceResponse

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


@router.get("/services", response_model=CreativeServicesListResponse)
async def get_creative_services(request: Request):
    """Get all services associated with the current creative"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.get_creative_services(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative services: {str(e)}")


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


@router.patch("/services/{service_id}/status", response_model=ToggleServiceStatusResponse)
async def toggle_service_status(request: Request, service_id: str, toggle_request: ToggleServiceStatusRequest):
    """Toggle service enabled/disabled status for the current creative"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.toggle_service_status(user_id, service_id, toggle_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle service status: {str(e)}")


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