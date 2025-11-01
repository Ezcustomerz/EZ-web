import {
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Card,
  CardContent,
  Slide,
  Avatar,
  LinearProgress,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { 
  Close, 
  CalendarToday,
  Schedule,
  CheckCircle,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';
import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { bookingService } from '../../../api/bookingService';
import type { CalendarSettings, TimeSlot, AvailableDate } from '../../../api/bookingService';
import { convertUTCToLocalTime, getUserTimezone } from '../../../utils/timezoneUtils';

export interface BookingSchedulePopoverProps {
  open: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    delivery_time: string;
    creative_name: string;
    creative_display_name?: string;
    creative_title?: string;
    creative_avatar_url?: string;
    color: string;
    payment_option?: 'upfront' | 'split' | 'later';
    requires_booking?: boolean;
  } | null;
  onConfirmBooking?: (bookingData: BookingScheduleData) => void;
  // Optional initial values to restore previous selection in current session
  initialSelectedDate?: Date | null;
  initialSelectedTime?: string | null;
  initialDuration?: number | null;
}

export interface BookingScheduleData {
  serviceId: string;
  selectedDate: Date;
  selectedTime: string;
  sessionDuration: number;
  timeSlotId?: string;
  bookingAvailabilityId?: string;
}

export function BookingSchedulePopover({ 
  open, 
  onClose, 
  service,
  onConfirmBooking,
  initialSelectedDate,
  initialSelectedTime,
  initialDuration
}: BookingSchedulePopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showProgress, setShowProgress] = useState(false);
  
  // Backend data state
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  // Track dates that have been checked and found to have no available time slots
  const [datesWithNoSlots, setDatesWithNoSlots] = useState<Set<string>>(new Set());
  
  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch booking data when component opens
  useEffect(() => {
    if (open && service?.id) {
      fetchBookingData();
    }
  }, [open, service?.id]);

  // Fetch time slots when date is selected OR when popover opens with a date already selected
  // Adding 'open' ensures fresh data is fetched each time the popover opens
  useEffect(() => {
    if (open && selectedDate && service?.id) {
      fetchTimeSlotsForDate(selectedDate);
    }
  }, [selectedDate, service?.id, open]);

  const fetchBookingData = async () => {
    if (!service?.id) return;
    
    setIsLoadingData(true);
    setError(null);
    // Don't reset tracked dates - keep previous checks across popover opens
    // This prevents dates from flickering between available/unavailable
    
    try {
      const [calendarData, availableDatesData] = await Promise.all([
        bookingService.getCalendarSettings(service.id),
        bookingService.getAvailableDates(service.id)
      ]);

      setCalendarSettings(calendarData);
      setAvailableDates(availableDatesData);
      
      // Set default session duration from calendar settings
      if (calendarData.default_session_length) {
        setSelectedDuration(calendarData.default_session_length);
      }
    } catch (err) {
      console.error('Error fetching booking data:', err);
      setError('Failed to load booking data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchTimeSlotsForDate = async (date: Date) => {
    if (!service?.id) return;
    
    setIsLoadingTimeSlots(true);
    
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const timeSlots = await bookingService.getAvailableTimeSlots(service.id, dateString);
      setAvailableTimeSlots(timeSlots);
      
      // Track dates with no available time slots
      if (timeSlots.length === 0) {
        setDatesWithNoSlots(prev => new Set(prev).add(dateString));
        // Clear selected time if no slots are available for the selected date
        if (selectedDate && isSameDay(selectedDate, date)) {
          setSelectedTime(null);
          setSelectedAvailabilityId(null);
        }
      } else {
        // Remove from set if slots become available
        setDatesWithNoSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(dateString);
          return newSet;
        });
      }
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setAvailableTimeSlots([]);
      // Mark as having no slots on error
      const dateString = format(date, 'yyyy-MM-dd');
      setDatesWithNoSlots(prev => new Set(prev).add(dateString));
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  // Helper function to parse time safely and convert to user's timezone
  const parseTime = (timeStr: string) => {
    try {
      // Extract time part from UTC string (e.g., "13:00:00+00" -> "13:00:00")
      const [timePart] = timeStr.split('+');
      const [hour, minute] = timePart.split(':').map(Number);
      
      // Get user's timezone
      const userTimezone = getUserTimezone();
      
      // Convert UTC time to local time using timezone utils
      const localTimeStr = convertUTCToLocalTime(`${hour}:${minute}`, userTimezone);
      const [localHour, localMinute] = localTimeStr.split(':').map(Number);
      
      // Create a date object with the local time
      return new Date(2000, 0, 1, localHour, localMinute);
    } catch (error) {
      console.warn('Failed to parse time:', timeStr, error);
      return new Date('2000-01-01T09:00:00'); // fallback
    }
  };

  // Reset or restore state when dialog opens
  useEffect(() => {
    if (!open) return;
    setCurrentMonth(initialSelectedDate ? initialSelectedDate : new Date());
    setAvailableTimeSlots([]);
    setError(null);
    setShowProgress(false);
    setIsSubmitting(false);
    setSelectedAvailabilityId(null);
    // Don't reset datesWithNoSlots - keep it for the session so dates remain marked if checked

    if (initialSelectedDate) {
      setSelectedDate(initialSelectedDate);
    } else {
      setSelectedDate(null);
    }
    if (initialSelectedTime) {
      setSelectedTime(initialSelectedTime);
    } else {
      setSelectedTime(null);
    }
    if (initialDuration ?? null) {
      setSelectedDuration(initialDuration as number);
    }
    // Note: Time slots will be fetched by the separate useEffect that watches selectedDate and open
  }, [open, initialSelectedDate, initialSelectedTime, initialDuration]);

  // Convert backend time slots to display format
  const displayTimeSlots = useMemo(() => {
    return availableTimeSlots.map(slot => {
      const slotTime = parseTime(slot.slot_time);
      const displayTime = format(slotTime, 'h:mm a');
      
      // Debug logging
      const userTimezone = getUserTimezone();
      console.log(`UTC time: ${slot.slot_time} -> Local time: ${displayTime} (Timezone: ${userTimezone})`);
      
      return {
        id: slot.id,
        time: slot.slot_time,
        displayTime,
        isAvailable: slot.is_enabled,
        day_of_week: slot.day_of_week,
        isTemplate: slot.is_template,
        current_bookings: slot.current_bookings,
        max_bookings: slot.max_bookings
      };
    });
  }, [availableTimeSlots]);


  // Get month dates for calendar view
  const monthDates = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startOfMonth = startOfWeek(start, { weekStartsOn: 0 });
    const endOfMonth = endOfWeek(end, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: startOfMonth, end: endOfMonth });
  }, [currentMonth]);

  // Navigation functions
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (timeSlot: { time: string; id: string; isTemplate?: boolean }) => {
    setSelectedTime(timeSlot.time);
    // Store the availability ID (or time slot template ID if no availability exists yet)
    setSelectedAvailabilityId(timeSlot.isTemplate ? null : timeSlot.id);
  };



  const handleSubmit = async () => {
    if (!service || !selectedDate || !selectedTime || !calendarSettings) {
      return;
    }

    setIsSubmitting(true);
    setShowProgress(true);
    
    try {
      const bookingData: BookingScheduleData = {
        serviceId: service.id,
        selectedDate,
        selectedTime,
        sessionDuration: selectedDuration,
        bookingAvailabilityId: selectedAvailabilityId || undefined
      };

      if (onConfirmBooking) {
        await onConfirmBooking(bookingData);
      }
      
      // Add a small delay for better UX
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to submit booking:', error);
      setShowProgress(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowProgress(false);
    setIsSubmitting(false);
    onClose();
  };

  const isDateAvailable = (date: Date) => {
    if (!Array.isArray(availableDates)) {
      return false;
    }
    const dateString = format(date, 'yyyy-MM-dd');
    const isCurrentlySelected = selectedDate && isSameDay(selectedDate, date);
    
    // First check: if this date has been checked and found to have no available time slots, it's not available
    if (datesWithNoSlots.has(dateString)) {
      return false;
    }
    
    // Second check: if this date is currently selected
    if (isCurrentlySelected) {
      // If we're still loading time slots, be conservative and don't show as available yet
      if (isLoadingTimeSlots) {
        return false;
      }
      // If we've finished loading (or haven't started yet) and have no slots, it's not available
      // Empty array means either: 1) we haven't fetched yet, 2) we fetched and found none
      // In both cases, don't show as available until we confirm there are slots
      if (availableTimeSlots.length === 0) {
        return false;
      }
      // If we have slots, it's available
      return true;
    }
    
    // Third check: if date is in the available dates list AND not marked as having no slots
    // For dates that haven't been selected yet, we show them as available based on backend data
    // (they will be checked when clicked)
    return availableDates.some(availableDate => availableDate.date === dateString && availableDate.is_available);
  };

  const isDateSelected = (date: Date) => {
    return selectedDate ? isSameDay(selectedDate, date) : false;
  };

  const canProceed = selectedDate && selectedTime && selectedDuration && calendarSettings;

  if (!service) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' } as any}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: isMobile 
            ? 'none' 
            : '0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${service.color} 0%, ${service.color}CC 100%)`,
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        pt: 3,
        px: 3,
        background: `linear-gradient(135deg, ${service.color}08 0%, ${service.color}04 100%)`,
        borderBottom: `1px solid ${service.color}20`,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar sx={{
              width: 48,
              height: 48,
              background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
              boxShadow: `0 6px 16px ${service.color}30`,
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s ease-in-out'
              }
            }}>
              <CalendarToday sx={{ color: 'white', fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                color: 'text.primary', 
                mb: 0.5,
                background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Schedule Your Session
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.875rem'
              }}>
                {service.title}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Close" arrow>
            <IconButton 
              onClick={handleClose}
              sx={{ 
                color: 'text.secondary',
                p: 1.5,
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': { 
                  background: 'rgba(0,0,0,0.08)',
                  color: 'text.primary',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2 }}>
        {isLoadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={40} sx={{ color: service.color, mr: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading booking calendar...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, pt: 2 }}>
          {/* Mini Calendar */}
          <Card sx={{ 
            border: `2px solid ${service.color}20`, 
            borderRadius: 3,
            boxShadow: `0 4px 12px ${service.color}15`,
            flex: 1,
            minWidth: 300
          }}>
            <CardContent sx={{ p: 3 }}>
              {/* Calendar Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: 'text.primary'
                }}>
                  {format(currentMonth, 'MMMM yyyy')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    onClick={handlePreviousMonth}
                    size="small"
                    sx={{ 
                      color: service.color,
                      '&:hover': { backgroundColor: `${service.color}20` }
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <IconButton 
                    onClick={handleNextMonth}
                    size="small"
                    sx={{ 
                      color: service.color,
                      '&:hover': { backgroundColor: `${service.color}20` }
                    }}
                  >
                    <ArrowForward />
                  </IconButton>
                </Box>
              </Box>

              {/* Calendar Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                {/* Day Headers */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Typography key={`day-${index}`} variant="caption" sx={{ 
                    fontWeight: 600, 
                    color: 'text.secondary',
                    textAlign: 'center',
                    py: 1,
                    fontSize: '0.75rem'
                  }}>
                    {day}
                  </Typography>
                ))}
                
                {/* Calendar Days */}
                {monthDates.map((date, index) => {
                  const isAvailable = isDateAvailable(date);
                  const isSelected = isDateSelected(date);
                  const isToday = isSameDay(date, new Date());
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  
                  return (
                    <Box
                      key={index}
                      onClick={() => isAvailable && handleDateSelect(date)}
                      sx={{
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        cursor: isAvailable ? 'pointer' : 'default',
                        backgroundColor: isSelected 
                          ? service.color 
                          : isToday 
                            ? `${service.color}20` 
                            : 'transparent',
                        color: isSelected 
                          ? 'white' 
                          : isAvailable && isCurrentMonth
                            ? 'text.primary' 
                            : 'text.disabled',
                        fontWeight: isSelected || isToday ? 600 : 400,
                        fontSize: '0.875rem',
                        transition: 'all 0.2s ease-in-out',
                        border: isToday ? `2px solid ${service.color}` : '2px solid transparent',
                        '&:hover': isAvailable ? {
                          backgroundColor: isSelected ? service.color : `${service.color}20`,
                          transform: 'scale(1.05)',
                        } : {},
                        opacity: isAvailable && isCurrentMonth ? 1 : 0.4
                      }}
                    >
                      {format(date, 'd')}
                    </Box>
                  );
                })}
              </Box>

              {/* Removed selected date alert per request */}
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card sx={{ 
            border: `2px solid ${service.color}20`, 
            borderRadius: 3,
            boxShadow: `0 4px 12px ${service.color}15`,
            flex: 1,
            minWidth: 300
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    width: 32,
                    height: 32,
                    background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
                    boxShadow: `0 3px 8px ${service.color}30`
                  }}>
                    <Schedule sx={{ color: 'white', fontSize: 18 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 600, 
                    color: 'text.primary'
                  }}>
                    Available Times
                  </Typography>
                </Box>
                {selectedTime && (
                  (() => {
                    const start = parseTime(selectedTime);
                    const minutes = selectedDuration || calendarSettings?.default_session_length || 0;
                    const end = new Date(start.getTime() + minutes * 60000);
                    const startStr = format(start, 'h:mm a');
                    const endStr = format(end, 'h:mm a');
                    return (
                      <Chip 
                        label={`${startStr} - ${endStr}`}
                        size="small"
                        sx={{
                          bgcolor: `${service.color}20`,
                          color: service.color,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          height: 26,
                          '& .MuiChip-label': { px: 1.5 }
                        }}
                      />
                    );
                  })()
                )}
              </Box>

              {!selectedDate ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Please select a date to view available times
                </Alert>
              ) : isLoadingTimeSlots ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                  <CircularProgress size={24} sx={{ color: service.color, mr: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading available times...
                  </Typography>
                </Box>
              ) : displayTimeSlots.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  No bookings available for this day
                </Alert>
              ) : (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                  gap: 1 
                }}>
                  {displayTimeSlots.map((slot) => (
                    <Box
                      key={slot.id}
                      onClick={() => handleTimeSelect(slot)}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: selectedTime === slot.time ? service.color : 'divider',
                        backgroundColor: selectedTime === slot.time 
                          ? `${service.color}10` 
                          : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: service.color,
                          backgroundColor: `${service.color}10`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${service.color}20`
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ 
                        fontWeight: selectedTime === slot.time ? 600 : 500,
                        color: selectedTime === slot.time ? service.color : 'text.primary'
                      }}>
                        {slot.displayTime}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              
            </CardContent>
          </Card>
        </Box>
        )}
      </DialogContent>

      <Divider sx={{ borderColor: `${service.color}20` }} />

      <DialogActions sx={{ p: 3, pt: 2, gap: 2 }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canProceed || isSubmitting}
          endIcon={isSubmitting ? null : <CheckCircle />}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            px: 3,
            py: 1,
            fontSize: '0.875rem',
            minWidth: 140,
            background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
            boxShadow: `0 4px 12px ${service.color}30`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: `linear-gradient(135deg, ${service.color}CC 0%, ${service.color} 100%)`,
              boxShadow: `0 6px 16px ${service.color}40`,
              transform: 'translateY(-1px)'
            },
            '&:disabled': {
              background: 'rgba(0,0,0,0.12)',
              color: 'rgba(0,0,0,0.26)',
              transform: 'none',
              boxShadow: 'none'
            }
          }}
        >
          {isSubmitting ? 'Processing...' : 'Confirm Booking'}
        </Button>
        
        {/* Progress indicator for submission */}
        {showProgress && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress 
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: `${service.color}20`,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${service.color} 0%, ${service.color}CC 100%)`,
                }
              }}
            />
            <Typography variant="caption" sx={{ 
              color: service.color, 
              fontWeight: 600, 
              mt: 1, 
              display: 'block',
              textAlign: 'center'
            }}>
              Processing your booking...
            </Typography>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}
