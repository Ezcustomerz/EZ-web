from typing import Dict, Any
from datetime import datetime
import logging
from fastapi import HTTPException
from supabase import Client
from core.safe_errors import log_exception_if_dev
from schemas.booking import (
    CreateBookingRequest, CreateBookingResponse,
    ApproveBookingResponse,
    RejectBookingResponse,
    CancelBookingResponse,
    SendPaymentReminderResponse
)

logger = logging.getLogger(__name__)

# NOTE: This service no longer uses db_admin - all operations use authenticated client
# RLS policies allow:
# - notifications INSERT: when recipient_user_id = auth.uid(), related_user_id = auth.uid(), 
#   or notification is related to a booking where user is client/creative
# - clients/users SELECT: when viewing users in your bookings
# - bookings: clients can INSERT/UPDATE their own, creatives can UPDATE their own


async def _send_notification_email(notification_data: Dict[str, Any], recipient_user_id: str, recipient_name: str, client: Client = None):
    """Helper function to send email after notification creation"""
    try:
        from services.notifications.notifications_service import NotificationsController
        # Get recipient email
        recipient_email = None
        if client:
            try:
                user_result = client.table('users').select('email').eq('user_id', recipient_user_id).single().execute()
                if user_result.data:
                    recipient_email = user_result.data.get('email')
            except:
                pass
        
        await NotificationsController.send_notification_email(
            notification_data=notification_data,
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            client=client
        )
    except Exception as e:
        log_exception_if_dev(logger, "Failed to send notification email", e)


