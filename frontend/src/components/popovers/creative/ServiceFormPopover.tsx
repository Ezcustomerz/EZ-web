import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton, 
  Button, 
  Box, 
  useTheme, 
  useMediaQuery, 
  Slide,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  InputAdornment,
  Checkbox,
  FormGroup,
  Tooltip,
  Radio,
  RadioGroup
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic, faPalette } from '@fortawesome/free-solid-svg-icons';
import { userService, type CreateServiceRequest } from '../../../api/userService';
import { successToast, errorToast } from '../../toast/toast';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface ServiceFormPopoverProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSubmit: (formData: ServiceFormData) => void;
  mode?: 'create' | 'edit';
  initialService?: {
    id: string;
    title: string;
    description: string;
    price: number;
    delivery_time: string;
    status: 'Public' | 'Private';
    color: string;
  } | null;
}

export interface ServiceFormData {
  title: string;
  description: string;
  price: string;
  deliveryTime: string;
  status: 'Public' | 'Private';
  color: string;
}

interface DeliveryTimeState {
  minTime: string;
  maxTime: string;
  unit: string;
}

const presetColors = [
  '#667eea', '#f093fb', '#4ecdc4', '#45b7d1', 
  '#96ceb4', '#feca57', '#ff6b6b', '#a55eea',
  '#6c5ce7', '#fd79a8', '#00b894', '#0984e3',
  '#00cec9', '#fdcb6e', '#e84393', '#2d3436'
];

const timeUnits = [
  { value: 'day', label: 'Day(s)', singular: 'day', plural: 'days' },
  { value: 'week', label: 'Week(s)', singular: 'week', plural: 'weeks' },
  { value: 'month', label: 'Month(s)', singular: 'month', plural: 'months' }
];

