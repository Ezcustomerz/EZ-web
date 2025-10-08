from fastapi import APIRouter, Request, HTTPException
from services.advocate.advocate_service import AdvocateController
from core.limiter import limiter

router = APIRouter()

@router.get("/profile")
@limiter.limit("2 per second")
async def get_advocate_profile(request: Request):
    """Get the current user's advocate profile"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await AdvocateController.get_advocate_profile(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch advocate profile: {str(e)}")