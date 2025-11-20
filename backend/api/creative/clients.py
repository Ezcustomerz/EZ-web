"""Clients router for creative endpoints"""
from fastapi import APIRouter, Request, HTTPException, Depends
from services.creative.client_service import ClientService
from schemas.creative import CreativeClientsListResponse
from core.limiter import limiter
from core.verify import require_auth
from typing import Dict, Any
from db.db_session import get_authenticated_client_dep
from supabase import Client

router = APIRouter()


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
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative clients: {str(e)}")

