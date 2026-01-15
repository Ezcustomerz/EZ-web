from typing import List, Optional, Dict, Any
from datetime import datetime, date, time, timedelta
import logging
import os
from fastapi import HTTPException
from supabase import Client
from db.db_session import db_admin
from schemas.booking import (
    OrdersListResponse, OrderResponse, OrderFile, Invoice,
    CalendarSessionsResponse, CalendarSessionResponse
)

logger = logging.getLogger(__name__)

class OrderService:
    """Service for handling order retrieval operations"""
    
    @staticmethod
    def _get_invoices_for_booking(booking: Dict[str, Any], client: Client) -> List[Invoice]:
        """Get invoices for a booking if status allows it"""
        try:
            client_status = booking.get('client_status', '').lower()
            allowed_statuses = ['canceled', 'cancelled', 'completed', 'download']
            
            logger.info(f"[_get_invoices_for_booking] Checking invoices for booking {booking.get('id')}, status: '{client_status}' (raw: '{booking.get('client_status')}')")
            logger.info(f"[_get_invoices_for_booking] Allowed statuses: {allowed_statuses}")
            
            if client_status not in allowed_statuses:
                logger.warning(f"[_get_invoices_for_booking] Status '{client_status}' not in allowed statuses {allowed_statuses}, returning empty list")
                return []
            
            invoices = []
            booking_id = booking.get('id')
            
            # Get EZ platform invoice (always available)
            invoices.append(Invoice(
                type='ez_invoice',
                name='EZ Platform Invoice',
                download_url=f'/api/bookings/invoice/ez/{booking_id}'
            ))
            logger.info(f"[_get_invoices_for_booking] Added EZ invoice for booking {booking_id}")
            
            # Get Stripe receipts
            try:
                import stripe
                stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
                if not stripe_secret_key:
                    logger.warning(f"STRIPE_SECRET_KEY not found in environment variables, skipping Stripe receipts for booking {booking_id}")
                    return invoices
                stripe.api_key = stripe_secret_key
                
                # Get creative's Stripe account ID
                creative_user_id = booking.get('creative_user_id')
                creative_result = client.table('creatives')\
                    .select('stripe_account_id')\
                    .eq('user_id', creative_user_id)\
                    .single()\
                    .execute()
                
                if creative_result.data and creative_result.data.get('stripe_account_id'):
                    stripe_account_id = creative_result.data.get('stripe_account_id')
                    
                    # List all checkout sessions for this booking
                    checkout_sessions = stripe.checkout.Session.list(
                        limit=100,
                        stripe_account=stripe_account_id
                    )
                    
                    # Filter sessions for this booking_id
                    booking_sessions = [
                        session for session in checkout_sessions.data
                        if session.metadata and session.metadata.get('booking_id') == booking_id
                        and session.payment_status == 'paid'
                    ]
                    
                    # Sort sessions by creation date (oldest first) to ensure correct order for split payments
                    # First payment (deposit) should be Payment 1, second payment (final) should be Payment 2
                    booking_sessions.sort(key=lambda s: s.created if hasattr(s, 'created') else 0)
                    
                    # For split payments, there should be 2 sessions
                    # For upfront/later, there should be 1 session
                    payment_option = booking.get('payment_option', 'later').lower()
                    
                    if payment_option == 'split' and len(booking_sessions) >= 2:
                        # Split payment: 2 Stripe receipts
                        for idx, session in enumerate(booking_sessions[:2], 1):
                            invoices.append(Invoice(
                                type='stripe_receipt',
                                name=f'Stripe Receipt - Payment {idx}',
                                session_id=session.id,
                                download_url=f'/api/bookings/invoice/stripe/{booking_id}?session_id={session.id}'
                            ))
                    elif len(booking_sessions) >= 1:
                        # Single payment: 1 Stripe receipt
                        invoices.append(Invoice(
                            type='stripe_receipt',
                            name='Stripe Receipt',
                            session_id=booking_sessions[0].id,
                            download_url=f'/api/bookings/invoice/stripe/{booking_id}?session_id={booking_sessions[0].id}'
                        ))
            except Exception as e:
                logger.warning(f"Could not retrieve Stripe receipts for booking {booking_id}: {e}")
                # Continue without Stripe receipts
            
            logger.info(f"[_get_invoices_for_booking] Returning {len(invoices)} invoices for booking {booking_id}")
            return invoices
        except Exception as e:
            logger.error(f"Error getting invoices for booking {booking.get('id')}: {e}", exc_info=True)
            return []

    @staticmethod
    def _build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False, files=None, client: Optional[Client] = None):
        """Helper function to build an OrderResponse from booking data"""
        service = services_dict.get(booking['service_id'], {})
        creative = creatives_dict.get(booking.get('creative_user_id', ''), {})
        user = users_dict.get(booking.get('creative_user_id' if not is_creative_view else 'client_user_id', ''), {})
        
        # Format booking date for display
        booking_date_display = None
        if booking.get('booking_date'):
            try:
                date_str = booking['booking_date']
                start_time = booking.get('start_time', '')
                
                if start_time:
                    time_str = start_time.split('+')[0].split(' ')[0]
                    if time_str and len(time_str.split(':')) >= 2:
                        time_parts = time_str.split(':')
                        if len(time_parts) == 2:
                            time_str = f"{time_parts[0]}:{time_parts[1]}:00"
                        booking_date_display = f"{date_str}T{time_str}Z"
                    else:
                        booking_date_display = f"{date_str}T00:00:00Z"
                else:
                    booking_date_display = f"{date_str}T00:00:00Z"
            except Exception as e:
                logger.warning(f"Error formatting booking date: {e}")
                booking_date_display = None
        
        # Determine the status for view
        creative_status = booking.get('creative_status')
        client_status = booking.get('client_status', 'placed')
        
        if is_creative_view:
            display_status = creative_status or 'pending_approval'
        else:
            # For client view: show 'canceled' if either creative rejected OR client cancelled
            if creative_status == 'rejected' or client_status == 'cancelled':
                display_status = 'canceled'
            else:
                display_status = client_status
        
        # Get amount_paid from booking
        amount_paid = float(booking.get('amount_paid', 0)) if booking.get('amount_paid') else 0.0
        
        if is_creative_view:
            # Convert files to OrderFile format if provided
            order_files = None
            if files and len(files) > 0:
                try:
                    order_files = [OrderFile(**f) if isinstance(f, dict) else f for f in files]
                    logger.debug(f"[_build_order_response] Converted {len(order_files)} files for booking {booking.get('id')} (creative view)")
                except Exception as e:
                    logger.error(f"[_build_order_response] Error converting files to OrderFile: {e}", exc_info=True)
                    order_files = None
            
            return OrderResponse(
                id=booking['id'],
                service_id=booking['service_id'],
                service_name=service.get('title', 'Unknown Service'),
                service_description=service.get('description'),
                service_delivery_time=service.get('delivery_time'),
                service_color=service.get('color'),
                creative_id=booking.get('creative_user_id', ''),
                creative_name=user.get('name', 'Unknown Client'),
                creative_display_name=None,
                creative_title=None,
                creative_avatar_url=user.get('profile_picture_url'),
                creative_email=user.get('email'),
                creative_rating=None,
                creative_review_count=None,
                creative_services_count=None,
                creative_color=None,
                order_date=booking['order_date'],
                booking_date=booking_date_display,
                canceled_date=booking.get('canceled_date'),
                approved_at=booking.get('approved_at'),
                price=float(booking['price']) if booking.get('price') else 0.0,
                payment_option=booking.get('payment_option', 'later'),
                split_deposit_amount=float(booking['split_deposit_amount']) if booking.get('split_deposit_amount') is not None else None,
                amount_paid=amount_paid,
                description=booking.get('notes'),
                status=display_status,
                client_status=client_status,
                creative_status=creative_status,
                files=order_files
            )
        else:
            # Convert files to OrderFile format if provided
            order_files = None
            if files and len(files) > 0:
                try:
                    order_files = [OrderFile(**f) for f in files]
                    logger.debug(f"[_build_order_response] Converted {len(order_files)} files for booking {booking.get('id')}")
                except Exception as e:
                    logger.error(f"[_build_order_response] Error converting files to OrderFile: {e}", exc_info=True)
                    order_files = None
            
            # Get invoices if client is provided and status allows
            order_invoices = None
            if client and not is_creative_view:
                try:
                    order_invoices = OrderService._get_invoices_for_booking(booking, client)
                    logger.info(f"[_build_order_response] Got {len(order_invoices) if order_invoices else 0} invoices for booking {booking.get('id')}, invoices: {order_invoices}")
                    # Ensure we return an empty list instead of None if no invoices
                    if order_invoices is None:
                        order_invoices = []
                except Exception as e:
                    logger.error(f"Could not get invoices for booking {booking.get('id')}: {e}", exc_info=True)
                    order_invoices = []
            else:
                logger.debug(f"[_build_order_response] Skipping invoices - client: {client is not None}, is_creative_view: {is_creative_view}")
            
            return OrderResponse(
                id=booking['id'],
                service_id=booking['service_id'],
                service_name=service.get('title', 'Unknown Service'),
                service_description=service.get('description'),
                service_delivery_time=service.get('delivery_time'),
                service_color=service.get('color'),
                creative_id=booking.get('creative_user_id', ''),
                creative_name=user.get('name', 'Unknown Creative'),
                creative_display_name=creative.get('display_name'),
                creative_title=creative.get('title'),
                creative_avatar_url=user.get('profile_picture_url'),
                creative_email=user.get('email'),
                creative_rating=None,
                creative_review_count=None,
                creative_services_count=None,
                creative_color=None,
                order_date=booking['order_date'],
                booking_date=booking_date_display,
                canceled_date=booking.get('canceled_date'),
                approved_at=booking.get('approved_at'),
                price=float(booking['price']) if booking.get('price') else 0.0,
                payment_option=booking.get('payment_option', 'later'),
                split_deposit_amount=float(booking['split_deposit_amount']) if booking.get('split_deposit_amount') is not None else None,
                amount_paid=amount_paid,
                description=booking.get('notes'),
                status=display_status,
                client_status=client_status,
                creative_status=creative_status,
                files=order_files,
                invoices=order_invoices
            )

    @staticmethod
    async def get_client_orders(user_id: str, client: Client) -> OrdersListResponse:
        """Get all orders for the current client user
        
        Args:
            user_id: The client user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Fetch bookings for this client
            bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, split_deposit_amount, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
                .eq('client_user_id', user_id)\
                .order('order_date', desc=True)\
                .execute()
            
            if not bookings_response.data:
                return OrdersListResponse(success=True, orders=[])
            
            # Get unique service IDs and creative user IDs
            service_ids = list(set([b['service_id'] for b in bookings_response.data]))
            creative_user_ids = list(set([b['creative_user_id'] for b in bookings_response.data]))
            
            # Fetch services
            services_response = client.table('creative_services')\
                .select('id, title, description, delivery_time, color')\
                .in_('id', service_ids)\
                .execute()
            services_dict = {s['id']: s for s in (services_response.data or [])}
            
            # Fetch creatives
            creatives_response = client.table('creatives')\
                .select('user_id, display_name, title')\
                .in_('user_id', creative_user_ids)\
                .execute()
            creatives_dict = {c['user_id']: c for c in (creatives_response.data or [])}
            
            # Fetch users
            users_response = client.table('users')\
                .select('user_id, name, email, profile_picture_url')\
                .in_('user_id', creative_user_ids)\
                .execute()
            users_dict = {u['user_id']: u for u in (users_response.data or [])}
            
            # Fetch deliverables (files) for orders that have files (locked, download statuses)
            booking_ids = [b['id'] for b in bookings_response.data]
            deliverables_dict = {}
            
            if booking_ids:
                try:
                    logger.info(f"[get_client_orders] Fetching deliverables for {len(booking_ids)} bookings: {booking_ids}")
                    
                    # Query with UUID objects (Supabase handles UUID conversion)
                    # Include file_url for deduplication
                    deliverables_response = client.table('booking_deliverables')\
                        .select('id, booking_id, file_name, file_type, file_size_bytes, file_url')\
                        .in_('booking_id', booking_ids)\
                        .execute()
                    
                    logger.info(f"[get_client_orders] Query response: {deliverables_response}")
                    logger.info(f"[get_client_orders] Fetched {len(deliverables_response.data or [])} deliverables for {len(booking_ids)} bookings")
                    
                    if deliverables_response.data:
                        logger.info(f"[get_client_orders] Sample deliverable: {deliverables_response.data[0] if deliverables_response.data else 'None'}")
                    
                    # Group deliverables by booking_id and deduplicate by file_url
                    # (normalize to string for consistent lookup)
                    for deliverable in (deliverables_response.data or []):
                        booking_id = str(deliverable['booking_id'])  # Ensure string for dictionary key
                        if booking_id not in deliverables_dict:
                            deliverables_dict[booking_id] = []
                        
                        # Get file_url for deduplication
                        file_url = deliverable.get('file_url')
                        file_name = deliverable.get('file_name', 'Unknown')
                        
                        # Check if we already have this file (by file_url if available, or by name as fallback)
                        existing_files = deliverables_dict[booking_id]
                        is_duplicate = False
                        if file_url:
                            # Deduplicate by file_url (preferred method)
                            is_duplicate = any(f.get('file_url') == file_url for f in existing_files)
                        else:
                            # Fallback: deduplicate by file_name if file_url not available
                            # This is less reliable but better than showing duplicates
                            is_duplicate = any(f.get('name') == file_name for f in existing_files)
                        
                        if is_duplicate:
                            logger.debug(f"[get_client_orders] Skipping duplicate file: {file_name} (file_url: {file_url}) for booking {booking_id}")
                            continue
                        
                        # Format file size
                        file_size_bytes = deliverable.get('file_size_bytes', 0) or 0
                        if file_size_bytes > 1024 * 1024:
                            file_size_str = f"{(file_size_bytes / 1024 / 1024):.2f} MB"
                        else:
                            file_size_str = f"{(file_size_bytes / 1024):.2f} KB"
                        deliverables_dict[booking_id].append({
                            'id': str(deliverable['id']),
                            'name': file_name,
                            'type': deliverable.get('file_type', 'file'),
                            'size': file_size_str,
                            'file_url': file_url  # Store file_url for deduplication
                        })
                    
                    logger.info(f"[get_client_orders] Deliverables dict has {len(deliverables_dict)} bookings with files")
                    logger.info(f"[get_client_orders] Deliverables dict keys: {list(deliverables_dict.keys())}")
                except Exception as e:
                    logger.error(f"Error fetching deliverables in get_client_orders: {e}", exc_info=True)
                    deliverables_dict = {}
            
            orders = []
            for booking in bookings_response.data:
                booking_id_str = str(booking['id'])  # Convert to string for dictionary lookup
                booking_files = deliverables_dict.get(booking_id_str, [])
                
                logger.info(f"[get_client_orders] Booking {booking_id_str} (status: {booking.get('client_status')}) has {len(booking_files)} files")
                if booking_files:
                    logger.info(f"[get_client_orders] Files for booking {booking_id_str}: {booking_files}")
                
                order = OrderService._build_order_response(
                    booking, 
                    services_dict, 
                    creatives_dict, 
                    users_dict, 
                    is_creative_view=False,
                    files=booking_files,
                    client=client
                )
                
                logger.info(f"[get_client_orders] Order {order.id} has files: {order.files}")
                orders.append(order)
            
            return OrdersListResponse(success=True, orders=orders)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching client orders: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch client orders: {str(e)}")

    @staticmethod
    async def get_client_in_progress_orders(user_id: str, client: Client) -> OrdersListResponse:
        """Get in-progress orders for the current client user
        
        Args:
            user_id: The client user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Fetch bookings for this client with in_progress status
            bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, split_deposit_amount, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
                .eq('client_user_id', user_id)\
                .eq('client_status', 'in_progress')\
                .order('order_date', desc=True)\
                .execute()
            
            if not bookings_response.data:
                return OrdersListResponse(success=True, orders=[])
            
            # Get unique service IDs and creative user IDs
            service_ids = list(set([b['service_id'] for b in bookings_response.data]))
            creative_user_ids = list(set([b['creative_user_id'] for b in bookings_response.data]))
            
            # Fetch services, creatives, and users
            services_response = client.table('creative_services')\
                .select('id, title, description, delivery_time, color')\
                .in_('id', service_ids)\
                .execute()
            services_dict = {s['id']: s for s in (services_response.data or [])}
            
            creatives_response = client.table('creatives')\
                .select('user_id, display_name, title')\
                .in_('user_id', creative_user_ids)\
                .execute()
            creatives_dict = {c['user_id']: c for c in (creatives_response.data or [])}
            
            users_response = client.table('users')\
                .select('user_id, name, email, profile_picture_url')\
                .in_('user_id', creative_user_ids)\
                .execute()
            users_dict = {u['user_id']: u for u in (users_response.data or [])}
            
            orders = []
            for booking in bookings_response.data:
                order = OrderService._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False, client=client)
                orders.append(order)
            
            return OrdersListResponse(success=True, orders=orders)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching client in-progress orders: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch client in-progress orders: {str(e)}")

    @staticmethod
    async def get_client_action_needed_orders(user_id: str, client: Client) -> OrdersListResponse:
        """Get action-needed orders for the current client user
        
        Args:
            user_id: The client user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Fetch bookings for this client
            bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, split_deposit_amount, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
                .eq('client_user_id', user_id)\
                .in_('client_status', ['payment_required', 'locked', 'download'])\
                .order('order_date', desc=True)\
                .execute()
            
            if not bookings_response.data:
                return OrdersListResponse(success=True, orders=[])
            
            # Get unique service IDs and creative user IDs
            service_ids = list(set([b['service_id'] for b in bookings_response.data]))
            creative_user_ids = list(set([b['creative_user_id'] for b in bookings_response.data]))
            
            # Fetch services, creatives, and users
            services_response = client.table('creative_services')\
                .select('id, title, description, delivery_time, color')\
                .in_('id', service_ids)\
                .execute()
            services_dict = {s['id']: s for s in (services_response.data or [])}
            
            creatives_response = client.table('creatives')\
                .select('user_id, display_name, title')\
                .in_('user_id', creative_user_ids)\
                .execute()
            creatives_dict = {c['user_id']: c for c in (creatives_response.data or [])}
            
            users_response = client.table('users')\
                .select('user_id, name, email, profile_picture_url')\
                .in_('user_id', creative_user_ids)\
                .execute()
            users_dict = {u['user_id']: u for u in (users_response.data or [])}
            
            # Fetch deliverables (files) for locked and download orders
            # Keep booking IDs as they come from the database (UUID objects) for the query
            booking_ids = [b['id'] for b in bookings_response.data]
            deliverables_dict = {}
            
            if booking_ids:
                try:
                    # Query with UUID objects (Supabase handles UUID conversion)
                    # Include file_url for deduplication
                    deliverables_response = client.table('booking_deliverables')\
                        .select('id, booking_id, file_name, file_type, file_size_bytes, file_url')\
                        .in_('booking_id', booking_ids)\
                        .execute()
                    
                    logger.info(f"[get_client_action_needed_orders] Fetched {len(deliverables_response.data or [])} deliverables for {len(booking_ids)} bookings")
                    logger.info(f"[get_client_action_needed_orders] Booking IDs: {booking_ids}")
                    
                    # Group deliverables by booking_id and deduplicate by file_url
                    # (normalize to string for consistent lookup)
                    for deliverable in (deliverables_response.data or []):
                        booking_id = str(deliverable['booking_id'])  # Ensure string for dictionary key
                        if booking_id not in deliverables_dict:
                            deliverables_dict[booking_id] = []
                        
                        # Get file_url for deduplication
                        file_url = deliverable.get('file_url')
                        file_name = deliverable.get('file_name', 'Unknown')
                        
                        # Check if we already have this file (by file_url if available, or by name as fallback)
                        existing_files = deliverables_dict[booking_id]
                        is_duplicate = False
                        if file_url:
                            # Deduplicate by file_url (preferred method)
                            is_duplicate = any(f.get('file_url') == file_url for f in existing_files)
                        else:
                            # Fallback: deduplicate by file_name if file_url not available
                            is_duplicate = any(f.get('name') == file_name for f in existing_files)
                        
                        if is_duplicate:
                            logger.debug(f"[get_client_action_needed_orders] Skipping duplicate file: {file_name} (file_url: {file_url}) for booking {booking_id}")
                            continue
                        
                        # Format file size
                        file_size_bytes = deliverable.get('file_size_bytes', 0) or 0
                        if file_size_bytes > 1024 * 1024:
                            file_size_str = f"{(file_size_bytes / 1024 / 1024):.2f} MB"
                        else:
                            file_size_str = f"{(file_size_bytes / 1024):.2f} KB"
                        deliverables_dict[booking_id].append({
                            'id': str(deliverable['id']),
                            'name': file_name,
                            'type': deliverable.get('file_type', 'file'),
                            'size': file_size_str,
                            'file_url': file_url  # Store file_url for deduplication
                        })
                    
                    logger.info(f"[get_client_action_needed_orders] Deliverables dict keys: {list(deliverables_dict.keys())}")
                    logger.info(f"[get_client_action_needed_orders] Deliverables dict: {deliverables_dict}")
                except Exception as e:
                    logger.error(f"Error fetching deliverables: {e}", exc_info=True)
                    deliverables_dict = {}
            
            orders = []
            for booking in bookings_response.data:
                booking_id_str = str(booking['id'])  # Convert to string for dictionary lookup
                booking_files = deliverables_dict.get(booking_id_str, [])
                logger.info(f"[get_client_action_needed_orders] Booking {booking_id_str} has {len(booking_files)} files")
                
                order = OrderService._build_order_response(
                    booking, 
                    services_dict, 
                    creatives_dict, 
                    users_dict, 
                    is_creative_view=False,
                    files=booking_files,
                    client=client
                )
                orders.append(order)
            
            return OrdersListResponse(success=True, orders=orders)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching client action-needed orders: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch client action-needed orders: {str(e)}")

    @staticmethod
    async def get_client_history_orders(user_id: str, client: Client) -> OrdersListResponse:
        """Get history orders for the current client user
        
        Args:
            user_id: The client user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Fetch bookings for this client with completed or canceled status
            bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, split_deposit_amount, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
                .eq('client_user_id', user_id)\
                .in_('client_status', ['completed', 'cancelled'])\
                .order('order_date', desc=True)\
                .execute()
            
            # Also get orders where creative rejected (these show as canceled to client)
            rejected_bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, split_deposit_amount, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
                .eq('client_user_id', user_id)\
                .eq('creative_status', 'rejected')\
                .order('order_date', desc=True)\
                .execute()
            
            # Combine both queries
            all_bookings = (bookings_response.data or []) + (rejected_bookings_response.data or [])
            
            if not all_bookings:
                return OrdersListResponse(success=True, orders=[])
            
            # Get unique service IDs and creative user IDs
            service_ids = list(set([b['service_id'] for b in all_bookings]))
            creative_user_ids = list(set([b['creative_user_id'] for b in all_bookings]))
            
            # Fetch services, creatives, and users
            services_response = client.table('creative_services')\
                .select('id, title, description, delivery_time, color')\
                .in_('id', service_ids)\
                .execute()
            services_dict = {s['id']: s for s in (services_response.data or [])}
            
            creatives_response = client.table('creatives')\
                .select('user_id, display_name, title')\
                .in_('user_id', creative_user_ids)\
                .execute()
            creatives_dict = {c['user_id']: c for c in (creatives_response.data or [])}
            
            users_response = client.table('users')\
                .select('user_id, name, email, profile_picture_url')\
                .in_('user_id', creative_user_ids)\
                .execute()
            users_dict = {u['user_id']: u for u in (users_response.data or [])}
            
            orders = []
            for booking in all_bookings:
                order = OrderService._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False, client=client)
                orders.append(order)
            
            return OrdersListResponse(success=True, orders=orders)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching client history orders: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch client history orders: {str(e)}")

    @staticmethod
    async def get_client_upcoming_bookings(user_id: str, client: Client) -> OrdersListResponse:
        """Get upcoming scheduled bookings for the current client user
        
        Args:
            user_id: The client user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            from datetime import date, datetime
            
            # Fetch upcoming bookings (scheduled bookings with booking_date and start_time)
            # Filter for bookings that:
            # - Have booking_date and start_time (scheduled bookings)
            # - booking_date >= today
            # - Are not cancelled
            today = date.today().isoformat()
            
            bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, end_time, price, payment_option, split_deposit_amount, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
                .eq('client_user_id', user_id)\
                .not_.is_('booking_date', 'null')\
                .not_.is_('start_time', 'null')\
                .gte('booking_date', today)\
                .neq('client_status', 'cancelled')\
                .order('booking_date', desc=False)\
                .order('start_time', desc=False)\
                .limit(25)\
                .execute()
            
            if not bookings_response.data:
                return OrdersListResponse(success=True, orders=[])
            
            # Get unique service IDs and creative user IDs
            service_ids = list(set([b['service_id'] for b in bookings_response.data]))
            creative_user_ids = list(set([b['creative_user_id'] for b in bookings_response.data]))
            
            # Fetch services, creatives, and users
            services_response = client.table('creative_services')\
                .select('id, title, description, delivery_time, color')\
                .in_('id', service_ids)\
                .execute()
            services_dict = {s['id']: s for s in (services_response.data or [])}
            
            creatives_response = client.table('creatives')\
                .select('user_id, display_name, title')\
                .in_('user_id', creative_user_ids)\
                .execute()
            creatives_dict = {c['user_id']: c for c in (creatives_response.data or [])}
            
            users_response = client.table('users')\
                .select('user_id, name, email, profile_picture_url')\
                .in_('user_id', creative_user_ids)\
                .execute()
            users_dict = {u['user_id']: u for u in (users_response.data or [])}
            
            orders = []
            for booking in bookings_response.data:
                order = OrderService._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False, client=client)
                orders.append(order)
            
            return OrdersListResponse(success=True, orders=orders)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching client upcoming bookings: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch client upcoming bookings: {str(e)}")

    @staticmethod
    async def get_creative_orders(user_id: str, client: Client) -> OrdersListResponse:
        """Get all orders for the current creative user
        
        Args:
            user_id: The creative user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Fetch bookings for this creative
            bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, split_deposit_amount, notes, client_status, creative_status, client_user_id, canceled_date, approved_at, amount_paid')\
                .eq('creative_user_id', user_id)\
                .order('order_date', desc=True)\
                .execute()
            
            if not bookings_response.data:
                return OrdersListResponse(success=True, orders=[])
            
            # Get unique service IDs and client user IDs
            service_ids = list(set([b['service_id'] for b in bookings_response.data]))
            client_user_ids = list(set([b['client_user_id'] for b in bookings_response.data]))
            
            # Fetch services
            services_response = client.table('creative_services')\
                .select('id, title, description, delivery_time, color')\
                .in_('id', service_ids)\
                .execute()
            services_dict = {s['id']: s for s in (services_response.data or [])}
            
            # Fetch users (clients)
            users_response = client.table('users')\
                .select('user_id, name, email, profile_picture_url')\
                .in_('user_id', client_user_ids)\
                .execute()
            users_dict = {u['user_id']: u for u in (users_response.data or [])}
            
            # For creative view, we don't need creatives dict
            creatives_dict = {}
            
            orders = []
            for booking in bookings_response.data:
                order = OrderService._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=True)
                orders.append(order)
            
            return OrdersListResponse(success=True, orders=orders)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching creative orders: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative orders: {str(e)}")

    @staticmethod
    async def get_creative_current_orders(user_id: str, client: Client) -> OrdersListResponse:
        """Get current orders for the current creative user
        
        Args:
            user_id: The creative user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Fetch bookings for this creative, excluding completed/rejected orders
            bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, split_deposit_amount, notes, client_status, creative_status, client_user_id, canceled_date, approved_at, amount_paid')\
                .eq('creative_user_id', user_id)\
                .not_.in_('creative_status', ['completed', 'rejected'])\
                .order('order_date', desc=True)\
                .execute()
            
            if not bookings_response.data:
                return OrdersListResponse(success=True, orders=[])
            
            # Get unique service IDs and client user IDs
            service_ids = list(set([b['service_id'] for b in bookings_response.data]))
            client_user_ids = list(set([b['client_user_id'] for b in bookings_response.data]))
            
            # Fetch services
            services_response = client.table('creative_services')\
                .select('id, title, description, delivery_time, color')\
                .in_('id', service_ids)\
                .execute()
            services_dict = {s['id']: s for s in (services_response.data or [])}
            
            # Fetch users (clients)
            users_response = client.table('users')\
                .select('user_id, name, email, profile_picture_url')\
                .in_('user_id', client_user_ids)\
                .execute()
            users_dict = {u['user_id']: u for u in (users_response.data or [])}
            
            creatives_dict = {}
            
            orders = []
            for booking in bookings_response.data:
                order = OrderService._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=True)
                orders.append(order)
            
            return OrdersListResponse(success=True, orders=orders)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching creative current orders: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative current orders: {str(e)}")

    @staticmethod
    async def get_creative_past_orders(user_id: str, client: Client) -> OrdersListResponse:
        """Get past orders for the current creative user
        
        Args:
            user_id: The creative user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Fetch bookings for this creative, only completed/rejected orders
            bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, split_deposit_amount, notes, client_status, creative_status, client_user_id, canceled_date, approved_at, amount_paid')\
                .eq('creative_user_id', user_id)\
                .in_('creative_status', ['completed', 'rejected'])\
                .order('order_date', desc=True)\
                .execute()
            
            if not bookings_response.data:
                return OrdersListResponse(success=True, orders=[])
            
            # Get unique service IDs and client user IDs
            service_ids = list(set([b['service_id'] for b in bookings_response.data]))
            client_user_ids = list(set([b['client_user_id'] for b in bookings_response.data]))
            
            # Fetch services
            services_response = client.table('creative_services')\
                .select('id, title, description, delivery_time, color')\
                .in_('id', service_ids)\
                .execute()
            services_dict = {s['id']: s for s in (services_response.data or [])}
            
            # Fetch users (clients)
            users_response = client.table('users')\
                .select('user_id, name, email, profile_picture_url')\
                .in_('user_id', client_user_ids)\
                .execute()
            users_dict = {u['user_id']: u for u in (users_response.data or [])}
            
            creatives_dict = {}
            
            # Fetch deliverables with download status
            booking_ids = [b['id'] for b in bookings_response.data]
            deliverables_dict = {}
            if booking_ids:
                try:
                    deliverables_response = client.table('booking_deliverables')\
                        .select('id, booking_id, file_name, file_type, file_size_bytes, file_url, downloaded_at')\
                        .in_('booking_id', booking_ids)\
                        .execute()
                    
                    for deliverable in (deliverables_response.data or []):
                        booking_id = str(deliverable['booking_id'])
                        if booking_id not in deliverables_dict:
                            deliverables_dict[booking_id] = []
                        
                        # Get file_url for deduplication
                        file_url = deliverable.get('file_url')
                        file_name = deliverable.get('file_name', 'Unknown')
                        
                        # Check if we already have this file (by file_url if available, or by name as fallback)
                        existing_files = deliverables_dict[booking_id]
                        is_duplicate = False
                        if file_url:
                            # Deduplicate by file_url (preferred method)
                            is_duplicate = any(f.get('file_url') == file_url for f in existing_files)
                        else:
                            # Fallback: deduplicate by file_name if file_url not available
                            is_duplicate = any(f.get('name') == file_name for f in existing_files)
                        
                        if is_duplicate:
                            logger.debug(f"[get_creative_past_orders] Skipping duplicate file: {file_name} (file_url: {file_url}) for booking {booking_id}")
                            continue
                        
                        file_size_bytes = deliverable.get('file_size_bytes', 0) or 0
                        if file_size_bytes > 1024 * 1024:
                            file_size_str = f"{(file_size_bytes / 1024 / 1024):.2f} MB"
                        else:
                            file_size_str = f"{(file_size_bytes / 1024):.2f} KB"
                        deliverables_dict[booking_id].append({
                            'id': str(deliverable['id']),
                            'name': file_name,
                            'type': deliverable.get('file_type', 'file'),
                            'size': file_size_str,
                            'file_url': file_url,  # Store file_url for deduplication
                            'downloaded_at': deliverable.get('downloaded_at')
                        })
                except Exception as e:
                    logger.error(f"Error fetching deliverables in get_creative_past_orders: {e}", exc_info=True)
                    deliverables_dict = {}
            
            orders = []
            for booking in bookings_response.data:
                booking_id_str = str(booking['id'])
                booking_files = deliverables_dict.get(booking_id_str, [])
                # Convert to OrderFile format
                order_files = []
                for f in booking_files:
                    order_files.append(OrderFile(
                        id=f['id'],
                        name=f['name'],
                        type=f['type'],
                        size=f['size'],
                        downloaded_at=f.get('downloaded_at')
                    ))
                order = OrderService._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=True, files=order_files)
                orders.append(order)
            
            return OrdersListResponse(success=True, orders=orders)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching creative past orders: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative past orders: {str(e)}")

    @staticmethod
    async def get_creative_dashboard_stats(user_id: str, client: Client) -> Dict[str, Any]:
        """Get dashboard statistics for the current creative user (current month only)
        
        Args:
            user_id: The creative user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Returns:
            Dictionary containing current month statistics:
            - total_clients: Number of new clients this month (clients with first booking this month)
            - monthly_amount: Net amount from Stripe for current month (matches Stripe Express dashboard)
            - total_bookings: Number of bookings created this month
            - completed_sessions: Number of sessions completed this month
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            from datetime import datetime, timezone
            import stripe
            import os
            
            # Get current month start and end timestamps
            now = datetime.now(timezone.utc)
            month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
            month_end = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc) if now.month < 12 else datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
            month_start_timestamp = int(month_start.timestamp())
            month_end_timestamp = int(month_end.timestamp())
            
            # Get all bookings for this creative
            bookings_response = client.table('bookings')\
                .select('id, client_user_id, amount_paid, creative_status, order_date, updated_at')\
                .eq('creative_user_id', user_id)\
                .execute()
            
            bookings = bookings_response.data or []
            
            # Calculate stats for current month
            # Filter bookings created this month (based on order_date)
            bookings_this_month = []
            for booking in bookings:
                order_date_str = booking.get('order_date')
                if order_date_str:
                    try:
                        order_date = datetime.fromisoformat(order_date_str.replace('Z', '+00:00'))
                        if month_start <= order_date < month_end:
                            bookings_this_month.append(booking)
                    except (ValueError, AttributeError):
                        continue
            
            # New clients this month: count unique clients from bookings created this month
            new_clients_this_month = len(set(b['client_user_id'] for b in bookings_this_month))
            
            # Total bookings created this month
            total_bookings_this_month = len(bookings_this_month)
            
            # Completed sessions this month: sessions with completed status, updated within this month
            completed_sessions_this_month = 0
            for booking in bookings:
                if booking.get('creative_status') == 'completed':
                    updated_at_str = booking.get('updated_at')
                    if updated_at_str:
                        try:
                            updated_at = datetime.fromisoformat(updated_at_str.replace('Z', '+00:00'))
                            if month_start <= updated_at < month_end:
                                completed_sessions_this_month += 1
                        except (ValueError, AttributeError):
                            # If no valid updated_at, check order_date as fallback
                            order_date_str = booking.get('order_date')
                            if order_date_str:
                                try:
                                    order_date = datetime.fromisoformat(order_date_str.replace('Z', '+00:00'))
                                    if month_start <= order_date < month_end:
                                        completed_sessions_this_month += 1
                                except (ValueError, AttributeError):
                                    continue
            
            # Get monthly amount from Stripe if account is connected
            monthly_amount = 0.0
            try:
                # Get creative's Stripe account ID
                creative_result = client.table('creatives')\
                    .select('stripe_account_id')\
                    .eq('user_id', user_id)\
                    .single()\
                    .execute()
                
                if creative_result.data and creative_result.data.get('stripe_account_id'):
                    stripe_account_id = creative_result.data.get('stripe_account_id')
                    stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
                    
                    if stripe_secret_key:
                        stripe.api_key = stripe_secret_key
                        
                        # Get balance transactions for current month from Stripe
                        # This gives us the actual net amounts after all fees
                        balance_transactions = stripe.BalanceTransaction.list(
                            created={'gte': month_start_timestamp, 'lt': month_end_timestamp},
                            stripe_account=stripe_account_id,
                            limit=100  # Adjust if needed
                        )
                        
                        # Sum up all positive net amounts (this matches Stripe Express dashboard)
                        # The net field already accounts for all fees (platform + Stripe processing)
                        # We sum positive net amounts which represent earnings
                        for transaction in balance_transactions.data:
                            # Include all transactions with positive net (earnings)
                            # Exclude negative transactions (refunds, chargebacks, fees)
                            if transaction.net > 0:
                                # Convert from cents to dollars
                                monthly_amount += transaction.net / 100
                        
                        # If there are more than 100 transactions, paginate
                        while balance_transactions.has_more:
                            balance_transactions = stripe.BalanceTransaction.list(
                                created={'gte': month_start_timestamp, 'lt': month_end_timestamp},
                                stripe_account=stripe_account_id,
                                limit=100,
                                starting_after=balance_transactions.data[-1].id
                            )
                            
                            for transaction in balance_transactions.data:
                                if transaction.net > 0:
                                    monthly_amount += transaction.net / 100
                    
            except Exception as stripe_error:
                # If Stripe fetch fails, fall back to database calculation
                logger.warning(f"Failed to fetch monthly amount from Stripe, falling back to database calculation: {stripe_error}")
                
                # Fallback: Calculate from bookings (less accurate but better than nothing)
                for booking in bookings:
                    order_date_str = booking.get('order_date')
                    if order_date_str:
                        try:
                            order_date = datetime.fromisoformat(order_date_str.replace('Z', '+00:00'))
                            if month_start <= order_date < month_end:
                                amount_paid = booking.get('amount_paid', 0)
                                if amount_paid:
                                    monthly_amount += float(amount_paid)
                        except (ValueError, AttributeError):
                            continue
            
            return {
                'total_clients': new_clients_this_month,
                'monthly_amount': round(monthly_amount, 2),
                'total_bookings': total_bookings_this_month,
                'completed_sessions': completed_sessions_this_month
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching creative dashboard stats: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative dashboard stats: {str(e)}")

    @staticmethod
    async def get_creative_calendar_sessions(user_id: str, year: int, month: int, client: Client) -> CalendarSessionsResponse:
        """Get calendar sessions for the current creative user for a specific month
        
        Args:
            user_id: The creative user ID
            year: The year to fetch sessions for
            month: The month to fetch sessions for
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Calculate month start and end dates
            month_start = datetime(year, month, 1)
            if month == 12:
                next_month_start = datetime(year + 1, 1, 1)
            else:
                next_month_start = datetime(year, month + 1, 1)
            
            month_start_str = month_start.strftime('%Y-%m-%d')
            month_end_str = (next_month_start - timedelta(days=1)).strftime('%Y-%m-%d')
            
            # Fetch bookings for this creative in the specified month
            bookings_response = client.table('bookings')\
                .select('id, service_id, booking_date, start_time, end_time, notes, creative_status, client_user_id')\
                .eq('creative_user_id', user_id)\
                .gte('booking_date', month_start_str)\
                .lte('booking_date', month_end_str)\
                .order('booking_date', desc=False)\
                .order('start_time', desc=False)\
                .execute()
            
            if not bookings_response.data:
                return CalendarSessionsResponse(success=True, sessions=[])
            
            # Get unique service IDs and client user IDs
            service_ids = list(set([b['service_id'] for b in bookings_response.data if b.get('service_id')]))
            client_user_ids = list(set([b['client_user_id'] for b in bookings_response.data if b.get('client_user_id')]))
            
            # Fetch services
            services_dict = {}
            if service_ids:
                services_response = client.table('creative_services')\
                    .select('id, title')\
                    .in_('id', service_ids)\
                    .execute()
                services_dict = {s['id']: s for s in (services_response.data or [])}
            
            # Fetch users (clients)
            users_dict = {}
            if client_user_ids:
                users_response = client.table('users')\
                    .select('user_id, name')\
                    .in_('user_id', client_user_ids)\
                    .execute()
                users_dict = {u['user_id']: u for u in (users_response.data or [])}
            
            sessions = []
            for booking in bookings_response.data:
                if not booking.get('booking_date'):
                    continue
                
                service = services_dict.get(booking['service_id'], {})
                user = users_dict.get(booking['client_user_id'], {})
                
                # Format time (extract HH:MM from start_time and end_time)
                start_time = booking.get('start_time', '')
                end_time = booking.get('end_time', '')
                
                # Extract time portion
                time_str = '09:00'  # default
                if start_time:
                    time_str = start_time.split('+')[0].split(' ')[0]
                    if ':' in time_str:
                        parts = time_str.split(':')
                        time_str = f"{parts[0]}:{parts[1]}"
                
                end_time_str = '10:00'  # default
                if end_time:
                    end_time_str = end_time.split('+')[0].split(' ')[0]
                    if ':' in end_time_str:
                        parts = end_time_str.split(':')
                        end_time_str = f"{parts[0]}:{parts[1]}"
                
                # Map creative_status to calendar status
                creative_status = booking.get('creative_status', 'pending_approval')
                if creative_status == 'pending_approval':
                    calendar_status = 'pending'
                elif creative_status == 'rejected':
                    calendar_status = 'cancelled'
                elif creative_status in ['in_progress', 'awaiting_payment', 'completed']:
                    calendar_status = 'confirmed'
                else:
                    calendar_status = 'pending'
                
                session = CalendarSessionResponse(
                    id=booking['id'],
                    date=booking['booking_date'],
                    time=time_str,
                    endTime=end_time_str,
                    client=user.get('name', 'Unknown Client'),
                    type=service.get('title', 'Unknown Service'),
                    status=calendar_status,
                    notes=booking.get('notes')
                )
                sessions.append(session)
            
            return CalendarSessionsResponse(success=True, sessions=sessions)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching creative calendar sessions: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch calendar sessions: {str(e)}")

    @staticmethod
    async def get_creative_calendar_sessions_week(user_id: str, start_date: str, end_date: str, client: Client) -> CalendarSessionsResponse:
        """Get calendar sessions for the current creative user for a specific week (date range)
        
        Args:
            user_id: The creative user ID
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Validate date format
            try:
                datetime.strptime(start_date, '%Y-%m-%d')
                datetime.strptime(end_date, '%Y-%m-%d')
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD")
            
            # Fetch bookings for this creative in the specified date range
            bookings_response = client.table('bookings')\
                .select('id, service_id, booking_date, start_time, end_time, notes, creative_status, client_user_id')\
                .eq('creative_user_id', user_id)\
                .gte('booking_date', start_date)\
                .lte('booking_date', end_date)\
                .order('booking_date', desc=False)\
                .order('start_time', desc=False)\
                .execute()
            
            if not bookings_response.data:
                return CalendarSessionsResponse(success=True, sessions=[])
            
            # Get unique service IDs and client user IDs
            service_ids = list(set([b['service_id'] for b in bookings_response.data if b.get('service_id')]))
            client_user_ids = list(set([b['client_user_id'] for b in bookings_response.data if b.get('client_user_id')]))
            
            # Fetch services
            services_dict = {}
            if service_ids:
                services_response = client.table('creative_services')\
                    .select('id, title')\
                    .in_('id', service_ids)\
                    .execute()
                services_dict = {s['id']: s for s in (services_response.data or [])}
            
            # Fetch users (clients)
            users_dict = {}
            if client_user_ids:
                users_response = client.table('users')\
                    .select('user_id, name')\
                    .in_('user_id', client_user_ids)\
                    .execute()
                users_dict = {u['user_id']: u for u in (users_response.data or [])}
            
            sessions = []
            for booking in bookings_response.data:
                if not booking.get('booking_date'):
                    continue
                
                service = services_dict.get(booking['service_id'], {})
                user = users_dict.get(booking['client_user_id'], {})
                
                # Format time
                start_time = booking.get('start_time', '')
                end_time = booking.get('end_time', '')
                
                time_str = '09:00'
                if start_time:
                    time_str = start_time.split('+')[0].split(' ')[0]
                    if ':' in time_str:
                        parts = time_str.split(':')
                        time_str = f"{parts[0]}:{parts[1]}"
                
                end_time_str = '10:00'
                if end_time:
                    end_time_str = end_time.split('+')[0].split(' ')[0]
                    if ':' in end_time_str:
                        parts = end_time_str.split(':')
                        end_time_str = f"{parts[0]}:{parts[1]}"
                
                # Map creative_status to calendar status
                creative_status = booking.get('creative_status', 'pending_approval')
                if creative_status == 'pending_approval':
                    calendar_status = 'pending'
                elif creative_status == 'rejected':
                    calendar_status = 'cancelled'
                elif creative_status in ['in_progress', 'awaiting_payment', 'completed']:
                    calendar_status = 'confirmed'
                else:
                    calendar_status = 'pending'
                
                session = CalendarSessionResponse(
                    id=booking['id'],
                    date=booking['booking_date'],
                    time=time_str,
                    endTime=end_time_str,
                    client=user.get('name', 'Unknown Client'),
                    type=service.get('title', 'Unknown Service'),
                    status=calendar_status,
                    notes=booking.get('notes')
                )
                sessions.append(session)
            
            return CalendarSessionsResponse(success=True, sessions=sessions)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching creative calendar sessions for week: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch calendar sessions: {str(e)}")

