from typing import List, Optional, Dict, Any
from datetime import datetime, date, time, timedelta
import logging
from db.db_session import db_admin

logger = logging.getLogger(__name__)

class BookingService:
    def __init__(self):
        self.db = db_admin

    def get_calendar_settings(self, service_id: str) -> Optional[Dict[str, Any]]:
        """Get calendar settings for a service"""
        try:
            logger.info(f"Fetching calendar settings for service_id: {service_id}")
            response = self.db.table('calendar_settings').select('*').eq('service_id', service_id).eq('is_active', True).execute()
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

    def get_weekly_schedule(self, calendar_setting_id: str) -> List[Dict[str, Any]]:
        """Get weekly schedule for a calendar setting"""
        try:
            response = self.db.table('weekly_schedule').select('*, time_blocks(*)').eq('calendar_setting_id', calendar_setting_id).execute()
            
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

    def get_time_slots(self, weekly_schedule_id: str) -> List[Dict[str, Any]]:
        """Get time slots for a weekly schedule"""
        try:
            response = self.db.table('time_slots').select('*, weekly_schedule!inner(day_of_week)').eq('weekly_schedule_id', weekly_schedule_id).order('slot_time').execute()
            
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

    def get_available_dates(self, service_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """Get available booking dates for a service based on calendar settings and actual slot availability"""
        try:
            # Get calendar settings
            calendar_settings = self.get_calendar_settings(service_id)
            if not calendar_settings or not calendar_settings.get("is_scheduling_enabled"):
                return []

            # Get weekly schedule
            weekly_schedule = self.get_weekly_schedule(calendar_settings["id"])
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
                        available_slots = self.get_available_time_slots(service_id, current_date)
                        
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

    def get_available_time_slots(self, service_id: str, booking_date: date) -> List[Dict[str, Any]]:
        """
        Get available time slots for a specific date.
        Uses time_slots (template) and filters out already-booked times from bookings table.
        """
        try:
            calendar_settings = self.get_calendar_settings(service_id)
            if not calendar_settings or not calendar_settings.get("is_scheduling_enabled"):
                return []

            day_name = booking_date.strftime('%A')
            weekly_schedule = self.get_weekly_schedule(calendar_settings["id"])
            day_schedule = next((day for day in weekly_schedule if day["day_of_week"] == day_name), None)
            
            if not day_schedule or not day_schedule["is_enabled"]:
                return []

            time_slots = self.get_time_slots(day_schedule["id"])
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
            existing_bookings_response = self.db.table('bookings')\
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

    def get_service_booking_data(self, service_id: str) -> Dict[str, Any]:
        """Get complete booking data for a service"""
        try:
            # Get calendar settings
            calendar_settings = self.get_calendar_settings(service_id)
            if not calendar_settings:
                return {"error": "Calendar settings not found"}

            # Get weekly schedule
            weekly_schedule = self.get_weekly_schedule(calendar_settings["id"])
            
            # Get time slots for each day
            time_slots = []
            for day in weekly_schedule:
                if day["is_enabled"]:
                    day_slots = self.get_time_slots(day["id"])
                    time_slots.extend(day_slots)

            return {
                "calendar_settings": calendar_settings,
                "weekly_schedule": weekly_schedule,
                "time_slots": time_slots
            }
        except Exception as e:
            logger.error(f"Error fetching service booking data: {e}")
            return {"error": str(e)}