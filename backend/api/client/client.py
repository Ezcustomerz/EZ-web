from fastapi import APIRouter, Request, HTTPException
from services.client.client_service import ClientController
from schemas.client import ClientCreativesListResponse

router = APIRouter()

@router.get("/profile")
async def get_client_profile(request: Request):
    """Get the current user's client profile"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await ClientController.get_client_profile(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch client profile: {str(e)}")

@router.get("/creatives", response_model=ClientCreativesListResponse)
async def get_client_creatives(request: Request):
    """Get all creatives connected to the current client"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await ClientController.get_client_creatives(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch client creatives: {str(e)}")

@router.get("/connected-services", response_model=dict)
async def get_connected_services(request: Request):
    """Get all services from creatives connected to the current client"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await ClientController.get_connected_services(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch connected services: {str(e)}")