from fastapi import APIRouter, Request, HTTPException
from services.client.client_service import ClientController

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
