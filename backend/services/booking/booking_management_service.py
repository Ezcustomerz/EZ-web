from typing import Dict, Any
from datetime import datetime
import logging
from fastapi import HTTPException
from supabase import Client
from db.db_session import db_admin
from schemas.booking import (
    CreateBookingRequest, CreateBookingResponse,
    ApproveBookingResponse,
    RejectBookingResponse,
    CancelBookingResponse
)

logger = logging.getLogger(__name__)

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
                    "price": str(service['price'])
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
            except Exception as notif_error:
                logger.error(f"Failed to create client notification: {notif_error}")
            
            try:
                creative_notif_result = client.table("notifications") \
                    .insert(creative_notification_data) \
                    .execute()
                logger.info(f"Creative notification created: {creative_notif_result.data}")
            except Exception as notif_error:
                logger.error(f"Failed to create creative notification: {notif_error}")
            
            return CreateBookingResponse(
                success=True,
                message="Booking created successfully",
                booking_id=booking['id'],
                booking=booking
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating booking: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create booking: {str(e)}")

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
            
            client_response = db_admin.table('clients')\
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
            try:
                notification_result = db_admin.table("notifications")\
                    .insert(notification_data)\
                    .execute()
                logger.info(f"Client approval notification created: {notification_result.data}")
            except Exception as notif_error:
                logger.error(f"Failed to create client approval notification: {notif_error}")
            
            # Create notification for creative confirming they approved the service
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
                
                creative_notification_result = db_admin.table("notifications")\
                    .insert(creative_notification_data)\
                    .execute()
                logger.info(f"Creative approval notification created: {creative_notification_result.data}")
            except Exception as notif_error:
                logger.error(f"Failed to create creative approval notification: {notif_error}")
            
            return ApproveBookingResponse(
                success=True,
                message="Booking approved successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error approving booking: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to approve booking: {str(e)}")

    @staticmethod
    async def reject_booking(user_id: str, booking_id: str, client: Client) -> RejectBookingResponse:
        """Reject a booking/order
        
        Args:
            user_id: The creative user ID rejecting the booking
            booking_id: The booking ID to reject
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
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
                # Insert both notifications
                notifications_to_insert = [client_notification_data]
                if user_id:  # creative user ID
                    notifications_to_insert.append(creative_notification_data)
                
                notification_result = db_admin.table("notifications")\
                    .insert(notifications_to_insert)\
                    .execute()
                logger.info(f"Rejection notifications created: {notification_result.data}")
            except Exception as notif_error:
                logger.error(f"Failed to create rejection notifications: {notif_error}")
            
            return RejectBookingResponse(
                success=True,
                message="Booking rejected successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error rejecting booking: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to reject booking: {str(e)}")

    @staticmethod
    async def cancel_booking(user_id: str, booking_id: str, client: Client) -> CancelBookingResponse:
        """Cancel a booking/order (client-initiated)
        
        Args:
            user_id: The client user ID canceling the booking
            booking_id: The booking ID to cancel
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
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
                # Insert both notifications
                notifications_to_insert = [client_notification_data]
                if creative_user_id:
                    notifications_to_insert.append(creative_notification_data)
                
                notification_result = db_admin.table("notifications")\
                    .insert(notifications_to_insert)\
                    .execute()
                logger.info(f"Cancellation notifications created: {notification_result.data}")
            except Exception as notif_error:
                logger.error(f"Failed to create cancellation notifications: {notif_error}")
            
            return CancelBookingResponse(
                success=True,
                message="Booking canceled successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error canceling booking: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to cancel booking: {str(e)}")

