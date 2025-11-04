from fastapi import APIRouter, Request, HTTPException, Depends
from services.client.client_service import ClientController
from schemas.client import ClientSetupRequest
from core.verify import require_auth
from typing import Dict, Any

router = APIRouter()

@router.post("/setup")
async def setup_client_profile(
    request: Request,
    setup_request: ClientSetupRequest,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """Set up client profile in the clients table
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        return await ClientController.setup_client_profile(user_id, setup_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set up client profile: {str(e)}")