class BookingManagementService:
    """Service for handling booking CRUD operations"""
    
    @staticmethod
    async def create_booking(user_id: str, booking_data: CreateBookingRequest, client: Client) -> CreateBookingResponse:
        """Create a new booking/order
        
        Args:
            user_id: The user ID creating the booking
            booking_data: The booking request data
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Get service details including creative_user_id
            service_response = client.table('creative_services')\
                .select('creative_user_id, price, payment_option, split_deposit_amount, title')\
                .eq('id', booking_data.service_id)\
                .single()\
                .execute()

            if not service_response.data:
                raise HTTPException(status_code=404, detail="Service not found")

            service = service_response.data
            payment_option = service['payment_option'] or 'later'
            
            # Calculate split deposit amount if payment option is split
            split_deposit_amount = None
            if payment_option == 'split':
                if service.get('split_deposit_amount') is not None:
                    split_deposit_amount = service['split_deposit_amount']
                else:
                    # Default to 50% if not specified
                    split_deposit_amount = round(float(service['price']) * 0.5, 2)

            # Prepare booking insert
            booking_insert = {
                'service_id': booking_data.service_id,
                'client_user_id': user_id,
                'creative_user_id': service['creative_user_id'],
                'price': service['price'],
                'payment_option': payment_option,
                'split_deposit_amount': split_deposit_amount,
                'notes': booking_data.notes,
                'client_status': 'placed',
                'creative_status': 'pending_approval',
                'payment_status': 'pending',
                'amount_paid': 0,
                'order_date': datetime.utcnow().isoformat(),
                'booking_date': booking_data.booking_date,
                'start_time': booking_data.start_time,
                'end_time': booking_data.end_time,
                'session_duration': booking_data.session_duration
            }
            
            # Insert booking into database
            booking_response = client.table('bookings')\
                .insert(booking_insert)\
                .execute()
            
            if not booking_response.data or len(booking_response.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to create booking")
            
            booking = booking_response.data[0]
            
            logger.info(f"Booking created successfully: {booking['id']} for user {user_id}")
            
            # Get client and creative display names for notifications
            client_response = client.table("clients") \
                .select("display_name") \
                .eq("user_id", user_id) \
                .single() \
                .execute()
            
            creative_response = client.table("creatives") \
                .select("display_name") \
                .eq("user_id", service['creative_user_id']) \
                .single() \
                .execute()
            
            client_display_name = client_response.data.get("display_name", "A client") if client_response.data else "A client"
            creative_display_name = creative_response.data.get("display_name", "A creative") if creative_response.data else "A creative"
            
            # Create notification for client
            client_notification_data = {
                "recipient_user_id": user_id,
                "notification_type": "booking_placed",
                "title": "Placed Booking",
                "message": f"Your booking for {service['title']} has been placed. Awaiting creative approval.",
                "is_read": False,
                "related_user_id": service['creative_user_id'],
                "related_entity_id": booking['id'],
                "related_entity_type": "booking",
                "target_roles": ["client"],
                "metadata": {
                    "service_title": service['title'],
                    "creative_display_name": creative_display_name,
                    "booking_id": str(booking['id']),
                    "price": str(service['price'])
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Create notification for creative
            creative_notification_data = {
                "recipient_user_id": service['creative_user_id'],
                "notification_type": "booking_created",
                "title": "New Booking Request",
                "message": f"{client_display_name} has placed a new booking for {service['title']} payment. Approval required.",
                "is_read": False,
                "related_user_id": user_id,
                "related_entity_id": booking['id'],
                "related_entity_type": "booking",
                "target_roles": ["creative"],
                "metadata": {
                    "service_title": service['title'],
                    "client_display_name": client_display_name,
                    "booking_id": str(booking['id']),
                    "price": str(service['price']),
                    "creative_status": booking.get('creative_status', 'pending_approval')  # Include status to determine which tab
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Create notifications (don't fail booking creation if notification creation fails)
            try:
                client_notif_result = client.table("notifications") \
                    .insert(client_notification_data) \
                    .execute()
                logger.info(f"Client notification created: {client_notif_result.data}")
                
                # Send email notification
                if client_notif_result.data:
                    from services.notifications.notifications_service import NotificationsController
                    await NotificationsController.send_notification_email(
                        notification_data=client_notification_data,
                        recipient_email=client_response.data.get('email') if client_response.data else None,
                        recipient_name=client_display_name,
                        client=client
                    )
            except Exception as notif_error:
                log_exception_if_dev(logger, "Failed to create client notification", notif_error)
            
            try:
                # Insert notification for creative using authenticated client
                # RLS policy allows: related_user_id = auth.uid() (client is the related_user)
                # OR booking relationship (client is the client_user_id of the booking)
                creative_notif_result = client.table("notifications") \
                    .insert(creative_notification_data) \
                    .execute()
                logger.info(f"Creative notification created: {creative_notif_result.data}")
                
                # Send email notification
                if creative_notif_result.data:
                    from services.notifications.notifications_service import NotificationsController
                    await NotificationsController.send_notification_email(
                        notification_data=creative_notification_data,
                        recipient_email=creative_response.data.get('primary_contact') if creative_response.data else None,
                        recipient_name=creative_display_name,
                        client=client
                    )
            except Exception as notif_error:
                log_exception_if_dev(logger, "Failed to create creative notification", notif_error)
            
            return CreateBookingResponse(
                success=True,
                message="Booking created successfully",
                booking_id=booking['id'],
                booking=booking
            )
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error creating booking", e)
            raise HTTPException(status_code=500, detail="Failed to create booking")

    @staticmethod
    async def approve_booking(user_id: str, booking_id: str, client: Client) -> ApproveBookingResponse:
        """Approve a booking/order
        
        Args:
            user_id: The creative user ID approving the booking
            booking_id: The booking ID to approve
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Fetch the booking to verify it exists and belongs to this creative
            booking_response = client.table('bookings')\
                .select('id, creative_user_id, client_user_id, service_id, creative_status, price, payment_option')\
                .eq('id', booking_id)\
                .single()\
                .execute()
            
            if not booking_response.data:
                raise HTTPException(status_code=404, detail="Booking not found")
            
            booking = booking_response.data
            
            # Verify the booking belongs to this creative
            if booking['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to approve this booking")
            
            # Check if booking can be approved
            current_status = booking.get('creative_status', 'pending_approval')
            if current_status not in ['pending_approval']:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot approve booking with status '{current_status}'. Only pending approvals can be approved."
                )
            
            # Determine new status based on payment option and price
            price = float(booking.get('price', 0))
            payment_option = booking.get('payment_option', 'later')
            
            if price == 0 or payment_option == 'later':
                creative_status = 'in_progress'
                client_status = 'in_progress'
            else:
                creative_status = 'awaiting_payment'
                client_status = 'payment_required'
            
            # Update booking status
            update_response = client.table('bookings')\
                .update({
                    'creative_status': creative_status,
                    'client_status': client_status,
                    'approved_at': datetime.utcnow().isoformat()
                })\
                .eq('id', booking_id)\
                .execute()
            
            if not update_response.data or len(update_response.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to update booking status")
            
            logger.info(f"Booking approved successfully: {booking_id} by creative {user_id}")
            
            # Get service, creative, and client details for notifications
            service_response = client.table('creative_services')\
                .select('title')\
                .eq('id', booking['service_id'])\
                .single()\
                .execute()
            
            creative_response = client.table('creatives')\
                .select('display_name')\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            
            # Get client display name - RLS allows viewing clients in your bookings
            client_response = client.table('clients')\
                .select('display_name')\
                .eq('user_id', booking['client_user_id'])\
                .single()\
                .execute()
            
            service_title = service_response.data.get('title', 'Service') if service_response.data else 'Service'
            creative_display_name = creative_response.data.get('display_name', 'Creative') if creative_response.data else 'Creative'
            client_display_name = client_response.data.get('display_name', 'A client') if client_response.data else 'A client'
            
            # Create appropriate notification
            if price == 0 or payment_option == 'later':
                notification_data = {
                    "recipient_user_id": booking['client_user_id'],
                    "notification_type": "booking_approved",
                    "title": "Booking Approved",
                    "message": f"{creative_display_name} has approved your booking for {service_title}. Your booking is confirmed!",
                    "is_read": False,
                    "related_user_id": user_id,
                    "related_entity_id": booking_id,
                    "related_entity_type": "booking",
                    "target_roles": ["client"],
                    "metadata": {
                        "service_title": service_title,
                        "creative_display_name": creative_display_name,
                        "booking_id": booking_id,
                        "price": str(price),
                        "payment_option": payment_option
                    },
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            else:
                notification_data = {
                    "recipient_user_id": booking['client_user_id'],
                    "notification_type": "payment_required",
                    "title": "Payment Required",
                    "message": f"{creative_display_name} has approved your booking for {service_title}. Please complete payment to start your service.",
                    "is_read": False,
                    "related_user_id": user_id,
                    "related_entity_id": booking_id,
                    "related_entity_type": "booking",
                    "target_roles": ["client"],
                    "metadata": {
                        "service_title": service_title,
                        "creative_display_name": creative_display_name,
                        "booking_id": booking_id,
                        "price": str(price),
                        "payment_option": payment_option
                    },
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            
            # Create notification for client
            # RLS allows: related_user_id = auth.uid() (creative is the related_user)
            try:
                notification_result = client.table("notifications")\
                    .insert(notification_data)\
                    .execute()
                logger.info(f"Client approval notification created: {notification_result.data}")
                
                # Send email notification
                if notification_result.data:
                    from services.notifications.notifications_service import NotificationsController
                    # Get client email - RLS allows viewing users in your bookings
                    client_user_result = client.table('users').select('email, name').eq('user_id', booking['client_user_id']).single().execute()
                    client_email = client_user_result.data.get('email') if client_user_result.data else None
                    await NotificationsController.send_notification_email(
                        notification_data=notification_data,
                        recipient_email=client_email,
                        recipient_name=client_display_name,
                        client=client
                    )
            except Exception as notif_error:
                log_exception_if_dev(logger, "Failed to create client approval notification", notif_error)
            
            # Create notification for creative confirming they approved the service
            # RLS allows: recipient_user_id = auth.uid() (notification for themselves)
            try:
                creative_notification_data = {
                    "recipient_user_id": user_id,
                    "notification_type": "booking_approved",
                    "title": "Service Approved",
                    "message": f"You have approved the booking for {service_title} from {client_display_name}.",
                    "is_read": False,
                    "related_user_id": booking['client_user_id'],
                    "related_entity_id": booking_id,
                    "related_entity_type": "booking",
                    "target_roles": ["creative"],
                    "metadata": {
                        "service_title": service_title,
                        "client_display_name": client_display_name,
                        "booking_id": booking_id,
                        "price": str(price),
                        "payment_option": payment_option,
                        "creative_status": creative_status  # Include status to determine which tab to navigate to
                    },
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                creative_notification_result = client.table("notifications")\
                    .insert(creative_notification_data)\
                    .execute()
                logger.info(f"Creative approval notification created: {creative_notification_result.data}")
                
                # Send email notification
                if creative_notification_result.data:
                    from services.notifications.notifications_service import NotificationsController
                    # Get creative email - user getting their own data via RLS
                    creative_user_result = client.table('users').select('email, name').eq('user_id', user_id).single().execute()
                    creative_email = creative_user_result.data.get('email') if creative_user_result.data else None
                    await NotificationsController.send_notification_email(
                        notification_data=creative_notification_data,
                        recipient_email=creative_email,
                        recipient_name=creative_display_name,
                        client=client
                    )
            except Exception as notif_error:
                log_exception_if_dev(logger, "Failed to create creative approval notification", notif_error)
            
            return ApproveBookingResponse(
                success=True,
                message="Booking approved successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error approving booking", e)
            raise HTTPException(status_code=500, detail="Failed to approve booking")

    @staticmethod
    async def reject_booking(user_id: str, booking_id: str, client: Client) -> RejectBookingResponse:
        """Reject a booking/order (creative-initiated)
        
        Updates creative_status to 'rejected' while leaving client_status unchanged.
        This maintains symmetry with cancel_booking which only updates client_status.
        
        Business Rule: Creatives can only reject bookings they haven't approved yet.
        Once approved (creative_status != 'pending_approval'), rejection is no longer allowed.
        
        Args:
            user_id: The creative user ID rejecting the booking
            booking_id: The booking ID to reject
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
            HTTPException: If booking is not in 'pending_approval' state
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Fetch the booking
            booking_response = client.table('bookings')\
                .select('id, creative_user_id, client_user_id, service_id, creative_status')\
                .eq('id', booking_id)\
                .single()\
                .execute()
            
            if not booking_response.data:
                raise HTTPException(status_code=404, detail="Booking not found")
            
            booking = booking_response.data
            
            # Verify the booking belongs to this creative
            if booking['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to reject this booking")
            
            # Check if booking can be rejected
            current_status = booking.get('creative_status', 'pending_approval')
            if current_status not in ['pending_approval']:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot reject booking with status '{current_status}'. Only pending approvals can be rejected."
                )
            
            # Update booking status
            update_response = client.table('bookings')\
                .update({
                    'creative_status': 'rejected',
                    'canceled_date': datetime.utcnow().isoformat()
                })\
                .eq('id', booking_id)\
                .execute()
            
            if not update_response.data or len(update_response.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to update booking status")
            
            logger.info(f"Booking rejected successfully: {booking_id} by creative {user_id}")
            
            # Get service and creative details
            service_response = client.table('creative_services')\
                .select('title')\
                .eq('id', booking['service_id'])\
                .single()\
                .execute()
            
            creative_response = client.table('creatives')\
                .select('display_name')\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            
            service_title = service_response.data.get('title', 'Service') if service_response.data else 'Service'
            creative_display_name = creative_response.data.get('display_name', 'Creative') if creative_response.data else 'Creative'
            
            # Get client user ID from booking
            client_user_id = booking.get('client_user_id')
            
            # Get client display name - RLS allows viewing clients in your bookings
            client_name_response = client.table('clients')\
                .select('display_name')\
                .eq('user_id', client_user_id)\
                .single()\
                .execute()
            client_display_name = client_name_response.data.get('display_name', 'Client') if client_name_response.data else 'Client'
            
            # Create notification for client
            client_notification_data = {
                "recipient_user_id": client_user_id,
                "notification_type": "booking_rejected",
                "title": "Booking Rejected",
                "message": f"{creative_display_name} has rejected your booking request for {service_title}. Your booking has been canceled.",
                "is_read": False,
                "related_user_id": user_id,
                "related_entity_id": booking_id,
                "related_entity_type": "booking",
                "target_roles": ["client"],
                "metadata": {
                    "service_title": service_title,
                    "creative_display_name": creative_display_name,
                    "booking_id": booking_id
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Create notification for creative
            creative_notification_data = {
                "recipient_user_id": user_id,
                "notification_type": "booking_rejected",
                "title": "Booking Rejected",
                "message": f"You have rejected a booking request for {service_title}.",
                "is_read": False,
                "related_user_id": user_id,
                "related_entity_id": booking_id,
                "related_entity_type": "booking",
                "target_roles": ["creative"],
                "metadata": {
                    "service_title": service_title,
                    "booking_id": booking_id
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            try:
                # Insert both notifications using authenticated client
                # RLS allows:
                # - Client notification: related_user_id = auth.uid() (creative is related)
                # - Creative notification: recipient_user_id = auth.uid() (notification for themselves)
                notifications_to_insert = [client_notification_data]
                if user_id:  # creative user ID
                    notifications_to_insert.append(creative_notification_data)
                
                notification_result = client.table("notifications")\
                    .insert(notifications_to_insert)\
                    .execute()
                logger.info(f"Rejection notifications created: {notification_result.data}")
                
                # Send email notifications
                if notification_result.data:
                    # Send client email
                    await _send_notification_email(client_notification_data, client_user_id, client_display_name, client)
                    # Send creative email
                    if user_id:
                        await _send_notification_email(creative_notification_data, user_id, creative_display_name, client)
            except Exception as notif_error:
                log_exception_if_dev(logger, "Failed to create rejection notifications", notif_error)
            
            return RejectBookingResponse(
                success=True,
                message="Booking rejected successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error rejecting booking", e)
            raise HTTPException(status_code=500, detail="Failed to reject booking")

    @staticmethod
    async def cancel_booking(user_id: str, booking_id: str, client: Client) -> CancelBookingResponse:
        """Cancel a booking/order (client-initiated)
        
        Updates client_status to 'cancelled' while leaving creative_status unchanged.
        This maintains symmetry with reject_booking which only updates creative_status.
        
        Business Rule: Clients can only cancel bookings that are still pending creative approval.
        Once a creative approves a booking (creative_status != 'pending_approval'), the 
        booking has progressed too far for unilateral client cancellation.
        
        Args:
            user_id: The client user ID canceling the booking
            booking_id: The booking ID to cancel
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
            HTTPException: If booking is not in 'placed'/'pending_approval' state
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Fetch the booking
            booking_response = client.table('bookings')\
                .select('id, client_user_id, creative_user_id, service_id, client_status, creative_status')\
                .eq('id', booking_id)\
                .single()\
                .execute()
            
            if not booking_response.data:
                raise HTTPException(status_code=404, detail="Booking not found")
            
            booking = booking_response.data
            
            # Verify the booking belongs to this client
            if booking['client_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to cancel this booking")
            
            # Check if booking can be canceled
            current_client_status = booking.get('client_status', 'placed')
            current_creative_status = booking.get('creative_status', 'pending_approval')
            
            if current_client_status not in ['placed'] or current_creative_status not in ['pending_approval']:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot cancel booking with status '{current_client_status}'. Only placed orders awaiting approval can be canceled."
                )
            
            # Update booking status - only change client_status, leave creative_status unchanged
            # This maintains symmetry with reject_booking which only changes creative_status
            update_response = client.table('bookings')\
                .update({
                    'client_status': 'cancelled',
                    'canceled_date': datetime.utcnow().isoformat()
                })\
                .eq('id', booking_id)\
                .execute()
            
            if not update_response.data or len(update_response.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to update booking status")
            
            logger.info(f"Booking canceled successfully: {booking_id} by client {user_id}")
            
            # Get service details
            service_response = client.table('creative_services')\
                .select('title')\
                .eq('id', booking['service_id'])\
                .single()\
                .execute()
            
            service_title = service_response.data.get('title', 'Service') if service_response.data else 'Service'
            
            # Get creative user ID from booking
            creative_user_id = booking.get('creative_user_id')
            
            # Create notification for client
            client_notification_data = {
                "recipient_user_id": user_id,
                "notification_type": "booking_canceled",
                "title": "Booking Canceled",
                "message": f"Your booking for {service_title} has been canceled successfully.",
                "is_read": False,
                "related_user_id": user_id,
                "related_entity_id": booking_id,
                "related_entity_type": "booking",
                "target_roles": ["client"],
                "metadata": {
                    "service_title": service_title,
                    "booking_id": booking_id
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Create notification for creative
            creative_notification_data = {
                "recipient_user_id": creative_user_id,
                "notification_type": "booking_canceled",
                "title": "Booking Canceled",
                "message": f"A client has canceled their booking for {service_title}.",
                "is_read": False,
                "related_user_id": user_id,
                "related_entity_id": booking_id,
                "related_entity_type": "booking",
                "target_roles": ["creative"],
                "metadata": {
                    "service_title": service_title,
                    "booking_id": booking_id
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            try:
                # Insert both notifications using authenticated client
                # RLS allows:
                # - Client notification: recipient_user_id = auth.uid() (client is recipient)
                # - Creative notification: related_user_id = auth.uid() (client is related)
                notifications_to_insert = [client_notification_data]
                if creative_user_id:
                    notifications_to_insert.append(creative_notification_data)
                
                notification_result = client.table("notifications")\
                    .insert(notifications_to_insert)\
                    .execute()
                logger.info(f"Cancellation notifications created: {notification_result.data}")
                
                # Send email notifications
                if notification_result.data:
                    # Get client name
                    client_response = client.table('clients').select('display_name').eq('user_id', user_id).single().execute()
                    client_display_name = client_response.data.get('display_name', 'Client') if client_response.data else 'Client'
                    # Get creative name
                    creative_response = client.table('creatives').select('display_name').eq('user_id', creative_user_id).single().execute()
                    creative_display_name = creative_response.data.get('display_name', 'Creative') if creative_response.data else 'Creative'
                    
                    await _send_notification_email(client_notification_data, user_id, client_display_name, client)
                    if creative_user_id:
                        await _send_notification_email(creative_notification_data, creative_user_id, creative_display_name, client)
            except Exception as notif_error:
                log_exception_if_dev(logger, "Failed to create cancellation notifications", notif_error)
            
            return CancelBookingResponse(
                success=True,
                message="Booking canceled successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error canceling booking", e)
            raise HTTPException(status_code=500, detail="Failed to cancel booking")
    
    @staticmethod
    async def send_payment_reminder(creative_user_id: str, booking_id: str, client: Client) -> Dict[str, Any]:
        """Send a payment reminder notification to the client for a booking
        
        Args:
            creative_user_id: The creative user ID sending the reminder
            booking_id: The booking ID to send reminder for
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Returns:
            Dict with success status, message, and notification_id
            
        Raises:
            HTTPException: If booking not found or user not authorized
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Get booking details
            booking_response = client.table('bookings')\
                .select('id, client_user_id, creative_user_id, service_id, price, payment_option, split_deposit_amount, amount_paid')\
                .eq('id', booking_id)\
                .single()\
                .execute()
            
            if not booking_response.data:
                raise HTTPException(status_code=404, detail="Booking not found")
            
            booking = booking_response.data
            
            # Verify the booking belongs to this creative
            if booking.get('creative_user_id') != creative_user_id:
                raise HTTPException(status_code=403, detail="You are not authorized to send reminders for this booking")
            
            client_user_id = booking.get('client_user_id')
            if not client_user_id:
                raise HTTPException(status_code=400, detail="Client user ID not found for this booking")
            
            # Get service details
            service_response = client.table('creative_services')\
                .select('id, title')\
                .eq('id', booking.get('service_id'))\
                .single()\
                .execute()
            
            service_title = service_response.data.get('title', 'service') if service_response.data else 'service'
            
            # Get creative display name
            creative_response = client.table('creatives')\
                .select('display_name')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            
            creative_display_name = creative_response.data.get('display_name', 'Your creative') if creative_response.data else 'Your creative'
            
            # Calculate payment details
            price = float(booking.get('price', 0))
            amount_paid = float(booking.get('amount_paid', 0))
            payment_option = booking.get('payment_option', 'later')
            split_deposit_amount = booking.get('split_deposit_amount')
            
            # Determine amount due based on payment option
            if payment_option == 'upfront':
                amount_due = price - amount_paid
                reminder_message = f"Please complete your payment of ${amount_due:.2f} for {service_title} to start your service."
            elif payment_option == 'split':
                deposit_amount = float(split_deposit_amount) if split_deposit_amount is not None else price * 0.5
                if amount_paid < deposit_amount:
                    amount_due = deposit_amount - amount_paid
                    reminder_message = f"Please complete your deposit payment of ${amount_due:.2f} for {service_title} to start your service."
                else:
                    remaining = price - amount_paid
                    reminder_message = f"Please complete your remaining payment of ${remaining:.2f} for {service_title}."
            else:  # payment_option == 'later'
                amount_due = price - amount_paid
                reminder_message = f"Please complete your payment of ${amount_due:.2f} for {service_title}."
            
            # Create notification for client
            client_notification_data = {
                "recipient_user_id": client_user_id,
                "notification_type": "payment_reminder",
                "title": "Payment Reminder",
                "message": reminder_message,
                "is_read": False,
                "related_user_id": creative_user_id,
                "related_entity_id": booking_id,
                "related_entity_type": "booking",
                "target_roles": ["client"],
                "metadata": {
                    "service_title": service_title,
                    "creative_display_name": creative_display_name,
                    "booking_id": str(booking_id),
                    "price": str(price),
                    "amount_paid": str(amount_paid),
                    "payment_option": payment_option
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Insert notification using authenticated client
            # RLS allows: related_user_id = auth.uid() (creative is related)
            # OR booking relationship (creative is the creative_user_id of the booking)
            try:
                notification_result = client.table("notifications")\
                    .insert(client_notification_data)\
                    .execute()
                logger.info(f"Payment reminder notification created: {notification_result.data}")
                
                # Send email notification
                if notification_result.data:
                    # Get client name - RLS allows viewing clients in your bookings
                    client_response = client.table('clients').select('display_name').eq('user_id', client_user_id).single().execute()
                    client_display_name = client_response.data.get('display_name', 'Client') if client_response.data else 'Client'
                    await _send_notification_email(client_notification_data, client_user_id, client_display_name, client)
                
                notification_id = None
                if notification_result.data and len(notification_result.data) > 0:
                    notification_id = notification_result.data[0].get('id')
                
                return {
                    "success": True,
                    "message": "Payment reminder sent successfully",
                    "notification_id": notification_id
                }
            except Exception as notif_error:
                log_exception_if_dev(logger, "Failed to create payment reminder notification", notif_error)
                raise HTTPException(status_code=500, detail="Failed to send payment reminder")
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error sending payment reminder", e)
            raise HTTPException(status_code=500, detail="Failed to send payment reminder")