export function ServiceFormPopover({ 
  open, 
  onClose, 
  onBack,
  onSubmit,
  mode = 'create',
  initialService = null,
}: ServiceFormPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    description: '',
    price: '',
    deliveryTime: '3-5 days',
    status: 'Public',
    color: '#667eea'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deliveryTime, setDeliveryTime] = useState<DeliveryTimeState>({
    minTime: '3',
    maxTime: '5',
    unit: 'day'
  });

  // Calendar scheduling (UI-only)
  const [isSchedulingEnabled, setIsSchedulingEnabled] = useState(false);
  const sessionDurationOptions = ['15', '30', '45', '60', '90', '120']; // minutes
  const [sessionDurations, setSessionDurations] = useState<string[]>(['60']);
  const [defaultSessionLength, setDefaultSessionLength] = useState('60');
  const [useTimeSlots, setUseTimeSlots] = useState(false);
  const [minNotice, setMinNotice] = useState<{ amount: string; unit: 'hours' | 'days' }>({ amount: '24', unit: 'hours' });
  const [maxAdvance, setMaxAdvance] = useState<{ amount: string; unit: 'days' | 'weeks' | 'months' }>({ amount: '30', unit: 'days' });
  const [bufferTime, setBufferTime] = useState<{ amount: string; unit: 'minutes' | 'hours' }>({ amount: '15', unit: 'minutes' });
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [weeklySchedule, setWeeklySchedule] = useState<{ 
    day: string; 
    enabled: boolean; 
    timeBlocks: { start: string; end: string }[];
    timeSlots: { time: string; enabled: boolean }[];
  }[]>(
    daysOfWeek.map((day) => ({ 
      day, 
      enabled: false, 
      timeBlocks: [{ start: '09:00', end: '17:00' }],
      timeSlots: []
    }))
  );

  // Helper functions for managing time blocks
  const addTimeBlock = (dayIndex: number) => {
    setWeeklySchedule((prev) => prev.map((schedule, idx) => {
      if (idx === dayIndex) {
        return {
          ...schedule,
          timeBlocks: [...schedule.timeBlocks, { start: '09:00', end: '17:00' }]
        };
      }
      return schedule;
    }));
  };

  const removeTimeBlock = (dayIndex: number, blockIndex: number) => {
    setWeeklySchedule((prev) => prev.map((schedule, idx) => {
      if (idx === dayIndex && schedule.timeBlocks.length > 1) {
        return {
          ...schedule,
          timeBlocks: schedule.timeBlocks.filter((_, bIdx) => bIdx !== blockIndex)
        };
      }
      return schedule;
    }));
  };


  const toggleDay = (dayIndex: number, enabled: boolean) => {
    setWeeklySchedule((prev) => prev.map((schedule, idx) => {
      if (idx === dayIndex) {
        const newTimeSlots = enabled && useTimeSlots 
          ? generateTimeSlots(schedule.timeBlocks, parseInt(defaultSessionLength))
          : schedule.timeSlots;
        
        return { 
          ...schedule, 
          enabled,
          timeSlots: newTimeSlots
        };
      }
      return schedule;
    }));
  };

  // Validation function to check for overlapping time blocks
  const validateTimeBlocks = (timeBlocks: { start: string; end: string }[]) => {
    const sortedBlocks = [...timeBlocks].sort((a, b) => a.start.localeCompare(b.start));
    
    for (let i = 0; i < sortedBlocks.length - 1; i++) {
      const currentEnd = sortedBlocks[i].end;
      const nextStart = sortedBlocks[i + 1].start;
      
      if (currentEnd > nextStart) {
        return false; // Overlapping blocks found
      }
    }
    return true;
  };

  // Enhanced updateTimeBlock with validation
  const updateTimeBlockWithValidation = (dayIndex: number, blockIndex: number, field: 'start' | 'end', value: string) => {
    setWeeklySchedule((prev) => prev.map((schedule, idx) => {
      if (idx === dayIndex) {
        const newTimeBlocks = schedule.timeBlocks.map((block, bIdx) => {
          if (bIdx === blockIndex) {
            return { ...block, [field]: value };
          }
          return block;
        });
        
        // Generate time slots when time blocks change and we're in time slot mode
        const newTimeSlots = useTimeSlots ? generateTimeSlots(newTimeBlocks, parseInt(defaultSessionLength)) : schedule.timeSlots;
        
        return {
          ...schedule,
          timeBlocks: newTimeBlocks,
          timeSlots: newTimeSlots
        };
      }
      return schedule;
    }));
  };

  // Generate time slots based on time blocks, session duration, and buffer time
  const generateTimeSlots = (timeBlocks: { start: string; end: string }[], sessionDurationMinutes: number) => {
    const slots: { time: string; enabled: boolean }[] = [];
    
    // Calculate buffer time in minutes
    const bufferMinutes = bufferTime.unit === 'hours' 
      ? parseInt(bufferTime.amount) * 60 
      : parseInt(bufferTime.amount);
    
    // Total time needed per slot = session duration + buffer time
    const slotSpacing = sessionDurationMinutes + bufferMinutes;
    
    timeBlocks.forEach(block => {
      const startTime = new Date(`1970-01-01T${block.start}:00`);
      const endTime = new Date(`1970-01-01T${block.end}:00`);
      
      let currentTime = new Date(startTime);
      
      // Generate slots with buffer time spacing
      while (currentTime < endTime) {
        // Check if there's enough time for a full session (don't need buffer after last slot)
        const sessionEndTime = new Date(currentTime.getTime() + sessionDurationMinutes * 60000);
        
        if (sessionEndTime <= endTime) {
          const timeString = currentTime.toTimeString().slice(0, 5);
          slots.push({ time: timeString, enabled: true });
        }
        
        // Move to next slot position (session + buffer time)
        currentTime.setMinutes(currentTime.getMinutes() + slotSpacing);
      }
    });
    
    return slots.sort((a, b) => a.time.localeCompare(b.time));
  };

  // Toggle individual time slot
  const toggleTimeSlot = (dayIndex: number, slotIndex: number) => {
    setWeeklySchedule((prev) => prev.map((schedule, idx) => {
      if (idx === dayIndex) {
        return {
          ...schedule,
          timeSlots: schedule.timeSlots.map((slot, sIdx) => 
            sIdx === slotIndex ? { ...slot, enabled: !slot.enabled } : slot
          )
        };
      }
      return schedule;
    }));
  };


  // Reset or prefill form when popover opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialService) {
        // Prefill from service
        setFormData({
          title: initialService.title,
          description: initialService.description,
          price: String(initialService.price.toFixed ? initialService.price.toFixed(2) : initialService.price),
          deliveryTime: initialService.delivery_time,
          status: initialService.status,
          color: initialService.color,
        });
        // Attempt to parse delivery_time like "3-5 days" or "3 days"
        const match = initialService.delivery_time.match(/(\d+)(?:-(\d+))?\s*(day|week|month)s?/i);
        if (match) {
          const minVal = match[1];
          const maxVal = match[2] || match[1];
          const unit = match[3].toLowerCase();
          setDeliveryTime({ minTime: minVal, maxTime: maxVal, unit });
        } else {
          setDeliveryTime({ minTime: '3', maxTime: '5', unit: 'day' });
        }
      } else {
        // Reset form data for create mode
        setFormData({
          title: '',
          description: '',
          price: '',
          deliveryTime: '3-5 days',
          status: 'Public',
          color: '#667eea'
        });
        setDeliveryTime({
          minTime: '3',
          maxTime: '5',
          unit: 'day'
        });
        
        // Reset calendar scheduling settings to defaults
        setIsSchedulingEnabled(false);
        setUseTimeSlots(false);
        setSessionDurations(['60']);
        setDefaultSessionLength('60');
        setMinNotice({ amount: '24', unit: 'hours' });
        setMaxAdvance({ amount: '30', unit: 'days' });
        setBufferTime({ amount: '15', unit: 'minutes' });
        setWeeklySchedule(
          daysOfWeek.map((day) => ({ 
            day, 
            enabled: false, 
            timeBlocks: [{ start: '09:00', end: '17:00' }],
            timeSlots: []
          }))
        );
      }
      setIsSubmitting(false);
    }
  }, [open, mode, initialService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare the service data for API call
      const serviceData: CreateServiceRequest = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        delivery_time: formData.deliveryTime,
        status: formData.status as 'Public' | 'Private',
        color: formData.color
      };

      // Add calendar settings if scheduling is enabled
      if (isSchedulingEnabled) {
        serviceData.calendar_settings = {
          is_scheduling_enabled: isSchedulingEnabled,
          use_time_slots: useTimeSlots,
          session_durations: sessionDurations.map(d => parseInt(d)),
          default_session_length: parseInt(defaultSessionLength),
          min_notice_amount: parseInt(minNotice.amount),
          min_notice_unit: minNotice.unit,
          max_advance_amount: parseInt(maxAdvance.amount),
          max_advance_unit: maxAdvance.unit,
          buffer_time_amount: parseInt(bufferTime.amount),
          buffer_time_unit: bufferTime.unit,
          weekly_schedule: weeklySchedule
            .filter(schedule => schedule.enabled)
            .map(schedule => ({
              day: schedule.day,
              enabled: schedule.enabled,
              time_blocks: schedule.timeBlocks.map(block => ({
                start: block.start,
                end: block.end
              })),
              time_slots: schedule.timeSlots.map(slot => ({
                time: slot.time,
                enabled: slot.enabled
              }))
            }))
        };
      }
      
      // Call the API
      const response = mode === 'edit' && initialService
        ? await userService.updateService(initialService.id, serviceData)
        : await userService.createService(serviceData);
      
      if (response.success) {
        successToast(response.message);
        onSubmit(formData); // handle UI updates
        onClose();
      } else {
        errorToast((response as any).message || (mode === 'edit' ? 'Failed to update service' : 'Failed to create service'));
      }
      
    } catch (error: any) {
      console.error('Failed to create service:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create service. Please try again.';
      errorToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ServiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDeliveryTime = (delivery: DeliveryTimeState): string => {
    const unit = timeUnits.find(u => u.value === delivery.unit);
    if (!unit) return '';

    // If min and max are the same, it's a fixed time
    if (delivery.minTime === delivery.maxTime) {
      const time = parseInt(delivery.minTime);
      return `${time} ${time === 1 ? unit.singular : unit.plural}`;
    }
    
    // Otherwise it's a range
    return `${delivery.minTime}-${delivery.maxTime} ${unit.plural}`;
  };

  const handleDeliveryTimeChange = (field: keyof DeliveryTimeState, value: string) => {
    const newDeliveryTime = { ...deliveryTime, [field]: value };
    setDeliveryTime(newDeliveryTime);
    
    // Update the form data with formatted delivery time
    const formattedTime = formatDeliveryTime(newDeliveryTime);
    setFormData(prev => ({ ...prev, deliveryTime: formattedTime }));
  };

  // Initialize delivery time on component mount
  useEffect(() => {
    const formattedTime = formatDeliveryTime(deliveryTime);
    setFormData(prev => ({ ...prev, deliveryTime: formattedTime }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure default session length is part of selected durations
  useEffect(() => {
    if (sessionDurations.length > 0 && !sessionDurations.includes(defaultSessionLength)) {
      setDefaultSessionLength(sessionDurations[0]);
    }
  }, [sessionDurations, defaultSessionLength]);

  // Regenerate time slots when session duration or buffer time changes in time slot mode
  useEffect(() => {
    if (useTimeSlots && defaultSessionLength) {
      setWeeklySchedule((prev) => prev.map((schedule) => ({
        ...schedule,
        timeSlots: schedule.enabled ? generateTimeSlots(schedule.timeBlocks, parseInt(defaultSessionLength)) : schedule.timeSlots
      })));
    }
  }, [defaultSessionLength, useTimeSlots, bufferTime]);

  // Restrict to single session duration when switching to time slot mode
  useEffect(() => {
    if (useTimeSlots && sessionDurations.length > 1) {
      // Keep only the default session length when switching to time slot mode
      const singleDuration = sessionDurations.includes(defaultSessionLength) 
        ? defaultSessionLength 
        : sessionDurations[0];
      setSessionDurations([singleDuration]);
      setDefaultSessionLength(singleDuration);
    }
  }, [useTimeSlots]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      sx={{
        zIndex: isMobile ? 10000 : 1300, // Higher z-index on mobile to cover mobile menu
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            p: 0,
            backgroundColor: '#fff',
            boxShadow: theme.shadows[8],
            height: isMobile ? '100dvh' : 'auto',
            maxHeight: isMobile ? '100dvh' : '90vh',
            maxWidth: isMobile ? '100%' : '700px',
            overflow: 'hidden', // This clips content to border radius
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
            }),
          },
        },
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.32)' } }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        py: 3,
        px: 4,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={onBack} 
            size="medium"
            sx={{ 
              mr: 0.5,
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                transform: 'translateX(-2px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <FontAwesomeIcon 
              icon={faMusic} 
              style={{ 
                fontSize: '24px', 
                color: 'white' 
              }} 
            />
            <Box>
              <Typography variant="h5" component="div" sx={{ 
                fontWeight: 800, 
                color: 'white',
                fontSize: '1.35rem',
                letterSpacing: '-0.025em'
              }}>
                {mode === 'edit' ? 'Edit Service' : 'Create New Service'}
              </Typography>
              <Typography variant="body1" sx={{ 
                mt: 0.5,
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.85)'
              }}>
                {mode === 'edit' ? 'Update the details for your service' : 'Fill out the details for your new service offering'}
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="medium"
          sx={{
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              color: 'rgba(255, 255, 255, 0.9)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{
          p: 0,
          flex: '1 1 auto',
          maxHeight: isMobile ? 'calc(100vh - 180px)' : 'calc(90vh - 180px)',
          overflow: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#fafbfc',
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 4,
            maxWidth: '600px',
            mx: 'auto',
            p: { xs: 3, sm: 4 },
            pr: { xs: 3, sm: 4 }, // Keep consistent padding, scrollbar will be in margin area
          }}>
            {/* Service Title */}
            <Box sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                Service Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Service Title"
                  placeholder="e.g., Professional Music Production"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#f8f9fa',
                      '&:hover': {
                        backgroundColor: '#f1f3f4'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white'
                      }
                    }
                  }}
                />

                <TextField
                  label="Description"
                  placeholder="Describe what's included in this service, your process, and what clients can expect..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#f8f9fa',
                      '&:hover': {
                        backgroundColor: '#f1f3f4'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white'
                      }
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Pricing & Delivery */}
            <Box sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>
                Pricing & Delivery
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Price */}
                <TextField
                  label="Price"
                  placeholder="299.99"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers and one decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      handleInputChange('price', value);
                    }
                  }}
                  onBlur={(e) => {
                    // Format the price on blur (add .00 if needed)
                    const value = e.target.value;
                    if (value && !isNaN(parseFloat(value))) {
                      const formatted = parseFloat(value).toFixed(2);
                      handleInputChange('price', formatted);
                    }
                  }}
                  required
                  type="text"
                  inputMode="decimal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#f8f9fa',
                      '&:hover': {
                        backgroundColor: '#f1f3f4'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white'
                      }
                    }
                  }}
                />

                {/* Delivery Time */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Estimated Delivery Time
                  </Typography>

                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    flexWrap: 'wrap',
                    mb: 2
                  }}>
                    <TextField
                      label="Min Time"
                      value={deliveryTime.minTime}
                      onChange={(e) => handleDeliveryTimeChange('minTime', e.target.value)}
                      type="number"
                      inputProps={{ min: 1, max: 365 }}
                      sx={{ 
                        width: 100,
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 2,
                          backgroundColor: '#f8f9fa',
                          '&:hover': {
                            backgroundColor: '#f1f3f4'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white'
                          }
                        }
                      }}
                      size="small"
                    />

                    <Typography variant="body1" sx={{ color: 'text.secondary', mx: 0.5 }}>
                      to
                    </Typography>

                    <TextField
                      label="Max Time"
                      value={deliveryTime.maxTime}
                      onChange={(e) => handleDeliveryTimeChange('maxTime', e.target.value)}
                      type="number"
                      inputProps={{ min: parseInt(deliveryTime.minTime) || 1, max: 365 }}
                      sx={{ 
                        width: 100,
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 2,
                          backgroundColor: '#f8f9fa',
                          '&:hover': {
                            backgroundColor: '#f1f3f4'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white'
                          }
                        }
                      }}
                      size="small"
                    />

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={deliveryTime.unit}
                        onChange={(e) => handleDeliveryTimeChange('unit', e.target.value)}
                        sx={{ 
                          borderRadius: 2,
                          backgroundColor: '#f8f9fa',
                          '&:hover': {
                            backgroundColor: '#f1f3f4'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white'
                          }
                        }}
                      >
                        {timeUnits.map((unit) => (
                          <MenuItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Preview */}
                  <Box sx={{
                    p: 2.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.1)'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Preview:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {formatDeliveryTime(deliveryTime)} delivery
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Calendar Scheduling (UI-only) */}
            <Box sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                Calendar Scheduling
              </Typography>

              <Box sx={{
                p: 2.5,
                borderRadius: 2,
                backgroundColor: '#f8f9fa',
                border: '1px solid rgba(0,0,0,0.06)',
                mb: 3
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isSchedulingEnabled}
                      onChange={(e) => setIsSchedulingEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Enable calendar scheduling for this service
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Clients will be taken to a booking screen to schedule a session
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', margin: 0 }}
                />
              </Box>

              {isSchedulingEnabled && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Time Slot Mode Toggle */}
                  <Box sx={{
                    p: 2.5,
                    borderRadius: 2,
                    backgroundColor: '#f0f8ff',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    mb: 1
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useTimeSlots}
                          onChange={(e) => setUseTimeSlots(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Use predefined time slots
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {useTimeSlots 
                              ? 'Clients book specific appointment times (e.g., 9:00 AM, 9:30 AM, 10:00 AM)'
                              : 'Clients can book flexibly within your available hours'
                            }
                          </Typography>
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start', margin: 0 }}
                    />
                  </Box>

                  {/* Session Durations */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Available session durations
                      </Typography>
                      <Tooltip 
                        title={useTimeSlots 
                          ? "Choose one session duration. Time slots will be generated based on this duration."
                          : "Select the session durations that clients can book. You can offer multiple options to give clients flexibility in choosing their session length."
                        }
                        placement="top"
                        arrow
                      >
                        <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                    {useTimeSlots ? (
                      // Radio buttons for single selection in time slot mode
                      <RadioGroup
                        row
                        value={sessionDurations[0] || ''}
                        onChange={(e) => {
                          const newDuration = e.target.value;
                          setSessionDurations([newDuration]);
                          setDefaultSessionLength(newDuration);
                        }}
                      >
                        {sessionDurationOptions.map((opt) => (
                          <FormControlLabel
                            key={opt}
                            value={opt}
                            control={<Radio />}
                            label={`${opt} min`}
                          />
                        ))}
                      </RadioGroup>
                    ) : (
                      // Checkboxes for multiple selection in flexible mode
                      <FormGroup row>
                        {sessionDurationOptions.map((opt) => {
                          const checked = sessionDurations.includes(opt);
                          return (
                            <FormControlLabel
                              key={opt}
                              control={
                                <Checkbox
                                  checked={checked}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setSessionDurations((prev) => {
                                      if (isChecked) return [...prev, opt].sort((a, b) => parseInt(a) - parseInt(b));
                                      return prev.filter((d) => d !== opt);
                                    });
                                  }}
                                />
                              }
                              label={`${opt} min`}
                            />
                          );
                        })}
                      </FormGroup>
                    )}
                  </Box>

                  {/* Default Session Length - Only show in flexible mode */}
                  {!useTimeSlots && (
                    <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Default session length
                      </Typography>
                      <Tooltip 
                        title="This duration will be pre-selected when clients book a session. Clients can still choose other available durations if you've enabled multiple options."
                        placement="top"
                        arrow
                      >
                        <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <Select
                        value={defaultSessionLength}
                        onChange={(e) => setDefaultSessionLength(String(e.target.value))}
                        disabled={sessionDurations.length === 0}
                        sx={{ borderRadius: 2, backgroundColor: '#f8f9fa' }}
                      >
                        {sessionDurations.length === 0 ? (
                          <MenuItem value="" disabled>
                            Select durations first
                          </MenuItem>
                        ) : (
                          sessionDurations.map((d) => (
                            <MenuItem key={d} value={d}>{`${d} min`}</MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                    </Box>
                  )}

                  {/* Booking Rules */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {/* Minimum Notice */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Minimum notice required
                        </Typography>
                        <Tooltip 
                          title="The minimum amount of time clients must book in advance. This gives you time to prepare and prevents last-minute bookings that may be inconvenient."
                          placement="top"
                          arrow
                        >
                          <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <TextField
                          label="Amount"
                          type="number"
                          size="small"
                          value={minNotice.amount}
                          onChange={(e) => setMinNotice({ ...minNotice, amount: e.target.value })}
                          sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#f8f9fa' } }}
                          inputProps={{ min: 0 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={minNotice.unit}
                            onChange={(e) => setMinNotice({ ...minNotice, unit: e.target.value as 'hours' | 'days' })}
                            sx={{ borderRadius: 2, backgroundColor: '#f8f9fa' }}
                          >
                            <MenuItem value="hours">Hours</MenuItem>
                            <MenuItem value="days">Days</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>

                    {/* Maximum Advance Booking */}
                    <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Maximum advance booking
                        </Typography>
                        <Tooltip 
                          title="The furthest into the future that clients can book sessions. This helps manage your schedule and prevents bookings too far ahead when your availability may change."
                          placement="top"
                          arrow
                        >
                          <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <TextField
                          label="Amount"
                          type="number"
                          size="small"
                          value={maxAdvance.amount}
                          onChange={(e) => setMaxAdvance({ ...maxAdvance, amount: e.target.value })}
                          sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#f8f9fa' } }}
                          inputProps={{ min: 0 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={maxAdvance.unit}
                            onChange={(e) => setMaxAdvance({ ...maxAdvance, unit: e.target.value as 'days' | 'weeks' | 'months' })}
                            sx={{ borderRadius: 2, backgroundColor: '#f8f9fa' }}
                          >
                            <MenuItem value="days">Days</MenuItem>
                            <MenuItem value="weeks">Weeks</MenuItem>
                            <MenuItem value="months">Months</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>

                    {/* Buffer Time */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Buffer time between bookings
                        </Typography>
                        <Tooltip 
                          title="Time gap automatically added between consecutive bookings. This gives you time to wrap up one session, take notes, and prepare for the next client."
                          placement="top"
                          arrow
                        >
                          <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <TextField
                          label="Amount"
                          type="number"
                          size="small"
                          value={bufferTime.amount}
                          onChange={(e) => setBufferTime({ ...bufferTime, amount: e.target.value })}
                          sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#f8f9fa' } }}
                          inputProps={{ min: 0 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={bufferTime.unit}
                            onChange={(e) => setBufferTime({ ...bufferTime, unit: e.target.value as 'minutes' | 'hours' })}
                            sx={{ borderRadius: 2, backgroundColor: '#f8f9fa' }}
                          >
                            <MenuItem value="minutes">Minutes</MenuItem>
                            <MenuItem value="hours">Hours</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                  </Box>

                  {/* Weekly Schedule */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Weekly schedule
                      </Typography>
                      <Tooltip 
                        title="Set your available hours for each day of the week. You can add multiple time blocks per day (e.g., 9am-12pm and 4pm-9pm). Clients can only book sessions during these times."
                        placement="top"
                        arrow
                      >
                        <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {weeklySchedule.map((daySchedule, dayIdx) => (
                        <Box
                          key={daySchedule.day}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: '#f8f9fa',
                            border: '1px solid rgba(0,0,0,0.06)'
                          }}
                        >
                          {/* Day Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={daySchedule.enabled}
                                  onChange={(e) => toggleDay(dayIdx, e.target.checked)}
                                  color="primary"
                                />
                              }
                              label={
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {daySchedule.day}
                                </Typography>
                              }
                            />
                            {daySchedule.enabled && (
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => addTimeBlock(dayIdx)}
                                sx={{ 
                                  fontSize: '0.75rem',
                                  textTransform: 'none',
                                  color: 'primary.main'
                                }}
                              >
                                Add Time Block
                              </Button>
                            )}
                          </Box>

                          {/* Time Blocks */}
                          {daySchedule.enabled && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              {daySchedule.timeBlocks.map((timeBlock, blockIdx) => {
                                const hasOverlap = !validateTimeBlocks(daySchedule.timeBlocks);
                                const isInvalidBlock = timeBlock.start >= timeBlock.end;
                                const hasError = hasOverlap || isInvalidBlock;
                                
                                return (
                                  <Box
                                    key={blockIdx}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      flexDirection: { xs: 'column', sm: 'row' },
                                      gap: { xs: 1, sm: 1.5 },
                                      p: 1.5,
                                      backgroundColor: hasError ? '#ffeaea' : '#fff',
                                      borderRadius: 1.5,
                                      border: hasError ? '1px solid #f44336' : '1px solid rgba(0,0,0,0.08)',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    {/* Mobile Layout */}
                                    <Box sx={{ 
                                      display: { xs: 'flex', sm: 'none' },
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '100%',
                                      gap: 1
                                    }}>
                                      <TextField
                                        label="Start"
                                        type="time"
                                        size="small"
                                        value={timeBlock.start}
                                        onChange={(e) => updateTimeBlockWithValidation(dayIdx, blockIdx, 'start', e.target.value)}
                                        error={hasError}
                                        sx={{ 
                                          width: '120px',
                                          '& .MuiOutlinedInput-root': { 
                                            borderRadius: 2, 
                                            backgroundColor: hasError ? '#ffeaea' : '#f8f9fa' 
                                          } 
                                        }}
                                        inputProps={{ step: 300 }}
                                      />
                                      <Typography 
                                        variant="body2" 
                                        color="text.secondary"
                                        sx={{ 
                                          fontSize: '0.875rem',
                                          px: 0.5
                                        }}
                                      >
                                        to
                                      </Typography>
                                      <TextField
                                        label="End"
                                        type="time"
                                        size="small"
                                        value={timeBlock.end}
                                        onChange={(e) => updateTimeBlockWithValidation(dayIdx, blockIdx, 'end', e.target.value)}
                                        error={hasError}
                                        sx={{ 
                                          width: '120px',
                                          '& .MuiOutlinedInput-root': { 
                                            borderRadius: 2, 
                                            backgroundColor: hasError ? '#ffeaea' : '#f8f9fa' 
                                          } 
                                        }}
                                        inputProps={{ step: 300 }}
                                      />
                                    </Box>

                                    {/* Desktop Layout */}
                                    <TextField
                                      label="Start"
                                      type="time"
                                      size="small"
                                      value={timeBlock.start}
                                      onChange={(e) => updateTimeBlockWithValidation(dayIdx, blockIdx, 'start', e.target.value)}
                                      error={hasError}
                                      sx={{ 
                                        display: { xs: 'none', sm: 'block' },
                                        minWidth: 120,
                                        '& .MuiOutlinedInput-root': { 
                                          borderRadius: 2, 
                                          backgroundColor: hasError ? '#ffeaea' : '#f8f9fa' 
                                        } 
                                      }}
                                      inputProps={{ step: 300 }}
                                    />
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary"
                                      sx={{ 
                                        display: { xs: 'none', sm: 'block' },
                                        fontSize: '0.875rem'
                                      }}
                                    >
                                      to
                                    </Typography>
                                    <TextField
                                      label="End"
                                      type="time"
                                      size="small"
                                      value={timeBlock.end}
                                      onChange={(e) => updateTimeBlockWithValidation(dayIdx, blockIdx, 'end', e.target.value)}
                                      error={hasError}
                                      sx={{ 
                                        display: { xs: 'none', sm: 'block' },
                                        minWidth: 120,
                                        '& .MuiOutlinedInput-root': { 
                                          borderRadius: 2, 
                                          backgroundColor: hasError ? '#ffeaea' : '#f8f9fa' 
                                        } 
                                      }}
                                      inputProps={{ step: 300 }}
                                    />

                                    {/* Delete Button */}
                                    {daySchedule.timeBlocks.length > 1 && (
                                      <IconButton
                                        size="small"
                                        onClick={() => removeTimeBlock(dayIdx, blockIdx)}
                                        sx={{ 
                                          color: 'error.main',
                                          alignSelf: 'center',
                                          '&:hover': { backgroundColor: 'error.light' }
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </Box>
                                );
                              })}

                              {/* Time Slots (when time slot mode is enabled) */}
                              {useTimeSlots && daySchedule.timeSlots.length > 0 && (
                                <Box sx={{ 
                                  mt: 2, 
                                  p: 2, 
                                  backgroundColor: '#f0f8ff', 
                                  borderRadius: 2,
                                  border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                  <Box sx={{ mb: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                      Available Time Slots ({defaultSessionLength} min each)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Spaced {parseInt(defaultSessionLength) + (bufferTime.unit === 'hours' ? parseInt(bufferTime.amount) * 60 : parseInt(bufferTime.amount))} min apart (includes {bufferTime.amount} {bufferTime.unit} buffer)
                                    </Typography>
                                  </Box>
                                  <Box sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                                    gap: 1 
                                  }}>
                                    {daySchedule.timeSlots.map((slot, slotIdx) => (
                                      <Box
                                        key={slotIdx}
                                        onClick={() => toggleTimeSlot(dayIdx, slotIdx)}
                                        sx={{
                                          p: 1,
                                          borderRadius: 1,
                                          backgroundColor: slot.enabled ? 'primary.main' : '#e0e0e0',
                                          color: slot.enabled ? 'white' : 'text.secondary',
                                          textAlign: 'center',
                                          cursor: 'pointer',
                                          fontSize: '0.75rem',
                                          fontWeight: slot.enabled ? 600 : 400,
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            backgroundColor: slot.enabled ? 'primary.dark' : '#d0d0d0',
                                            transform: 'scale(1.02)'
                                          }
                                        }}
                                      >
                                        {slot.time}
                                      </Box>
                                    ))}
                                  </Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Click time slots to enable/disable them for booking
                                  </Typography>
                                </Box>
                              )}

                              {/* Validation Message */}
                              {!validateTimeBlocks(daySchedule.timeBlocks) && (
                                <Typography 
                                  variant="caption" 
                                  color="error" 
                                  sx={{ 
                                    mt: 0.5, 
                                    fontStyle: 'italic',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                  }}
                                >
                                  ⚠️ Time blocks overlap. Please adjust the times.
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Customization */}
            <Box sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>
                <FontAwesomeIcon 
                  icon={faPalette} 
                  style={{ marginRight: 12, fontSize: '18px', color: formData.color }} 
                />
                Customization
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Color Selection */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Service Color Theme
                  </Typography>

                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    mb: 2 
                  }}>
                    <Box sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      backgroundColor: formData.color,
                      border: '3px solid rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 6px 20px ${formData.color}50`,
                      transition: 'all 0.3s ease'
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: 'white', 
                        fontWeight: 800,
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                        fontSize: '0.65rem',
                        letterSpacing: '0.5px'
                      }}>
                        PREVIEW
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Color (Hex)"
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        placeholder="#667eea"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#f8f9fa',
                            '&:hover': {
                              backgroundColor: '#f1f3f4'
                            },
                            '&.Mui-focused': {
                              backgroundColor: 'white'
                            }
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => handleInputChange('color', e.target.value)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  backgroundColor: 'transparent'
                                }}
                              />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Preset Colors */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Quick presets:
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1.5 
                  }}>
                    {presetColors.map((color) => (
                      <Box
                        key={color}
                        onClick={() => handleInputChange('color', color)}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          backgroundColor: color,
                          cursor: 'pointer',
                          border: formData.color === color 
                            ? '3px solid #333' 
                            : '2px solid rgba(0,0,0,0.1)',
                          transition: 'all 0.25s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover': {
                            transform: 'scale(1.15)',
                            boxShadow: `0 6px 16px ${color}60`,
                          }
                        }}
                      >
                        {formData.color === color && (
                          <Box sx={{ 
                            color: 'white', 
                            fontSize: '16px',
                            textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                          }}>
                            ✓
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    This color will be used for your service cards and branding
                  </Typography>
                </Box>

                {/* Visibility Settings */}
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: '#f8f9fa',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.status === 'Public'}
                        onChange={(e) => handleInputChange('status', e.target.checked ? 'Public' : 'Private')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Make service public
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formData.status === 'Public' 
                            ? 'This service will be visible on your public profile for clients to book'
                            : 'This service will only be visible to you and won\'t appear on your public profile'
                          }
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', margin: 0 }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: { xs: 3, sm: 3 }, 
          pt: { xs: 2, sm: 2 },
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'white',
          justifyContent: 'center'
        }}>
          <Button 
            type="submit"
            variant="contained"
            size="large"
            sx={{ 
              minWidth: 160,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '1rem',
              background: `linear-gradient(135deg, ${formData.color} 0%, ${formData.color}dd 100%)`,
              boxShadow: `0 4px 16px ${formData.color}40`,
              '&:hover': {
                background: `linear-gradient(135deg, ${formData.color}dd 0%, ${formData.color}bb 100%)`,
                boxShadow: `0 6px 20px ${formData.color}50`,
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: 'rgba(0,0,0,0.12)',
                boxShadow: 'none'
              },
              transition: 'all 0.2s ease'
            }}
            disabled={
              !formData.title || 
              !formData.description || 
              !formData.price || 
              isNaN(parseFloat(formData.price)) || 
              parseFloat(formData.price) <= 0 || 
              isSubmitting
            }
          >
            {isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Creating...') : (mode === 'edit' ? 'Save Changes' : 'Create Service')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
