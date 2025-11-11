from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Optional, List, Dict, Any
import logging
from supabase import Client
from core.limiter import limiter
from core.verify import require_auth
from db.db_session import get_authenticated_client_dep
from services.notifications import NotificationsController
from schemas.notifications import NotificationResponse, UnreadCountResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationResponse])
@limiter.limit("10 per second")
async def get_notifications(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep),
    limit: Optional[int] = 25,
    offset: Optional[int] = 0,
    unread_only: Optional[bool] = False,
    role_context: Optional[str] = None
):
    """
    Get notifications for the current user, filtered by their role context.
    Requires authentication - will return 401 if not authenticated.
    
    Args:
        role_context: Optional role context ('client', 'creative', 'advocate'). 
                     If provided, only notifications with this role in target_roles will be returned.
                     If not provided, returns notifications for all of the user's roles.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await NotificationsController.get_notifications(
            user_id, limit, offset, unread_only, role_context, client
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")


@router.get("/unread-count", response_model=UnreadCountResponse)
@limiter.limit("10 per second")
async def get_unread_count(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep),
    role_context: Optional[str] = None
):
    """
    Get count of unread notifications for the current user, filtered by role context.
    Requires authentication - will return 401 if not authenticated.
    
    Args:
        role_context: Optional role context ('client', 'creative', 'advocate'). 
                     If provided, only counts notifications with this role in target_roles.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await NotificationsController.get_unread_count(user_id, role_context, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching unread count: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch unread count: {str(e)}")


@router.put("/{notification_id}/read", response_model=NotificationResponse)
@limiter.limit("20 per minute")
async def mark_notification_as_read(
    request: Request,
    notification_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Mark a notification as read.
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await NotificationsController.mark_as_read(user_id, notification_id, client)
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e) if isinstance(e, Exception) else repr(e)
        # Avoid including large data structures in error messages
        if error_msg.startswith('{') and len(error_msg) > 200:
            error_msg = "An error occurred while marking notification as read"
        logger.error(f"Error marking notification as read: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {error_msg}")