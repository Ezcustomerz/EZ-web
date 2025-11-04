from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from db.db_session import db_admin
from core.limiter import limiter

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationResponse(BaseModel):
    id: str
    recipient_user_id: str
    notification_type: str
    title: str
    message: str
    is_read: bool
    related_user_id: Optional[str] = None
    related_entity_id: Optional[str] = None
    related_entity_type: Optional[str] = None
    metadata: dict = {}
    created_at: str
    updated_at: str


@router.get("", response_model=List[NotificationResponse])
@limiter.limit("10 per second")
async def get_notifications(
    request: Request,
    limit: Optional[int] = 50,
    offset: Optional[int] = 0,
    unread_only: Optional[bool] = False,
    role_context: Optional[str] = None
):
    """
    Get notifications for the current user, filtered by their role context.
    
    Args:
        role_context: Optional role context ('client', 'creative', 'advocate'). 
                     If provided, only notifications with this role in target_roles will be returned.
                     If not provided, returns notifications for all of the user's roles.
    """
    try:
        # Get user ID from JWT token
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Get user roles from database to filter notifications
        user_response = db_admin.table("users") \
            .select("roles") \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_roles = user_response.data.get('roles', [])
        if not user_roles:
            # If user has no roles, return empty list
            return []
        
        # If role_context is provided, validate it's one of the user's roles
        if role_context:
            if role_context not in user_roles:
                # User doesn't have this role, return empty list
                return []
            # Use role_context as the filter role
            filter_role = role_context
        else:
            # No role context provided - filter by all user roles (backward compatibility)
            filter_role = None
        
        # Build query - filter by recipient_user_id
        query = db_admin.table("notifications") \
            .select("*") \
            .eq("recipient_user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .offset(offset)
        
        # Filter by read status if requested
        if unread_only:
            query = query.eq("is_read", False)
        
        result = query.execute()
        
        if not result.data:
            return []
        
        # Filter notifications by target_roles
        filtered_notifications = []
        for notification in result.data:
            target_roles = notification.get('target_roles', [])
            
            # If target_roles is empty or null, include it (backward compatibility)
            if not target_roles or len(target_roles) == 0:
                filtered_notifications.append(notification)
            # If role_context is provided, check if it's in target_roles
            elif filter_role:
                if filter_role in target_roles:
                    filtered_notifications.append(notification)
            # If no role_context, check if any of the user's roles are in target_roles
            else:
                if any(role in target_roles for role in user_roles):
                    filtered_notifications.append(notification)
        
        return filtered_notifications
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")


@router.get("/unread-count")
@limiter.limit("10 per second")
async def get_unread_count(
    request: Request,
    role_context: Optional[str] = None
):
    """
    Get count of unread notifications for the current user, filtered by role context.
    
    Args:
        role_context: Optional role context ('client', 'creative', 'advocate'). 
                     If provided, only counts notifications with this role in target_roles.
    """
    try:
        # Get user ID from JWT token
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Get user roles from database to filter notifications
        user_response = db_admin.table("users") \
            .select("roles") \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        if not user_response.data:
            return {"count": 0}
        
        user_roles = user_response.data.get('roles', [])
        if not user_roles:
            return {"count": 0}
        
        # If role_context is provided, validate it's one of the user's roles
        if role_context:
            if role_context not in user_roles:
                # User doesn't have this role, return 0
                return {"count": 0}
            filter_role = role_context
        else:
            filter_role = None
        
        result = db_admin.table("notifications") \
            .select("id, target_roles") \
            .eq("recipient_user_id", user_id) \
            .eq("is_read", False) \
            .execute()
        
        if not result.data:
            return {"count": 0}
        
        # Filter notifications by target_roles
        filtered_count = 0
        for notification in result.data:
            target_roles = notification.get('target_roles', [])
            # If target_roles is empty or null, include it (backward compatibility)
            if not target_roles or len(target_roles) == 0:
                filtered_count += 1
            # If role_context is provided, check if it's in target_roles
            elif filter_role:
                if filter_role in target_roles:
                    filtered_count += 1
            # If no role_context, check if any of the user's roles are in target_roles
            else:
                if any(role in target_roles for role in user_roles):
                    filtered_count += 1
        
        return {
            "count": filtered_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching unread count: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch unread count: {str(e)}")

