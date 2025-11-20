from typing import List, Optional, Dict, Any
from datetime import datetime, date, time, timedelta
import logging
import os
from fastapi import HTTPException
from supabase import Client
from db.db_session import db_admin
from schemas.booking import (
    CreateBookingRequest, CreateBookingResponse,
    OrdersListResponse, OrderResponse, OrderFile, Invoice,
    CalendarSessionsResponse, CalendarSessionResponse,
    ApproveBookingRequest, ApproveBookingResponse,
    RejectBookingRequest, RejectBookingResponse,
    CancelBookingRequest, CancelBookingResponse,
    FinalizeServiceRequest, FinalizeServiceResponse
)

logger = logging.getLogger(__name__)

class BookingService:
    @staticmethod
    def get_calendar_settings(service_id: str, client: Client) -> Optional[Dict[str, Any]]:
        """Get calendar settings for a service
        
        Args:
            service_id: The service ID to get calendar settings for
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Optimized: Single query with minimal fields
            response = client.table('calendar_settings')\
                .select('id, service_id, is_scheduling_enabled, session_duration, default_session_length, min_notice_amount, min_notice_unit, max_advance_amount, max_advance_unit, buffer_time_amount, buffer_time_unit, is_active')\
                .eq('service_id', service_id)\
                .eq('is_active', True)\
                .limit(1)\
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching calendar settings: {e}")
            return None

    @staticmethod
    def get_weekly_schedule(calendar_setting_id: str, client: Client) -> List[Dict[str, Any]]:
        """Get weekly schedule for a calendar setting
        
        Args:
            calendar_setting_id: The calendar setting ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Optimized: Fetch only needed fields with nested time_blocks
            response = client.table('weekly_schedule')\
                .select('id, day_of_week, is_enabled, time_blocks(start_time, end_time)')\
                .eq('calendar_setting_id', calendar_setting_id)\
                .execute()
            
            schedule = []
            for item in response.data:
                time_blocks = item.get('time_blocks', [])
                time_block = time_blocks[0] if time_blocks else {}
                
                schedule.append({
                    "id": item["id"],
                    "day_of_week": item["day_of_week"],
                    "is_enabled": item["is_enabled"],
                    "start_time": time_block.get("start_time"),
                    "end_time": time_block.get("end_time")
                })
            
            # Sort by day of week
            day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            schedule.sort(key=lambda x: day_order.index(x['day_of_week']) if x['day_of_week'] in day_order else 999)
            
            return schedule
        except Exception as e:
            logger.error(f"Error fetching weekly schedule: {e}")
            return []

    @staticmethod
    def get_time_slots(weekly_schedule_id: str, client: Client) -> List[Dict[str, Any]]:
        """Get time slots for a weekly schedule
        
        Args:
            weekly_schedule_id: The weekly schedule ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            response = client.table('time_slots').select('*, weekly_schedule!inner(day_of_week)').eq('weekly_schedule_id', weekly_schedule_id).order('slot_time').execute()
            
            slots = []
            for item in response.data:
                slots.append({
                    "id": item["id"],
                    "slot_time": item["slot_time"],
                    "is_enabled": item["is_enabled"],
                    "day_of_week": item["weekly_schedule"]["day_of_week"]
                })
            
            return slots
        except Exception as e:
            logger.error(f"Error fetching time slots: {e}")
            return []

    @staticmethod
    def get_available_dates(service_id: str, client: Client, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """Get available booking dates for a service based on calendar settings and actual slot availability
        
        Args:
            service_id: The service ID
            client: Authenticated Supabase client (required, respects RLS policies)
            start_date: Optional start date
            end_date: Optional end date
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Get calendar settings (cached for reuse)
            calendar_settings = BookingService.get_calendar_settings(service_id, client)
            if not calendar_settings or not calendar_settings.get("is_scheduling_enabled"):
                return []

            # Get weekly schedule with time slots (cached for reuse)
            weekly_schedule = BookingService.get_weekly_schedule(calendar_settings["id"], client)
            if not weekly_schedule:
                return []

            # Set date range
            if not start_date:
                start_date = date.today()
            if not end_date:
                # Calculate end date based on max_advance settings
                max_advance = calendar_settings.get("max_advance_amount", 30)
                max_unit = calendar_settings.get("max_advance_unit", "days")
                
                if max_unit == "hours":
                    end_date = start_date + timedelta(hours=max_advance)
                elif max_unit == "days":
                    end_date = start_date + timedelta(days=max_advance)
                elif max_unit == "weeks":
                    end_date = start_date + timedelta(weeks=max_advance)
                elif max_unit == "months":
                    end_date = start_date + timedelta(days=max_advance * 30)  # Approximate

            # Get enabled days
            enabled_days = [day["day_of_week"] for day in weekly_schedule if day["is_enabled"]]
            if not enabled_days:
                return []

            # OPTIMIZATION: Batch fetch all bookings for the date range in a single query
            bookings_response = client.table('bookings')\
                .select('booking_date, start_time, creative_status, client_status')\
                .eq('service_id', service_id)\
                .gte('booking_date', start_date.isoformat())\
                .lte('booking_date', end_date.isoformat())\
                .neq('creative_status', 'rejected')\
                .neq('client_status', 'cancelled')\
                .execute()
            
            # Build a map of booked times by date for fast lookup
            booked_times_by_date = {}
            if bookings_response.data:
                for booking in bookings_response.data:
                    booking_date_str = booking.get('booking_date')
                    if not booking_date_str:
                        continue
                    
                    if booking_date_str not in booked_times_by_date:
                        booked_times_by_date[booking_date_str] = set()
                    
                    start_time = booking.get('start_time')
                    if start_time:
                        # Normalize time format
                        time_str = str(start_time)
                        if '+' in time_str:
                            time_str = time_str.split('+')[0]
                        elif ' ' in time_str:
                            time_str = time_str.split(' ')[0]
                        
                        if len(time_str) >= 5:
                            time_parts = time_str.split(':')
                            if len(time_parts) >= 2:
                                normalized_time = f"{time_parts[0]}:{time_parts[1]}"
                                booked_times_by_date[booking_date_str].add(normalized_time)

            # Pre-fetch all time slots for enabled days (single query per day)
            time_slots_by_day = {}
            for day_schedule in weekly_schedule:
                if day_schedule["is_enabled"]:
                    day_name = day_schedule["day_of_week"]
                    if day_name not in time_slots_by_day:
                        time_slots = BookingService.get_time_slots(day_schedule["id"], client)
                        time_slots_by_day[day_name] = [slot for slot in time_slots if slot["is_enabled"]]

            # Calculate available dates
            available_dates = []
            current_date = start_date
            
            # Calculate min notice once
            min_notice = calendar_settings.get("min_notice_amount", 24)
            min_unit = calendar_settings.get("min_notice_unit", "hours")
            min_notice_hours = min_notice
            if min_unit == "minutes":
                min_notice_hours = min_notice / 60
            elif min_unit == "days":
                min_notice_hours = min_notice * 24
            min_notice_time = datetime.now() + timedelta(hours=min_notice_hours)
            
            while current_date <= end_date:
                day_name = current_date.strftime('%A')
                if day_name in enabled_days:
                    current_datetime = datetime.combine(current_date, datetime.min.time())
                    
                    if current_datetime >= min_notice_time:
                        # Check if there are available slots for this date
                        date_str = current_date.isoformat()
                        booked_times = booked_times_by_date.get(date_str, set())
                        day_time_slots = time_slots_by_day.get(day_name, [])
                        
                        # Check if at least one slot is available
                        has_available_slot = False
                        for slot in day_time_slots:
                            slot_time = str(slot["slot_time"])
                            if '+' in slot_time:
                                slot_time = slot_time.split('+')[0]
                            elif ' ' in slot_time:
                                slot_time = slot_time.split(' ')[0]
                            
                            slot_time_parts = slot_time.split(':')
                            if len(slot_time_parts) >= 2:
                                normalized_slot_time = f"{slot_time_parts[0]}:{slot_time_parts[1]}"
                                if normalized_slot_time not in booked_times:
                                    has_available_slot = True
                                    break
                        
                        if has_available_slot:
                            available_dates.append({
                                "date": date_str,
                                "day_of_week": day_name,
                                "is_available": True
                            })
                
                current_date += timedelta(days=1)

            return available_dates
        except Exception as e:
            logger.error(f"Error calculating available dates: {e}")
            return []

    @staticmethod
    def get_available_time_slots(service_id: str, booking_date: date, client: Client, calendar_settings: Optional[Dict[str, Any]] = None, weekly_schedule: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """
        Get available time slots for a specific date.
        Uses time_slots (template) and filters out already-booked times from bookings table.
        
        Args:
            service_id: The service ID
            booking_date: The date to get available slots for
            client: Authenticated Supabase client (required, respects RLS policies)
            calendar_settings: Optional pre-fetched calendar settings (for optimization)
            weekly_schedule: Optional pre-fetched weekly schedule (for optimization)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            day_name = booking_date.strftime('%A')
            time_slots = []
            
            # OPTIMIZATION: If calendar_settings and weekly_schedule are not provided,
            # fetch everything in a single nested query
            if calendar_settings is None or weekly_schedule is None:
                # Single query to get calendar settings with nested weekly_schedule and time_slots
                calendar_result = client.table('calendar_settings')\
                    .select('id, is_scheduling_enabled, weekly_schedule(id, day_of_week, is_enabled, time_slots(id, slot_time, is_enabled))')\
                    .eq('service_id', service_id)\
                    .eq('is_active', True)\
                    .limit(1)\
                    .execute()
                
                if not calendar_result.data:
                    return []
                
                calendar_data = calendar_result.data[0]
                if not calendar_data.get("is_scheduling_enabled"):
                    return []
                
                # Extract weekly schedule with nested time_slots
                weekly_schedule_data = calendar_data.get('weekly_schedule', []) or []
                day_schedule = next((day for day in weekly_schedule_data if day["day_of_week"] == day_name), None)
                
                if not day_schedule or not day_schedule["is_enabled"]:
                    return []
                
                # Extract time slots from nested data
                nested_time_slots = day_schedule.get('time_slots', []) or []
                for ts in nested_time_slots:
                    if ts.get('is_enabled', True):
                        time_slots.append({
                            "id": ts["id"],
                            "slot_time": ts["slot_time"],
                            "is_enabled": ts["is_enabled"],
                            "day_of_week": day_name
                        })
            else:
                # Use provided data (for optimization when called from get_available_dates)
                if not calendar_settings.get("is_scheduling_enabled"):
                    return []
                
                day_schedule = next((day for day in weekly_schedule if day["day_of_week"] == day_name), None)
                
                if not day_schedule or not day_schedule["is_enabled"]:
                    return []

                time_slots_result = BookingService.get_time_slots(day_schedule["id"], client)
                time_slots = [slot for slot in time_slots_result if slot["is_enabled"] and slot["day_of_week"] == day_name]
            
            if not time_slots:
                return []

            # OPTIMIZED: Single query for bookings on this date (only fetch start_time)
            existing_bookings_response = client.table('bookings')\
                .select('start_time')\
                .eq('service_id', service_id)\
                .eq('booking_date', booking_date.isoformat())\
                .neq('creative_status', 'rejected')\
                .neq('client_status', 'cancelled')\
                .execute()
            
            # Build set of booked times (normalized to HH:MM) - optimized normalization
            booked_times = set()
            if existing_bookings_response.data:
                for booking in existing_bookings_response.data:
                    start_time = booking.get('start_time')
                    if start_time:
                        # Fast normalization: extract HH:MM from time string
                        time_str = str(start_time).split('+')[0].split(' ')[0]
                        if len(time_str) >= 5:
                            booked_times.add(time_str[:5])  # Take HH:MM

            # Filter time slots - optimized comparison
            available_slots = []
            for slot in time_slots:
                slot_time = str(slot["slot_time"]).split('+')[0].split(' ')[0]
                normalized_slot_time = slot_time[:5] if len(slot_time) >= 5 else None
                
                if normalized_slot_time and normalized_slot_time not in booked_times:
                    available_slots.append({
                        "id": slot["id"],
                        "slot_time": slot["slot_time"],
                        "is_enabled": slot["is_enabled"],
                        "day_of_week": slot["day_of_week"]
                    })

            return available_slots
        except Exception as e:
            logger.error(f"Error fetching available time slots: {e}")
            return []

    @staticmethod
    def get_service_booking_data(service_id: str, client: Client) -> Dict[str, Any]:
        """Get complete booking data for a service
        
        Args:
            service_id: The service ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Get calendar settings
            calendar_settings = BookingService.get_calendar_settings(service_id, client)
            if not calendar_settings:
                return {"error": "Calendar settings not found"}

            # Get weekly schedule
            weekly_schedule = BookingService.get_weekly_schedule(calendar_settings["id"], client)
            
            # Get time slots for each day
            time_slots = []
            for day in weekly_schedule:
                if day["is_enabled"]:
                    day_slots = BookingService.get_time_slots(day["id"], client)
                    time_slots.extend(day_slots)

            return {
                "calendar_settings": calendar_settings,
                "weekly_schedule": weekly_schedule,
                "time_slots": time_slots
            }
        except Exception as e:
            logger.error(f"Error fetching service booking data: {e}")
            return {"error": str(e)}


class BookingController:
    """Controller for booking/order management operations"""
    
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
            if creative_status == 'rejected':
                display_status = 'canceled'
            elif client_status == 'cancelled':
                display_status = 'canceled'
            else:
                display_status = client_status
        
        # Get amount_paid from booking
        amount_paid = float(booking.get('amount_paid', 0)) if booking.get('amount_paid') else 0.0
        
        if is_creative_view:
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
                amount_paid=amount_paid,
                description=booking.get('notes'),
                status=display_status,
                client_status=client_status,
                creative_status=creative_status
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
                    order_invoices = BookingController._get_invoices_for_booking(booking, client)
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
                amount_paid=amount_paid,
                description=booking.get('notes'),
                status=display_status,
                client_status=client_status,
                creative_status=creative_status,
                files=order_files,
                invoices=order_invoices
            )
    
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
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
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
                    deliverables_response = client.table('booking_deliverables')\
                        .select('id, booking_id, file_name, file_type, file_size_bytes')\
                        .in_('booking_id', booking_ids)\
                        .execute()
                    
                    logger.info(f"[get_client_orders] Query response: {deliverables_response}")
                    logger.info(f"[get_client_orders] Fetched {len(deliverables_response.data or [])} deliverables for {len(booking_ids)} bookings")
                    
                    if deliverables_response.data:
                        logger.info(f"[get_client_orders] Sample deliverable: {deliverables_response.data[0] if deliverables_response.data else 'None'}")
                    
                    # Group deliverables by booking_id (normalize to string for consistent lookup)
                    for deliverable in (deliverables_response.data or []):
                        booking_id = str(deliverable['booking_id'])  # Ensure string for dictionary key
                        if booking_id not in deliverables_dict:
                            deliverables_dict[booking_id] = []
                        # Format file size
                        file_size_bytes = deliverable.get('file_size_bytes', 0) or 0
                        if file_size_bytes > 1024 * 1024:
                            file_size_str = f"{(file_size_bytes / 1024 / 1024):.2f} MB"
                        else:
                            file_size_str = f"{(file_size_bytes / 1024):.2f} KB"
                        deliverables_dict[booking_id].append({
                            'id': str(deliverable['id']),
                            'name': deliverable.get('file_name', 'Unknown'),
                            'type': deliverable.get('file_type', 'file'),
                            'size': file_size_str
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
                
                order = BookingController._build_order_response(
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
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
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
                order = BookingController._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False, client=client)
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
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
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
                    deliverables_response = client.table('booking_deliverables')\
                        .select('id, booking_id, file_name, file_type, file_size_bytes')\
                        .in_('booking_id', booking_ids)\
                        .execute()
                    
                    logger.info(f"[get_client_action_needed_orders] Fetched {len(deliverables_response.data or [])} deliverables for {len(booking_ids)} bookings")
                    logger.info(f"[get_client_action_needed_orders] Booking IDs: {booking_ids}")
                    
                    # Group deliverables by booking_id (normalize to string for consistent lookup)
                    for deliverable in (deliverables_response.data or []):
                        booking_id = str(deliverable['booking_id'])  # Ensure string for dictionary key
                        if booking_id not in deliverables_dict:
                            deliverables_dict[booking_id] = []
                        # Format file size
                        file_size_bytes = deliverable.get('file_size_bytes', 0) or 0
                        if file_size_bytes > 1024 * 1024:
                            file_size_str = f"{(file_size_bytes / 1024 / 1024):.2f} MB"
                        else:
                            file_size_str = f"{(file_size_bytes / 1024):.2f} KB"
                        deliverables_dict[booking_id].append({
                            'id': str(deliverable['id']),
                            'name': deliverable.get('file_name', 'Unknown'),
                            'type': deliverable.get('file_type', 'file'),
                            'size': file_size_str
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
                
                order = BookingController._build_order_response(
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
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
                .eq('client_user_id', user_id)\
                .in_('client_status', ['completed', 'cancelled'])\
                .order('order_date', desc=True)\
                .execute()
            
            # Also get orders where creative rejected (these show as canceled to client)
            rejected_bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at, amount_paid')\
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
                order = BookingController._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False, client=client)
                orders.append(order)
            
            return OrdersListResponse(success=True, orders=orders)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching client history orders: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch client history orders: {str(e)}")
    
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
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, client_user_id, canceled_date, approved_at, amount_paid')\
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
                order = BookingController._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=True)
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
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, client_user_id, canceled_date, approved_at, amount_paid')\
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
                order = BookingController._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=True)
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
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, client_user_id, canceled_date, approved_at, amount_paid')\
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
            
            orders = []
            for booking in bookings_response.data:
                order = BookingController._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=True)
                orders.append(order)
            
            return OrdersListResponse(success=True, orders=orders)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching creative past orders: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative past orders: {str(e)}")
    
    @staticmethod
    async def get_creative_dashboard_stats(user_id: str, client: Client) -> Dict[str, Any]:
        """Get dashboard statistics for the current creative user
        
        Args:
            user_id: The creative user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Returns:
            Dictionary containing:
            - total_clients: Number of unique clients
            - monthly_amount: Net amount from Stripe for current month (matches Stripe Express dashboard)
            - total_bookings: Total number of bookings
            - completed_sessions: Number of completed bookings
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
                .select('id, client_user_id, amount_paid, creative_status, order_date')\
                .eq('creative_user_id', user_id)\
                .execute()
            
            bookings = bookings_response.data or []
            
            # Calculate stats
            unique_clients = len(set(b['client_user_id'] for b in bookings))
            total_bookings = len(bookings)
            completed_sessions = len([b for b in bookings if b.get('creative_status') == 'completed'])
            
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
                'total_clients': unique_clients,
                'monthly_amount': round(monthly_amount, 2),
                'total_bookings': total_bookings,
                'completed_sessions': completed_sessions
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
                        "payment_option": payment_option
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
            
            # Update booking status
            update_response = client.table('bookings')\
                .update({
                    'client_status': 'cancelled',
                    'creative_status': 'rejected',
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
                for file_info in finalize_request.files:
                    deliverables_data.append({
                        'booking_id': booking_id,
                        'file_url': file_info.get('url') or file_info.get('file_url'),
                        'file_name': file_info.get('name') or file_info.get('file_name'),
                        'file_size_bytes': file_info.get('size') or file_info.get('file_size_bytes'),
                        'file_type': file_info.get('type') or file_info.get('file_type')
                    })
                
                if deliverables_data:
                    db_admin.table('booking_deliverables').insert(deliverables_data).execute()
            
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
            service_response = db_admin.table('creative_services').select('title').eq('id', booking['service_id']).single().execute()
            creative_response = db_admin.table('creatives').select('display_name').eq('user_id', user_id).single().execute()
            client_response = db_admin.table('clients').select('display_name').eq('user_id', booking['client_user_id']).single().execute()
            
            service_title = service_response.data.get('title', 'Service') if service_response.data else 'Service'
            creative_display_name = creative_response.data.get('display_name', 'Creative') if creative_response.data else 'Creative'
            client_display_name = client_response.data.get('display_name', 'A client') if client_response.data else 'A client'
            
            # Create notifications based on final status
            try:
                # Client notifications
                if client_status == 'payment_required':
                    # Payment required notification (already exists type)
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
                    db_admin.table("notifications").insert(client_notification_data).execute()
                    logger.info(f"Payment required notification created for client: {booking['client_user_id']}")
                
                elif client_status == 'locked':
                    # Client: Payment to unlock notification
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
                    db_admin.table("notifications").insert(client_notification_data).execute()
                    logger.info(f"Payment to unlock notification created for client: {booking['client_user_id']}")
                    
                    # Creative: Files sent notification
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
                            "has_files": True
                        },
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    db_admin.table("notifications").insert(creative_notification_data).execute()
                    logger.info(f"Files sent notification created for creative: {user_id}")
                
                elif client_status == 'completed':
                    # Both: Service complete notification
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
                    db_admin.table("notifications").insert(client_notification_data).execute()
                    logger.info(f"Service complete notification created for client: {booking['client_user_id']}")
                    
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
                    db_admin.table("notifications").insert(creative_notification_data).execute()
                    logger.info(f"Service complete notification created for creative: {user_id}")
                
                elif client_status == 'download':
                    # Client: Files ready notification
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
                    db_admin.table("notifications").insert(client_notification_data).execute()
                    logger.info(f"Files ready notification created for client: {booking['client_user_id']}")
                    
                    # Creative: Files sent notification
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
                            "has_files": True
                        },
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    db_admin.table("notifications").insert(creative_notification_data).execute()
                    logger.info(f"Files sent notification created for creative: {user_id}")
                    
            except Exception as notif_error:
                logger.error(f"Failed to create finalization notifications: {notif_error}")
            
            return FinalizeServiceResponse(
                success=True,
                message="Service finalized successfully",
                booking_id=booking_id
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error finalizing service: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to finalize service: {str(e)}")