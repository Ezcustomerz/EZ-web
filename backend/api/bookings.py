from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import logging
from db.db_session import db_admin
from core.limiter import limiter
from core.verify import require_auth

logger = logging.getLogger(__name__)
router = APIRouter()


class CreateBookingRequest(BaseModel):
    service_id: str
    booking_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    session_duration: Optional[int] = None
    notes: Optional[str] = None


class CreateBookingResponse(BaseModel):
    success: bool
    message: str
    booking_id: Optional[str] = None
    booking: Optional[dict] = None


@router.post("/create", response_model=CreateBookingResponse)
@limiter.limit("10 per minute")
async def create_booking(
    request: Request,
    booking_data: CreateBookingRequest,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Create a new booking/order
    Requires authentication - will return 401 if not authenticated.
    - Fetches service details (creative_user_id, price, payment_option)
    - Creates booking with proper status tracking
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        # Get service details including creative_user_id
        service_response = db_admin.table('creative_services')\
            .select('creative_user_id, price, payment_option, title')\
            .eq('id', booking_data.service_id)\
            .single()\
            .execute()
        
        if not service_response.data:
            raise HTTPException(status_code=404, detail="Service not found")
        
        service = service_response.data
        
        # Prepare booking insert
        booking_insert = {
            'service_id': booking_data.service_id,
            'client_user_id': user_id,
            'creative_user_id': service['creative_user_id'],
            'price': service['price'],
            'payment_option': service['payment_option'] or 'later',
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
        booking_response = db_admin.table('bookings')\
            .insert(booking_insert)\
            .execute()
        
        if not booking_response.data or len(booking_response.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create booking")
        
        booking = booking_response.data[0]
        
        logger.info(f"Booking created successfully: {booking['id']} for user {user_id}")
        
        # Get client and creative display names for notifications
        client_response = db_admin.table("clients") \
            .select("display_name") \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        creative_response = db_admin.table("creatives") \
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
            client_notif_result = db_admin.table("notifications") \
                .insert(client_notification_data) \
                .execute()
            logger.info(f"Client notification created: {client_notif_result.data}")
        except Exception as notif_error:
            logger.error(f"Failed to create client notification: {notif_error}")
        
        try:
            creative_notif_result = db_admin.table("notifications") \
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


class OrderResponse(BaseModel):
    id: str
    service_id: str
    service_name: str
    service_description: Optional[str]
    service_delivery_time: Optional[str]
    service_color: Optional[str]
    creative_id: str
    creative_name: str
    creative_display_name: Optional[str]
    creative_title: Optional[str]
    creative_avatar_url: Optional[str]
    creative_email: Optional[str]
    creative_rating: Optional[float]
    creative_review_count: Optional[int]
    creative_services_count: Optional[int]
    creative_color: Optional[str]
    order_date: str
    booking_date: Optional[str]
    canceled_date: Optional[str]
    approved_at: Optional[str]
    price: float
    payment_option: Optional[str]
    description: Optional[str]
    status: str
    client_status: Optional[str]
    creative_status: Optional[str]


class OrdersListResponse(BaseModel):
    success: bool
    orders: List[OrderResponse]


@router.get("/client", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Get all orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with client_status = 'placed' (and other statuses)
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Fetch bookings for this client
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at')\
            .eq('client_user_id', user_id)\
            .order('order_date', desc=True)\
            .execute()
        
        if not bookings_response.data:
            return OrdersListResponse(success=True, orders=[])
        
        # Get unique service IDs and creative user IDs
        service_ids = list(set([b['service_id'] for b in bookings_response.data]))
        creative_user_ids = list(set([b['creative_user_id'] for b in bookings_response.data]))
        
        # Fetch services
        services_response = db_admin.table('creative_services')\
            .select('id, title, description, delivery_time, color')\
            .in_('id', service_ids)\
            .execute()
        services_dict = {s['id']: s for s in (services_response.data or [])}
        
        # Fetch creatives
        creatives_response = db_admin.table('creatives')\
            .select('user_id, display_name, title')\
            .in_('user_id', creative_user_ids)\
            .execute()
        creatives_dict = {c['user_id']: c for c in (creatives_response.data or [])}
        
        # Fetch users
        users_response = db_admin.table('users')\
            .select('user_id, name, email, profile_picture_url')\
            .in_('user_id', creative_user_ids)\
            .execute()
        users_dict = {u['user_id']: u for u in (users_response.data or [])}
        
        orders = []
        for booking in bookings_response.data:
            service = services_dict.get(booking['service_id'], {})
            creative = creatives_dict.get(booking['creative_user_id'], {})
            user = users_dict.get(booking['creative_user_id'], {})
            
            # Format booking date for display (combine booking_date and start_time if available)
            booking_date_display = None
            if booking.get('booking_date'):
                try:
                    date_str = booking['booking_date']
                    start_time = booking.get('start_time', '')
                    
                    # If we have both date and time, combine them
                    if start_time:
                        # Extract time part (handle formats like "HH:MM:SS+00" or "HH:MM:SS")
                        time_str = start_time.split('+')[0].split(' ')[0]
                        if time_str and len(time_str.split(':')) >= 2:
                            # Ensure time has seconds
                            time_parts = time_str.split(':')
                            if len(time_parts) == 2:
                                time_str = f"{time_parts[0]}:{time_parts[1]}:00"
                            booking_date_display = f"{date_str}T{time_str}Z"
                        else:
                            # Fallback to date only with midnight
                            booking_date_display = f"{date_str}T00:00:00Z"
                    else:
                        # Just a date, add midnight UTC
                        booking_date_display = f"{date_str}T00:00:00Z"
                except Exception as e:
                    logger.warning(f"Error formatting booking date: {e}")
                    booking_date_display = None
            
            # Determine the status for client view
            # If creative rejected the order, show as 'canceled' to the client
            creative_status = booking.get('creative_status')
            client_status = booking.get('client_status', 'placed')
            
            # If creative rejected the order, the client should see it as canceled
            if creative_status == 'rejected':
                display_status = 'canceled'
            elif client_status == 'cancelled':
                # Map database 'cancelled' (British spelling) to frontend 'canceled' (American spelling)
                display_status = 'canceled'
            else:
                display_status = client_status
            
            order = OrderResponse(
                id=booking['id'],
                service_id=booking['service_id'],
                service_name=service.get('title', 'Unknown Service'),
                service_description=service.get('description'),
                service_delivery_time=service.get('delivery_time'),
                service_color=service.get('color'),
                creative_id=booking['creative_user_id'],
                creative_name=user.get('name', 'Unknown Creative'),
                creative_display_name=creative.get('display_name'),
                creative_title=creative.get('title'),
                creative_avatar_url=user.get('profile_picture_url'),
                creative_email=user.get('email'),
                creative_rating=None,  # TODO: Add rating fetching
                creative_review_count=None,  # TODO: Add review count fetching
                creative_services_count=None,  # TODO: Add services count fetching
                creative_color=None,  # TODO: Add creative color
                order_date=booking['order_date'],
                booking_date=booking_date_display,
                canceled_date=booking.get('canceled_date'),
                approved_at=booking.get('approved_at'),
                price=float(booking['price']) if booking.get('price') else 0.0,
                payment_option=booking.get('payment_option', 'later'),
                description=booking.get('notes'),
                status=display_status,
                client_status=client_status,
                creative_status=creative_status
            )
            orders.append(order)
        
        return OrdersListResponse(success=True, orders=orders)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client orders: {str(e)}")


# Helper function to build order response from booking data
def build_order_response(booking, services_dict, creatives_dict, users_dict):
    """Helper function to build an OrderResponse from booking data"""
    service = services_dict.get(booking['service_id'], {})
    creative = creatives_dict.get(booking['creative_user_id'], {})
    user = users_dict.get(booking['creative_user_id'], {})
    
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
    
    # Determine the status for client view
    creative_status = booking.get('creative_status')
    client_status = booking.get('client_status', 'placed')
    
    if creative_status == 'rejected':
        display_status = 'canceled'
    elif client_status == 'cancelled':
        display_status = 'canceled'
    else:
        display_status = client_status
    
    return OrderResponse(
        id=booking['id'],
        service_id=booking['service_id'],
        service_name=service.get('title', 'Unknown Service'),
        service_description=service.get('description'),
        service_delivery_time=service.get('delivery_time'),
        service_color=service.get('color'),
        creative_id=booking['creative_user_id'],
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
        description=booking.get('notes'),
        status=display_status,
        client_status=client_status,
        creative_status=creative_status
    )


@router.get("/client/in-progress", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_in_progress_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Get in-progress orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with client_status = 'in_progress'
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Fetch bookings for this client with in_progress status
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at')\
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
        services_response = db_admin.table('creative_services')\
            .select('id, title, description, delivery_time, color')\
            .in_('id', service_ids)\
            .execute()
        services_dict = {s['id']: s for s in (services_response.data or [])}
        
        creatives_response = db_admin.table('creatives')\
            .select('user_id, display_name, title')\
            .in_('user_id', creative_user_ids)\
            .execute()
        creatives_dict = {c['user_id']: c for c in (creatives_response.data or [])}
        
        users_response = db_admin.table('users')\
            .select('user_id, name, email, profile_picture_url')\
            .in_('user_id', creative_user_ids)\
            .execute()
        users_dict = {u['user_id']: u for u in (users_response.data or [])}
        
        orders = []
        for booking in bookings_response.data:
            order = build_order_response(booking, services_dict, creatives_dict, users_dict)
            orders.append(order)
        
        return OrdersListResponse(success=True, orders=orders)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client in-progress orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client in-progress orders: {str(e)}")


@router.get("/client/action-needed", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_action_needed_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Get action-needed orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with statuses: payment_required, locked, download
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Fetch bookings for this client
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at')\
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
        services_response = db_admin.table('creative_services')\
            .select('id, title, description, delivery_time, color')\
            .in_('id', service_ids)\
            .execute()
        services_dict = {s['id']: s for s in (services_response.data or [])}
        
        creatives_response = db_admin.table('creatives')\
            .select('user_id, display_name, title')\
            .in_('user_id', creative_user_ids)\
            .execute()
        creatives_dict = {c['user_id']: c for c in (creatives_response.data or [])}
        
        users_response = db_admin.table('users')\
            .select('user_id, name, email, profile_picture_url')\
            .in_('user_id', creative_user_ids)\
            .execute()
        users_dict = {u['user_id']: u for u in (users_response.data or [])}
        
        orders = []
        for booking in bookings_response.data:
            order = build_order_response(booking, services_dict, creatives_dict, users_dict)
            orders.append(order)
        
        return OrdersListResponse(success=True, orders=orders)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client action-needed orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client action-needed orders: {str(e)}")


@router.get("/client/history", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_history_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Get history orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with statuses: completed, canceled
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Fetch bookings for this client with completed or canceled status
        # Also include cancelled (British spelling) and rejected creative status (shown as canceled)
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at')\
            .eq('client_user_id', user_id)\
            .in_('client_status', ['completed', 'cancelled'])\
            .order('order_date', desc=True)\
            .execute()
        
        # Also get orders where creative rejected (these show as canceled to client)
        rejected_bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at')\
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
        services_response = db_admin.table('creative_services')\
            .select('id, title, description, delivery_time, color')\
            .in_('id', service_ids)\
            .execute()
        services_dict = {s['id']: s for s in (services_response.data or [])}
        
        creatives_response = db_admin.table('creatives')\
            .select('user_id, display_name, title')\
            .in_('user_id', creative_user_ids)\
            .execute()
        creatives_dict = {c['user_id']: c for c in (creatives_response.data or [])}
        
        users_response = db_admin.table('users')\
            .select('user_id, name, email, profile_picture_url')\
            .in_('user_id', creative_user_ids)\
            .execute()
        users_dict = {u['user_id']: u for u in (users_response.data or [])}
        
        orders = []
        for booking in all_bookings:
            order = build_order_response(booking, services_dict, creatives_dict, users_dict)
            orders.append(order)
        
        return OrdersListResponse(success=True, orders=orders)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client history orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client history orders: {str(e)}")


@router.get("/creative", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Get all orders for the current creative user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with creative_status = 'pending_approval' (and other statuses)
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Fetch bookings for this creative
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, client_user_id, canceled_date, approved_at')\
            .eq('creative_user_id', user_id)\
            .order('order_date', desc=True)\
            .execute()
        
        if not bookings_response.data:
            return OrdersListResponse(success=True, orders=[])
        
        # Get unique service IDs and client user IDs
        service_ids = list(set([b['service_id'] for b in bookings_response.data]))
        client_user_ids = list(set([b['client_user_id'] for b in bookings_response.data]))
        
        # Fetch services
        services_response = db_admin.table('creative_services')\
            .select('id, title, description, delivery_time, color')\
            .in_('id', service_ids)\
            .execute()
        services_dict = {s['id']: s for s in (services_response.data or [])}
        
        # Fetch users (clients)
        users_response = db_admin.table('users')\
            .select('user_id, name, email, profile_picture_url')\
            .in_('user_id', client_user_ids)\
            .execute()
        users_dict = {u['user_id']: u for u in (users_response.data or [])}
        
        orders = []
        for booking in bookings_response.data:
            service = services_dict.get(booking['service_id'], {})
            user = users_dict.get(booking['client_user_id'], {})
            
            # Format booking date for display (combine booking_date and start_time if available)
            booking_date_display = None
            if booking.get('booking_date'):
                try:
                    date_str = booking['booking_date']
                    start_time = booking.get('start_time', '')
                    
                    # If we have both date and time, combine them
                    if start_time:
                        # Extract time part (handle formats like "HH:MM:SS+00" or "HH:MM:SS")
                        time_str = start_time.split('+')[0].split(' ')[0]
                        if time_str and len(time_str.split(':')) >= 2:
                            # Ensure time has seconds
                            time_parts = time_str.split(':')
                            if len(time_parts) == 2:
                                time_str = f"{time_parts[0]}:{time_parts[1]}:00"
                            booking_date_display = f"{date_str}T{time_str}Z"
                        else:
                            # Fallback to date only with midnight
                            booking_date_display = f"{date_str}T00:00:00Z"
                    else:
                        # Just a date, add midnight UTC
                        booking_date_display = f"{date_str}T00:00:00Z"
                except Exception as e:
                    logger.warning(f"Error formatting booking date: {e}")
                    booking_date_display = None
            
            order = OrderResponse(
                id=booking['id'],
                service_id=booking['service_id'],
                service_name=service.get('title', 'Unknown Service'),
                service_description=service.get('description'),
                service_delivery_time=service.get('delivery_time'),
                service_color=service.get('color'),
                creative_id=user_id,
                creative_name=user.get('name', 'Unknown Client'),
                creative_display_name=None,  # This is the client, not creative
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
                description=booking.get('notes'),
                status=booking.get('creative_status', 'pending_approval'),
                client_status=booking.get('client_status'),
                creative_status=booking.get('creative_status')
            )
            orders.append(order)
        
        return OrdersListResponse(success=True, orders=orders)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative orders: {str(e)}")


@router.get("/creative/current", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_current_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Get current orders for the current creative user
    Requires authentication - will return 401 if not authenticated.
    Returns orders excluding 'complete', 'rejected', and 'canceled' statuses
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Fetch bookings for this creative, excluding completed/canceled/rejected orders
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, client_user_id, canceled_date, approved_at')\
            .eq('creative_user_id', user_id)\
            .not_.in_('creative_status', ['complete', 'rejected', 'canceled'])\
            .order('order_date', desc=True)\
            .execute()
        
        if not bookings_response.data:
            return OrdersListResponse(success=True, orders=[])
        
        # Get unique service IDs and client user IDs
        service_ids = list(set([b['service_id'] for b in bookings_response.data]))
        client_user_ids = list(set([b['client_user_id'] for b in bookings_response.data]))
        
        # Fetch services
        services_response = db_admin.table('creative_services')\
            .select('id, title, description, delivery_time, color')\
            .in_('id', service_ids)\
            .execute()
        services_dict = {s['id']: s for s in (services_response.data or [])}
        
        # Fetch users (clients)
        users_response = db_admin.table('users')\
            .select('user_id, name, email, profile_picture_url')\
            .in_('user_id', client_user_ids)\
            .execute()
        users_dict = {u['user_id']: u for u in (users_response.data or [])}
        
        orders = []
        for booking in bookings_response.data:
            service = services_dict.get(booking['service_id'], {})
            user = users_dict.get(booking['client_user_id'], {})
            
            # Format booking date for display (combine booking_date and start_time if available)
            booking_date_display = None
            if booking.get('booking_date'):
                try:
                    date_str = booking['booking_date']
                    start_time = booking.get('start_time', '')
                    
                    # If we have both date and time, combine them
                    if start_time:
                        # Extract time part (handle formats like "HH:MM:SS+00" or "HH:MM:SS")
                        time_str = start_time.split('+')[0].split(' ')[0]
                        if time_str and len(time_str.split(':')) >= 2:
                            # Ensure time has seconds
                            time_parts = time_str.split(':')
                            if len(time_parts) == 2:
                                time_str = f"{time_parts[0]}:{time_parts[1]}:00"
                            booking_date_display = f"{date_str}T{time_str}Z"
                        else:
                            # Fallback to date only with midnight
                            booking_date_display = f"{date_str}T00:00:00Z"
                    else:
                        # Just a date, add midnight UTC
                        booking_date_display = f"{date_str}T00:00:00Z"
                except Exception as e:
                    logger.warning(f"Error formatting booking date: {e}")
                    booking_date_display = None
            
            order = OrderResponse(
                id=booking['id'],
                service_id=booking['service_id'],
                service_name=service.get('title', 'Unknown Service'),
                service_description=service.get('description'),
                service_delivery_time=service.get('delivery_time'),
                service_color=service.get('color'),
                creative_id=user_id,
                creative_name=user.get('name', 'Unknown Client'),
                creative_display_name=None,  # This is the client, not creative
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
                description=booking.get('notes'),
                status=booking.get('creative_status', 'pending_approval'),
                client_status=booking.get('client_status'),
                creative_status=booking.get('creative_status')
            )
            orders.append(order)
        
        return OrdersListResponse(success=True, orders=orders)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative current orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative current orders: {str(e)}")


class CalendarSessionResponse(BaseModel):
    id: str
    date: str  # yyyy-MM-dd format
    time: str  # HH:MM format
    endTime: str  # HH:MM format
    client: str
    type: str  # service name
    status: str  # 'pending' | 'confirmed' | 'cancelled'
    notes: Optional[str] = None


class CalendarSessionsResponse(BaseModel):
    success: bool
    sessions: List[CalendarSessionResponse]


@router.get("/creative/calendar", response_model=CalendarSessionsResponse)
@limiter.limit("20 per minute")
async def get_creative_calendar_sessions(
    request: Request,
    year: int,
    month: int,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Get calendar sessions for the current creative user for a specific month
    Requires authentication - will return 401 if not authenticated.
    Returns bookings with calendar-specific format
    Status mapping:
    - pending_approval -> pending
    - in_progress, awaiting_payment -> confirmed
    - rejected -> cancelled
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Calculate month start and end dates
        month_start = datetime(year, month, 1)
        # Calculate next month start, then subtract 1 day to get last day of current month
        if month == 12:
            next_month_start = datetime(year + 1, 1, 1)
        else:
            next_month_start = datetime(year, month + 1, 1)
        
        month_start_str = month_start.strftime('%Y-%m-%d')
        month_end_str = (next_month_start - timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Fetch bookings for this creative in the specified month
        bookings_response = db_admin.table('bookings')\
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
            services_response = db_admin.table('creative_services')\
                .select('id, title')\
                .in_('id', service_ids)\
                .execute()
            services_dict = {s['id']: s for s in (services_response.data or [])}
        
        # Fetch users (clients)
        users_dict = {}
        if client_user_ids:
            users_response = db_admin.table('users')\
                .select('user_id, name')\
                .in_('user_id', client_user_ids)\
                .execute()
            users_dict = {u['user_id']: u for u in (users_response.data or [])}
        
        sessions = []
        for booking in bookings_response.data:
            # Skip bookings without booking_date
            if not booking.get('booking_date'):
                continue
            
            service = services_dict.get(booking['service_id'], {})
            user = users_dict.get(booking['client_user_id'], {})
            
            # Format time (extract HH:MM from start_time and end_time)
            start_time = booking.get('start_time', '')
            end_time = booking.get('end_time', '')
            
            # Extract time portion (handle formats like "HH:MM:SS+00" or "HH:MM:SS" or "HH:MM")
            time_str = '09:00'  # default
            if start_time:
                time_str = start_time.split('+')[0].split(' ')[0]
                # Take only HH:MM part
                if ':' in time_str:
                    parts = time_str.split(':')
                    time_str = f"{parts[0]}:{parts[1]}"
            
            end_time_str = '10:00'  # default
            if end_time:
                end_time_str = end_time.split('+')[0].split(' ')[0]
                # Take only HH:MM part
                if ':' in end_time_str:
                    parts = end_time_str.split(':')
                    end_time_str = f"{parts[0]}:{parts[1]}"
            
            # Map creative_status to calendar status
            creative_status = booking.get('creative_status', 'pending_approval')
            if creative_status == 'pending_approval':
                calendar_status = 'pending'
            elif creative_status == 'rejected':
                calendar_status = 'cancelled'
            elif creative_status in ['in_progress', 'awaiting_payment', 'complete']:
                calendar_status = 'confirmed'
            else:
                # Default to pending for unknown statuses
                calendar_status = 'pending'
            
            session = CalendarSessionResponse(
                id=booking['id'],
                date=booking['booking_date'],  # Already in yyyy-MM-dd format
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


@router.get("/creative/past", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_past_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Get past orders for the current creative user
    Requires authentication - will return 401 if not authenticated.
    Returns only orders with creative_status = 'complete', 'rejected', or 'canceled'
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Fetch bookings for this creative, only completed/canceled/rejected orders
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, client_user_id, canceled_date, approved_at')\
            .eq('creative_user_id', user_id)\
            .in_('creative_status', ['complete', 'rejected', 'canceled'])\
            .order('order_date', desc=True)\
            .execute()
        
        if not bookings_response.data:
            return OrdersListResponse(success=True, orders=[])
        
        # Get unique service IDs and client user IDs
        service_ids = list(set([b['service_id'] for b in bookings_response.data]))
        client_user_ids = list(set([b['client_user_id'] for b in bookings_response.data]))
        
        # Fetch services
        services_response = db_admin.table('creative_services')\
            .select('id, title, description, delivery_time, color')\
            .in_('id', service_ids)\
            .execute()
        services_dict = {s['id']: s for s in (services_response.data or [])}
        
        # Fetch users (clients)
        users_response = db_admin.table('users')\
            .select('user_id, name, email, profile_picture_url')\
            .in_('user_id', client_user_ids)\
            .execute()
        users_dict = {u['user_id']: u for u in (users_response.data or [])}
        
        orders = []
        for booking in bookings_response.data:
            service = services_dict.get(booking['service_id'], {})
            user = users_dict.get(booking['client_user_id'], {})
            
            # Format booking date for display (combine booking_date and start_time if available)
            booking_date_display = None
            if booking.get('booking_date'):
                try:
                    date_str = booking['booking_date']
                    start_time = booking.get('start_time', '')
                    
                    # If we have both date and time, combine them
                    if start_time:
                        # Extract time part (handle formats like "HH:MM:SS+00" or "HH:MM:SS")
                        time_str = start_time.split('+')[0].split(' ')[0]
                        if time_str and len(time_str.split(':')) >= 2:
                            # Ensure time has seconds
                            time_parts = time_str.split(':')
                            if len(time_parts) == 2:
                                time_str = f"{time_parts[0]}:{time_parts[1]}:00"
                            booking_date_display = f"{date_str}T{time_str}Z"
                        else:
                            # Fallback to date only with midnight
                            booking_date_display = f"{date_str}T00:00:00Z"
                    else:
                        # Just a date, add midnight UTC
                        booking_date_display = f"{date_str}T00:00:00Z"
                except Exception as e:
                    logger.warning(f"Error formatting booking date: {e}")
                    booking_date_display = None
            
            order = OrderResponse(
                id=booking['id'],
                service_id=booking['service_id'],
                service_name=service.get('title', 'Unknown Service'),
                service_description=service.get('description'),
                service_delivery_time=service.get('delivery_time'),
                service_color=service.get('color'),
                creative_id=user_id,
                creative_name=user.get('name', 'Unknown Client'),
                creative_display_name=None,  # This is the client, not creative
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
                description=booking.get('notes'),
                status=booking.get('creative_status', 'pending_approval'),
                client_status=booking.get('client_status'),
                creative_status=booking.get('creative_status')
            )
            orders.append(order)
        
        return OrdersListResponse(success=True, orders=orders)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative past orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative past orders: {str(e)}")


class ApproveBookingRequest(BaseModel):
    booking_id: str


class ApproveBookingResponse(BaseModel):
    success: bool
    message: str


@router.post("/approve", response_model=ApproveBookingResponse)
@limiter.limit("10 per minute")
async def approve_booking(
    request: Request,
    approve_data: ApproveBookingRequest,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Approve a booking/order
    Requires authentication - will return 401 if not authenticated.
    - Verifies the booking belongs to the creative
    - Updates status based on payment option:
      * Free or 'later' payment: creative_status='in_progress', client_status='in_progress'
      * 'upfront' or 'split' payment: creative_status='awaiting_payment', client_status='payment_required'
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Fetch the booking to verify it exists and belongs to this creative
        booking_response = db_admin.table('bookings')\
            .select('id, creative_user_id, client_user_id, service_id, creative_status, price, payment_option')\
            .eq('id', approve_data.booking_id)\
            .single()\
            .execute()
        
        if not booking_response.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_response.data
        
        # Verify the booking belongs to this creative
        if booking['creative_user_id'] != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to approve this booking")
        
        # Check if booking can be approved (only pending_approval can be approved)
        current_status = booking.get('creative_status', 'pending_approval')
        if current_status not in ['pending_approval']:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot approve booking with status '{current_status}'. Only pending approvals can be approved."
            )
        
        # Determine new status based on payment option and price
        price = float(booking.get('price', 0))
        payment_option = booking.get('payment_option', 'later')
        
        # If booking is free or payment at end, both statuses become 'in_progress'
        # If booking requires upfront or split payment, creative waits for payment
        if price == 0 or payment_option == 'later':
            creative_status = 'in_progress'
            client_status = 'in_progress'
        else:  # upfront or split payment
            creative_status = 'awaiting_payment'
            client_status = 'payment_required'
        
        # Update booking status and set approved timestamp
        update_response = db_admin.table('bookings')\
            .update({
                'creative_status': creative_status,
                'client_status': client_status,
                'approved_at': datetime.utcnow().isoformat()
            })\
            .eq('id', approve_data.booking_id)\
            .execute()
        
        if not update_response.data or len(update_response.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to update booking status")
        
        logger.info(f"Booking approved successfully: {approve_data.booking_id} by creative {user_id} - Status: creative={creative_status}, client={client_status}")
        
        # Get service and creative details for notification
        service_response = db_admin.table('creative_services')\
            .select('title')\
            .eq('id', booking['service_id'])\
            .single()\
            .execute()
        
        creative_response = db_admin.table('creatives')\
            .select('display_name')\
            .eq('user_id', user_id)\
            .single()\
            .execute()
        
        service_title = service_response.data.get('title', 'Service') if service_response.data else 'Service'
        creative_display_name = creative_response.data.get('display_name', 'Creative') if creative_response.data else 'Creative'
        
        # Create appropriate notification for client based on payment requirement
        if price == 0 or payment_option == 'later':
            # Booking approved - no payment required
            notification_data = {
                "recipient_user_id": booking['client_user_id'],
                "notification_type": "booking_approved",
                "title": "Booking Approved",
                "message": f"{creative_display_name} has approved your booking for {service_title}. Your booking is confirmed!",
                "is_read": False,
                "related_user_id": user_id,
                "related_entity_id": approve_data.booking_id,
                "related_entity_type": "booking",
                "target_roles": ["client"],
                "metadata": {
                    "service_title": service_title,
                    "creative_display_name": creative_display_name,
                    "booking_id": approve_data.booking_id,
                    "price": str(price),
                    "payment_option": payment_option
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
        else:
            # Payment required notification
            notification_data = {
                "recipient_user_id": booking['client_user_id'],
                "notification_type": "payment_required",
                "title": "Payment Required",
                "message": f"{creative_display_name} has approved your booking for {service_title}. Please complete payment to start your service.",
                "is_read": False,
                "related_user_id": user_id,
                "related_entity_id": approve_data.booking_id,
                "related_entity_type": "booking",
                "target_roles": ["client"],
                "metadata": {
                    "service_title": service_title,
                    "creative_display_name": creative_display_name,
                    "booking_id": approve_data.booking_id,
                    "price": str(price),
                    "payment_option": payment_option
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
        
        # Create notification (don't fail approval if notification creation fails)
        try:
            notification_result = db_admin.table("notifications")\
                .insert(notification_data)\
                .execute()
            logger.info(f"Approval notification created: {notification_result.data}")
        except Exception as notif_error:
            logger.error(f"Failed to create approval notification: {notif_error}")
        
        return ApproveBookingResponse(
            success=True,
            message="Booking approved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving booking: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve booking: {str(e)}")


class RejectBookingRequest(BaseModel):
    booking_id: str


class RejectBookingResponse(BaseModel):
    success: bool
    message: str


@router.post("/reject", response_model=RejectBookingResponse)
@limiter.limit("10 per minute")
async def reject_booking(
    request: Request,
    reject_data: RejectBookingRequest,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Reject a booking/order
    Requires authentication - will return 401 if not authenticated.
    - Verifies the booking belongs to the creative
    - Updates creative_status to 'rejected'
    - client_status remains unchanged (stays as 'placed')
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Fetch the booking to verify it exists and belongs to this creative
        booking_response = db_admin.table('bookings')\
            .select('id, creative_user_id, client_user_id, service_id, creative_status')\
            .eq('id', reject_data.booking_id)\
            .single()\
            .execute()
        
        if not booking_response.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_response.data
        
        # Verify the booking belongs to this creative
        if booking['creative_user_id'] != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to reject this booking")
        
        # Check if booking can be rejected (only pending_approval can be rejected)
        current_status = booking.get('creative_status', 'pending_approval')
        if current_status not in ['pending_approval']:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot reject booking with status '{current_status}'. Only pending approvals can be rejected."
            )
        
        # Update booking status to rejected
        # Only update creative_status - client_status remains as 'placed' since the client did place the order
        # Set canceled_date to track when the booking was rejected
        update_response = db_admin.table('bookings')\
            .update({
                'creative_status': 'rejected',
                'canceled_date': datetime.utcnow().isoformat()
            })\
            .eq('id', reject_data.booking_id)\
            .execute()
        
        if not update_response.data or len(update_response.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to update booking status")
        
        logger.info(f"Booking rejected successfully: {reject_data.booking_id} by creative {user_id}")
        
        # Get service and creative details for notification
        service_response = db_admin.table('creative_services')\
            .select('title')\
            .eq('id', booking['service_id'])\
            .single()\
            .execute()
        
        creative_response = db_admin.table('creatives')\
            .select('display_name')\
            .eq('user_id', user_id)\
            .single()\
            .execute()
        
        service_title = service_response.data.get('title', 'Service') if service_response.data else 'Service'
        creative_display_name = creative_response.data.get('display_name', 'Creative') if creative_response.data else 'Creative'
        
        # Create notification for client about rejection
        notification_data = {
            "recipient_user_id": booking['client_user_id'],
            "notification_type": "booking_rejected",
            "title": "Booking Rejected",
            "message": f"{creative_display_name} has rejected your booking request for {service_title}. Your booking has been canceled.",
            "is_read": False,
            "related_user_id": user_id,
            "related_entity_id": reject_data.booking_id,
            "related_entity_type": "booking",
            "target_roles": ["client"],
            "metadata": {
                "service_title": service_title,
                "creative_display_name": creative_display_name,
                "booking_id": reject_data.booking_id
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Create notification (don't fail rejection if notification creation fails)
        try:
            notification_result = db_admin.table("notifications")\
                .insert(notification_data)\
                .execute()
            logger.info(f"Rejection notification created: {notification_result.data}")
        except Exception as notif_error:
            logger.error(f"Failed to create rejection notification: {notif_error}")
        
        return RejectBookingResponse(
            success=True,
            message="Booking rejected successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting booking: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject booking: {str(e)}")


class CancelBookingRequest(BaseModel):
    booking_id: str


class CancelBookingResponse(BaseModel):
    success: bool
    message: str


@router.post("/cancel", response_model=CancelBookingResponse)
@limiter.limit("10 per minute")
async def cancel_booking(
    request: Request,
    cancel_data: CancelBookingRequest,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Cancel a booking/order (client-initiated)
    Requires authentication - will return 401 if not authenticated.
    - Verifies the booking belongs to the client
    - Updates both client_status and creative_status to 'canceled'
    - Sets canceled_date to track when the booking was canceled
    """
    try:
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        
        # Fetch the booking to verify it exists and belongs to this client
        booking_response = db_admin.table('bookings')\
            .select('id, client_user_id, service_id, client_status, creative_status')\
            .eq('id', cancel_data.booking_id)\
            .single()\
            .execute()
        
        if not booking_response.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_response.data
        
        # Verify the booking belongs to this client
        if booking['client_user_id'] != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to cancel this booking")
        
        # Check if booking can be canceled (only 'placed' status can be canceled by client)
        current_client_status = booking.get('client_status', 'placed')
        current_creative_status = booking.get('creative_status', 'pending_approval')
        
        # Allow cancellation if status is 'placed' (awaiting approval) or if creative hasn't approved yet
        if current_client_status not in ['placed'] or current_creative_status not in ['pending_approval']:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot cancel booking with status '{current_client_status}'. Only placed orders awaiting approval can be canceled."
            )
        
        # Update both client_status and creative_status
        # client_status uses 'cancelled' (British spelling) to match database constraint
        # creative_status uses 'rejected' since 'cancelled' is not in the allowed values
        # Set canceled_date to track when the booking was canceled
        update_response = db_admin.table('bookings')\
            .update({
                'client_status': 'cancelled',
                'creative_status': 'rejected',
                'canceled_date': datetime.utcnow().isoformat()
            })\
            .eq('id', cancel_data.booking_id)\
            .execute()
        
        if not update_response.data or len(update_response.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to update booking status")
        
        logger.info(f"Booking canceled successfully: {cancel_data.booking_id} by client {user_id}")
        
        # Get service details for notification
        service_response = db_admin.table('creative_services')\
            .select('title')\
            .eq('id', booking['service_id'])\
            .single()\
            .execute()
        
        service_title = service_response.data.get('title', 'Service') if service_response.data else 'Service'
        
        # Create notification for client about cancellation
        notification_data = {
            "recipient_user_id": user_id,
            "notification_type": "booking_canceled",
            "title": "Booking Canceled",
            "message": f"Your booking for {service_title} has been canceled successfully.",
            "is_read": False,
            "related_user_id": user_id,
            "related_entity_id": cancel_data.booking_id,
            "related_entity_type": "booking",
            "target_roles": ["client"],
            "metadata": {
                "service_title": service_title,
                "booking_id": cancel_data.booking_id
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Create notification (don't fail cancellation if notification creation fails)
        try:
            notification_result = db_admin.table("notifications")\
                .insert(notification_data)\
                .execute()
            logger.info(f"Cancellation notification created: {notification_result.data}")
        except Exception as notif_error:
            logger.error(f"Failed to create cancellation notification: {notif_error}")
        
        return CancelBookingResponse(
            success=True,
            message="Booking canceled successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling booking: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel booking: {str(e)}")