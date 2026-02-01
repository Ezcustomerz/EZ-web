import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict, Any, Optional
from supabase import Client
from core.limiter import limiter
from core.verify import require_auth
from core.safe_errors import log_exception_if_dev
from db.db_session import get_authenticated_client_dep
from services.invite import InviteController
from schemas.invite import (
    GenerateInviteResponse,
    ValidateInviteResponse,
    AcceptInviteResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/invite", tags=["invite"])


@router.post("/generate", response_model=GenerateInviteResponse)
@limiter.limit("2 per second")
async def generate_invite_link(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Generate an invite link for a creative to invite clients
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await InviteController.generate_invite_link(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error generating invite link", e)
        raise HTTPException(status_code=500, detail="Failed to generate invite link")


@router.get("/validate/{invite_token}", response_model=ValidateInviteResponse)
@limiter.limit("2 per second")
async def validate_invite_token(
    invite_token: str, 
    request: Request,
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Validate an invite token and return creative information.
    Public endpoint - authentication is optional but will provide additional user context if available.
    Uses authenticated client with RLS policies when user is authenticated.
    """
    try:
        # Client is always provided via dependency - authenticated if token exists, anon otherwise
        
        # Check if there's an authenticated user and their roles
        user_info = None
        if hasattr(request.state, 'user') and request.state.user:
            user_id = request.state.user.get('sub')
            if user_id:
                # Get user roles from database using authenticated client (respects RLS)
                try:
                    # Client respects RLS policy "public_users_select_own"
                    # This policy allows users to SELECT their own user record (user_id = auth.uid())
                    user_response = client.table("users") \
                        .select("roles") \
                        .eq("user_id", user_id) \
                        .single() \
                        .execute()
                    
                    if user_response.data:
                        user_info = {
                            "user_id": user_id,
                            "roles": user_response.data.get('roles', []),
                            "has_client_role": 'client' in user_response.data.get('roles', [])
                        }
                    else:
                        # User authenticated but not found in database - log this as it's a data inconsistency
                        logger.warning(f"Authenticated user {user_id} not found in users table")
                except Exception as e:
                    # Log the error but don't fail the request since user info is optional
                    log_exception_if_dev(logger, "Error fetching user info for optional auth in validate endpoint", e)
        
        # Pass client to service method - always set (authenticated or anon)
        # RLS policy "Allow public to read creative profiles" allows anon users to read
        return await InviteController.validate_invite_token(invite_token, user_info, client)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error validating invite token", e)
        raise HTTPException(status_code=500, detail="Failed to validate invite token")


@router.post("/accept/{invite_token}", response_model=AcceptInviteResponse)
@limiter.limit("2 per second")
async def accept_invite(
    invite_token: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Accept an invite and create the creative-client relationship
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await InviteController.accept_invite(invite_token, user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error accepting invite", e)
        raise HTTPException(status_code=500, detail="Failed to accept invite")


@router.post("/accept-after-role-setup/{invite_token}", response_model=AcceptInviteResponse)
@limiter.limit("2 per second")
async def accept_invite_after_role_setup(
    invite_token: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Accept an invite after user has set up their client role
    This is called after the user completes client role setup
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await InviteController.accept_invite_after_role_setup(invite_token, user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error accepting invite after role setup", e)
        raise HTTPException(status_code=500, detail="Failed to accept invite after role setup")

