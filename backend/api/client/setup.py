from fastapi import APIRouter, Request, HTTPException
from services.client.client_service import ClientController
from schemas.client import ClientSetupRequest

router = APIRouter()

@router.post("/setup")
async def setup_client_profile(request: Request, setup_request: ClientSetupRequest):
    """Set up client profile in the clients table"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await ClientController.setup_client_profile(user_id, setup_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set up client profile: {str(e)}")