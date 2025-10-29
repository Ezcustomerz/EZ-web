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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fade,
  Slide,
  Avatar,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { 
  Close, 
  BookOnline,
  CheckCircle,
  Schedule,
  Payment,
  CalendarToday
} from '@mui/icons-material';
import { useState } from 'react';
import { BookingSchedulePopover, type BookingScheduleData } from './BookingSchedulePopover';
import { ScheduleSessionStep } from './ScheduleSessionStep';
import { ScheduleConfirmationStep } from './ScheduleConfirmationStep';
import { PaymentStep } from './PaymentStep';

export interface BookingServicePopoverProps {
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
  weeklySchedule?: Array<{
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
  onConfirmBooking?: (bookingData: BookingData) => void;
}

export interface BookingData {
  serviceId: string;
  selectedDate?: Date;
  selectedTime?: string;
  sessionDuration?: number;
  timeSlotId?: string;
}

export function BookingServicePopover({ 
  open, 
  onClose, 
  service,
  calendarSettings,
  weeklySchedule = [],
  timeSlots = [],
  onConfirmBooking
}: BookingServicePopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [stepTransition, setStepTransition] = useState(true);
  const [showProgress, setShowProgress] = useState(false);
  const [showSchedulePopover, setShowSchedulePopover] = useState(false);
  const [schedulingData, setSchedulingData] = useState<BookingScheduleData | null>(null);

  // Determine if booking is required
  const isBookingRequired = service?.requires_booking || false;
  
  // Progress calculation - 3 steps if booking required (schedule, confirm, payment)
  const progress = isBookingRequired ? ((activeStep + 1) / 3) * 100 : 100;

  // Step navigation functions with smooth transitions
  const handleNext = () => {
    setStepTransition(false);
    setTimeout(() => {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setStepTransition(true);
    }, 150);
  };

  const handleBack = () => {
    setStepTransition(false);
    setTimeout(() => {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
      setStepTransition(true);
    }, 150);
  };

  // Handle scheduling popover
  const handleOpenSchedule = () => {
    setShowSchedulePopover(true);
  };

  const handleCloseSchedule = () => {
    setShowSchedulePopover(false);

  };

  const handleScheduleConfirm = (data: BookingScheduleData) => {
    setSchedulingData(data);
    setShowSchedulePopover(false);
    handleNext(); // Move to next step after scheduling
  };

  // Debug logging to help troubleshoot
  console.log('BookingServicePopover Debug:', {
    service: service,
    requires_booking: service?.requires_booking,
    isBookingRequired: isBookingRequired,
    activeStep: activeStep,
    showSchedulePopover: showSchedulePopover,
    calendarSettings: calendarSettings
  });


  const handleSubmit = async () => {
    if (!service) {
      return;
    }

    // If booking is required and we're on step 0, open schedule popover
    if (isBookingRequired && activeStep === 0) {
      handleOpenSchedule();
      return;
    }

    // Final submission
    setIsSubmitting(true);
    setShowProgress(true);
    
    try {
      const bookingData: BookingData = {
        serviceId: service.id,
        selectedDate: schedulingData?.selectedDate,
        selectedTime: schedulingData?.selectedTime,
        sessionDuration: schedulingData?.sessionDuration,
        timeSlotId: schedulingData?.timeSlotId
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

  if (!service) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
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
            background: `linear-gradient(90deg, ${service?.color || '#1976d2'} 0%, ${service?.color || '#1976d2'}CC 100%)`,
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
              <BookOnline sx={{ color: 'white', fontSize: 24 }} />
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
                Book Service
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
        
        {/* Progress indicator */}
        {isBookingRequired && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Progress
              </Typography>
              <Typography variant="caption" sx={{ color: service.color, fontWeight: 600 }}>
                {activeStep + 1} of 3
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: `${service.color}20`,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${service.color} 0%, ${service.color}CC 100%)`,
                }
              }}
            />
          </Box>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2}}>
        {isBookingRequired ? (
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 1 }}>
            {/* Step 1: Booking Required */}
            <Step expanded={activeStep >= 0}>
              <StepLabel
                StepIconComponent={({ active, completed }) => (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: completed 
                        ? service.color 
                        : active 
                          ? `${service.color}20` 
                          : 'grey.200',
                      color: completed || active ? 'white' : 'grey.500',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease-in-out',
                      boxShadow: active || completed 
                        ? `0 3px 8px ${service.color}30` 
                        : '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      }
                    }}
                  >
                    {completed ? <CheckCircle sx={{ fontSize: 20 }} /> : <Schedule sx={{ fontSize: 20 }} />}
                  </Box>
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: activeStep >= 0 ? service.color : 'text.secondary'
                  }
                }}
              >
                Schedule Your Session
              </StepLabel>
              <StepContent>
                <ScheduleSessionStep
                  service={service}
                  activeStep={activeStep}
                  stepTransition={stepTransition}
                  onScheduleClick={handleOpenSchedule}
                />
              </StepContent>
            </Step>

            {/* Step 2: Schedule Confirmation */}
            <Step expanded={activeStep >= 1}>
              <StepLabel
                StepIconComponent={({ active, completed }) => (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: completed 
                        ? service.color 
                        : active 
                          ? `${service.color}20` 
                          : 'grey.200',
                      color: completed || active ? 'white' : 'grey.500',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease-in-out',
                      boxShadow: active || completed 
                        ? `0 3px 8px ${service.color}30` 
                        : '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      }
                    }}
                  >
                    {completed ? <CheckCircle sx={{ fontSize: 20 }} /> : <CalendarToday sx={{ fontSize: 20 }} />}
                  </Box>
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: activeStep >= 1 ? service.color : 'text.secondary'
                  }
                }}
              >
                Confirm Schedule
              </StepLabel>
              <StepContent sx={{ mt: 2 }}>
                <ScheduleConfirmationStep
                  service={service}
                  schedulingData={schedulingData}
                  onBack={handleBack}
                  onNext={handleNext}
                />
              </StepContent>
            </Step>

            {/* Step 3: Confirm Booking & Payment */}
            <Step expanded={activeStep >= 2}>
              <StepLabel
                StepIconComponent={({ active, completed }) => (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: completed 
                        ? service.color 
                        : active 
                          ? `${service.color}20` 
                          : 'grey.200',
                      color: completed || active ? 'white' : 'grey.500',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease-in-out',
                      boxShadow: active || completed 
                        ? `0 3px 8px ${service.color}30` 
                        : '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      }
                    }}
                  >
                    {completed ? <CheckCircle sx={{ fontSize: 20 }} /> : <Payment sx={{ fontSize: 20 }} />}
                  </Box>
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: activeStep >= 1 ? service.color : 'text.secondary'
                  }
                }}
              >
                Confirm Booking & Payment
              </StepLabel>
              <StepContent sx={{ mt: 2 }}>
                <PaymentStep
                  service={service}
                  schedulingData={schedulingData}
                  isSubmitting={isSubmitting}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                />
              </StepContent>
            </Step>
          </Stepper>
        ) : (
          /* Single step for services that don't require booking */
          <Fade in={true} timeout={500}>
            <PaymentStep
              service={service}
              schedulingData={null}
              isSubmitting={isSubmitting}
              onBack={undefined} // No back button for single step
              onSubmit={handleSubmit}
            />
          </Fade>
        )}
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
        
        {!isBookingRequired && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
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
        )}
        
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

      {/* Scheduling Popover */}
      <BookingSchedulePopover
        open={showSchedulePopover}
        onClose={handleCloseSchedule}
        service={service}
        calendarSettings={calendarSettings || null}
        weeklySchedule={weeklySchedule}
        timeSlots={timeSlots}
        onConfirmBooking={handleScheduleConfirm}
      />
    </Dialog>
  );
}
