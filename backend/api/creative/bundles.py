"""Bundles router for creative endpoints"""
from fastapi import APIRouter, Request, HTTPException, Depends
from services.creative.bundle_service import BundleService
from schemas.creative import (
    CreateBundleRequest, CreateBundleResponse,
    UpdateBundleRequest, UpdateBundleResponse, DeleteBundleResponse
)
from core.limiter import limiter
from core.verify import require_auth
from typing import Dict, Any
from db.db_session import get_authenticated_client_dep
from supabase import Client

router = APIRouter()


@router.post("/bundles", response_model=CreateBundleResponse)
@limiter.limit("2 per second")
async def create_bundle(
    request: Request,
    bundle_request: CreateBundleRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Create a new bundle for the current creative
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BundleService.create_bundle(user_id, bundle_request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bundle: {str(e)}")


@router.put("/bundles/{bundle_id}", response_model=UpdateBundleResponse)
@limiter.limit("2 per second")
async def update_bundle(
    request: Request,
    bundle_id: str,
    bundle_request: UpdateBundleRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Update a bundle by ID
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BundleService.update_bundle(user_id, bundle_id, bundle_request, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bundle: {str(e)}")


@router.delete("/bundles/{bundle_id}", response_model=DeleteBundleResponse)
@limiter.limit("2 per second")
async def delete_bundle(
    request: Request,
    bundle_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Delete a bundle by ID
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await BundleService.delete_bundle(user_id, bundle_id, client)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete bundle: {str(e)}")

