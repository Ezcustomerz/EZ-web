from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
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
    booking_availability_id: Optional[str] = None
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
    - Database trigger automatically updates booking_availability if booking_availability_id is set
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
            'session_duration': booking_data.session_duration,
            'booking_availability_id': booking_data.booking_availability_id
        }
        
        # Insert booking into database
        # Note: If booking_availability_id is set, a database trigger will automatically
        # increment booking_availability.current_bookings to track capacity
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

