from fastapi import APIRouter, Request, HTTPException
from services.advocate.advocate_service import AdvocateController

router = APIRouter()

@router.post("/setup")
async def setup_advocate_profile(request: Request):
    """Set up advocate profile in the advocates table with hardcoded demo values"""
    try:
        # Get user ID from JWT token
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return await AdvocateController.setup_advocate_profile(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set up advocate profile: {str(e)}")