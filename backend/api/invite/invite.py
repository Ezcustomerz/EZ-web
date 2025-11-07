from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict, Any, Optional
import logging
from core.limiter import limiter
from core.verify import require_auth
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
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Generate an invite link for a creative to invite clients
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await InviteController.generate_invite_link(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating invite link: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate invite link: {str(e)}")


@router.get("/validate/{invite_token}", response_model=ValidateInviteResponse)
@limiter.limit("2 per second")
async def validate_invite_token(invite_token: str, request: Request):
    """
    Validate an invite token and return creative information
    """
    try:
        # Check if there's an authenticated user and their roles
        user_info = None
        if hasattr(request.state, 'user') and request.state.user:
            user_id = request.state.user.get('sub')
            if user_id:
                # Get user roles from database
                try:
                    from db.db_session import db_admin
                    user_response = db_admin.table("users") \
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
                except Exception:
                    # User not found in database, continue without user_info
                    pass
        
        return await InviteController.validate_invite_token(invite_token, user_info)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating invite token: {e}")
        raise HTTPException(status_code=500, detail="Failed to validate invite token")


@router.post("/accept/{invite_token}", response_model=AcceptInviteResponse)
@limiter.limit("2 per second")
async def accept_invite(
    invite_token: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Accept an invite and create the creative-client relationship
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await InviteController.accept_invite(invite_token, user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting invite: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to accept invite: {str(e)}")


@router.post("/accept-after-role-setup/{invite_token}", response_model=AcceptInviteResponse)
@limiter.limit("2 per second")
async def accept_invite_after_role_setup(
    invite_token: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Accept an invite after user has set up their client role
    This is called after the user completes client role setup
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await InviteController.accept_invite_after_role_setup(invite_token, user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting invite after role setup: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to accept invite after role setup: {str(e)}")

