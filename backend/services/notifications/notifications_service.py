from fastapi import HTTPException
from typing import List, Optional, Dict, Any
import logging
from supabase import Client
from schemas.notifications import NotificationResponse, UnreadCountResponse

logger = logging.getLogger(__name__)


class NotificationsController:
    """Controller for notification-related operations"""
    
    @staticmethod
    async def get_notifications(
        user_id: str,
        limit: int = 25,
        offset: int = 0,
        unread_only: bool = False,
        role_context: Optional[str] = None,
        client: Client = None
    ) -> List[NotificationResponse]:
        """
        Get notifications for the current user, filtered by their role context.
        
        Args:
            user_id: The user ID to fetch notifications for
            limit: Maximum number of notifications to return
            offset: Number of notifications to skip
            unread_only: If True, only return unread notifications
            role_context: Optional role context ('client', 'creative', 'advocate'). 
                         If provided, only notifications with this role in target_roles will be returned.
                         If not provided, returns notifications for all of the user's roles.
            client: Authenticated Supabase client (required, respects RLS policies)
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Get user roles from database to filter notifications (using authenticated client - respects RLS)
            user_response = client.table("users") \
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
            
            # Build query - filter by recipient_user_id (using authenticated client - respects RLS)
            query = client.table("notifications") \
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
            
            # Batch fetch all bookings that we need (using authenticated client - respects RLS)
            bookings_map = {}
            if booking_ids:
                try:
                    bookings_response = client.table("bookings") \
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
                    logger.error(f"Error batch fetching bookings: {e}")
            
            # Batch fetch all service colors
            services_map = {}
            service_ids = []
            if bookings_map:
                service_ids = [b.get('service_id') for b in bookings_map.values() if b.get('service_id')]
                service_ids = list(set(service_ids))  # Remove duplicates
            
            if service_ids:
                try:
                    # Batch fetch service colors (using authenticated client - respects RLS)
                    services_response = client.table("creative_services") \
                        .select("id, color") \
                        .in_("id", service_ids) \
                        .execute()
                    
                    if services_response.data:
                        for service in services_response.data:
                            services_map[service['id']] = service
                except Exception as e:
                    logger.error(f"Error batch fetching service colors: {e}")
            
            # Batch fetch all creative avatar colors (using authenticated client - respects RLS)
            creatives_map = {}
            if user_ids_needing_avatar_color:
                try:
                    creatives_response = client.table("creatives") \
                        .select("user_id, avatar_background_color") \
                        .in_("user_id", list(user_ids_needing_avatar_color)) \
                        .execute()
                    
                    if creatives_response.data:
                        for creative in creatives_response.data:
                            creatives_map[creative['user_id']] = creative
                except Exception as e:
                    logger.error(f"Error batch fetching creative avatar colors: {e}")
            
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
            
            return [NotificationResponse(**n) for n in filtered_notifications]
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching notifications: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")
    
    @staticmethod
    async def get_unread_count(
        user_id: str,
        role_context: Optional[str] = None,
        client: Client = None
    ) -> UnreadCountResponse:
        """
        Get count of unread notifications for the current user, filtered by role context.
        
        Args:
            user_id: The user ID to count unread notifications for
            role_context: Optional role context ('client', 'creative', 'advocate'). 
                         If provided, only counts notifications with this role in target_roles.
            client: Authenticated Supabase client (required, respects RLS policies)
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Get user roles from database to filter notifications (using authenticated client - respects RLS)
            user_response = client.table("users") \
                .select("roles") \
                .eq("user_id", user_id) \
                .single() \
                .execute()
            
            if not user_response.data:
                return UnreadCountResponse(count=0)
            
            user_roles = user_response.data.get('roles', [])
            if not user_roles:
                return UnreadCountResponse(count=0)
            
            # If role_context is provided, validate it's one of the user's roles
            if role_context:
                if role_context not in user_roles:
                    # User doesn't have this role, return 0
                    return UnreadCountResponse(count=0)
                filter_role = role_context
            else:
                filter_role = None
            
            # Query unread notifications (using authenticated client - respects RLS)
            result = client.table("notifications") \
                .select("id, target_roles") \
                .eq("recipient_user_id", user_id) \
                .eq("is_read", False) \
                .execute()
            
            if not result.data:
                return UnreadCountResponse(count=0)
            
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
            
            return UnreadCountResponse(count=filtered_count)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching unread count: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch unread count: {str(e)}")

