from typing import Dict, Any
from datetime import datetime
import logging
from fastapi import HTTPException
from supabase import Client
from schemas.booking import (
    FinalizeServiceRequest, FinalizeServiceResponse
)
from core.safe_errors import is_dev_env

logger = logging.getLogger(__name__)

# NOTE: This service no longer uses db_admin - all operations use authenticated client
# RLS policies allow:
# - booking_deliverables: Creatives can manage deliverables for their bookings
# - notifications INSERT: when recipient_user_id = auth.uid(), related_user_id = auth.uid(),
#   or notification is related to a booking where user is client/creative
# - creative_services/creatives: Public SELECT
# - clients: Users can view clients in their bookings


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
        if is_dev_env():
            logger.warning(f"Failed to send notification email: {str(e)}")


class FinalizationService:
    """Service for handling booking finalization operations"""
    
    @staticmethod
    async def finalize_service(user_id: str, finalize_request: FinalizeServiceRequest, client: Client) -> FinalizeServiceResponse:
        """Finalize a service - update statuses based on payment type and file presence
        
        Status flow:
        - Free + File: Creative = "completed", Client = "download"
        - Free + No file: Both = "completed"
        - Payment upfront + File: Creative = "completed", Client = "download"
        - Payment upfront + No file: Both = "completed"
        - Split payment + File: Creative = "awaiting_payment" (if not fully paid) or "completed" (if fully paid), Client = "locked" (if not fully paid) or "download" (if fully paid)
        - Split payment + No file: Creative = "awaiting_payment" (if not fully paid) or "completed" (if fully paid), Client = "payment_required" (if not fully paid) or "completed" (if fully paid)
        - Payment later + File: Creative = "awaiting_payment" (if not fully paid) or "completed" (if fully paid), Client = "locked" (if not fully paid) or "download" (if fully paid)
        - Payment later + No file: Creative = "awaiting_payment" (if not fully paid) or "completed" (if fully paid), Client = "payment_required" (if not fully paid) or "completed" (if fully paid)
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            booking_id = finalize_request.booking_id
            
            # Get booking details
            booking_result = client.table('bookings').select(
                'id, creative_user_id, client_user_id, service_id, price, payment_option, payment_status, amount_paid, creative_status, client_status'
            ).eq('id', booking_id).single().execute()
            
            if not booking_result.data:
                raise HTTPException(status_code=404, detail="Booking not found")
            
            booking = booking_result.data
            
            # Verify the booking belongs to the creative
            if booking['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to finalize this booking")
            
            # Verify the booking is in progress
            if booking['creative_status'] != 'in_progress':
                raise HTTPException(status_code=400, detail=f"Cannot finalize booking with status: {booking['creative_status']}")
            
            # Get payment details
            price = float(booking.get('price', 0))
            payment_option = booking.get('payment_option', 'later')
            payment_status = booking.get('payment_status', 'pending')
            amount_paid = float(booking.get('amount_paid', 0))
            
            # Determine if files were provided
            has_files = finalize_request.files and len(finalize_request.files) > 0
            
            # Determine if service is free
            is_free = price == 0
            
            # Determine new statuses based on payment type and file presence
            creative_status = 'completed'
            client_status = 'completed'  # Default
            
            if is_free:
                # Free service
                if has_files:
                    client_status = 'download'
                else:
                    client_status = 'completed'
            elif payment_option == 'upfront':
                # Payment upfront
                if has_files:
                    client_status = 'download'
                else:
                    client_status = 'completed'
            elif payment_option == 'split':
                # Split payment
                if has_files:
                    # Check if fully paid
                    if payment_status == 'fully_paid' or amount_paid >= price:
                        client_status = 'download'
                    else:
                        client_status = 'locked'
                        creative_status = 'awaiting_payment'  # Creative waits for payment
                else:
                    # No files - check payment status
                    if payment_status == 'fully_paid' or amount_paid >= price:
                        client_status = 'completed'
                    else:
                        client_status = 'payment_required'
                        creative_status = 'awaiting_payment'  # Creative waits for payment
            elif payment_option == 'later':
                # Payment later
                if has_files:
                    # Check if fully paid
                    if payment_status == 'fully_paid' or amount_paid >= price:
                        client_status = 'download'
                    else:
                        client_status = 'locked'
                        creative_status = 'awaiting_payment'  # Creative waits for payment
                else:
                    # No files - check payment status
                    if payment_status == 'fully_paid' or amount_paid >= price:
                        client_status = 'completed'
                    else:
                        client_status = 'payment_required'
                        creative_status = 'awaiting_payment'  # Creative waits for payment
            
            # Save files if provided
            if has_files:
                deliverables_data = []
                # Get existing file URLs for this booking to prevent duplicates
                # Uses authenticated client - RLS allows creatives to SELECT deliverables for their bookings
                existing_deliverables = client.table('booking_deliverables')\
                    .select('file_url')\
                    .eq('booking_id', booking_id)\
                    .execute()
                
                existing_file_urls = set()
                if existing_deliverables.data:
                    existing_file_urls = {d.get('file_url') for d in existing_deliverables.data if d.get('file_url')}
                
                for file_info in finalize_request.files:
                    file_url = file_info.get('url') or file_info.get('file_url')
                    
                    # Skip if file with this file_url already exists for this booking
                    if file_url and file_url in existing_file_urls:
                        if is_dev_env():
                            logger.warning(f"File with file_url '{file_url}' already exists for booking {booking_id}, skipping duplicate insertion")
                        continue
                    
                    deliverables_data.append({
                        'booking_id': booking_id,
                        'file_url': file_url,
                        'file_name': file_info.get('name') or file_info.get('file_name'),
                        'file_size_bytes': file_info.get('size') or file_info.get('file_size_bytes'),
                        'file_type': file_info.get('type') or file_info.get('file_type')
                    })
                    
                    # Add to existing set to prevent duplicates within the same batch
                    if file_url:
                        existing_file_urls.add(file_url)
                
                if deliverables_data:
                    try:
                        # Uses authenticated client - RLS allows creatives to INSERT deliverables for their bookings
                        client.table('booking_deliverables').insert(deliverables_data).execute()
                    except Exception as insert_error:
                        error_str = str(insert_error)
                        # Check if it's a unique constraint violation (duplicate file_url)
                        if 'unique' in error_str.lower() or 'duplicate' in error_str.lower() or 'already exists' in error_str.lower():
                            if is_dev_env():
                                logger.warning(f"Some files already exist for booking {booking_id}, skipping duplicates: {error_str}")
                            # This is okay - the files already exist, continue with status update
                        else:
                            if is_dev_env():
                                logger.error(f"Failed to insert deliverables for booking {booking_id}: {error_str}")
                            raise HTTPException(status_code=500, detail="Failed to save deliverables")
            
            # Update booking statuses
            update_data = {
                'creative_status': creative_status,
                'client_status': client_status,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            update_result = client.table('bookings').update(update_data).eq('id', booking_id).execute()
            
            if not update_result.data:
                raise HTTPException(status_code=500, detail="Failed to update booking status")
            
            # Get service, creative, and client details for notifications
            # All use authenticated client - RLS allows:
            # - creative_services: public SELECT
            # - creatives: public SELECT / own data
            # - clients: users can view clients in their bookings
            service_response = client.table('creative_services').select('title').eq('id', booking['service_id']).single().execute()
            creative_response = client.table('creatives').select('display_name').eq('user_id', user_id).single().execute()
            client_response = client.table('clients').select('display_name').eq('user_id', booking['client_user_id']).single().execute()
            
            service_title = service_response.data.get('title', 'Service') if service_response.data else 'Service'
            creative_display_name = creative_response.data.get('display_name', 'Creative') if creative_response.data else 'Creative'
            client_display_name = client_response.data.get('display_name', 'A client') if client_response.data else 'A client'
            
            # Create notifications based on final status
            try:
                # Client notifications
                if client_status == 'payment_required':
                    # Payment required notification (already exists type)
                    # RLS allows: related_user_id = auth.uid() (creative is related)
                    client_notification_data = {
                        "recipient_user_id": booking['client_user_id'],
                        "notification_type": "payment_required",
                        "title": "Payment Required",
                        "message": f"Please complete payment for {service_title} to receive your completed service.",
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
                    notification_result = client.table("notifications").insert(client_notification_data).execute()
                    if is_dev_env():
                        logger.info(f"Payment required notification created for client: {booking['client_user_id']}")
                    
                    # Send email notification
                    if notification_result.data:
                        await _send_notification_email(client_notification_data, booking['client_user_id'], client_display_name, client)
                
                elif client_status == 'locked':
                    # Client: Payment to unlock notification
                    # RLS allows: related_user_id = auth.uid() (creative is related)
                    client_notification_data = {
                        "recipient_user_id": booking['client_user_id'],
                        "notification_type": "payment_required",
                        "title": "Payment Required to Unlock",
                        "message": f"Files for {service_title} are ready. Complete payment to unlock and download your files.",
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
                    notification_result = client.table("notifications").insert(client_notification_data).execute()
                    if is_dev_env():
                        logger.info(f"Payment to unlock notification created for client: {booking['client_user_id']}")
                    
                    # Send email notification
                    if notification_result.data:
                        await _send_notification_email(client_notification_data, booking['client_user_id'], client_display_name, client)
                    
                    # Creative: Files sent notification
                    # RLS allows: recipient_user_id = auth.uid() (notification for themselves)
                    creative_notification_data = {
                        "recipient_user_id": user_id,
                        "notification_type": "session_completed",
                        "title": "Files Sent",
                        "message": f"You have sent files for {service_title} to {client_display_name}. Awaiting payment to unlock.",
                        "is_read": False,
                        "related_user_id": booking['client_user_id'],
                        "related_entity_id": booking_id,
                        "related_entity_type": "booking",
                        "target_roles": ["creative"],
                        "metadata": {
                            "service_title": service_title,
                            "client_display_name": client_display_name,
                            "booking_id": booking_id,
                            "has_files": True,
                            "creative_status": creative_status  # Include status to determine which tab to navigate to
                        },
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    creative_notification_result = client.table("notifications").insert(creative_notification_data).execute()
                    if is_dev_env():
                        logger.info(f"Files sent notification created for creative: {user_id}")
                    
                    # Send email notification
                    if creative_notification_result.data:
                        await _send_notification_email(creative_notification_data, user_id, creative_display_name, client)
                
                elif client_status == 'completed':
                    # Both: Service complete notification
                    # Client notification - RLS allows: related_user_id = auth.uid() (creative is related)
                    client_notification_data = {
                        "recipient_user_id": booking['client_user_id'],
                        "notification_type": "session_completed",
                        "title": "Service Complete",
                        "message": f"Your service {service_title} has been completed by {creative_display_name}.",
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
                    client_notification_result = client.table("notifications").insert(client_notification_data).execute()
                    if is_dev_env():
                        logger.info(f"Service complete notification created for client: {booking['client_user_id']}")
                    
                    # Send email notification
                    if client_notification_result.data:
                        await _send_notification_email(client_notification_data, booking['client_user_id'], client_display_name, client)
                    
                    # Creative notification - RLS allows: recipient_user_id = auth.uid() (notification for themselves)
                    creative_notification_data = {
                        "recipient_user_id": user_id,
                        "notification_type": "session_completed",
                        "title": "Service Complete",
                        "message": f"You have completed {service_title} for {client_display_name}.",
                        "is_read": False,
                        "related_user_id": booking['client_user_id'],
                        "related_entity_id": booking_id,
                        "related_entity_type": "booking",
                        "target_roles": ["creative"],
                        "metadata": {
                            "service_title": service_title,
                            "client_display_name": client_display_name,
                            "booking_id": booking_id
                        },
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    creative_notification_result = client.table("notifications").insert(creative_notification_data).execute()
                    if is_dev_env():
                        logger.info(f"Service complete notification created for creative: {user_id}")
                    
                    # Send email notification
                    if creative_notification_result.data:
                        await _send_notification_email(creative_notification_data, user_id, creative_display_name, client)
                
                elif client_status == 'download':
                    # Client: Files ready notification
                    # RLS allows: related_user_id = auth.uid() (creative is related)
                    client_notification_data = {
                        "recipient_user_id": booking['client_user_id'],
                        "notification_type": "session_completed",
                        "title": "Files Ready",
                        "message": f"Files for {service_title} are ready for download from {creative_display_name}.",
                        "is_read": False,
                        "related_user_id": user_id,
                        "related_entity_id": booking_id,
                        "related_entity_type": "booking",
                        "target_roles": ["client"],
                        "metadata": {
                            "service_title": service_title,
                            "creative_display_name": creative_display_name,
                            "booking_id": booking_id,
                            "has_files": True
                        },
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    client_notification_result = client.table("notifications").insert(client_notification_data).execute()
                    if is_dev_env():
                        logger.info(f"Files ready notification created for client: {booking['client_user_id']}")
                    
                    # Send email notification
                    if client_notification_result.data:
                        await _send_notification_email(client_notification_data, booking['client_user_id'], client_display_name, client)
                    
                    # Creative: Files sent notification
                    # RLS allows: recipient_user_id = auth.uid() (notification for themselves)
                    creative_notification_data = {
                        "recipient_user_id": user_id,
                        "notification_type": "session_completed",
                        "title": "Files Sent",
                        "message": f"You have sent files for {service_title} to {client_display_name}. Files are now available for download.",
                        "is_read": False,
                        "related_user_id": booking['client_user_id'],
                        "related_entity_id": booking_id,
                        "related_entity_type": "booking",
                        "target_roles": ["creative"],
                        "metadata": {
                            "service_title": service_title,
                            "client_display_name": client_display_name,
                            "booking_id": booking_id,
                            "has_files": True,
                            "creative_status": creative_status  # Include status to determine which tab to navigate to
                        },
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    creative_notification_result = client.table("notifications").insert(creative_notification_data).execute()
                    if is_dev_env():
                        logger.info(f"Files sent notification created for creative: {user_id}")
                    
                    # Send email notification
                    if creative_notification_result.data:
                        await _send_notification_email(creative_notification_data, user_id, creative_display_name, client)
                    
            except Exception as notif_error:
                if is_dev_env():
                    logger.error(f"Failed to create finalization notifications: {notif_error}")
            
            return FinalizeServiceResponse(
                success=True,
                message="Service finalized successfully",
                booking_id=booking_id
            )
            
        except HTTPException:
            raise
        except Exception as e:
            if is_dev_env():
                logger.error(f"Error finalizing service: {e}")
            raise HTTPException(status_code=500, detail="Failed to finalize service")

    @staticmethod
    async def mark_download_complete(user_id: str, booking_id: str, client: Client) -> Dict[str, Any]:
        """Mark a booking as complete after all files are downloaded by the client
        
        - Verifies the booking belongs to the client
        - Verifies the booking is in 'download' status
        - Updates client_status to 'completed'
        - Keeps creative_status unchanged
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Get booking details
            booking_result = client.table('bookings').select(
                'id, client_user_id, client_status, creative_status'
            ).eq('id', booking_id).single().execute()
            
            if not booking_result.data:
                raise HTTPException(status_code=404, detail="Booking not found")
            
            booking = booking_result.data
            
            # Verify the booking belongs to the client
            if booking['client_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to update this booking")
            
            # Verify the booking is in 'download' status
            if booking['client_status'] != 'download':
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot mark as complete. Booking must be in 'download' status. Current status: {booking['client_status']}"
                )
            
            # Update client_status to 'completed', keep creative_status unchanged
            update_response = client.table('bookings')\
                .update({'client_status': 'completed'})\
                .eq('id', booking_id)\
                .execute()
            
            if not update_response.data or len(update_response.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to update booking status")
            
            if is_dev_env():
                logger.info(f"Booking {booking_id} marked as complete after download by client {user_id}")
            
            return {
                "success": True,
                "message": "Booking marked as complete successfully",
                "booking_id": booking_id,
                "client_status": "completed"
            }
            
        except HTTPException:
            raise
        except Exception as e:
            if is_dev_env():
                logger.error(f"Error marking download as complete: {e}")
            raise HTTPException(status_code=500, detail="Failed to mark download as complete")

