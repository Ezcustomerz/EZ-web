"""
Timezone utility functions for handling UTC conversion
"""
from datetime import datetime, time, timezone
from typing import Optional
import pytz


def convert_local_time_to_utc(local_time_str: str, user_timezone: str = 'UTC') -> str:
    """
    Convert a local time string (HH:MM format) to UTC time string.
    
    Args:
        local_time_str: Time in HH:MM format (e.g., "09:00")
        user_timezone: User's timezone (e.g., 'America/New_York', 'Europe/London')
    
    Returns:
        UTC time string in HH:MM format
    """
    try:
        print(f"DEBUG: Converting {local_time_str} from {user_timezone} to UTC")
        
        # Parse the time string
        hour, minute = map(int, local_time_str.split(':'))
        local_time = time(hour, minute)
        
        # Get the user's timezone
        user_tz = pytz.timezone(user_timezone)
        
        # Create a datetime object for today with the local time
        today = datetime.now(user_tz).date()
        local_datetime = user_tz.localize(datetime.combine(today, local_time))
        
        # Convert to UTC
        utc_datetime = local_datetime.astimezone(pytz.UTC)
        
        result = utc_datetime.strftime('%H:%M')
        print(f"DEBUG: Converted {local_time_str} ({user_timezone}) to {result} UTC")
        
        # Return as HH:MM string
        return result
    except Exception as e:
        print(f"DEBUG: Conversion failed: {e}")
        # If conversion fails, assume it's already UTC
        return local_time_str


def convert_utc_time_to_local(utc_time_str: str, user_timezone: str = 'UTC') -> str:
    """
    Convert a UTC time string (HH:MM format) to local time string.
    
    Args:
        utc_time_str: UTC time in HH:MM format (e.g., "14:00")
        user_timezone: User's timezone (e.g., 'America/New_York', 'Europe/London')
    
    Returns:
        Local time string in HH:MM format
    """
    try:
        # Parse the UTC time string
        hour, minute = map(int, utc_time_str.split(':'))
        utc_time = time(hour, minute)
        
        # Get UTC timezone
        utc_tz = pytz.UTC
        
        # Create a datetime object for today with the UTC time
        today = datetime.now(utc_tz).date()
        utc_datetime = utc_tz.localize(datetime.combine(today, utc_time))
        
        # Convert to user's timezone
        user_tz = pytz.timezone(user_timezone)
        local_datetime = utc_datetime.astimezone(user_tz)
        
        # Return as HH:MM string
        return local_datetime.strftime('%H:%M')
    except Exception as e:
        # If conversion fails, return as is
        return utc_time_str


def get_user_timezone_from_request(request_headers: dict) -> str:
    """
    Extract user timezone from request headers or return default.
    
    Args:
        request_headers: Request headers dictionary
    
    Returns:
        User timezone string (defaults to 'UTC')
    """
    # Try to get timezone from headers
    timezone_header = request_headers.get('x-user-timezone') or request_headers.get('timezone')
    if timezone_header:
        try:
            # Validate timezone
            pytz.timezone(timezone_header)
            return timezone_header
        except pytz.exceptions.UnknownTimeZoneError:
            pass
    
    # Default to UTC if no valid timezone found
    return 'UTC'


def convert_time_blocks_to_utc(time_blocks: list, user_timezone: str = 'UTC') -> list:
    """
    Convert a list of time blocks from local time to UTC.
    
    Args:
        time_blocks: List of time block dictionaries with 'start' and 'end' keys
        user_timezone: User's timezone
    
    Returns:
        List of time blocks with UTC times
    """
    utc_blocks = []
    for block in time_blocks:
        utc_blocks.append({
            'start': convert_local_time_to_utc(block['start'], user_timezone),
            'end': convert_local_time_to_utc(block['end'], user_timezone)
        })
    return utc_blocks


def convert_time_slots_to_utc(time_slots: list, user_timezone: str = 'UTC') -> list:
    """
    Convert a list of time slots from local time to UTC.
    
    Args:
        time_slots: List of time slot dictionaries with 'time' and 'enabled' keys
        user_timezone: User's timezone
    
    Returns:
        List of time slots with UTC times
    """
    utc_slots = []
    for slot in time_slots:
        utc_slots.append({
            'time': convert_local_time_to_utc(slot['time'], user_timezone),
            'enabled': slot['enabled']
        })
    return utc_slots


def convert_time_blocks_from_utc(time_blocks: list, user_timezone: str = 'UTC') -> list:
    """
    Convert a list of time blocks from UTC to local time.
    
    Args:
        time_blocks: List of time block dictionaries with 'start' and 'end' keys
        user_timezone: User's timezone
    
    Returns:
        List of time blocks with local times
    """
    local_blocks = []
    for block in time_blocks:
        local_blocks.append({
            'start': convert_utc_time_to_local(block['start'], user_timezone),
            'end': convert_utc_time_to_local(block['end'], user_timezone)
        })
    return local_blocks


def convert_time_slots_from_utc(time_slots: list, user_timezone: str = 'UTC') -> list:
    """
    Convert a list of time slots from UTC to local time.
    
    Args:
        time_slots: List of time slot dictionaries with 'time' and 'enabled' keys
        user_timezone: User's timezone
    
    Returns:
        List of time slots with local times
    """
    local_slots = []
    for slot in time_slots:
        local_slots.append({
            'time': convert_utc_time_to_local(slot['time'], user_timezone),
            'enabled': slot['enabled']
        })
    return local_slots
