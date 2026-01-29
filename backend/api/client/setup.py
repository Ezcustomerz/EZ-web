from fastapi import APIRouter, Request, HTTPException, Depends
from services.client.client_service import ClientController
from schemas.client import ClientSetupRequest
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from db.db_session import get_authenticated_client_dep
from typing import Dict, Any
from supabase import Client
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/setup")
async def setup_client_profile(
    request: Request,
    setup_request: ClientSetupRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Set up client profile in the clients table
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ClientController.setup_client_profile(user_id, setup_request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to set up client profile", e)
        raise HTTPException(status_code=500, detail="Failed to set up client profile")