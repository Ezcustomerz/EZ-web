import os
import logging
import stripe
from typing import Dict, Any, Optional
from fastapi import HTTPException
from core.safe_errors import log_exception_if_dev, is_dev_env
from supabase import Client
from db.db_session import db_admin

logger = logging.getLogger(__name__)


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

# Get Stripe secret key from environment
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
if not STRIPE_SECRET_KEY:
    raise ValueError("STRIPE_SECRET_KEY environment variable is not set")

stripe.api_key = STRIPE_SECRET_KEY


class PaymentRequestService:
    @staticmethod
    async def create_payment_request(
        creative_user_id: str,
        client_user_id: Optional[str],
        amount: float,
        notes: Optional[str],
        booking_id: Optional[str],
        client: Client
    ) -> Dict[str, Any]:
        """Create a new payment request
        
        Args:
            creative_user_id: The user ID of the creative creating the request
            client_user_id: The user ID of the client to pay (required if booking_id is not provided)
            amount: The payment amount in dollars
            notes: Optional notes/description
            booking_id: Optional booking ID to associate with (if provided, client_user_id will be taken from booking)
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing the created payment request
        """
        try:
            # Validate amount
            if amount <= 0:
                raise HTTPException(status_code=400, detail="Amount must be greater than 0")
            
            # Get creative info (for validation and notification) - fetch all needed fields in one query
            creative_result = client.table('creatives')\
                .select('user_id, display_name, avatar_background_color')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative not found")
            
            creative_data = creative_result.data
            creative_display_name = creative_data.get('display_name', 'A creative')
            creative_avatar_background_color = creative_data.get('avatar_background_color', '#3B82F6')
            
            # Determine client_user_id - from booking if provided, otherwise from parameter
            final_client_user_id = client_user_id
            booking_service_id = None
            
            # If booking_id is provided, get client_user_id from booking and verify ownership
            if booking_id:
                booking_result = client.table('bookings')\
                    .select('id, creative_user_id, client_user_id, service_id')\
                    .eq('id', booking_id)\
                    .single()\
                    .execute()
                
                if not booking_result.data:
                    raise HTTPException(status_code=404, detail="Booking not found")
                
                booking = booking_result.data
                if booking['creative_user_id'] != creative_user_id:
                    raise HTTPException(status_code=403, detail="Booking does not belong to this creative")
                
                # Use client_user_id from booking
                final_client_user_id = booking['client_user_id']
                booking_service_id = booking.get('service_id')
            
            # Verify client_user_id is set
            if not final_client_user_id:
                raise HTTPException(status_code=400, detail="Client user ID is required")
            
            # Verify client exists
            client_result = client.table('clients')\
                .select('user_id')\
                .eq('user_id', final_client_user_id)\
                .single()\
                .execute()
            
            if not client_result.data:
                raise HTTPException(status_code=404, detail="Client not found")
            
            # Create payment request - ensure all required fields are valid
            if not final_client_user_id or not isinstance(final_client_user_id, str):
                raise HTTPException(status_code=400, detail="Invalid client user ID")
            
            payment_request_data = {
                'creative_user_id': str(creative_user_id),  # Ensure it's a string
                'client_user_id': str(final_client_user_id),  # Ensure it's a string
                'amount': float(amount),
                'status': 'pending'
            }
            
            # Only include optional fields if they have values (not None, not empty string)
            if notes and notes.strip():
                payment_request_data['notes'] = notes.strip()
            
            if booking_id:
                payment_request_data['booking_id'] = str(booking_id)  # Ensure it's a string
            
            result = client.table('payment_requests')\
                .insert(payment_request_data)\
                .execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create payment request")
            
            payment_request = result.data[0]
            
            # Create notification for the client
            try:
                from db.db_session import db_admin
                
                # Get service name and color if booking is associated (service_id already fetched above)
                service_title = None
                service_color = None
                if booking_service_id:
                    service_result = client.table('creative_services')\
                        .select('title, color')\
                        .eq('id', booking_service_id)\
                        .single()\
                        .execute()
                    
                    if service_result.data:
                        service_title = service_result.data.get('title')
                        service_color = service_result.data.get('color', '#3b82f6')
                
                notification_message = f"{creative_display_name} has requested a payment of ${amount:.2f}"
                if service_title:
                    notification_message += f" for {service_title}"
                notification_message += "."
                
                # Build metadata, excluding None values
                metadata = {
                    'creative_display_name': creative_display_name,
                    'creative_avatar_background_color': creative_avatar_background_color,
                    'payment_request_id': payment_request['id'],
                    'amount': str(amount),
                }
                if booking_id:
                    metadata['booking_id'] = booking_id
                if service_title:
                    metadata['service_title'] = service_title
                if service_color:
                    metadata['service_color'] = service_color
                
                notification_data = {
                    'recipient_user_id': final_client_user_id,
                    'notification_type': 'payment_required',
                    'title': 'Payment Request Received',
                    'message': notification_message,
                    'is_read': False,
                    'related_user_id': creative_user_id,
                    'related_entity_id': payment_request['id'],
                    'related_entity_type': 'payment_request',
                    'target_roles': ['client'],
                    'metadata': metadata
                }
                
                notification_result = db_admin.table("notifications").insert(notification_data).execute()
                if is_dev_env():
                    logger.info("Payment request notification created for client: %s, notification_id: %s", final_client_user_id, notification_result.data[0]['id'] if notification_result.data else 'unknown')
                
                # Send email notification
                if notification_result.data:
                    # Get client name
                    try:
                        client_result = db_admin.table('clients').select('display_name').eq('user_id', final_client_user_id).single().execute()
                        client_name = client_result.data.get('display_name', 'Client') if client_result.data else 'Client'
                        await _send_notification_email(notification_data, final_client_user_id, client_name, db_admin)
                    except Exception as email_error:
                        log_exception_if_dev(logger, "Failed to send payment request email", email_error)
            except Exception as notif_error:
                # Log error but don't fail payment request creation
                log_exception_if_dev(logger, "Failed to create payment request notification", notif_error)
            
            return payment_request
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error creating payment request", e)
            raise HTTPException(status_code=500, detail="Failed to create payment request")

    @staticmethod
    async def get_client_payment_requests(
        client_user_id: str,
        client: Client,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """Get all payment requests for a client
        
        Args:
            client_user_id: The user ID of the client
            client: Supabase client for database operations
            
        Returns:
            List of payment requests with related data
        """
        try:
            # Get total count first
            count_result = client.table('payment_requests')\
                .select('id', count='exact')\
                .eq('client_user_id', client_user_id)\
                .execute()
            
            total = count_result.count if count_result.count is not None else 0
            
            # Calculate pagination
            offset = (page - 1) * page_size
            
            # Get payment requests with pagination - only select fields we actually need
            result = client.table('payment_requests')\
                .select('id, creative_user_id, client_user_id, booking_id, amount, notes, status, created_at, paid_at, cancelled_at, stripe_session_id')\
                .eq('client_user_id', client_user_id)\
                .order('created_at', desc=True)\
                .range(offset, offset + page_size - 1)\
                .execute()
            
            if not result.data:
                return {
                    'data': [],
                    'pagination': {
                        'total': total,
                        'page': page,
                        'page_size': page_size,
                        'total_pages': (total + page_size - 1) // page_size if total > 0 else 0
                    }
                }
            
            # Get unique creative and booking IDs
            creative_ids = list(set([pr['creative_user_id'] for pr in result.data]))
            booking_ids = list(set([pr['booking_id'] for pr in result.data if pr.get('booking_id')]))
            
            # Fetch creatives data
            creatives_map = {}
            if creative_ids:
                creatives_result = client.table('creatives')\
                    .select('user_id, display_name, profile_banner_url')\
                    .in_('user_id', creative_ids)\
                    .execute()
                
                if creatives_result.data:
                    for creative in creatives_result.data:
                        creatives_map[creative['user_id']] = creative
            
            # Fetch bookings and services data
            bookings_map = {}
            services_map = {}
            if booking_ids:
                bookings_result = client.table('bookings')\
                    .select('id, service_id, order_date')\
                    .in_('id', booking_ids)\
                    .execute()
                
                if bookings_result.data:
                    service_ids = list(set([b['service_id'] for b in bookings_result.data if b.get('service_id')]))
                    
                    for booking in bookings_result.data:
                        bookings_map[booking['id']] = booking
                    
                    # Fetch services
                    if service_ids:
                        services_result = client.table('creative_services')\
                            .select('id, title')\
                            .in_('id', service_ids)\
                            .execute()
                        
                        if services_result.data:
                            for service in services_result.data:
                                services_map[service['id']] = service
            
            # Transform the data to match frontend expectations
            payment_requests = []
            for pr in result.data:
                creative = creatives_map.get(pr['creative_user_id'], {})
                booking = bookings_map.get(pr.get('booking_id'), {}) if pr.get('booking_id') else {}
                service = services_map.get(booking.get('service_id'), {}) if booking.get('service_id') else {}
                
                payment_request = {
                    'id': pr['id'],
                    'creative_user_id': pr['creative_user_id'],
                    'client_user_id': pr['client_user_id'],
                    'booking_id': pr.get('booking_id'),
                    'amount': float(pr['amount']),
                    'notes': pr.get('notes'),
                    'status': pr['status'],
                    'created_at': pr['created_at'],
                    'paid_at': pr.get('paid_at'),
                    'cancelled_at': pr.get('cancelled_at'),
                    'stripe_session_id': pr.get('stripe_session_id'),
                    'creative_name': creative.get('display_name') if creative else None,
                    'creative_display_name': creative.get('display_name') if creative else None,
                    'creative_avatar_url': creative.get('profile_banner_url') if creative else None,
                    'service_name': service.get('title') if service else None,
                    'booking_order_date': booking.get('order_date') if booking else None,
                }
                payment_requests.append(payment_request)
            
            total_pages = (total + page_size - 1) // page_size if total > 0 else 0
            
            return {
                'data': payment_requests,
                'pagination': {
                    'total': total,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': total_pages
                }
            }
            
        except Exception as e:
            log_exception_if_dev(logger, "Error fetching payment requests", e)
            raise HTTPException(status_code=500, detail="Failed to fetch payment requests")

    @staticmethod
    async def get_creative_payment_requests(
        creative_user_id: str,
        client: Client,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """Get all payment requests for a creative
        
        Args:
            creative_user_id: The user ID of the creative
            client: Supabase client for database operations
            
        Returns:
            List of payment requests with related data
        """
        try:
            # Get total count first
            count_result = client.table('payment_requests')\
                .select('id', count='exact')\
                .eq('creative_user_id', creative_user_id)\
                .execute()
            
            total = count_result.count if count_result.count is not None else 0
            
            # Calculate pagination
            offset = (page - 1) * page_size
            
            # Get payment requests with pagination - only select fields we actually need
            result = client.table('payment_requests')\
                .select('id, creative_user_id, client_user_id, booking_id, amount, notes, status, created_at, paid_at, cancelled_at, stripe_session_id')\
                .eq('creative_user_id', creative_user_id)\
                .order('created_at', desc=True)\
                .range(offset, offset + page_size - 1)\
                .execute()
            
            if not result.data:
                return {
                    'data': [],
                    'pagination': {
                        'total': total,
                        'page': page,
                        'page_size': page_size,
                        'total_pages': (total + page_size - 1) // page_size if total > 0 else 0
                    }
                }
            
            # Get unique client and booking IDs
            client_ids = list(set([pr['client_user_id'] for pr in result.data]))
            booking_ids = list(set([pr['booking_id'] for pr in result.data if pr.get('booking_id')]))
            
            # Fetch clients data
            clients_map = {}
            if client_ids:
                clients_result = client.table('clients')\
                    .select('user_id, display_name')\
                    .in_('user_id', client_ids)\
                    .execute()
                
                if clients_result.data:
                    for client_data in clients_result.data:
                        clients_map[client_data['user_id']] = client_data
            
            # Fetch bookings and services data
            bookings_map = {}
            services_map = {}
            if booking_ids:
                bookings_result = client.table('bookings')\
                    .select('id, service_id, order_date')\
                    .in_('id', booking_ids)\
                    .execute()
                
                if bookings_result.data:
                    service_ids = list(set([b['service_id'] for b in bookings_result.data if b.get('service_id')]))
                    
                    for booking in bookings_result.data:
                        bookings_map[booking['id']] = booking
                    
                    # Fetch services
                    if service_ids:
                        services_result = client.table('creative_services')\
                            .select('id, title')\
                            .in_('id', service_ids)\
                            .execute()
                        
                        if services_result.data:
                            for service in services_result.data:
                                services_map[service['id']] = service
            
            # Transform the data to match frontend expectations
            payment_requests = []
            for pr in result.data:
                client_data = clients_map.get(pr['client_user_id'], {})
                booking = bookings_map.get(pr.get('booking_id'), {}) if pr.get('booking_id') else {}
                service = services_map.get(booking.get('service_id'), {}) if booking.get('service_id') else {}
                
                payment_request = {
                    'id': pr['id'],
                    'creative_user_id': pr['creative_user_id'],
                    'client_user_id': pr['client_user_id'],
                    'booking_id': pr.get('booking_id'),
                    'amount': float(pr['amount']),
                    'notes': pr.get('notes'),
                    'status': pr['status'],
                    'created_at': pr['created_at'],
                    'paid_at': pr.get('paid_at'),
                    'cancelled_at': pr.get('cancelled_at'),
                    'stripe_session_id': pr.get('stripe_session_id'),
                    'client_name': client_data.get('display_name') if client_data else None,
                    'client_display_name': client_data.get('display_name') if client_data else None,
                    'service_name': service.get('title') if service else None,
                    'booking_order_date': booking.get('order_date') if booking else None,
                }
                payment_requests.append(payment_request)
            
            total_pages = (total + page_size - 1) // page_size if total > 0 else 0
            
            return {
                'data': payment_requests,
                'pagination': {
                    'total': total,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': total_pages
                }
            }
            
        except Exception as e:
            log_exception_if_dev(logger, "Error fetching creative payment requests", e)
            raise HTTPException(status_code=500, detail="Failed to fetch payment requests")
    
    @staticmethod
    async def get_pending_count(
        client_user_id: str,
        client: Client
    ) -> int:
        """Get count of pending payment requests for a client
        
        Args:
            client_user_id: The user ID of the client
            client: Supabase client for database operations
            
        Returns:
            Count of pending payment requests
        """
        try:
            result = client.table('payment_requests')\
                .select('id', count='exact')\
                .eq('client_user_id', client_user_id)\
                .eq('status', 'pending')\
                .execute()
            
            return result.count or 0
            
        except Exception as e:
            log_exception_if_dev(logger, "Error fetching pending count", e)
            return 0  # Return 0 on error to avoid breaking UI
    
    @staticmethod
    async def get_payment_requests_by_booking(
        booking_id: str,
        client: Client,
        user_id: Optional[str] = None,
        is_creative: bool = False
    ) -> list:
        """Get all payment requests associated with a booking
        
        Args:
            booking_id: The booking ID to get payment requests for
            client: Supabase client for database operations
            user_id: Optional user ID to help with RLS filtering
            is_creative: Whether the user is a creative (helps with RLS)
            
        Returns:
            List of payment requests for the booking
        """
        try:
            # Use db_admin to bypass RLS since authorization is already verified in the router
            # This ensures both client and creative can see payment requests for the booking
            result = db_admin.table('payment_requests')\
                .select('id, creative_user_id, client_user_id, booking_id, amount, notes, status, created_at, paid_at, cancelled_at, stripe_session_id')\
                .eq('booking_id', booking_id)\
                .order('created_at', desc=True)\
                .execute()
            
            if not result.data:
                return []
            
            # Get creative and client info for each payment request
            creative_ids = list(set([pr['creative_user_id'] for pr in result.data]))
            client_ids = list(set([pr['client_user_id'] for pr in result.data]))
            
            # Fetch creatives data (use db_admin to bypass RLS)
            creatives_map = {}
            if creative_ids:
                creatives_result = db_admin.table('creatives')\
                    .select('user_id, display_name, profile_banner_url')\
                    .in_('user_id', creative_ids)\
                    .execute()
                
                if creatives_result.data:
                    for creative in creatives_result.data:
                        creatives_map[creative['user_id']] = creative
            
            # Fetch clients data (use db_admin to bypass RLS)
            clients_map = {}
            if client_ids:
                clients_result = db_admin.table('clients')\
                    .select('user_id, display_name')\
                    .in_('user_id', client_ids)\
                    .execute()
                
                if clients_result.data:
                    for client_data in clients_result.data:
                        clients_map[client_data['user_id']] = client_data
            
            # Transform the data
            payment_requests = []
            for pr in result.data:
                creative = creatives_map.get(pr['creative_user_id'], {})
                client_data = clients_map.get(pr['client_user_id'], {})
                
                payment_request = {
                    'id': pr['id'],
                    'creative_user_id': pr['creative_user_id'],
                    'client_user_id': pr['client_user_id'],
                    'booking_id': pr.get('booking_id'),
                    'amount': float(pr['amount']),
                    'notes': pr.get('notes'),
                    'status': pr['status'],
                    'created_at': pr['created_at'],
                    'paid_at': pr.get('paid_at'),
                    'cancelled_at': pr.get('cancelled_at'),
                    'stripe_session_id': pr.get('stripe_session_id'),
                    'creative_name': creative.get('display_name') if creative else None,
                    'creative_display_name': creative.get('display_name') if creative else None,
                    'creative_avatar_url': creative.get('profile_banner_url') if creative else None,
                    'client_name': client_data.get('display_name') if client_data else None,
                    'client_display_name': client_data.get('display_name') if client_data else None,
                }
                payment_requests.append(payment_request)
            
            return payment_requests
            
        except Exception as e:
            log_exception_if_dev(logger, "Error fetching payment requests for booking", e)
            raise HTTPException(status_code=500, detail="Failed to fetch payment requests")
    
    @staticmethod
    async def process_payment_request(
        payment_request_id: str,
        client_user_id: str,
        client: Client
    ) -> Dict[str, Any]:
        """Process a payment request - creates a Stripe Checkout Session
        
        Args:
            payment_request_id: The payment request ID
            client_user_id: The user ID of the client making the payment
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing checkout_url and session_id
        """
        try:
            # Get payment request - only select fields we actually need
            result = client.table('payment_requests')\
                .select('id, creative_user_id, client_user_id, booking_id, amount, notes, status, stripe_session_id')\
                .eq('id', payment_request_id)\
                .single()\
                .execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Payment request not found")
            
            payment_request = result.data
            
            # Verify the payment request belongs to this client
            if payment_request['client_user_id'] != client_user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to pay for this request")
            
            # Verify status is pending
            if payment_request['status'] != 'pending':
                raise HTTPException(status_code=400, detail="Payment request is not pending")
            
            creative_user_id = payment_request['creative_user_id']
            amount = float(payment_request['amount'])
            
            # Get creative's Stripe account ID and subscription tier
            creative_result = client.table('creatives')\
                .select('stripe_account_id, subscription_tier_id')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative not found")
            
            creative = creative_result.data
            stripe_account_id = creative.get('stripe_account_id')
            
            if not stripe_account_id:
                raise HTTPException(status_code=400, detail="Creative has not connected their Stripe account")
            
            # Get subscription tier to determine platform fee percentage
            subscription_tier_id = creative.get('subscription_tier_id')
            tier_result = client.table('subscription_tiers')\
                .select('fee_percentage')\
                .eq('id', subscription_tier_id)\
                .single()\
                .execute()
            
            if not tier_result.data:
                raise HTTPException(status_code=404, detail="Subscription tier not found")
            
            fee_percentage = float(tier_result.data.get('fee_percentage', 0))
            
            # Calculate platform fee (application fee)
            # fee_percentage is stored as decimal (e.g., 0.01 = 1%, 0.026 = 2.6%)
            platform_fee_amount = round(amount * fee_percentage, 2)
            
            # Convert to cents for Stripe
            amount_cents = int(round(amount * 100))
            application_fee_cents = int(round(platform_fee_amount * 100))
            
            # Get frontend URL for redirects
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
            
            # Create Checkout Session on the connected account (Direct Charge)
            checkout_session = stripe.checkout.Session.create(
                payment_intent_data={
                    'application_fee_amount': application_fee_cents,
                },
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Payment Request - {payment_request_id[:8]}',
                            'description': payment_request.get('notes') or 'Direct payment request',
                        },
                        'unit_amount': amount_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&payment_request_id={payment_request_id}',
                cancel_url=f'{frontend_url}/payment-cancelled?payment_request_id={payment_request_id}',
                metadata={
                    'payment_request_id': payment_request_id,
                },
                stripe_account=stripe_account_id,
            )
            
            # Update payment request with session ID
            client.table('payment_requests')\
                .update({'stripe_session_id': checkout_session.id})\
                .eq('id', payment_request_id)\
                .execute()
            
            return {
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id,
                'amount': amount,
                'platform_fee': platform_fee_amount,
                'creative_amount': amount - platform_fee_amount,
            }
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error processing payment request", e)
            raise HTTPException(status_code=500, detail="Failed to process payment")
    
    @staticmethod
    async def verify_payment_request(
        session_id: str,
        payment_request_id: str,
        client: Client
    ) -> Dict[str, Any]:
        """Verify a Stripe payment session and update payment request status
        
        Args:
            session_id: The Stripe checkout session ID
            payment_request_id: The payment request ID
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing success status and updated payment request info
        """
        from datetime import datetime
        
        try:
            # Get payment request details - only select fields we actually need
            pr_result = client.table('payment_requests')\
                .select('id, creative_user_id, client_user_id, booking_id, amount, status, stripe_session_id')\
                .eq('id', payment_request_id)\
                .single()\
                .execute()
            
            if not pr_result.data:
                raise HTTPException(status_code=404, detail="Payment request not found")
            
            payment_request = pr_result.data
            
            # Check if already paid
            if payment_request['status'] == 'paid':
                return {
                    "success": True,
                    "message": "Payment request already verified",
                    "payment_request_id": payment_request_id,
                    "status": "paid",
                    "amount": float(payment_request.get('amount', 0))
                }
            
            # Check if cancelled
            if payment_request['status'] == 'cancelled':
                raise HTTPException(status_code=400, detail="Payment request has been cancelled")
            
            creative_user_id = payment_request.get('creative_user_id')
            
            # Get creative's Stripe account ID
            creative_result = client.table('creatives')\
                .select('stripe_account_id')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative not found")
            
            stripe_account_id = creative_result.data.get('stripe_account_id')
            if not stripe_account_id:
                raise HTTPException(status_code=400, detail="Creative has not connected their Stripe account")
            
            # Retrieve the checkout session from Stripe (from the connected account)
            checkout_session = stripe.checkout.Session.retrieve(
                session_id,
                stripe_account=stripe_account_id
            )
            
            # Verify payment was successful
            if checkout_session.payment_status != 'paid':
                raise HTTPException(
                    status_code=400, 
                    detail=f"Payment not completed. Status: {checkout_session.payment_status}"
                )
            
            # Verify payment_request_id in metadata matches
            session_payment_request_id = checkout_session.metadata.get('payment_request_id') if checkout_session.metadata else None
            if session_payment_request_id and session_payment_request_id != payment_request_id:
                raise HTTPException(
                    status_code=400,
                    detail="Payment request ID mismatch in payment session"
                )
            
            # Verify session_id matches
            if payment_request.get('stripe_session_id') != session_id:
                raise HTTPException(
                    status_code=400,
                    detail="Session ID mismatch"
                )
            
            # Update payment request status to paid
            now = datetime.utcnow().isoformat()
            update_result = client.table('payment_requests')\
                .update({
                    'status': 'paid',
                    'paid_at': now
                })\
                .eq('id', payment_request_id)\
                .execute()
            
            if not update_result.data:
                raise HTTPException(status_code=500, detail="Failed to update payment request")
            
            updated_payment_request = update_result.data[0]
            
            # Create notifications for both creative and client
            try:
                from db.db_session import db_admin
                
                client_user_id = payment_request.get('client_user_id')
                amount = float(payment_request.get('amount', 0))
                
                # Get client display name for creative notification
                client_result = client.table('clients')\
                    .select('display_name')\
                    .eq('user_id', client_user_id)\
                    .single()\
                    .execute()
                
                client_display_name = client_result.data.get('display_name', 'A client') if client_result.data else 'A client'
                
                # Get service info if booking is associated - fetch service_id with booking in one query
                service_title = None
                service_color = None
                booking_id = payment_request.get('booking_id')
                booking_service_id = None
                
                if booking_id:
                    booking_result = client.table('bookings')\
                        .select('service_id')\
                        .eq('id', booking_id)\
                        .single()\
                        .execute()
                    
                    if booking_result.data:
                        booking_service_id = booking_result.data.get('service_id')
                
                if booking_service_id:
                    service_result = client.table('creative_services')\
                        .select('title, color')\
                        .eq('id', booking_service_id)\
                        .single()\
                        .execute()
                    
                    if service_result.data:
                        service_title = service_result.data.get('title')
                        service_color = service_result.data.get('color', '#3b82f6')
                
                # Build creative notification message
                creative_message = f"{client_display_name} has paid ${amount:.2f}"
                if service_title:
                    creative_message += f" for {service_title}"
                creative_message += "."
                
                # Build creative notification metadata
                creative_metadata = {
                    'client_display_name': client_display_name,
                    'payment_request_id': payment_request_id,
                    'amount': str(amount),
                }
                if booking_id:
                    creative_metadata['booking_id'] = booking_id
                if service_title:
                    creative_metadata['service_title'] = service_title
                if service_color:
                    creative_metadata['service_color'] = service_color
                
                creative_notification_data = {
                    'recipient_user_id': creative_user_id,
                    'notification_type': 'payment_received',
                    'title': 'Payment Received',
                    'message': creative_message,
                    'is_read': False,
                    'related_user_id': client_user_id,
                    'related_entity_id': payment_request_id,
                    'related_entity_type': 'payment_request',
                    'target_roles': ['creative'],
                    'metadata': creative_metadata
                }
                
                # Build client notification metadata
                client_metadata = {
                    'payment_request_id': payment_request_id,
                    'amount': str(amount),
                }
                if booking_id:
                    client_metadata['booking_id'] = booking_id
                
                client_notification_data = {
                    'recipient_user_id': client_user_id,
                    'notification_type': 'payment_received',
                    'title': 'Payment Completed',
                    'message': f"Your payment of ${amount:.2f} has been processed successfully.",
                    'is_read': False,
                    'related_user_id': creative_user_id,
                    'related_entity_id': payment_request_id,
                    'related_entity_type': 'payment_request',
                    'target_roles': ['client'],
                    'metadata': client_metadata
                }
                
                try:
                    client_notif_result = db_admin.table("notifications")\
                        .insert(client_notification_data)\
                        .execute()
                    if is_dev_env():
                        logger.info("Client payment notification created for client: %s, notification_id: %s", client_user_id, client_notif_result.data[0]['id'] if client_notif_result.data else 'unknown')
                    
                    # Send email notification
                    if client_notif_result.data:
                        await _send_notification_email(client_notification_data, client_user_id, client_display_name, db_admin)
                except Exception as notif_error:
                    log_exception_if_dev(logger, "Failed to create client payment notification", notif_error)
                
                try:
                    creative_notif_result = db_admin.table("notifications")\
                        .insert(creative_notification_data)\
                        .execute()
                    if is_dev_env():
                        logger.info("Creative payment notification created for creative: %s, notification_id: %s", creative_user_id, creative_notif_result.data[0]['id'] if creative_notif_result.data else 'unknown')
                    
                    # Send email notification
                    if creative_notif_result.data:
                        # Get creative name
                        try:
                            creative_result = db_admin.table('creatives').select('display_name').eq('user_id', creative_user_id).single().execute()
                            creative_name = creative_result.data.get('display_name', 'Creative') if creative_result.data else 'Creative'
                            await _send_notification_email(creative_notification_data, creative_user_id, creative_name, db_admin)
                        except Exception as email_error:
                            log_exception_if_dev(logger, "Failed to send payment received email to creative", email_error)
                except Exception as notif_error:
                    log_exception_if_dev(logger, "Failed to create creative payment notification", notif_error)

            except Exception as notif_error:
                # Log error but don't fail payment verification
                log_exception_if_dev(logger, "Error creating payment notifications", notif_error)
            
            return {
                "success": True,
                "message": "Payment verified and payment request updated successfully",
                "payment_request_id": payment_request_id,
                "amount": float(updated_payment_request.get('amount', 0)),
                "status": updated_payment_request.get('status')
            }
            
        except stripe.error.StripeError as e:
            log_exception_if_dev(logger, "Stripe error verifying payment", e)
            raise HTTPException(status_code=400, detail="Payment verification failed")
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error verifying payment request", e)
            raise HTTPException(status_code=500, detail="Failed to verify payment")

