"""Role management router for creative endpoints"""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from services.creative.creative_service import CreativeController
from core.limiter import limiter
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from typing import Dict, Any
from db.db_session import get_authenticated_client_dep
from supabase import Client

router = APIRouter()
logger = logging.getLogger(__name__)


@router.delete("/role")
@limiter.limit("1 per 10 seconds")
async def delete_creative_role(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Delete the creative role and all associated data
    Requires authentication - will return 401 if not authenticated.
    This is a permanent action that deletes:
    - Creative profile
    - All services and bundles
    - All service photos from storage
    - Profile photos from storage
    - Calendar settings and schedules
    - Client relationships
    - Bookings and notifications
    
    Note: This method is kept in CreativeController as it requires coordination
    across multiple services and is a complex deletion operation.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await CreativeController.delete_creative_role(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to delete creative role", e)
        raise HTTPException(status_code=500, detail="Failed to delete creative role")

