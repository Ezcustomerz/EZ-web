import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
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
  Tooltip,
  Card,
  CardContent,
  Paper,
  Chip,
  Alert,
  TextField
} from '@mui/material';
import { 
  Close, 
  BookOnline,
  CheckCircle,
  Schedule,
  Payment,
  CalendarToday,
  AccountBalanceWallet,
  ArrowForward,
  ArrowBack,
  Info,
  Note
} from '@mui/icons-material';
import { convertUTCToLocalTime, getUserTimezone } from '../../../utils/timezoneUtils';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingSchedulePopover, type BookingScheduleData } from './BookingSchedulePopover';
import { successToast, errorToast } from '../../toast/toast';
import { bookingService } from '../../../api/bookingService';
// Inlined components: ScheduleSessionStep and PaymentStep
 

export interface PaymentStepProps {
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
  };
  schedulingData: BookingScheduleData | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack?: () => void;
}

export function PaymentStep({
  service,
  schedulingData: _schedulingData,
  isSubmitting,
  onSubmit,
  onBack
}: PaymentStepProps) {
  const getPaymentOptionLabel = (option: 'upfront' | 'split' | 'later', price: number) => {
    if (price === 0) {
      return 'Free Service';
    }
    switch (option) {
      case 'upfront':
        return 'Payment Upfront';
      case 'split':
        return 'Split Payment';
      case 'later':
        return 'Payment Later';
      default:
        return 'Payment Upfront';
    }
  };

  const getPaymentOptionDescription = (option: 'upfront' | 'split' | 'later', price: number) => {
    if (price === 0) {
      return 'This is a complimentary service';
    }
    switch (option) {
      case 'upfront':
        return 'Full payment required before service begins';
      case 'split':
        return '50% deposit required to secure booking, remaining 50% due after completion';
      case 'later':
        return 'Payment due after service completion';
      default:
        return 'Full payment required before service begins';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const paymentBreakdown = {
    isFree: service?.price === 0,
    totalAmount: service?.price || 0,
    amountPaid: 0,
    amountRemaining: service?.price || 0,
  };

  return (
    <Fade in={true} timeout={300}>
      <Card sx={{ 
        border: `2px solid ${service.color}20`, 
        borderRadius: 3,
        boxShadow: `0 8px 24px ${service.color}15`,
        transition: 'all 0.3s ease',
        
      }}>
        <CardContent sx={{ p: 3 }}>
          <Paper sx={{ 
            p: 2, 
            bgcolor: `${service.color}08`,
            border: `1px solid ${service.color}20`,
            borderRadius: 2,
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <AccountBalanceWallet sx={{ 
                fontSize: 24, 
                color: service.color, 
                mt: 0.25,
                flexShrink: 0
              }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 600, 
                  display: 'block', 
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.75rem'
                }}>
                  Payment Option
                </Typography>
                <Chip
                  label={getPaymentOptionLabel(service.payment_option || 'upfront', service.price)}
                  size="small"
                  sx={{
                    bgcolor: `${service.color}20`,
                    color: service.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    mb: 1,
                    height: 28,
                    '& .MuiChip-label': {
                      px: 1.5
                    }
                  }}
                />
                <Typography variant="body2" sx={{ 
                  color: 'text.secondary', 
                  fontSize: '0.875rem',
                  lineHeight: 1.5
                }}>
                  {getPaymentOptionDescription(service.payment_option || 'upfront', service.price)}
                </Typography>
                {(service.payment_option === 'split' || service.payment_option === 'upfront') && (
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary', 
                    display: 'block', 
                    mt: 1 
                  }}>
                    Payment is only captured once the creative approves your booking.
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {!paymentBreakdown.isFree && (
            <Box 
              sx={{ 
                p: 2,
                borderRadius: 2,
                bgcolor: `${service.color}10`,
                border: `1px solid ${service.color}30`,
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccountBalanceWallet sx={{ fontSize: 20, color: service.color }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Payment Status
                </Typography>
              </Box>

              {service.payment_option === 'split' ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Deposit Required
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        50% deposit required to secure booking
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: service.color }}>
                      {formatCurrency(paymentBreakdown.totalAmount * 0.5)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Remaining Balance
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Due after service completion
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {formatCurrency(paymentBreakdown.totalAmount * 0.5)}
                    </Typography>
                  </Box>
                </>
              ) : service.payment_option === 'upfront' ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Full Payment Required
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Complete payment needed before service can begin
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: service.color }}>
                    {formatCurrency(paymentBreakdown.amountRemaining)}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Payment Due After Completion
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Service can begin without upfront payment
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: service.color }}>
                    {formatCurrency(paymentBreakdown.amountRemaining)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mt: 3, 
            gap: 1.5 
          }}>
            {onBack && (
              <Button
                onClick={onBack}
                variant="outlined"
                startIcon={<ArrowBack />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  fontSize: '0.875rem',
                  borderColor: service.color,
                  color: service.color,
                  '&:hover': {
                    borderColor: service.color,
                    backgroundColor: `${service.color}10`,
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Back
              </Button>
            )}
            <Button
              onClick={onSubmit}
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
              {isSubmitting ? 'Processing...' : 'Confirm Service'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}

export interface ScheduleSessionStepProps {
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
  };
  activeStep: number;
  stepTransition: boolean;
  onScheduleClick: () => void;
}

export function ScheduleSessionStep({
  service,
  activeStep,
  stepTransition,
  onScheduleClick
}: ScheduleSessionStepProps) {
  return (
    <Fade in={stepTransition} timeout={300}>
      <Card sx={{ 
        border: '2px solid',
        borderColor: activeStep === 0 ? service.color : 'divider',
        borderRadius: 3,
        mt: 2,
        transition: 'all 0.3s ease',
        boxShadow: activeStep === 0 
          ? `0 8px 24px ${service.color}20` 
          : '0 4px 12px rgba(0,0,0,0.1)',
        
      }}>
        <CardContent sx={{ p: 3 }}>
          <Paper sx={{ 
            p: 2, 
            bgcolor: `${service.color}08`,
            border: `1px solid ${service.color}20`,
            borderRadius: 2,
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Info sx={{ 
                color: service.color, 
                fontSize: 20, 
                mt: 0.25,
                flexShrink: 0
              }} />
              <Box>
                <Typography variant="body1" sx={{ 
                  color: 'text.primary',
                  fontWeight: 600,
                  mb: 1
                }}>
                  Booking Required
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'text.secondary',
                  lineHeight: 1.6
                }}>
                  This service requires advance scheduling
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              onClick={onScheduleClick}
              variant="contained"
              endIcon={<ArrowForward />}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.875rem',
                background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
                boxShadow: `0 4px 12px ${service.color}30`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: `linear-gradient(135deg, ${service.color}CC 0%, ${service.color} 100%)`,
                  boxShadow: `0 6px 16px ${service.color}40`,
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Schedule Session
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}

export interface ScheduleConfirmationStepProps {
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
  };
  schedulingData: BookingScheduleData | null;
  onNext: () => void;
  isConfirmed?: boolean;
}

export interface AdditionalNotesStepProps {
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
  };
  notes: string;
  onNotesChange: (notes: string) => void;
  onNext: () => void;
  activeStep: number;
  stepTransition: boolean;
}

export function AdditionalNotesStep({
  service,
  notes,
  onNotesChange,
  onNext,
  activeStep,
  stepTransition
}: AdditionalNotesStepProps) {
  return (
    <Fade in={stepTransition} timeout={300}>
      <Card sx={{ 
        border: `2px solid ${activeStep === 2 ? service.color : service.color}20`, 
        borderRadius: 3,
        boxShadow: activeStep === 2 
          ? `0 8px 24px ${service.color}20` 
          : `0 4px 12px ${service.color}15`,
        transition: 'all 0.3s ease'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Paper sx={{ 
            p: 2, 
            bgcolor: `${service.color}08`,
            border: `1px solid ${service.color}20`,
            borderRadius: 2,
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Info sx={{ 
                color: service.color, 
                fontSize: 20, 
                mt: 0.25,
                flexShrink: 0
              }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ 
                  color: 'text.secondary',
                  lineHeight: 1.6,
                  fontSize: '0.875rem'
                }}>
                  Let the creative know about any specific requirements, preferences, or details that might be helpful for your session.
                </Typography>
              </Box>
            </Box>
          </Paper>

          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="e.g., I'd like to focus on branding, preferred color scheme, special accessibility needs, etc."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: service.color,
                },
                '&.Mui-focused fieldset': {
                  borderColor: service.color,
                },
              }
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button
              onClick={onNext}
              variant="contained"
              endIcon={<ArrowForward />}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.875rem',
                background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
                boxShadow: `0 4px 12px ${service.color}30`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: `linear-gradient(135deg, ${service.color}CC 0%, ${service.color} 100%)`,
                  boxShadow: `0 6px 16px ${service.color}40`,
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Continue
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}

export function ScheduleConfirmationStep({
  service,
  schedulingData,
  onNext,
  isConfirmed = false
}: ScheduleConfirmationStepProps) {
  const parseUtcTimeToLocalDate = (timeStr: string): Date => {
    try {
      // Convert from UTC HH:MM[:SS][+offset] to local HH:MM using utils
      const [timePart] = timeStr.split('+');
      const [h, m] = timePart.split(':');
      const localHHMM = convertUTCToLocalTime(`${h}:${m}`, getUserTimezone());
      const [localH, localM] = localHHMM.split(':').map(Number);
      const d = new Date();
      d.setHours(localH, localM, 0, 0);
      return d;
    } catch {
      return new Date('2000-01-01T00:00:00');
    }
  };

  const formatTimeRange = (timeStr?: string | null, durationMin?: number): string | null => {
    if (!timeStr || !durationMin) return null;
    const start = parseUtcTimeToLocalDate(timeStr);
    const end = new Date(start.getTime() + durationMin * 60000);
    const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    return `${start.toLocaleTimeString(undefined, opts)} - ${end.toLocaleTimeString(undefined, opts)}`;
  };
  return (
    <Fade in={true} timeout={300}>
      <Card sx={{ 
        border: `2px solid ${service.color}20`, 
        borderRadius: 3,
        boxShadow: `0 8px 24px ${service.color}15`,
        transition: 'all 0.3s ease'
      }}>
        <CardContent sx={{ p: 3 }}>
          {schedulingData ? (
            <Paper sx={{ 
              p: 2, 
              bgcolor: `${service.color}08`,
              border: `1px solid ${service.color}20`,
              borderRadius: 2,
              mb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <CheckCircle sx={{ 
                  color: service.color, 
                  fontSize: 24, 
                  mt: 0.25,
                  flexShrink: 0
                }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ 
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 1
                  }}>
                    Session Scheduled
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    mb: 2
                  }}>
                    Date: {schedulingData.selectedDate ? schedulingData.selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Not selected'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    mb: 2
                  }}>
                    Time: {formatTimeRange(schedulingData.selectedTime, schedulingData.sessionDuration) || 'Not selected'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.6
                  }}>
                    Duration: {schedulingData.sessionDuration} minutes
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
              Please schedule your session to continue
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
            <Button
              onClick={onNext}
              variant="contained"
              disabled={isConfirmed || !schedulingData}
              endIcon={<CheckCircle />}
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
              {isConfirmed ? 'Confirmed' : 'Confirm Session'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}

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
  onConfirmBooking?: (bookingData: BookingData) => void;
}

export interface BookingData {
  serviceId: string;
  selectedDate?: Date;
  selectedTime?: string;
  sessionDuration?: number;
  timeSlotId?: string;
  additionalNotes?: string;
}

export function BookingServicePopover({ 
  open, 
  onClose, 
  service,
  calendarSettings,
  onConfirmBooking
}: BookingServicePopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [stepTransition, setStepTransition] = useState(true);
  // removed footer progress UI
  const [showSchedulePopover, setShowSchedulePopover] = useState(false);
  const [schedulingData, setSchedulingData] = useState<BookingScheduleData | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Refs for auto-scrolling to steps
  const contentRef = useRef<HTMLDivElement | null>(null);
  const step0Ref = useRef<HTMLDivElement | null>(null);
  const step1Ref = useRef<HTMLDivElement | null>(null);
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const step3Ref = useRef<HTMLDivElement | null>(null);

  const scrollToStep = (index: number) => {
    const container = contentRef.current;
    const refs = [step0Ref.current, step1Ref.current, step2Ref.current, step3Ref.current];
    const stepEl = refs[index] as HTMLElement | null;
    if (!container || !stepEl) return;
    const labelEl = (stepEl.querySelector('.MuiStepLabel-root') as HTMLElement) || stepEl;
    const containerRect = container.getBoundingClientRect();
    const targetRect = labelEl.getBoundingClientRect();
    const currentScrollTop = container.scrollTop;
    const offsetWithinContainer = targetRect.top - containerRect.top;
    const topMargin = 8;
    const nextScrollTop = currentScrollTop + offsetWithinContainer - topMargin;
    container.scrollTo({ top: Math.max(nextScrollTop, 0), behavior: 'smooth' });
  };

  // Determine if booking is required
  const isBookingRequired = service?.requires_booking || false;
  
  // Progress calculation - 4 steps if booking required (schedule, confirm, notes, payment), 2 steps if not (notes, payment)
  const maxStep = isBookingRequired ? 3 : 1;
  const clampedStep = Math.max(0, Math.min(activeStep, maxStep));
  const progress = isBookingRequired ? ((clampedStep + 1) / 4) * 100 : ((clampedStep + 1) / 2) * 100;

  // Step navigation functions with smooth transitions
  const handleNext = () => {
    setStepTransition(false);
    setTimeout(() => {
      setActiveStep((prevActiveStep) => Math.min(prevActiveStep + 1, maxStep));
      setStepTransition(true);
    }, 150);
  };

  const handleBack = () => {
    setStepTransition(false);
    setTimeout(() => {
      setActiveStep((prevActiveStep) => Math.max(prevActiveStep - 1, 0));
      setStepTransition(true);
    }, 150);
  };

  // Scroll to the active step smoothly inside dialog content
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    
    // Map activeStep to the correct ref based on booking requirement
    const refs = isBookingRequired 
      ? [step0Ref.current, step1Ref.current, step2Ref.current, step3Ref.current]
      : [step2Ref.current, step3Ref.current]; // For non-booking, only use Notes and Payment refs
    
    const stepEl = refs[activeStep] as HTMLElement | null;
    if (!stepEl) return;

    // Wait for the StepContent expand animation to finish before measuring
    const timeoutId = window.setTimeout(() => {
      const maxStep = isBookingRequired ? 3 : 1;
      // For the final step, just scroll to the bottom to ensure the whole section is visible
      if (activeStep === maxStep) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        return;
      }
      const labelEl = (stepEl.querySelector('.MuiStepLabel-root') as HTMLElement) || stepEl;
      const containerRect = container.getBoundingClientRect();
      const targetRect = labelEl.getBoundingClientRect();
      const currentScrollTop = container.scrollTop;
      const offsetWithinContainer = targetRect.top - containerRect.top;
      const topMargin = 8;
      const nextScrollTop = currentScrollTop + offsetWithinContainer - topMargin;
      container.scrollTo({ top: Math.max(nextScrollTop, 0), behavior: 'smooth' });
    }, 250); // align with StepContent transition duration

    return () => window.clearTimeout(timeoutId);
  }, [activeStep, isBookingRequired]);

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
    // Move to Confirm Schedule (step index 1) without exceeding bounds
    setStepTransition(false);
    setTimeout(() => {
      setActiveStep(1);
      setStepTransition(true);
      // ensure view scrolls to step 2 header after closing the popover
      setTimeout(() => scrollToStep(1), 200);
    }, 150);
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

    // Final submission (for both booking and non-booking flows)
    setIsSubmitting(true);
    
    try {
      // Prepare booking request data
      let bookingDate: string | undefined;
      let startTime: string | undefined;
      let endTime: string | undefined;
      let sessionDuration: number | undefined;
      // booking_availability_id is no longer used - removed

      // Add scheduling data if booking was required and scheduled
      if (isBookingRequired && schedulingData?.selectedDate && schedulingData?.selectedTime) {
        // Parse the selected time (format: "HH:MM:SS+offset" in UTC)
        const timeMatch = schedulingData.selectedTime.match(/^(\d{2}):(\d{2})/);
        if (timeMatch) {
          const [, hours, minutes] = timeMatch;
          
          // Create start and end time strings in UTC format
          startTime = `${hours}:${minutes}:00+00`;
          
          // Calculate end time based on session duration
          const durationMinutes = schedulingData.sessionDuration || 60;
          const totalEndMinutes = parseInt(hours) * 60 + parseInt(minutes) + durationMinutes;
          const endHours = Math.floor(totalEndMinutes / 60);
          const endMinutes = totalEndMinutes % 60;
          endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00+00`;
          
          bookingDate = schedulingData.selectedDate.toISOString().split('T')[0];
          sessionDuration = durationMinutes;
        }
      }

      // Call backend API to create booking
      const response = await bookingService.createBooking({
        service_id: service.id,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        session_duration: sessionDuration,
        notes: additionalNotes.trim() || undefined
      });

      if (!response.success) {
        console.error('Failed to create booking:', response.message);
        errorToast('Booking Failed', response.message || 'Failed to create booking. Please try again.');
        return;
      }

      console.log('Booking created successfully:', response.booking);
      
      // Show success toast
      successToast(
        'Service Booked Successfully!', 
        isBookingRequired 
          ? 'Your booking request has been sent to the creative for approval.'
          : 'Your order has been placed and is awaiting creative approval.'
      );

      const bookingData: BookingData = {
        serviceId: service.id,
        selectedDate: schedulingData?.selectedDate,
        selectedTime: schedulingData?.selectedTime,
        sessionDuration: schedulingData?.sessionDuration,
        timeSlotId: schedulingData?.timeSlotId,
        additionalNotes: additionalNotes.trim() || undefined
      };

      if (onConfirmBooking) {
        await onConfirmBooking(bookingData);
      }
      
      // Add a small delay for better UX and reset state properly
      setTimeout(() => {
        handleClose();
        // Navigate to orders page after closing the popover
        navigate('/client/orders');
      }, 500);
    } catch (error: any) {
      console.error('Failed to submit booking:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred. Please try again.';
      errorToast('Unexpected Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset booking flow state when closing the popover
    setSchedulingData(null);
    setActiveStep(0);
    setIsSubmitting(false);
    setShowSchedulePopover(false);
    setAdditionalNotes('');
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
                transition: 'transform 0.2s ease-in-out'
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
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Progress
            </Typography>
            <Typography variant="caption" sx={{ color: service.color, fontWeight: 600 }}>
              {clampedStep + 1} of {isBookingRequired ? 4 : 2}
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
      </DialogTitle>

      <DialogContent ref={contentRef} sx={{ p: 3, pt: 2}}>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 1 }}>
          {isBookingRequired && (
            <>
              {/* Step 1: Booking Required */}
              <Step expanded={activeStep >= 0} ref={step0Ref}>
                <StepLabel
                  StepIconComponent={({ active, completed }) => {
                    const isActive = active || activeStep === 0;
                    const isCompleted = completed || activeStep > 0;
                    return (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isCompleted || isActive ? service.color : 'grey.200',
                          color: isCompleted || isActive ? 'white' : 'grey.500',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          transition: 'all 0.3s ease-in-out',
                          boxShadow: isActive || isCompleted 
                            ? `0 3px 8px ${service.color}30` 
                            : '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        {isCompleted ? <CheckCircle sx={{ fontSize: 20 }} /> : <Schedule sx={{ fontSize: 20 }} />}
                      </Box>
                    );
                  }}
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
                <StepContent ref={step0Ref}>
                  <ScheduleSessionStep
                    service={service}
                    activeStep={activeStep}
                    stepTransition={stepTransition}
                    onScheduleClick={handleOpenSchedule}
                  />
                </StepContent>
              </Step>

              {/* Step 2: Schedule Confirmation */}
              <Step expanded={activeStep >= 1} ref={step1Ref}>
                <StepLabel
                  StepIconComponent={() => {
                    const isActive = activeStep === 1;
                    const isCompleted = activeStep > 1;
                    return (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isCompleted || isActive ? service.color : 'grey.200',
                          color: isCompleted || isActive ? 'white' : 'grey.500',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          transition: 'all 0.3s ease-in-out',
                          boxShadow: isActive || isCompleted 
                            ? `0 3px 8px ${service.color}30` 
                            : '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        {isCompleted ? <CheckCircle sx={{ fontSize: 20 }} /> : <CalendarToday sx={{ fontSize: 20 }} />}
                      </Box>
                    );
                  }}
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
                <StepContent ref={step1Ref} sx={{ mt: 2 }}>
                  <ScheduleConfirmationStep
                    service={service}
                    schedulingData={schedulingData}
                    onNext={handleNext}
                    isConfirmed={activeStep >= 2}
                  />
                </StepContent>
              </Step>
            </>
          )}

          {/* Step 3: Additional Notes (Optional) */}
          <Step expanded={activeStep >= (isBookingRequired ? 2 : 0)} ref={step2Ref}>
            <StepLabel
              StepIconComponent={() => {
                const stepIndex = isBookingRequired ? 2 : 0;
                const isActive = activeStep === stepIndex;
                const isCompleted = isBookingRequired ? activeStep > 2 : activeStep > 0;
                return (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: isCompleted || isActive ? service.color : 'grey.200',
                      color: isCompleted || isActive ? 'white' : 'grey.500',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease-in-out',
                      boxShadow: isActive || isCompleted 
                        ? `0 3px 8px ${service.color}30` 
                        : '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {isCompleted ? <CheckCircle sx={{ fontSize: 20 }} /> : <Note sx={{ fontSize: 20 }} />}
                  </Box>
                );
              }}
              sx={{
                '& .MuiStepLabel-label': {
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: (isBookingRequired ? activeStep >= 2 : activeStep >= 0) ? service.color : 'text.secondary'
                }
              }}
            >
              Additional Notes (Optional)
            </StepLabel>
            <StepContent ref={step2Ref} sx={{ mt: 2 }}>
              <AdditionalNotesStep
                service={service}
                notes={additionalNotes}
                onNotesChange={setAdditionalNotes}
                onNext={handleNext}
                activeStep={isBookingRequired ? activeStep : activeStep + 2}
                stepTransition={stepTransition}
              />
            </StepContent>
          </Step>

          {/* Step 4: Confirm Booking & Payment */}
          <Step expanded={activeStep >= (isBookingRequired ? 3 : 1)} ref={step3Ref}>
            <StepLabel
              StepIconComponent={() => {
                const stepIndex = isBookingRequired ? 3 : 1;
                const isActive = activeStep === stepIndex;
                const isCompleted = false; // This is the final step, never completed until submission
                return (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: isCompleted || isActive ? service.color : 'grey.200',
                      color: isCompleted || isActive ? 'white' : 'grey.500',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease-in-out',
                      boxShadow: isActive || isCompleted 
                        ? `0 3px 8px ${service.color}30` 
                        : '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {isCompleted ? <CheckCircle sx={{ fontSize: 20 }} /> : <Payment sx={{ fontSize: 20 }} />}
                  </Box>
                );
              }}
              sx={{
                '& .MuiStepLabel-label': {
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: (isBookingRequired ? activeStep >= 3 : activeStep >= 1) ? service.color : 'text.secondary'
                }
              }}
            >
              Confirm Booking & Payment
            </StepLabel>
            <StepContent ref={step3Ref} sx={{ mt: 2 }}>
              <PaymentStep
                service={service}
                schedulingData={schedulingData}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onBack={handleBack}
              />
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>

      

      {/* Scheduling Popover */}
      <BookingSchedulePopover
        open={showSchedulePopover}
        onClose={handleCloseSchedule}
        service={service}
        onConfirmBooking={handleScheduleConfirm}
        initialSelectedDate={schedulingData?.selectedDate || null}
        initialSelectedTime={schedulingData?.selectedTime || null}
        initialDuration={schedulingData?.sessionDuration || null}
      />
    </Dialog>
  );
}
