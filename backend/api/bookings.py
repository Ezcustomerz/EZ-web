from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import logging
from db.db_session import db_admin
from core.limiter import limiter

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
    booking_data: CreateBookingRequest
):
    """
    Create a new booking/order
    - Validates user authentication
    - Fetches service details (creative_user_id, price, payment_option)
    - Creates booking with proper status tracking
    """
    try:
        # Get user ID from JWT token (set by middleware)
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
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
        
        # TODO: Future enhancements
        # - Send email notification to creative
        # - Send confirmation email to client
        # - Add webhook for integrations
        # - Update analytics/metrics
        
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
async def get_client_orders(request: Request):
    """
    Get all orders for the current client user
    Returns orders with client_status = 'placed' (and other statuses)
    """
    try:
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Fetch bookings for this client
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date')\
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
                price=float(booking['price']) if booking.get('price') else 0.0,
                payment_option=booking.get('payment_option', 'later'),
                description=booking.get('notes'),
                status=booking.get('client_status', 'placed'),
                client_status=booking.get('client_status'),
                creative_status=booking.get('creative_status')
            )
            orders.append(order)
        
        return OrdersListResponse(success=True, orders=orders)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client orders: {str(e)}")


@router.get("/creative", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_orders(request: Request):
    """
    Get all orders for the current creative user
    Returns orders with creative_status = 'pending_approval' (and other statuses)
    """
    try:
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Fetch bookings for this creative
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, client_user_id, canceled_date')\
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
async def get_creative_current_orders(request: Request):
    """
    Get current orders for the current creative user
    Returns orders excluding 'complete', 'rejected', and 'canceled' statuses
    """
    try:
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Fetch bookings for this creative, excluding completed/canceled/rejected orders
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, client_user_id, canceled_date')\
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


@router.get("/creative/past", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_past_orders(request: Request):
    """
    Get past orders for the current creative user
    Returns only orders with creative_status = 'complete', 'rejected', or 'canceled'
    """
    try:
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Fetch bookings for this creative, only completed/canceled/rejected orders
        bookings_response = db_admin.table('bookings')\
            .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, client_user_id, canceled_date')\
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


class RejectBookingRequest(BaseModel):
    booking_id: str


class RejectBookingResponse(BaseModel):
    success: bool
    message: str


@router.post("/reject", response_model=RejectBookingResponse)
@limiter.limit("10 per minute")
async def reject_booking(
    request: Request,
    reject_data: RejectBookingRequest
):
    """
    Reject a booking/order
    - Validates user authentication
    - Verifies the booking belongs to the creative
    - Updates creative_status to 'rejected'
    - client_status remains unchanged (stays as 'placed')
    """
    try:
        # Get user ID from JWT token (set by middleware)
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_id = request.state.user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Fetch the booking to verify it exists and belongs to this creative
        booking_response = db_admin.table('bookings')\
            .select('id, creative_user_id, creative_status')\
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
        
        # TODO: Future enhancements
        # - Send email notification to client about rejection
        # - Add webhook for integrations
        # - Update analytics/metrics
        
        return RejectBookingResponse(
            success=True,
            message="Booking rejected successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting booking: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject booking: {str(e)}")

