from fastapi import HTTPException
from typing import List, Optional, Dict, Any
import logging
from supabase import Client
from db.db_session import db_admin
from schemas.notifications import NotificationResponse, UnreadCountResponse
from postgrest.exceptions import APIError
from services.email.email_service import email_service

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
    
    @staticmethod
    async def mark_as_read(
        user_id: str,
        notification_id: str,
        client: Client = None
    ) -> NotificationResponse:
        """
        Mark a notification as read.
        
        Args:
            user_id: The user ID who owns the notification
            notification_id: The notification ID to mark as read
            client: Authenticated Supabase client (required, respects RLS policies)
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # First, verify the notification exists and belongs to the user
            # Use service role client to check existence, then verify ownership
            notification_response = None
            notification_data = None
            
            try:
                notification_response = db_admin.table("notifications") \
                    .select("*") \
                    .eq("id", notification_id) \
                    .single() \
                    .execute()
                notification_data = notification_response.data if notification_response else None
            except APIError as api_error:
                # APIError from postgrest - the exception is raised with the notification dict
                # Based on the traceback: APIError({'id': '...', ...})
                # The dict is passed as the exception argument, so it should be in args[0]
                error_data = None
                
                # Check exception args first (the dict is passed as the first argument)
                if hasattr(api_error, 'args') and len(api_error.args) > 0:
                    first_arg = api_error.args[0]
                    # The dict might be directly in args[0]
                    if isinstance(first_arg, dict):
                        error_data = first_arg
                    # Or it might be a tuple/list containing the dict
                    elif isinstance(first_arg, (tuple, list)) and len(first_arg) > 0:
                        if isinstance(first_arg[0], dict):
                            error_data = first_arg[0]
                
                # If not in args, check if we can get it from the exception's __dict__
                if not error_data:
                    error_dict = api_error.__dict__ if hasattr(api_error, '__dict__') else {}
                    # Look for any dict values that might contain the notification
                    for key, value in error_dict.items():
                        if isinstance(value, dict) and 'id' in value:
                            error_data = value
                            break
                
                # If still not found, try to extract from string representation
                if not error_data:
                    error_str = str(api_error)
                    # The error string might be the dict representation
                    if error_str.startswith('{') and 'id' in error_str:
                        import json
                        try:
                            error_data = json.loads(error_str)
                        except:
                            # Try ast.literal_eval as fallback
                            import ast
                            try:
                                error_data = ast.literal_eval(error_str)
                            except:
                                pass
                
                if error_data and isinstance(error_data, dict) and 'id' in error_data:
                    # The error contains notification data - use it directly
                    notification_data = error_data
                else:
                    logger.error(f"Could not extract notification data from APIError", exc_info=True)
                    raise HTTPException(status_code=404, detail="Notification not found")
            except Exception as fetch_error:
                logger.error(f"Error fetching notification: {fetch_error}", exc_info=True)
                raise HTTPException(status_code=404, detail="Notification not found")
            
            # Get notification data from response if we have it
            if notification_response and notification_response.data:
                notification_data = notification_response.data
            
            if not notification_data:
                raise HTTPException(status_code=404, detail="Notification not found")
            
            # Verify the notification belongs to this user (security check)
            if notification_data.get("recipient_user_id") != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to update this notification")
            
            # Update the notification to mark it as read
            # Use service role client to bypass RLS since we've already verified ownership
            from datetime import datetime
            try:
                update_response = db_admin.table("notifications") \
                    .update({
                        "is_read": True,
                        "updated_at": datetime.utcnow().isoformat()
                    }) \
                    .eq("id", notification_id) \
                    .eq("recipient_user_id", user_id) \
                    .execute()
            except Exception as update_error:
                logger.error(f"Error updating notification in database: {update_error}", exc_info=True)
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to update notification: {str(update_error)}"
                )
            
            if not update_response.data or len(update_response.data) == 0:
                logger.error(f"Update response was empty for notification {notification_id}")
                raise HTTPException(status_code=500, detail="Failed to update notification: no data returned")
            
            # Use the notification data we already have and update is_read and updated_at
            # This avoids potential issues with the update response format
            updated_notification = notification_data.copy()
            updated_notification["is_read"] = True
            updated_notification["updated_at"] = datetime.utcnow().isoformat()
            
            # Create response, filtering out any extra fields that aren't in the schema
            try:
                # Convert datetime objects to ISO format strings if needed
                created_at = updated_notification.get("created_at")
                updated_at = updated_notification.get("updated_at")
                
                if created_at and not isinstance(created_at, str):
                    if isinstance(created_at, datetime):
                        created_at = created_at.isoformat()
                    else:
                        created_at = str(created_at)
                
                if updated_at and not isinstance(updated_at, str):
                    if isinstance(updated_at, datetime):
                        updated_at = updated_at.isoformat()
                    else:
                        updated_at = str(updated_at)
                
                # Build the response dict with only the fields expected by NotificationResponse
                response_data = {
                    "id": str(updated_notification.get("id")),
                    "recipient_user_id": str(updated_notification.get("recipient_user_id")),
                    "notification_type": str(updated_notification.get("notification_type")),
                    "title": str(updated_notification.get("title")),
                    "message": str(updated_notification.get("message")),
                    "is_read": True,  # We know this is True since we just set it
                    "related_user_id": str(updated_notification.get("related_user_id")) if updated_notification.get("related_user_id") else None,
                    "related_entity_id": str(updated_notification.get("related_entity_id")) if updated_notification.get("related_entity_id") else None,
                    "related_entity_type": str(updated_notification.get("related_entity_type")) if updated_notification.get("related_entity_type") else None,
                    "metadata": updated_notification.get("metadata", {}) or {},
                    "created_at": created_at,
                    "updated_at": updated_at,
                }
                
                # Validate all required fields are present
                required_fields = ["id", "recipient_user_id", "notification_type", "title", "message", "is_read", "created_at", "updated_at"]
                missing_fields = [field for field in required_fields if response_data.get(field) is None]
                if missing_fields:
                    raise ValueError(f"Missing required fields: {missing_fields}")
                
                return NotificationResponse(**response_data)
            except ValueError as validation_error:
                logger.error(f"Validation error creating NotificationResponse: {validation_error}", exc_info=True)
                raise HTTPException(
                    status_code=500, 
                    detail=f"Notification marked as read but response validation failed: {str(validation_error)}"
                )
            except Exception as validation_error:
                logger.error(f"Unexpected error creating NotificationResponse: {type(validation_error).__name__}: {validation_error}", exc_info=True)
                raise HTTPException(
                    status_code=500, 
                    detail="Notification marked as read but response validation failed"
                )
            
        except HTTPException:
            raise
        except Exception as e:
            # Extract error message safely - avoid including large data structures
            if isinstance(e, Exception):
                error_message = str(e)
                # If the error message contains a dict representation, truncate it
                if error_message.startswith('{') and len(error_message) > 200:
                    error_message = "Error occurred (details logged)"
            elif isinstance(e, str):
                error_message = e
                if error_message.startswith('{') and len(error_message) > 200:
                    error_message = "Error occurred (details logged)"
            else:
                error_message = "An unexpected error occurred"
            
            # Log the full error with exception info
            logger.error(f"Error marking notification as read: {type(e).__name__}: {e}", exc_info=True)
            
            # Return a clean error message without potentially large data structures
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to mark notification as read: {error_message}"
            )
    
    @staticmethod
    async def send_notification_email(
        notification_data: Dict[str, Any],
        recipient_email: Optional[str] = None,
        recipient_name: Optional[str] = None,
        client: Optional[Client] = None
    ) -> bool:
        """
        Send an email notification when a notification is created.
        This is a helper function that should be called after creating a notification.
        
        Args:
            notification_data: The notification data dictionary (from database)
            recipient_email: Recipient's email address (optional, will be fetched if not provided)
            recipient_name: Recipient's display name (optional, will be fetched if not provided)
            client: Supabase client for fetching user data (optional)
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        try:
            recipient_user_id = notification_data.get('recipient_user_id')
            notification_type = notification_data.get('notification_type')
            title = notification_data.get('title')
            message = notification_data.get('message')
            target_roles = notification_data.get('target_roles', [])
            related_entity_id = notification_data.get('related_entity_id')
            related_entity_type = notification_data.get('related_entity_type')
            metadata = notification_data.get('metadata', {}) or {}
            
            # Determine recipient role from target_roles
            recipient_role = None
            if target_roles:
                # Use the first role in target_roles (usually only one role per notification)
                recipient_role = target_roles[0] if target_roles else None
            
            # If no role determined, skip email (shouldn't happen, but safety check)
            if not recipient_role:
                logger.warning(f"Cannot send notification email - no recipient role determined for notification {notification_data.get('id')}")
                return False
            
            # Fetch recipient email and name if not provided
            if not recipient_email or not recipient_name:
                if client and recipient_user_id:
                    try:
                        # Try to get from users table first
                        user_response = client.table('users').select('email, name').eq('user_id', recipient_user_id).single().execute()
                        if user_response.data:
                            if not recipient_email:
                                recipient_email = user_response.data.get('email')
                            if not recipient_name:
                                recipient_name = user_response.data.get('name')
                        
                        # If still missing, try to get from role-specific tables
                        if recipient_role == 'client' and (not recipient_email or not recipient_name):
                            client_response = client.table('clients').select('email, display_name').eq('user_id', recipient_user_id).single().execute()
                            if client_response.data:
                                if not recipient_email:
                                    recipient_email = client_response.data.get('email')
                                if not recipient_name:
                                    recipient_name = client_response.data.get('display_name')
                        elif recipient_role == 'creative' and (not recipient_email or not recipient_name):
                            creative_response = client.table('creatives').select('primary_contact, display_name').eq('user_id', recipient_user_id).single().execute()
                            if creative_response.data:
                                if not recipient_email:
                                    recipient_email = creative_response.data.get('primary_contact')
                                if not recipient_name:
                                    recipient_name = creative_response.data.get('display_name')
                    except Exception as fetch_error:
                        logger.warning(f"Failed to fetch recipient info for email: {str(fetch_error)}")
            
            # If still no email, skip sending
            if not recipient_email:
                logger.warning(f"Cannot send notification email - no email found for user {recipient_user_id}")
                return False
            
            # Extract booking_id or payment_request_id from metadata or related_entity_id
            booking_id = None
            payment_request_id = None
            
            if related_entity_type == 'booking' and related_entity_id:
                booking_id = str(related_entity_id)
            elif related_entity_type == 'payment_request' and related_entity_id:
                payment_request_id = str(related_entity_id)
            else:
                # Try to get from metadata
                booking_id = metadata.get('booking_id') or metadata.get('order_id')
                payment_request_id = metadata.get('payment_request_id')
            
            # Send the email
            return await email_service.send_notification_email(
                to_email=recipient_email,
                notification_type=notification_type,
                title=title,
                message=message,
                recipient_role=recipient_role,
                recipient_name=recipient_name,
                booking_id=booking_id,
                payment_request_id=payment_request_id,
                metadata=metadata
            )
            
        except Exception as e:
            # Log error but don't fail notification creation
            logger.error(f"Failed to send notification email: {str(e)}")
            return False

