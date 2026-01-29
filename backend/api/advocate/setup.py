from fastapi import APIRouter, Request, HTTPException, Depends
from services.advocate.advocate_service import AdvocateController
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from typing import Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

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
        log_exception_if_dev(logger, "Failed to set up advocate profile", e)
        raise HTTPException(status_code=500, detail="Failed to set up advocate profile")