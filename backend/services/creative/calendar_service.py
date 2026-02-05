"""Calendar settings service for creative services"""
import logging
from fastapi import HTTPException, Request
from core.safe_errors import log_exception_if_dev
from schemas.creative import CalendarSettingsRequest
from supabase import Client
from core.timezone_utils import (
    convert_time_blocks_to_utc,
    convert_time_slots_to_utc,
    get_user_timezone_from_request
)

logger = logging.getLogger(__name__)


class CalendarService:
    """Service for handling calendar settings and schedules"""
    
    @staticmethod
    async def save_calendar_settings(service_id: str, calendar_settings: CalendarSettingsRequest, client: Client, request: Request = None):
        """Save calendar settings for a service
        
        Args:
            service_id: The service ID to save calendar settings for
            calendar_settings: The calendar settings data
            client: Authenticated Supabase client (required, respects RLS policies)
            request: Optional request object for timezone detection
        
        Note: All operations use authenticated client. RLS policies allow:
        - calendar_settings: DELETE/INSERT for own services
        - weekly_schedule: ALL for own calendar settings
        - time_blocks: ALL for own weekly schedules
        - time_slots: ALL for own weekly schedules
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Get user timezone from request headers
            user_timezone = 'UTC'  # Default to UTC
            if request:
                user_timezone = get_user_timezone_from_request(dict(request.headers))
                print(f"DEBUG: User timezone detected: {user_timezone}")
            
            # First, delete existing calendar settings for this service
            # RLS: "Users can manage calendar settings for their own services"
            client.table('calendar_settings').delete().eq('service_id', service_id).execute()
            
            # Insert new calendar settings
            # RLS: "Users can insert calendar settings for their own active service"
            calendar_data = {
                'service_id': service_id,
                'is_scheduling_enabled': calendar_settings.is_scheduling_enabled,
                'session_duration': calendar_settings.session_duration,
                'default_session_length': calendar_settings.default_session_length,
                'min_notice_amount': calendar_settings.min_notice_amount,
                'min_notice_unit': calendar_settings.min_notice_unit,
                'max_advance_amount': calendar_settings.max_advance_amount,
                'max_advance_unit': calendar_settings.max_advance_unit,
                'buffer_time_amount': calendar_settings.buffer_time_amount,
                'buffer_time_unit': calendar_settings.buffer_time_unit,
                'is_active': True
            }
            
            calendar_result = client.table('calendar_settings').insert(calendar_data).execute()
            if not calendar_result.data:
                raise HTTPException(status_code=500, detail="Failed to save calendar settings")
            
            calendar_setting_id = calendar_result.data[0]['id']
            
            # Save weekly schedule
            for day_schedule in calendar_settings.weekly_schedule:
                if day_schedule.enabled:  # Only save enabled days
                    # Insert weekly schedule entry
                    # RLS: "Users can manage weekly schedule for their own calendar setting"
                    weekly_data = {
                        'calendar_setting_id': calendar_setting_id,
                        'day_of_week': day_schedule.day,
                        'is_enabled': day_schedule.enabled
                    }
                    
                    weekly_result = client.table('weekly_schedule').insert(weekly_data).execute()
                    if not weekly_result.data:
                        continue  # Skip this day if insertion fails
                    
                    weekly_schedule_id = weekly_result.data[0]['id']
                    
                    # Save time blocks (convert to UTC)
                    if day_schedule.time_blocks:
                        time_blocks_data = []
                        # Convert time blocks to UTC
                        utc_time_blocks = convert_time_blocks_to_utc(
                            [{'start': block.start, 'end': block.end} for block in day_schedule.time_blocks],
                            user_timezone
                        )
                        for block in utc_time_blocks:
                            # Validate that start_time < end_time (database constraint requirement)
                            start_time_str = block['start']
                            end_time_str = block['end']
                            
                            # Parse times to compare
                            start_hour, start_min = map(int, start_time_str.split(':'))
                            end_hour, end_min = map(int, end_time_str.split(':'))
                            
                            # Convert to minutes for comparison
                            start_minutes = start_hour * 60 + start_min
                            end_minutes = end_hour * 60 + end_min
                            
                            # Only add if end_time > start_time
                            if end_minutes > start_minutes:
                                time_blocks_data.append({
                                    'weekly_schedule_id': weekly_schedule_id,
                                    'start_time': start_time_str,
                                    'end_time': end_time_str
                                })
                            else:
                                print(f"WARNING: Skipping invalid time block: start={start_time_str}, end={end_time_str} (end_time must be > start_time)")
                        
                        if time_blocks_data:
                            # RLS: "Users can manage time blocks for their own weekly schedule"
                            client.table('time_blocks').insert(time_blocks_data).execute()
                    
                    # Save time slots (always use time slot mode, convert to UTC)
                    if day_schedule.time_slots:
                        time_slots_data = []
                        # Convert time slots to UTC
                        utc_time_slots = convert_time_slots_to_utc(
                            [{'time': slot.time, 'enabled': slot.enabled} for slot in day_schedule.time_slots],
                            user_timezone
                        )
                        for slot in utc_time_slots:
                            time_slots_data.append({
                                'weekly_schedule_id': weekly_schedule_id,
                                'slot_time': slot['time'],
                                'is_enabled': slot['enabled']
                            })
                        
                        if time_slots_data:
                            # RLS: "Users can manage time slots for their own weekly schedule"
                            client.table('time_slots').insert(time_slots_data).execute()

        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Failed to save calendar settings", e)
            raise HTTPException(status_code=500, detail="Failed to save calendar settings")

    @staticmethod
    async def get_calendar_settings(service_id: str, user_id: str, client: Client):
        """Get active calendar settings for a service
        
        Args:
            service_id: The service ID to get calendar settings for
            user_id: The user ID to verify ownership
            client: Authenticated Supabase client (required, respects RLS policies)
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Verify service exists and belongs to user (using authenticated client - respects RLS)
            service_result = client.table('creative_services').select(
                'id, creative_user_id, is_active'
            ).eq('id', service_id).single().execute()
            
            if not service_result.data:
                raise HTTPException(status_code=404, detail="Service not found")
            
            if service_result.data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to view this service")
            
            if not service_result.data['is_active']:
                raise HTTPException(status_code=400, detail="Cannot access calendar settings for deleted service")
            
            # OPTIMIZED: Use nested selects to fetch all related data in fewer queries
            calendar_result = client.table('calendar_settings').select(
                '*, weekly_schedule(id, day_of_week, is_enabled, time_blocks(start_time, end_time), time_slots(slot_time, is_enabled))'
            ).eq('service_id', service_id).eq('is_active', True).limit(1).execute()
            
            if not calendar_result.data:
                return None  # No calendar settings configured
            
            calendar_data = calendar_result.data[0]
            weekly_schedule_data = calendar_data.pop('weekly_schedule', []) or []
            
            # Process nested data structure
            weekly_result = weekly_schedule_data
            time_blocks_by_ws = {}
            time_slots_by_ws = {}
            
            for ws in weekly_result:
                ws_id = ws['id']
                # Extract time_blocks
                time_blocks = ws.get('time_blocks', []) or []
                if ws_id not in time_blocks_by_ws:
                    time_blocks_by_ws[ws_id] = []
                for tb in time_blocks:
                    start_time = str(tb.get('start_time', ''))[:5] if tb.get('start_time') else '09:00'
                    end_time = str(tb.get('end_time', ''))[:5] if tb.get('end_time') else '17:00'
                    time_blocks_by_ws[ws_id].append({
                        'start': start_time,
                        'end': end_time
                    })
                
                # Extract time_slots
                time_slots = ws.get('time_slots', []) or []
                if ws_id not in time_slots_by_ws:
                    time_slots_by_ws[ws_id] = []
                for ts in time_slots:
                    slot_time = str(ts.get('slot_time', ''))[:5] if ts.get('slot_time') else '09:00'
                    time_slots_by_ws[ws_id].append({
                        'time': slot_time,
                        'enabled': ts.get('is_enabled', True)
                    })
            
            # Build weekly schedule with nested data (already processed above)
            weekly_schedule = []
            for ws in weekly_result:
                ws_id = ws['id']
                weekly_schedule.append({
                    'day': ws['day_of_week'],
                    'enabled': ws['is_enabled'],
                    'time_blocks': time_blocks_by_ws.get(ws_id, []),
                    'time_slots': time_slots_by_ws.get(ws_id, [])
                })
            
            calendar_data['weekly_schedule'] = weekly_schedule
            
            return calendar_data
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Failed to get calendar settings", e)
            raise HTTPException(status_code=500, detail="Failed to get calendar settings")

