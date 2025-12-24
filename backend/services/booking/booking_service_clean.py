from typing import List, Optional, Dict, Any
from datetime import datetime, date, time, timedelta
import logging
from supabase import Client

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

