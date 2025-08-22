from fastapi import APIRouter, Request, HTTPException
from services.creative.creative_service import CreativeController
from schemas.creative import CreativeSetupRequest

router = APIRouter()

@router.post("/setup")
async def setup_creative_profile(request: Request, setup_request: CreativeSetupRequest):
    """Set up creative profile in the creatives table"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await CreativeController.setup_creative_profile(user_id, setup_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set up creative profile: {str(e)}")