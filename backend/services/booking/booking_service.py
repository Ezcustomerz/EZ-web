from typing import List, Optional, Dict, Any
from datetime import datetime, date, time, timedelta
import logging
from fastapi import HTTPException
from supabase import Client
from db.db_session import db_admin
from schemas.booking import (
    CreateBookingRequest, CreateBookingResponse,
    OrdersListResponse, OrderResponse,
    CalendarSessionsResponse, CalendarSessionResponse,
    ApproveBookingRequest, ApproveBookingResponse,
    RejectBookingRequest, RejectBookingResponse,
    CancelBookingRequest, CancelBookingResponse
)

logger = logging.getLogger(__name__)

class BookingService:
    def __init__(self, client: Optional[Client] = None):
        self.db = client if client else db_admin

    def get_calendar_settings(self, service_id: str, client: Optional[Client] = None) -> Optional[Dict[str, Any]]:
        """Get calendar settings for a service
        
        Args:
            service_id: The service ID to get calendar settings for
            client: Optional Supabase client (uses self.db if not provided)
        """
        try:
            db_client = client if client else self.db
            logger.info(f"Fetching calendar settings for service_id: {service_id}")
            response = db_client.table('calendar_settings').select('*').eq('service_id', service_id).eq('is_active', True).execute()
            logger.info(f"Response: {response}")
            
            if response.data and len(response.data) > 0:
                data = response.data[0]
                logger.info(f"Found calendar settings: {data}")
                return {
                    "id": data["id"],
                    "service_id": data["service_id"],
                    "is_scheduling_enabled": data["is_scheduling_enabled"],
                    "session_duration": data["session_duration"],
                    "default_session_length": data["default_session_length"],
                    "min_notice_amount": data["min_notice_amount"],
                    "min_notice_unit": data["min_notice_unit"],
                    "max_advance_amount": data["max_advance_amount"],
                    "max_advance_unit": data["max_advance_unit"],
                    "buffer_time_amount": data["buffer_time_amount"],
                    "buffer_time_unit": data["buffer_time_unit"],
                    "is_active": data["is_active"]
                }
            logger.warning(f"No calendar settings found for service_id: {service_id}")
            return None
        except Exception as e:
            logger.error(f"Error fetching calendar settings: {e}")
            return None

    def get_weekly_schedule(self, calendar_setting_id: str, client: Optional[Client] = None) -> List[Dict[str, Any]]:
        """Get weekly schedule for a calendar setting
        
        Args:
            calendar_setting_id: The calendar setting ID
            client: Optional Supabase client (uses self.db if not provided)
        """
        try:
            db_client = client if client else self.db
            response = db_client.table('weekly_schedule').select('*, time_blocks(*)').eq('calendar_setting_id', calendar_setting_id).execute()
            
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

    def get_time_slots(self, weekly_schedule_id: str, client: Optional[Client] = None) -> List[Dict[str, Any]]:
        """Get time slots for a weekly schedule
        
        Args:
            weekly_schedule_id: The weekly schedule ID
            client: Optional Supabase client (uses self.db if not provided)
        """
        try:
            db_client = client if client else self.db
            response = db_client.table('time_slots').select('*, weekly_schedule!inner(day_of_week)').eq('weekly_schedule_id', weekly_schedule_id).order('slot_time').execute()
            
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

    def get_available_dates(self, service_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None, client: Optional[Client] = None) -> List[Dict[str, Any]]:
        """Get available booking dates for a service based on calendar settings and actual slot availability
        
        Args:
            service_id: The service ID
            start_date: Optional start date
            end_date: Optional end date
            client: Optional Supabase client (uses self.db if not provided)
        """
        try:
            # Get calendar settings
            calendar_settings = self.get_calendar_settings(service_id, client)
            if not calendar_settings or not calendar_settings.get("is_scheduling_enabled"):
                return []

            # Get weekly schedule
            weekly_schedule = self.get_weekly_schedule(calendar_settings["id"], client)
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

            # Calculate available dates
            available_dates = []
            current_date = start_date
            
            while current_date <= end_date:
                day_name = current_date.strftime('%A')
                if day_name in enabled_days:
                    # Check minimum notice requirement
                    min_notice = calendar_settings.get("min_notice_amount", 24)
                    min_unit = calendar_settings.get("min_notice_unit", "hours")
                    
                    min_notice_hours = min_notice
                    if min_unit == "minutes":
                        min_notice_hours = min_notice / 60
                    elif min_unit == "days":
                        min_notice_hours = min_notice * 24
                    
                    min_notice_time = datetime.now() + timedelta(hours=min_notice_hours)
                    current_datetime = datetime.combine(current_date, datetime.min.time())
                    
                    if current_datetime >= min_notice_time:
                        # CRITICAL CHECK: Verify there are actually available time slots for this date
                        # before marking it as available
                        available_slots = self.get_available_time_slots(service_id, current_date, client)
                        
                        # Only add date if it has at least one available time slot
                        if available_slots and len(available_slots) > 0:
                            available_dates.append({
                                "date": current_date.isoformat(),
                                "day_of_week": day_name,
                                "is_available": True
                            })
                
                current_date += timedelta(days=1)

            return available_dates
        except Exception as e:
            logger.error(f"Error calculating available dates: {e}")
            return []

    def get_available_time_slots(self, service_id: str, booking_date: date, client: Optional[Client] = None) -> List[Dict[str, Any]]:
        """
        Get available time slots for a specific date.
        Uses time_slots (template) and filters out already-booked times from bookings table.
        
        Args:
            service_id: The service ID
            booking_date: The date to get available slots for
            client: Optional Supabase client (uses self.db if not provided)
        """
        try:
            db_client = client if client else self.db
            calendar_settings = self.get_calendar_settings(service_id, client)
            if not calendar_settings or not calendar_settings.get("is_scheduling_enabled"):
                return []

            day_name = booking_date.strftime('%A')
            weekly_schedule = self.get_weekly_schedule(calendar_settings["id"], client)
            day_schedule = next((day for day in weekly_schedule if day["day_of_week"] == day_name), None)
            
            if not day_schedule or not day_schedule["is_enabled"]:
                return []

            time_slots = self.get_time_slots(day_schedule["id"], client)
            if not time_slots:
                return []

            # Get existing bookings for this date to filter out booked times
            # Include bookings that should block the time slot:
            # - pending_approval (waiting for approval)
            # - in_progress (confirmed)
            # - awaiting_payment (confirmed, waiting for payment)
            # - completed (past booking, but might still block depending on logic)
            # Exclude bookings that should NOT block:
            # - rejected (creative rejected)
            # - cancelled (client cancelled)
            existing_bookings_response = db_client.table('bookings')\
                .select('start_time, creative_status, client_status')\
                .eq('service_id', service_id)\
                .eq('booking_date', booking_date.isoformat())\
                .neq('creative_status', 'rejected')\
                .neq('client_status', 'cancelled')\
                .execute()
            
            booked_times = set()
            if existing_bookings_response.data:
                for booking in existing_bookings_response.data:
                    start_time = booking.get('start_time')
                    if start_time:
                        # Normalize time format - extract just the time portion (HH:MM:SS)
                        # Handle different formats: "HH:MM:SS+00", "HH:MM:SS", "HH:MM"
                        time_str = str(start_time)
                        # Extract time part before timezone or space
                        if '+' in time_str:
                            time_str = time_str.split('+')[0]
                        elif ' ' in time_str:
                            time_str = time_str.split(' ')[0]
                        # Take only HH:MM:SS part (first 8 characters if format is correct)
                        if len(time_str) >= 5:  # At least HH:MM
                            # Ensure we have HH:MM format
                            time_parts = time_str.split(':')
                            if len(time_parts) >= 2:
                                normalized_time = f"{time_parts[0]}:{time_parts[1]}"
                                if len(time_parts) >= 3:
                                    normalized_time += f":{time_parts[2][:2]}"  # Take only seconds part before any timezone
                                booked_times.add(normalized_time)
                                # Also add without seconds for comparison flexibility
                                booked_times.add(f"{time_parts[0]}:{time_parts[1]}")

            # Return time slots but filter out already booked ones
            available_slots = []
            for slot in time_slots:
                if slot["is_enabled"] and slot["day_of_week"] == day_name:
                    # Normalize slot_time for comparison
                    slot_time = str(slot["slot_time"])
                    # Extract time part (handle formats like "HH:MM:SS" or "HH:MM")
                    if '+' in slot_time:
                        slot_time = slot_time.split('+')[0]
                    elif ' ' in slot_time:
                        slot_time = slot_time.split(' ')[0]
                    
                    # Normalize to HH:MM format for comparison
                    slot_time_parts = slot_time.split(':')
                    normalized_slot_time = None
                    if len(slot_time_parts) >= 2:
                        normalized_slot_time = f"{slot_time_parts[0]}:{slot_time_parts[1]}"
                    
                    # Skip this slot if it's already booked (check both normalized formats)
                    is_booked = False
                    if normalized_slot_time:
                        # Check if any booked time matches (with or without seconds)
                        is_booked = any(
                            normalized_slot_time == booked_time or 
                            normalized_slot_time == booked_time[:5] or
                            booked_time == normalized_slot_time or
                            booked_time[:5] == normalized_slot_time
                            for booked_time in booked_times
                        )
                    
                    if not is_booked:
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

    def get_service_booking_data(self, service_id: str, client: Optional[Client] = None) -> Dict[str, Any]:
        """Get complete booking data for a service
        
        Args:
            service_id: The service ID
            client: Optional Supabase client (uses self.db if not provided)
        """
        try:
            # Get calendar settings
            calendar_settings = self.get_calendar_settings(service_id, client)
            if not calendar_settings:
                return {"error": "Calendar settings not found"}

            # Get weekly schedule
            weekly_schedule = self.get_weekly_schedule(calendar_settings["id"], client)
            
            # Get time slots for each day
            time_slots = []
            for day in weekly_schedule:
                if day["is_enabled"]:
                    day_slots = self.get_time_slots(day["id"], client)
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
    def _build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False):
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
                description=booking.get('notes'),
                status=display_status,
                client_status=client_status,
                creative_status=creative_status
            )
        else:
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
                description=booking.get('notes'),
                status=display_status,
                client_status=client_status,
                creative_status=creative_status
            )
    
    @staticmethod
    async def create_booking(user_id: str, booking_data: CreateBookingRequest, client: Client) -> CreateBookingResponse:
        """Create a new booking/order
        
        Args:
            user_id: The user ID creating the booking
            booking_data: The booking request data
            client: Authenticated Supabase client (respects RLS policies)
        """
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
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Fetch bookings for this client
            bookings_response = client.table('bookings')\
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
            
            orders = []
            for booking in bookings_response.data:
                order = BookingController._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False)
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
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Fetch bookings for this client with in_progress status
            bookings_response = client.table('bookings')\
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
                order = BookingController._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False)
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
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Fetch bookings for this client
            bookings_response = client.table('bookings')\
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
                order = BookingController._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False)
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
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Fetch bookings for this client with completed or canceled status
            bookings_response = client.table('bookings')\
                .select('id, service_id, order_date, booking_date, start_time, price, payment_option, notes, client_status, creative_status, creative_user_id, canceled_date, approved_at')\
                .eq('client_user_id', user_id)\
                .in_('client_status', ['completed', 'cancelled'])\
                .order('order_date', desc=True)\
                .execute()
            
            # Also get orders where creative rejected (these show as canceled to client)
            rejected_bookings_response = client.table('bookings')\
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
                order = BookingController._build_order_response(booking, services_dict, creatives_dict, users_dict, is_creative_view=False)
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
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Fetch bookings for this creative
            bookings_response = client.table('bookings')\
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
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Fetch bookings for this creative, excluding completed/canceled/rejected orders
            bookings_response = client.table('bookings')\
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
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Fetch bookings for this creative, only completed/canceled/rejected orders
            bookings_response = client.table('bookings')\
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
    async def get_creative_calendar_sessions(user_id: str, year: int, month: int, client: Client) -> CalendarSessionsResponse:
        """Get calendar sessions for the current creative user for a specific month
        
        Args:
            user_id: The creative user ID
            year: The year to fetch sessions for
            month: The month to fetch sessions for
            client: Authenticated Supabase client (respects RLS policies)
        """
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
                elif creative_status in ['in_progress', 'awaiting_payment', 'complete']:
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
            client: Authenticated Supabase client (respects RLS policies)
        """
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
                elif creative_status in ['in_progress', 'awaiting_payment', 'complete']:
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
            client: Authenticated Supabase client (respects RLS policies)
        """
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
            
            # Get service and creative details for notification
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
            
            # Create notification
            try:
                notification_result = client.table("notifications")\
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
    
    @staticmethod
    async def reject_booking(user_id: str, booking_id: str, client: Client) -> RejectBookingResponse:
        """Reject a booking/order
        
        Args:
            user_id: The creative user ID rejecting the booking
            booking_id: The booking ID to reject
            client: Authenticated Supabase client (respects RLS policies)
        """
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
            
            # Create notification
            notification_data = {
                "recipient_user_id": booking['client_user_id'],
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
            
            try:
                notification_result = client.table("notifications")\
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
    
    @staticmethod
    async def cancel_booking(user_id: str, booking_id: str, client: Client) -> CancelBookingResponse:
        """Cancel a booking/order (client-initiated)
        
        Args:
            user_id: The client user ID canceling the booking
            booking_id: The booking ID to cancel
            client: Authenticated Supabase client (respects RLS policies)
        """
        try:
            # Fetch the booking
            booking_response = client.table('bookings')\
                .select('id, client_user_id, service_id, client_status, creative_status')\
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
            
            # Create notification
            notification_data = {
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
            
            try:
                notification_result = client.table("notifications")\
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