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
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addHours, addMinutes, addWeeks, addMonths } from 'date-fns';

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
  calendarSettings?: {
    service_id: string;
    is_scheduling_enabled: boolean;
    session_duration: number;
    default_session_length: number;
    min_notice_amount: number;
    min_notice_unit: 'minutes' | 'hours' | 'days';
    max_advance_amount: number;
    max_advance_unit: 'hours' | 'days' | 'weeks' | 'months';
    buffer_time_amount: number;
    buffer_time_unit: 'minutes' | 'hours';
  } | null;
  weeklySchedule: Array<{
    day_of_week: string;
    is_enabled: boolean;
    start_time: string;
    end_time: string;
  }>;
  timeSlots?: Array<{
    slot_time: string;
    is_enabled: boolean;
    day_of_week: string;
  }>;
  onConfirmBooking?: (bookingData: BookingScheduleData) => void;
}

export interface BookingScheduleData {
  serviceId: string;
  selectedDate: Date;
  selectedTime: string;
  sessionDuration: number;
  timeSlotId?: string;
}

export function BookingSchedulePopover({ 
  open, 
  onClose, 
  service,
  calendarSettings,
  weeklySchedule,
  timeSlots = [],
  onConfirmBooking
}: BookingSchedulePopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration] = useState<number>(calendarSettings?.default_session_length || 60);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showProgress, setShowProgress] = useState(false);

  // Create default calendar settings if none provided
  const defaultCalendarSettings = {
    service_id: service?.id || '',
    is_scheduling_enabled: true,
    session_duration: 60,
    default_session_length: 60,
    min_notice_amount: 24,
    min_notice_unit: 'hours' as const,
    max_advance_amount: 30,
    max_advance_unit: 'days' as const,
    buffer_time_amount: 15,
    buffer_time_unit: 'minutes' as const
  };

  const effectiveCalendarSettings = calendarSettings || defaultCalendarSettings;

  // Helper function to parse time safely
  const parseTime = (timeStr: string) => {
    try {
      // Handle different time formats
      let timeToParse = timeStr;
      if (timeStr.includes('+')) {
        // Remove timezone info for parsing
        timeToParse = timeStr.split('+')[0];
      }
      if (timeToParse.split(':').length === 2) {
        // Add seconds if missing
        timeToParse += ':00';
      }
      return new Date(`2000-01-01T${timeToParse}`);
    } catch (error) {
      console.warn('Failed to parse time:', timeStr, error);
      return new Date('2000-01-01T09:00:00'); // fallback
    }
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedDate(null);
      setSelectedTime(null);
      setCurrentMonth(new Date());
    }
  }, [open]);

  // Calculate available dates based on weekly schedule
  const availableDates = useMemo(() => {
    if (!effectiveCalendarSettings) return [];

    // If no weekly schedule provided, create a default one (Monday to Friday, 9 AM to 5 PM)
    const defaultWeeklySchedule = [
      { day_of_week: 'Monday', is_enabled: true, start_time: '09:00:00+00', end_time: '17:00:00+00' },
      { day_of_week: 'Tuesday', is_enabled: true, start_time: '09:00:00+00', end_time: '17:00:00+00' },
      { day_of_week: 'Wednesday', is_enabled: true, start_time: '09:00:00+00', end_time: '17:00:00+00' },
      { day_of_week: 'Thursday', is_enabled: true, start_time: '09:00:00+00', end_time: '17:00:00+00' },
      { day_of_week: 'Friday', is_enabled: true, start_time: '09:00:00+00', end_time: '17:00:00+00' }
    ];

    const scheduleToUse = weeklySchedule.length > 0 ? weeklySchedule : defaultWeeklySchedule;
    const enabledDays = scheduleToUse
      .filter(day => day.is_enabled)
      .map(day => day.day_of_week);

    const startDate = new Date();
    let endDate;
    if (effectiveCalendarSettings.max_advance_unit === 'hours') {
      endDate = addHours(startDate, effectiveCalendarSettings.max_advance_amount);
    } else if (effectiveCalendarSettings.max_advance_unit === 'days') {
      endDate = addDays(startDate, effectiveCalendarSettings.max_advance_amount);
    } else if (effectiveCalendarSettings.max_advance_unit === 'weeks') {
      endDate = addWeeks(startDate, effectiveCalendarSettings.max_advance_amount);
    } else { // months
      endDate = addMonths(startDate, effectiveCalendarSettings.max_advance_amount);
    }

    const dates: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayName = format(current, 'EEEE');
      if (enabledDays.includes(dayName)) {
        // Check minimum notice requirement
        let minNoticeHours;
        if (effectiveCalendarSettings.min_notice_unit === 'minutes') {
          minNoticeHours = effectiveCalendarSettings.min_notice_amount / 60;
        } else if (effectiveCalendarSettings.min_notice_unit === 'hours') {
          minNoticeHours = effectiveCalendarSettings.min_notice_amount;
        } else { // days
          minNoticeHours = effectiveCalendarSettings.min_notice_amount * 24;
        }
        
        const minNoticeDate = addHours(new Date(), minNoticeHours);
        
        if (current >= minNoticeDate) {
          dates.push(new Date(current));
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [effectiveCalendarSettings, weeklySchedule]);

  // Calculate available time slots for selected date
  const availableTimeSlots = useMemo(() => {
    try {
      if (!selectedDate || !effectiveCalendarSettings) return [];

      // If no weekly schedule provided, create a default one
      const defaultWeeklySchedule = [
        { day_of_week: 'Monday', is_enabled: true, start_time: '09:00:00+00', end_time: '17:00:00+00' },
        { day_of_week: 'Tuesday', is_enabled: true, start_time: '09:00:00+00', end_time: '17:00:00+00' },
        { day_of_week: 'Wednesday', is_enabled: true, start_time: '09:00:00+00', end_time: '17:00:00+00' },
        { day_of_week: 'Thursday', is_enabled: true, start_time: '09:00:00+00', end_time: '17:00:00+00' },
        { day_of_week: 'Friday', is_enabled: true, start_time: '09:00:00+00', end_time: '17:00:00+00' }
      ];

      const scheduleToUse = weeklySchedule.length > 0 ? weeklySchedule : defaultWeeklySchedule;
      const dayName = format(selectedDate, 'EEEE');
      const daySchedule = scheduleToUse.find(day => day.day_of_week === dayName);
      
      if (!daySchedule || !daySchedule.is_enabled) return [];

      const slots: Array<{ time: string; displayTime: string; isAvailable: boolean }> = [];

      if (timeSlots.length > 0) {
        // Use predefined time slots (always use time slots now)
        const dayTimeSlots = timeSlots.filter(slot => 
          slot.day_of_week === dayName && slot.is_enabled
        );

        dayTimeSlots.forEach(slot => {
          const slotTime = parseTime(slot.slot_time);
          const displayTime = format(slotTime, 'h:mm a');
          
          slots.push({
            time: slot.slot_time,
            displayTime,
            isAvailable: true
          });
        });
      } else {
        // Generate time slots based on time blocks
        const startTime = parseTime(daySchedule.start_time);
        const endTime = parseTime(daySchedule.end_time);
        
        let currentTime = new Date(startTime);
        const bufferMinutes = effectiveCalendarSettings.buffer_time_unit === 'minutes' 
          ? effectiveCalendarSettings.buffer_time_amount 
          : effectiveCalendarSettings.buffer_time_amount * 60;

        while (currentTime < endTime) {
          const displayTime = format(currentTime, 'h:mm a');
          const timeString = format(currentTime, 'HH:mm:ss') + '+00:00';
          
          slots.push({
            time: timeString,
            displayTime,
            isAvailable: true
          });

          // Add buffer time between slots
          currentTime = addMinutes(currentTime, selectedDuration + bufferMinutes);
        }
      }

      return slots;
    } catch (error) {
      console.error('Error calculating available time slots:', error);
      return [];
    }
  }, [selectedDate, effectiveCalendarSettings, weeklySchedule, timeSlots, selectedDuration]);


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

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };



  const handleSubmit = async () => {
    if (!service || !selectedDate || !selectedTime || !effectiveCalendarSettings) {
      return;
    }

    setIsSubmitting(true);
    setShowProgress(true);
    
    try {
      const bookingData: BookingScheduleData = {
        serviceId: service.id,
        selectedDate,
        selectedTime,
        sessionDuration: selectedDuration
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
    onClose();
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => isSameDay(availableDate, date));
  };

  const isDateSelected = (date: Date) => {
    return selectedDate ? isSameDay(selectedDate, date) : false;
  };

  const canProceed = selectedDate && selectedTime && selectedDuration;

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
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
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

              {selectedDate && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mt: 2, 
                    borderRadius: 2,
                    backgroundColor: `${service.color}10`,
                    border: `1px solid ${service.color}30`,
                    '& .MuiAlert-icon': {
                      color: service.color
                    }
                  }}
                >
                  Selected: {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                </Alert>
              )}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
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

              {!selectedDate ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Please select a date to view available times
                </Alert>
              ) : availableTimeSlots.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  No available times for the selected date
                </Alert>
              ) : (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                  gap: 1 
                }}>
                  {availableTimeSlots.map((slot, index) => (
                    <Box
                      key={index}
                      onClick={() => handleTimeSelect(slot.time)}
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

              {selectedTime && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mt: 2, 
                    borderRadius: 2,
                    backgroundColor: `${service.color}10`,
                    border: `1px solid ${service.color}30`,
                    '& .MuiAlert-icon': {
                      color: service.color
                    }
                  }}
                >
                  Selected: {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: `${service.color}20` }} />

      <DialogActions sx={{ p: 3, pt: 2, gap: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2, 
            fontWeight: 600,
            px: 3,
            py: 1,
            fontSize: '0.875rem',
            color: 'error.main',
            borderColor: 'error.main',
            minWidth: 100,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'white',
              borderColor: 'error.main',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
            }
          }}
        >
          Cancel
        </Button>
        
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
