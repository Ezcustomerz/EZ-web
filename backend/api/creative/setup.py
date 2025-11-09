from fastapi import APIRouter, Request, HTTPException, Depends
from services.creative.creative_service import CreativeController
from schemas.creative import CreativeSetupRequest
from core.verify import require_auth
from db.db_session import get_authenticated_client_dep
from typing import Dict, Any
from supabase import Client

router = APIRouter()

@router.post("/setup")
async def setup_creative_profile(
    request: Request,
    setup_request: CreativeSetupRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Set up creative profile in the creatives table
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.setup_creative_profile(user_id, setup_request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set up creative profile: {str(e)}")