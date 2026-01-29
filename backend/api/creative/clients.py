"""Clients router for creative endpoints"""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from services.creative.client_service import ClientService
from schemas.creative import CreativeClientsListResponse
from core.limiter import limiter
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from typing import Dict, Any
from db.db_session import get_authenticated_client_dep
from supabase import Client

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/clients", response_model=CreativeClientsListResponse)
@limiter.limit("2 per second")
async def get_creative_clients(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get all clients associated with the current creative
    Requires authentication - will return 401 if not authenticated.
    Uses authenticated client to respect RLS policies.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await ClientService.get_creative_clients(user_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to fetch creative clients", e)
        raise HTTPException(status_code=500, detail="Failed to fetch creative clients")

