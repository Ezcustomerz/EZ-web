from fastapi import APIRouter, Request, HTTPException
from services.creative.creative_service import CreativeController

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