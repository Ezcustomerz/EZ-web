from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from db.db_session import db_admin
from core.limiter import limiter
from core.verify import require_auth

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
    current_user: Dict[str, Any] = Depends(require_auth),
    limit: Optional[int] = 50,
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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
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
        
        # Filter notifications by target_roles first
        filtered_notifications = []
        booking_ids = []
        user_ids_needing_avatar_color = set()
        
        for notification in result.data:
            target_roles = notification.get('target_roles', [])
            
            # Check if notification should be included based on target_roles
            should_include = False
            if not target_roles or len(target_roles) == 0:
                should_include = True
            elif filter_role:
                if filter_role in target_roles:
                    should_include = True
            else:
                if any(role in target_roles for role in user_roles):
                    should_include = True
            
            if not should_include:
                continue
            
            filtered_notifications.append(notification)
            
            # Collect IDs for batch fetching
            related_entity_type = notification.get('related_entity_type')
            related_entity_id = notification.get('related_entity_id')
            related_user_id = notification.get('related_user_id')
            
            if related_entity_type == 'booking' and related_entity_id:
                booking_ids.append(related_entity_id)
            
            # Collect user IDs that might need avatar colors
            if related_user_id:
                user_ids_needing_avatar_color.add(related_user_id)
        
        # Batch fetch all bookings that we need
        bookings_map = {}
        if booking_ids:
            try:
                bookings_response = db_admin.table("bookings") \
                    .select("id, service_id, creative_user_id") \
                    .in_("id", booking_ids) \
                    .execute()
                
                if bookings_response.data:
                    for booking in bookings_response.data:
                        bookings_map[booking['id']] = booking
                        # Also collect creative_user_id for avatar colors
                        if booking.get('creative_user_id'):
                            user_ids_needing_avatar_color.add(booking['creative_user_id'])
            except Exception as e:
                print(f"Error batch fetching bookings: {e}")
        
        # Batch fetch all service colors
        services_map = {}
        service_ids = []
        if bookings_map:
            service_ids = [b.get('service_id') for b in bookings_map.values() if b.get('service_id')]
            service_ids = list(set(service_ids))  # Remove duplicates
        
        if service_ids:
            try:
                services_response = db_admin.table("creative_services") \
                    .select("id, color") \
                    .in_("id", service_ids) \
                    .execute()
                
                if services_response.data:
                    for service in services_response.data:
                        services_map[service['id']] = service
            except Exception as e:
                print(f"Error batch fetching service colors: {e}")
        
        # Batch fetch all creative avatar colors
        creatives_map = {}
        if user_ids_needing_avatar_color:
            try:
                creatives_response = db_admin.table("creatives") \
                    .select("user_id, avatar_background_color") \
                    .in_("user_id", list(user_ids_needing_avatar_color)) \
                    .execute()
                
                if creatives_response.data:
                    for creative in creatives_response.data:
                        creatives_map[creative['user_id']] = creative
            except Exception as e:
                print(f"Error batch fetching creative avatar colors: {e}")
        
        # Enrich notifications with batch-fetched data
        for notification in filtered_notifications:
            notification_metadata = notification.get('metadata', {}) or {}
            related_entity_type = notification.get('related_entity_type')
            related_entity_id = notification.get('related_entity_id')
            related_user_id = notification.get('related_user_id')
            
            # Get service color from booking if this is a booking notification
            if related_entity_type == 'booking' and related_entity_id:
                booking = bookings_map.get(related_entity_id)
                if booking:
                    service_id = booking.get('service_id')
                    creative_user_id = booking.get('creative_user_id')
                    
                    # Get service color
                    if service_id:
                        service = services_map.get(service_id)
                        if service and service.get('color'):
                            notification_metadata['service_color'] = service['color']
                    
                    # Get creative avatar color from booking
                    if creative_user_id:
                        creative = creatives_map.get(creative_user_id)
                        if creative and creative.get('avatar_background_color'):
                            notification_metadata['creative_avatar_background_color'] = creative['avatar_background_color']
            
            # Get creative avatar color from related_user_id if not already set
            if related_user_id and 'creative_avatar_background_color' not in notification_metadata:
                creative = creatives_map.get(related_user_id)
                if creative and creative.get('avatar_background_color'):
                    notification_metadata['creative_avatar_background_color'] = creative['avatar_background_color']
            
            # Update notification with enriched metadata
            notification['metadata'] = notification_metadata
        
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
    current_user: Dict[str, Any] = Depends(require_auth),
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
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
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

