from fastapi import APIRouter, Request, HTTPException, Depends
from services.advocate.advocate_service import AdvocateController
from core.verify import require_auth
from typing import Dict, Any

router = APIRouter()

@router.post("/setup")
async def setup_advocate_profile(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Set up advocate profile in the advocates table with hardcoded demo values
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await AdvocateController.setup_advocate_profile(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set up advocate profile: {str(e)}")