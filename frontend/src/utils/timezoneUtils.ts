/**
 * Timezone utility functions for handling UTC conversion
 */

/**
 * Convert a local time string (HH:MM format) to UTC time string
 * @param localTimeStr - Time in HH:MM format (e.g., "09:00")
 * @param userTimezone - User's timezone (e.g., 'America/New_York', 'Europe/London')
 * @returns UTC time string in HH:MM format
 */
export function convertLocalTimeToUTC(localTimeStr: string, userTimezone: string = 'UTC'): string {
  try {
    // Parse the time string
    const [hour, minute] = localTimeStr.split(':').map(Number);
    
    // Create a date object for today
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    // Create a date string in ISO format
    const localDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    
    // Create a date object representing the local time
    const localDate = new Date(localDateStr);
    
    // Get the timezone offset for the user's timezone
    const utcDate = new Date(localDateStr + 'Z'); // This is UTC
    const userTzDate = new Date(utcDate.toLocaleString('en-US', { timeZone: userTimezone }));
    
    // Calculate the offset (difference between UTC and user timezone)
    const offset = userTzDate.getTime() - utcDate.getTime();
    
    // Apply the offset to convert from user timezone to UTC
    const utcResult = new Date(localDate.getTime() - offset);
    
    // Return as HH:MM string
    return utcResult.toISOString().substr(11, 5);
  } catch {
    // If conversion fails, assume it's already UTC
    return localTimeStr;
  }
}

/**
 * Convert a UTC time string (HH:MM format) to local time string
 * @param utcTimeStr - UTC time in HH:MM format (e.g., "14:00")
 * @param userTimezone - User's timezone (e.g., 'America/New_York', 'Europe/London')
 * @returns Local time string in HH:MM format
 */
export function convertUTCToLocalTime(utcTimeStr: string, userTimezone: string = 'UTC'): string {
  try {
    // Parse the UTC time string
    const [hour, minute] = utcTimeStr.split(':').map(Number);
    
    // Create a date object for today with the UTC time
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    // Create a UTC date string
    const utcDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;
    
    // Create a date object representing the UTC time
    const utcDate = new Date(utcDateStr);
    
    // Convert to the user's timezone
    const localTime = new Date(utcDate.toLocaleString('en-US', { timeZone: userTimezone }));
    
    // Return as HH:MM string
    return localTime.toTimeString().substr(0, 5);
  } catch {
    // If conversion fails, return as is
    return utcTimeStr;
  }
}

/**
 * Get user's timezone from browser
 * @returns User's timezone string
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Convert time blocks from local time to UTC
 * @param timeBlocks - Array of time block objects with 'start' and 'end' keys
 * @param userTimezone - User's timezone
 * @returns Array of time blocks with UTC times
 */
export function convertTimeBlocksToUTC(timeBlocks: Array<{start: string; end: string}>, userTimezone: string = 'UTC'): Array<{start: string; end: string}> {
  return timeBlocks.map(block => ({
    start: convertLocalTimeToUTC(block.start, userTimezone),
    end: convertLocalTimeToUTC(block.end, userTimezone)
  }));
}

/**
 * Convert time slots from local time to UTC
 * @param timeSlots - Array of time slot objects with 'time' and 'enabled' keys
 * @param userTimezone - User's timezone
 * @returns Array of time slots with UTC times
 */
export function convertTimeSlotsToUTC(timeSlots: Array<{time: string; enabled: boolean}>, userTimezone: string = 'UTC'): Array<{time: string; enabled: boolean}> {
  return timeSlots.map(slot => ({
    time: convertLocalTimeToUTC(slot.time, userTimezone),
    enabled: slot.enabled
  }));
}

/**
 * Convert time blocks from UTC to local time
 * @param timeBlocks - Array of time block objects with 'start' and 'end' keys
 * @param userTimezone - User's timezone
 * @returns Array of time blocks with local times
 */
export function convertTimeBlocksFromUTC(timeBlocks: Array<{start: string; end: string}>, userTimezone: string = 'UTC'): Array<{start: string; end: string}> {
  return timeBlocks.map(block => ({
    start: convertUTCToLocalTime(block.start, userTimezone),
    end: convertUTCToLocalTime(block.end, userTimezone)
  }));
}

/**
 * Convert time slots from UTC to local time
 * @param timeSlots - Array of time slot objects with 'time' and 'enabled' keys
 * @param userTimezone - User's timezone
 * @returns Array of time slots with local times
 */
export function convertTimeSlotsFromUTC(timeSlots: Array<{time: string; enabled: boolean}>, userTimezone: string = 'UTC'): Array<{time: string; enabled: boolean}> {
  return timeSlots.map(slot => ({
    time: convertUTCToLocalTime(slot.time, userTimezone),
    enabled: slot.enabled
  }));
}

/**
 * Format time for display with timezone info
 * @param timeStr - Time in HH:MM format
 * @param userTimezone - User's timezone
 * @returns Formatted time string with timezone
 */
export function formatTimeWithTimezone(timeStr: string, userTimezone: string = 'UTC'): string {
  try {
    const [hour, minute] = timeStr.split(':').map(Number);
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone
    });
  } catch {
    return timeStr;
  }
}
