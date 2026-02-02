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
  Tooltip,
  Radio,
  RadioGroup,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Card,
  CardMedia,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect } from 'react';
import { userService, type CreateServiceRequest, type ServicePhoto, type CreativeProfile } from '../../../api/userService';
import { successToast, errorToast } from '../../toast/toast';
import { ServiceCard } from '../../cards/creative/ServiceCard';
import { 
  convertTimeBlocksToUTC, 
  convertTimeSlotsToUTC, 
  convertTimeBlocksFromUTC, 
  convertTimeSlotsFromUTC,
  getUserTimezone 
} from '../../../utils/timezoneUtils';

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
  creativeProfile?: CreativeProfile | null;
  initialService?: {
    id: string;
    title: string;
    description: string;
    price: number;
    delivery_time: string;
    status: 'Public' | 'Private' | 'Bundle-Only';
    color: string;
    payment_option?: 'upfront' | 'split' | 'later';
    split_deposit_amount?: number;
    photos?: ServicePhoto[];
    requires_booking?: boolean;
    calendar_settings?: {
      is_scheduling_enabled: boolean;
      session_duration: number;
      default_session_length: number;
      min_notice_amount: number;
      min_notice_unit: 'minutes' | 'hours' | 'days';
      max_advance_amount: number;
      max_advance_unit: 'hours' | 'days' | 'weeks' | 'months';
      buffer_time_amount: number;
      buffer_time_unit: 'minutes' | 'hours';
      weekly_schedule: {
        day: string;
        enabled: boolean;
        time_blocks: { start: string; end: string }[];
        time_slots: { time: string; enabled: boolean }[];
      }[];
    };
  } | null;
}

export interface ServiceFormData {
  title: string;
  description: string;
  price: string;
  deliveryTime?: string;
  status: 'Public' | 'Private' | 'Bundle-Only';
  color: string;
  photos: File[];
  existingPhotos: ServicePhoto[];
  primaryPhotoIndex: number;
  paymentOption: 'upfront' | 'split' | 'later';
  splitDepositAmount: string;
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

const steps = [
  'Service Details',
  'Pricing & Delivery',
  'Upload Photos',
  'Calendar Scheduling',
  'Customization & Review'
];

export function ServiceFormPopover({
  open,
  onClose,
  onBack,
  onSubmit,
  mode = 'create',
  creativeProfile = null,
  initialService = null,
}: ServiceFormPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    description: '',
    price: '',
    deliveryTime: '3-5 days',
    status: 'Public',
    color: '#667eea',
    photos: [],
    existingPhotos: [],
    primaryPhotoIndex: -1,
    paymentOption: 'later',
    splitDepositAmount: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isDeliveryTimeEnabled, setIsDeliveryTimeEnabled] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState<DeliveryTimeState>({
    minTime: '3',
    maxTime: '5',
    unit: 'day'
  });

  // Calendar scheduling (UI-only)
  const [isSchedulingEnabled, setIsSchedulingEnabled] = useState(false);
  // Common presets for quick selection
  const commonDurations = ['15', '30', '45', '60', '90', '120', '180'];
  
  const [sessionDuration, setSessionDuration] = useState<string>('60');
  const [defaultSessionLength, setDefaultSessionLength] = useState('60');
  // Always use time slots - removed toggle functionality
  const useTimeSlots = true;
  const [minNotice, setMinNotice] = useState<{ amount: string; unit: 'minutes' | 'hours' | 'days' }>({ amount: '24', unit: 'hours' });
  const [maxAdvance, setMaxAdvance] = useState<{ amount: string; unit: 'hours' | 'days' | 'weeks' | 'months' }>({ amount: '30', unit: 'days' });
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
  
  // Flag to track if time slots were loaded from backend
  const [timeSlotsLoadedFromBackend, setTimeSlotsLoadedFromBackend] = useState(false);

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
        const newTimeBlocks = schedule.timeBlocks.filter((_, bIdx) => bIdx !== blockIndex);
        // Regenerate time slots based on remaining time blocks
        const newTimeSlots = useTimeSlots && schedule.enabled
          ? generateTimeSlots(newTimeBlocks, parseInt(defaultSessionLength))
          : schedule.timeSlots;
        
        return {
          ...schedule,
          timeBlocks: newTimeBlocks,
          timeSlots: newTimeSlots
        };
      }
      return schedule;
    }));
    // Reset the flag when time blocks are removed so time slots can be regenerated
    setTimeSlotsLoadedFromBackend(false);
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
    // Reset the flag when toggling days so time slots can be regenerated
    setTimeSlotsLoadedFromBackend(false);
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

  // Validate all time blocks across all enabled days
  const validateAllTimeBlocks = (): { isValid: boolean; errorMessage?: string } => {
    if (!isSchedulingEnabled) {
      return { isValid: true };
    }

    // Check each enabled day
    for (const daySchedule of weeklySchedule) {
      if (!daySchedule.enabled) continue;

      // Check for invalid time blocks (start >= end)
      for (const timeBlock of daySchedule.timeBlocks) {
        if (timeBlock.start >= timeBlock.end) {
          return {
            isValid: false,
            errorMessage: `Invalid time block on ${daySchedule.day}: end time must be greater than start time`
          };
        }
      }

      // Check for overlapping time blocks
      if (!validateTimeBlocks(daySchedule.timeBlocks)) {
        return {
          isValid: false,
          errorMessage: `Overlapping time blocks found on ${daySchedule.day}. Please fix the time ranges.`
        };
      }
    }

    return { isValid: true };
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
    // Reset the flag when time blocks are updated so time slots can be regenerated
    setTimeSlotsLoadedFromBackend(false);
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

  // Step navigation functions
  const handleNext = () => {
    // Validate split payment amount before proceeding from Pricing & Delivery step (step 1)
    if (activeStep === 1) {
      if (formData.paymentOption === 'split') {
        // Check if split deposit amount is configured
        if (!formData.splitDepositAmount || formData.splitDepositAmount.trim() === '') {
          errorToast('Please configure the initial payment amount for split payment');
          return;
        }
        
        const depositAmount = parseFloat(formData.splitDepositAmount);
        const price = parseFloat(formData.price);
        
        // Validate the amount
        if (isNaN(depositAmount) || depositAmount <= 0) {
          errorToast('Initial payment amount must be greater than 0');
          return;
        }
        
        if (depositAmount >= price) {
          errorToast('Initial payment amount must be less than the total price. Use "Upfront Payment" if you want full payment before work begins.');
          return;
        }
      }
    }
    
    // Validate time blocks before proceeding from Calendar Scheduling step (step 3)
    if (activeStep === 3 && isSchedulingEnabled) {
      const validation = validateAllTimeBlocks();
      if (!validation.isValid) {
        errorToast(validation.errorMessage || 'Please fix invalid time blocks before proceeding');
        return;
      }
    }

    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
      // Reset scroll position to top when moving to next step
      setTimeout(() => {
        const dialogContent = document.querySelector('.MuiDialogContent-root');
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
      }, 100);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
      // Reset scroll position to top when moving to previous step
      setTimeout(() => {
        const dialogContent = document.querySelector('.MuiDialogContent-root');
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
      }, 100);
    } else if (onBack) {
      onBack();
    }
  };

  // Photo upload functions
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Filter files to only allow PNG and JPEG
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const validFiles = Array.from(files).filter(file => 
        allowedTypes.includes(file.type)
      );
      
      // Show error if any files were rejected
      if (validFiles.length !== files.length) {
        errorToast('Only PNG and JPEG files are allowed');
      }
      
      const newPhotos = validFiles.slice(0, 6 - (formData.photos.length + formData.existingPhotos.length));
      setFormData(prev => {
        const updatedPhotos = [...prev.photos, ...newPhotos];
        // If this is the first photo, set it as primary
        const newPrimaryIndex = (prev.photos.length + prev.existingPhotos.length) === 0 ? 0 : prev.primaryPhotoIndex;
        return {
          ...prev,
          photos: updatedPhotos,
          primaryPhotoIndex: newPrimaryIndex
        };
      });
    }
  };

  const handlePhotoRemove = (index: number) => {
    setFormData(prev => {
      const updatedPhotos = prev.photos.filter((_, i) => i !== index);
      let newPrimaryIndex = prev.primaryPhotoIndex;
      
      // Adjust primary photo index if needed
      if (index === prev.primaryPhotoIndex) {
        // If removing the primary photo, set the first remaining photo as primary
        newPrimaryIndex = updatedPhotos.length > 0 ? 0 : -1;
      } else if (index < prev.primaryPhotoIndex) {
        // If removing a photo before the primary, adjust the index
        newPrimaryIndex = prev.primaryPhotoIndex - 1;
      }
      
      return {
        ...prev,
        photos: updatedPhotos,
        primaryPhotoIndex: newPrimaryIndex
      };
    });
  };

  const handleSetPrimaryPhoto = (index: number) => {
    setFormData(prev => {
      // If the index is within existing photos range, update existing photos
      if (index < prev.existingPhotos.length) {
        const updatedExistingPhotos = prev.existingPhotos.map((photo, i) => ({
          ...photo,
          is_primary: i === index
        }));
        
        return {
          ...prev,
          existingPhotos: updatedExistingPhotos,
          primaryPhotoIndex: index
        };
      } else {
        // If the index is for a new photo, just update the primaryPhotoIndex
        return {
          ...prev,
          primaryPhotoIndex: index
        };
      }
    });
  };

  const handleSetPrimaryExistingPhoto = (index: number) => {
    setFormData(prev => {
      // Update existing photos to mark the selected one as primary and others as not primary
      const updatedExistingPhotos = prev.existingPhotos.map((photo, i) => ({
        ...photo,
        is_primary: i === index
      }));
      
      return {
        ...prev,
        existingPhotos: updatedExistingPhotos,
        primaryPhotoIndex: index
      };
    });
  };

  const handleExistingPhotoRemove = (index: number) => {
    setFormData(prev => {
      const updatedExistingPhotos = prev.existingPhotos.filter((_, i) => i !== index);
      let newPrimaryIndex = prev.primaryPhotoIndex;
      
      // Adjust primary photo index if needed
      if (prev.primaryPhotoIndex === index) {
        // If we're removing the primary photo, reset to -1
        newPrimaryIndex = -1;
      } else if (prev.primaryPhotoIndex > index) {
        // If the primary photo is after the removed photo, adjust the index
        newPrimaryIndex = prev.primaryPhotoIndex - 1;
      }
      
      return {
        ...prev,
        existingPhotos: updatedExistingPhotos,
        primaryPhotoIndex: newPrimaryIndex
      };
    });
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.title.trim().length > 0 && formData.description.trim().length > 0;
      case 1:
        const priceValid = formData.price.trim().length > 0 && !isNaN(parseFloat(formData.price)) && parseFloat(formData.price) >= 0;
        // If delivery time is enabled, validate that min <= max
        if (isDeliveryTimeEnabled) {
          const deliveryTimeValid = validateDeliveryTime(deliveryTime);
          return priceValid && deliveryTimeValid;
        }
        return priceValid;
      case 2:
        // If photos are uploaded, a primary photo must be selected
        return (formData.photos.length + formData.existingPhotos.length) === 0 || formData.primaryPhotoIndex >= 0;
      case 3:
        // If calendar scheduling is enabled, require at least one weekly schedule event and valid time blocks
        if (isSchedulingEnabled) {
          const hasEnabledDay = weeklySchedule.some(day => day.enabled);
          if (!hasEnabledDay) {
            return false;
          }
          // Validate all time blocks are valid (end > start and no overlaps)
          const validation = validateAllTimeBlocks();
          return validation.isValid;
        }
        return true; // Calendar scheduling is optional
      case 4:
        return true; // Customization is optional
      default:
        return false;
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

  const validateDeliveryTime = (delivery: DeliveryTimeState): boolean => {
    const min = parseInt(delivery.minTime);
    const max = parseInt(delivery.maxTime);
    return !isNaN(min) && !isNaN(max) && min > 0 && max > 0 && min <= max;
  };

  const handleDeliveryTimeChange = (field: keyof DeliveryTimeState, value: string) => {
    const newDeliveryTime = { ...deliveryTime, [field]: value };
    setDeliveryTime(newDeliveryTime);

    // Update the form data with formatted delivery time only if enabled
    if (isDeliveryTimeEnabled) {
      const formattedTime = formatDeliveryTime(newDeliveryTime);
      setFormData(prev => ({ ...prev, deliveryTime: formattedTime }));
    }
  };

  const handleDeliveryTimeToggle = (enabled: boolean) => {
    setIsDeliveryTimeEnabled(enabled);
    if (enabled) {
      // If enabling, format and set delivery time
      const formattedTime = formatDeliveryTime(deliveryTime);
      setFormData(prev => ({ ...prev, deliveryTime: formattedTime }));
    } else {
      // If disabling, remove delivery time
      setFormData(prev => {
        const { deliveryTime, ...rest } = prev;
        return rest as ServiceFormData;
      });
    }
  };

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
        delivery_time: isDeliveryTimeEnabled && formData.deliveryTime ? formData.deliveryTime : '',
        status: formData.status as 'Public' | 'Private' | 'Bundle-Only',
        color: formData.color,
        payment_option: formData.paymentOption,
        split_deposit_amount: formData.paymentOption === 'split' && formData.splitDepositAmount 
          ? parseFloat(formData.splitDepositAmount) 
          : undefined
      };

      // Note: Photos are handled separately via the updateServiceWithPhotos method
      // when there are new photos to upload

      // Add calendar settings if scheduling is enabled
      if (isSchedulingEnabled) {
        const userTimezone = getUserTimezone();
        serviceData.calendar_settings = {
          is_scheduling_enabled: isSchedulingEnabled,
          session_duration: parseInt(sessionDuration),
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
              time_blocks: convertTimeBlocksToUTC(schedule.timeBlocks, userTimezone),
              time_slots: convertTimeSlotsToUTC(schedule.timeSlots, userTimezone)
            }))
        };
      }

      // Call the API - use optimized endpoint if photos are present or if existing photos were modified
      const hasNewPhotos = formData.photos.length > 0;
      const hasModifiedExistingPhotos = initialService && initialService.photos && 
        (formData.existingPhotos.length !== initialService.photos.length);
      
      const response = mode === 'edit' && initialService
        ? (hasNewPhotos || hasModifiedExistingPhotos)
          ? await userService.updateServiceWithPhotos(initialService.id, serviceData, formData.photos, formData.existingPhotos, (progress) => {
              setUploadProgress(progress);
            })
          : await userService.updateService(initialService.id, serviceData)
        : formData.photos.length > 0
        ? await userService.createServiceWithPhotos(serviceData, formData.photos, (progress) => {
            setUploadProgress(progress);
          })
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
      setUploadProgress(0);
    }
  };

  // Reset or prefill form when popover opens
  useEffect(() => {
    if (open) {
      setActiveStep(0); // Reset to first step
      setTimeSlotsLoadedFromBackend(false); // Reset flag
      if (mode === 'edit' && initialService) {
        console.log('Edit mode - initial service:', initialService);
        // Find the index of the primary photo in existing photos
        const existingPhotos = initialService.photos || [];
        const primaryPhotoIndex = existingPhotos.findIndex(photo => photo.is_primary);
        
        // Prefill from service
        const hasDeliveryTime = !!(initialService.delivery_time && initialService.delivery_time.trim().length > 0);
        setIsDeliveryTimeEnabled(hasDeliveryTime);
        
        // Calculate default split deposit amount if not provided
        let splitDepositAmount = '';
        if (initialService.payment_option === 'split') {
          if (initialService.split_deposit_amount !== undefined && initialService.split_deposit_amount !== null) {
            splitDepositAmount = String(initialService.split_deposit_amount.toFixed ? initialService.split_deposit_amount.toFixed(2) : initialService.split_deposit_amount);
          } else {
            // Default to 50% if not set
            splitDepositAmount = String((initialService.price * 0.5).toFixed(2));
          }
        }
        
        setFormData({
          title: initialService.title,
          description: initialService.description,
          price: String(initialService.price.toFixed ? initialService.price.toFixed(2) : initialService.price),
          deliveryTime: hasDeliveryTime ? initialService.delivery_time : undefined,
          status: initialService.status,
          color: initialService.color,
          photos: [], // New photos to upload
          existingPhotos: existingPhotos, // Existing photos from service
          primaryPhotoIndex: primaryPhotoIndex,
          paymentOption: initialService.payment_option || 'later', // Use existing or default to later
          splitDepositAmount: splitDepositAmount
        });
        // Attempt to parse delivery_time like "3-5 days" or "3 days"
        if (hasDeliveryTime) {
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
          setDeliveryTime({ minTime: '3', maxTime: '5', unit: 'day' });
        }
        
        // Load existing calendar settings
        setIsSchedulingEnabled(initialService.requires_booking || false);
        // Always use time slots - no longer need to set this from initial service
        
        // Load detailed calendar settings if available
        console.log('Initial service calendar settings:', initialService.calendar_settings);
        console.log('Full initial service:', initialService);
        if (initialService.calendar_settings) {
          const calendarSettings = initialService.calendar_settings;
          console.log('Processing calendar settings:', calendarSettings);
          
          // Set calendar settings
          setIsSchedulingEnabled(calendarSettings.is_scheduling_enabled);
          // Always use time slots - no longer need to set this from calendar settings
          setSessionDuration(String(calendarSettings.session_duration));
          setDefaultSessionLength(String(calendarSettings.default_session_length));
          setMinNotice({
            amount: String(calendarSettings.min_notice_amount),
            unit: calendarSettings.min_notice_unit
          });
          setMaxAdvance({
            amount: String(calendarSettings.max_advance_amount),
            unit: calendarSettings.max_advance_unit
          });
          setBufferTime({
            amount: String(calendarSettings.buffer_time_amount),
            unit: calendarSettings.buffer_time_unit
          });
          
          // Load weekly schedule
          console.log('Weekly schedule check:', calendarSettings.weekly_schedule);
          if (calendarSettings.weekly_schedule && calendarSettings.weekly_schedule.length > 0) {
            console.log('Loading weekly schedule:', calendarSettings.weekly_schedule);
            const userTimezone = getUserTimezone();
            const loadedSchedule = daysOfWeek.map(day => {
              const dayData = calendarSettings.weekly_schedule.find(ws => ws.day === day);
              if (dayData) {
                console.log(`Found data for ${day}:`, dayData);
                return {
                  day,
                  enabled: dayData.enabled,
                  timeBlocks: dayData.time_blocks 
                    ? convertTimeBlocksFromUTC(dayData.time_blocks, userTimezone)
                    : [{ start: '09:00', end: '17:00' }],
                  timeSlots: dayData.time_slots 
                    ? convertTimeSlotsFromUTC(dayData.time_slots, userTimezone)
                    : []
                };
              }
              return {
                day,
                enabled: false,
                timeBlocks: [{ start: '09:00', end: '17:00' }],
                timeSlots: []
              };
            });
            console.log('Loaded schedule:', loadedSchedule);
            console.log('Wednesday schedule specifically:', loadedSchedule.find(day => day.day === 'Wednesday'));
            setWeeklySchedule(loadedSchedule);
            // Mark that time slots were loaded from backend
            setTimeSlotsLoadedFromBackend(true);
          } else {
            console.log('No weekly schedule data found or empty array');
          }
        } else {
          console.log('No calendar settings found in initial service');
          setTimeSlotsLoadedFromBackend(false);
        }
      } else {
        // Reset form data for create mode
        setTimeSlotsLoadedFromBackend(false);
        setIsDeliveryTimeEnabled(true);
        setFormData({
          title: '',
          description: '',
          price: '',
          deliveryTime: '3-5 days',
          status: 'Public',
          color: '#667eea',
          photos: [],
          existingPhotos: [],
          primaryPhotoIndex: -1,
          paymentOption: 'later',
          splitDepositAmount: ''
        });
        setDeliveryTime({
          minTime: '3',
          maxTime: '5',
          unit: 'day'
        });

        // Reset calendar scheduling settings to defaults
        setIsSchedulingEnabled(false);
        setSessionDuration('60');
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

        // Reset scroll position to top when dialog opens
        setTimeout(() => {
          const dialogContent = document.querySelector('.MuiDialogContent-root');
          if (dialogContent) {
            dialogContent.scrollTop = 0;
          }
        }, 100);
      }
      setIsSubmitting(false);
    }
  }, [open, mode, initialService]);

  // Initialize delivery time on component mount
  useEffect(() => {
    if (isDeliveryTimeEnabled) {
      const formattedTime = formatDeliveryTime(deliveryTime);
      setFormData(prev => ({ ...prev, deliveryTime: formattedTime }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure default session length matches session duration
  useEffect(() => {
    if (sessionDuration !== defaultSessionLength) {
      setDefaultSessionLength(sessionDuration);
    }
  }, [sessionDuration, defaultSessionLength]);

  // Regenerate time slots when session duration or buffer time changes in time slot mode
  // But only if time slots weren't loaded from backend
  useEffect(() => {
    if (useTimeSlots && defaultSessionLength && !timeSlotsLoadedFromBackend) {
      setWeeklySchedule((prev) => prev.map((schedule) => ({
        ...schedule,
        timeSlots: schedule.enabled ? generateTimeSlots(schedule.timeBlocks, parseInt(defaultSessionLength)) : schedule.timeSlots
      })));
    }
  }, [defaultSessionLength, useTimeSlots, bufferTime, timeSlotsLoadedFromBackend]);

  // Restrict to single session duration when switching to time slot mode
  // No longer needed since we always use time slots and have single duration

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Provide the basic details for your service. This information will be displayed to clients.
            </Alert>

            <TextField
              label="Service Title"
              placeholder="e.g., Professional Music Production"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              fullWidth
              required
              helperText="Give your service a clear, descriptive name"
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
              helperText="Provide detailed information about what clients will receive"
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Set your pricing and delivery timeline. This helps clients understand what to expect.
            </Alert>

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
              helperText="Set your service price in USD"
            />

            {/* Earnings Breakdown - Only show when price is set and creative profile is available */}
            {(() => {
              // Debug logging
              console.log('[ServiceFormPopover] Earnings breakdown check:', {
                hasPrice: !!(formData.price && parseFloat(formData.price) > 0),
                hasProfile: !!creativeProfile,
                feePercentage: creativeProfile?.subscription_tier_fee_percentage,
                fullProfile: creativeProfile
              });
              return null;
            })()}
            {formData.price && parseFloat(formData.price) > 0 && creativeProfile?.subscription_tier_fee_percentage !== undefined && (
              <Box sx={{
                p: 2.5,
                borderRadius: 2,
                backgroundColor: 'rgba(76, 175, 80, 0.05)',
                border: '1px solid rgba(76, 175, 80, 0.2)'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'success.main' }}>
                  💰 Your Earnings Breakdown
                </Typography>
                {(() => {
                  const price = parseFloat(formData.price);
                  const feePercentage = creativeProfile.subscription_tier_fee_percentage;
                  const platformFee = price * feePercentage;
                  const yourEarnings = price - platformFee;
                  const feePercentageDisplay = (feePercentage * 100).toFixed(1);
                  
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Service Price:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${price.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Transaction Fee ({feePercentageDisplay}%):
                        </Typography>
                        <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                          -${platformFee.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        pt: 1,
                        borderTop: '1px solid rgba(76, 175, 80, 0.2)'
                      }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                          Your Earnings:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                          ${yourEarnings.toFixed(2)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                        You're on the {creativeProfile.subscription_tier_name || 'Basic'} plan
                      </Typography>
                    </Box>
                  );
                })()}
              </Box>
            )}

            {/* Payment Options - Only show when price is not free */}
            {formData.price && parseFloat(formData.price) > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Payment Options
                  </Typography>
                  <Tooltip
                    title="Choose how you want to receive payment from clients for this service"
                    placement="top"
                    arrow
                  >
                    <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                  </Tooltip>
                </Box>

                <RadioGroup
                  value={formData.paymentOption}
                  onChange={(e) => handleInputChange('paymentOption', e.target.value)}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Upfront Payment */}
                    <Paper
                      sx={{
                        p: 2,
                        border: '2px solid',
                        borderColor: formData.paymentOption === 'upfront' ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: formData.paymentOption === 'upfront' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(59, 130, 246, 0.02)',
                        }
                      }}
                      onClick={() => handleInputChange('paymentOption', 'upfront')}
                    >
                      <FormControlLabel
                        value="upfront"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Upfront Payment
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              Client pays the full amount before work begins
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                      />
                    </Paper>

                    {/* Split Payment */}
                    <Paper
                      sx={{
                        p: 2,
                        border: '2px solid',
                        borderColor: formData.paymentOption === 'split' ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: formData.paymentOption === 'split' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(59, 130, 246, 0.02)',
                        }
                      }}
                      onClick={() => handleInputChange('paymentOption', 'split')}
                    >
                      <FormControlLabel
                        value="split"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Split Payment
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              Client pays configurable amount upfront, remaining upon completion
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                      />
                    </Paper>

                    {/* Split Deposit Amount Input - Only shown when split payment is selected */}
                    {formData.paymentOption === 'split' && (
                      <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(59, 130, 246, 0.03)', borderRadius: 2, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
                          Configure Split Payment *
                        </Typography>
                        <TextField
                          label="First Payment (Paid Upfront)"
                          placeholder="e.g., 5.00"
                          value={formData.splitDepositAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string or valid positive numbers with up to 2 decimal places
                            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                              handleInputChange('splitDepositAmount', value);
                            }
                          }}
                          type="text"
                          fullWidth
                          required
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                          helperText={
                            (() => {
                              const price = parseFloat(formData.price);
                              const depositAmount = parseFloat(formData.splitDepositAmount || '0');
                              
                              if (!formData.price || isNaN(price)) {
                                return 'Amount client pays before work begins (required)';
                              }
                              
                              if (!formData.splitDepositAmount || formData.splitDepositAmount.trim() === '') {
                                return 'Amount client pays before work begins (required)';
                              }
                              
                              if (isNaN(depositAmount) || depositAmount <= 0) {
                                return 'Must be greater than $0';
                              }
                              
                              if (depositAmount >= price) {
                                return 'Must be less than total price (use Upfront Payment option for full payment)';
                              }
                              
                              const remainingAmount = (price - depositAmount).toFixed(2);
                              return `Later Payment (Paid After Completion): $${remainingAmount}`;
                            })()
                          }
                          error={
                            formData.splitDepositAmount !== '' && 
                            formData.price !== '' && 
                            (parseFloat(formData.splitDepositAmount) >= parseFloat(formData.price) || 
                             parseFloat(formData.splitDepositAmount) <= 0)
                          }
                          sx={{ mb: 0 }}
                        />
                        
                        {/* Split Payment Earnings Breakdown */}
                        {formData.price && formData.splitDepositAmount && creativeProfile?.subscription_tier_fee_percentage !== undefined && (
                          <Box sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(156, 39, 176, 0.05)',
                            border: '1px solid rgba(156, 39, 176, 0.2)'
                          }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#9c27b0' }}>
                              💜 Split Payment Earnings
                            </Typography>
                            {(() => {
                              const price = parseFloat(formData.price);
                              const depositAmount = parseFloat(formData.splitDepositAmount);
                              const remainingAmount = price - depositAmount;
                              const feePercentage = creativeProfile.subscription_tier_fee_percentage;
                              
                              const depositFee = depositAmount * feePercentage;
                              const remainingFee = remainingAmount * feePercentage;
                              const depositEarnings = depositAmount - depositFee;
                              const remainingEarnings = remainingAmount - remainingFee;
                              
                              return (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.875rem' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      First Payment (${depositAmount.toFixed(2)} - fee):
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#9c27b0' }}>
                                      ${depositEarnings.toFixed(2)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Later Payment (${remainingAmount.toFixed(2)} - fee):
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#9c27b0' }}>
                                      ${remainingEarnings.toFixed(2)}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })()}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Payment Later */}
                    <Paper
                      sx={{
                        p: 2,
                        border: '2px solid',
                        borderColor: formData.paymentOption === 'later' ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: formData.paymentOption === 'later' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(59, 130, 246, 0.02)',
                        }
                      }}
                      onClick={() => handleInputChange('paymentOption', 'later')}
                    >
                      <FormControlLabel
                        value="later"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Payment Later
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              Client pays after work is completed and delivered
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                      />
                    </Paper>
                  </Box>
                </RadioGroup>
              </Box>
            )}

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Estimated Delivery Time
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDeliveryTimeEnabled}
                      onChange={(e) => handleDeliveryTimeToggle(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={isDeliveryTimeEnabled ? 'Enabled' : 'Optional'}
                />
              </Box>

              {isDeliveryTimeEnabled && (
                <>
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
                      sx={{ width: 100 }}
                      size="small"
                      error={!validateDeliveryTime(deliveryTime) && parseInt(deliveryTime.minTime) > parseInt(deliveryTime.maxTime)}
                      helperText={!validateDeliveryTime(deliveryTime) && parseInt(deliveryTime.minTime) > parseInt(deliveryTime.maxTime) ? 'Min must be ≤ Max' : ''}
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
                      sx={{ width: 100 }}
                      size="small"
                      error={!validateDeliveryTime(deliveryTime) && parseInt(deliveryTime.minTime) > parseInt(deliveryTime.maxTime)}
                      helperText={!validateDeliveryTime(deliveryTime) && parseInt(deliveryTime.minTime) > parseInt(deliveryTime.maxTime) ? 'Max must be ≥ Min' : ''}
                    />

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={deliveryTime.unit}
                        onChange={(e) => handleDeliveryTimeChange('unit', e.target.value)}
                      >
                        {timeUnits.map((unit) => (
                          <MenuItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Validation Error */}
                  {!validateDeliveryTime(deliveryTime) && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Minimum time must be less than or equal to maximum time. Please adjust the values.
                    </Alert>
                  )}

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
                </>
              )}

              {!isDeliveryTimeEnabled && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Delivery time is optional. You can enable it above if you want to specify an estimated delivery time for this service.
                </Alert>
              )}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Upload up to 6 photos to showcase your service. This helps clients understand what you offer.
            </Alert>

            {/* Photo Upload Area */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Upload Button */}
              <Paper
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  textAlign: 'center',
                  backgroundColor: 'rgba(59, 130, 246, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderColor: 'primary.dark',
                  }
                }}
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                <input
                  id="photo-upload"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
                  Upload Photos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click to select photos from your device
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  PNG and JPEG files only • {(formData.photos.length + formData.existingPhotos.length)}/6 photos uploaded
                </Typography>
              </Paper>

              {/* Photo Grid */}
              {(formData.photos.length > 0 || formData.existingPhotos.length > 0) && (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 2 
                }}>
                  {/* Existing Photos */}
                  {formData.existingPhotos.map((photo, index) => (
                    <Card key={`existing-${index}`} sx={{ 
                      position: 'relative', 
                      aspectRatio: '1',
                      border: photo.is_primary ? '3px solid' : '1px solid',
                      borderColor: photo.is_primary ? 'primary.main' : 'divider'
                    }}>
                      <CardMedia
                        component="img"
                        image={photo.photo_url}
                        alt={`Existing service photo ${index + 1}`}
                        sx={{
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      
                      {/* Primary Photo Star */}
                      <IconButton
                        onClick={() => handleSetPrimaryExistingPhoto(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: photo.is_primary ? 'warning.main' : 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          }
                        }}
                        size="small"
                      >
                        {photo.is_primary ? (
                          <StarIcon fontSize="small" />
                        ) : (
                          <StarBorderIcon fontSize="small" />
                        )}
                      </IconButton>

                      {/* Delete Button */}
                      <IconButton
                        onClick={() => handleExistingPhotoRemove(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          }
                        }}
                        size="small"
                      >
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>

                      {/* Primary Photo Label */}
                      {photo.is_primary && (
                        <Box sx={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          right: 8,
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderRadius: 1,
                          py: 0.5,
                          px: 1
                        }}>
                          <Typography variant="caption" sx={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 600,
                            textAlign: 'center',
                            display: 'block'
                          }}>
                            Primary Photo
                          </Typography>
                        </Box>
                      )}
                    </Card>
                  ))}

                  {/* New Photos */}
                  {formData.photos.map((photo, index) => (
                    <Card key={`new-${index}`} sx={{ 
                      position: 'relative', 
                      aspectRatio: '1',
                      border: (formData.existingPhotos.length + index) === formData.primaryPhotoIndex ? '3px solid' : '1px solid',
                      borderColor: (formData.existingPhotos.length + index) === formData.primaryPhotoIndex ? 'primary.main' : 'divider'
                    }}>
                      <CardMedia
                        component="img"
                        image={URL.createObjectURL(photo)}
                        alt={`New service photo ${index + 1}`}
                        sx={{
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      
                      {/* Primary Photo Star */}
                      <IconButton
                        onClick={() => handleSetPrimaryPhoto(formData.existingPhotos.length + index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: (formData.existingPhotos.length + index) === formData.primaryPhotoIndex ? 'warning.main' : 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          }
                        }}
                        size="small"
                      >
                        {(formData.existingPhotos.length + index) === formData.primaryPhotoIndex ? (
                          <StarIcon fontSize="small" />
                        ) : (
                          <StarBorderIcon fontSize="small" />
                        )}
                      </IconButton>

                      {/* Delete Button */}
                      <IconButton
                        onClick={() => handlePhotoRemove(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          }
                        }}
                        size="small"
                      >
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>

                      {/* Primary Photo Label */}
                      {(formData.existingPhotos.length + index) === formData.primaryPhotoIndex && (
                        <Box sx={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          right: 8,
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderRadius: 1,
                          py: 0.5,
                          px: 1
                        }}>
                          <Typography variant="caption" sx={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 600,
                            textAlign: 'center',
                            display: 'block'
                          }}>
                            Primary Photo
                          </Typography>
                        </Box>
                      )}
                    </Card>
                  ))}
                </Box>
              )}

              {/* Primary Photo Instructions */}
              {(formData.photos.length > 0 || formData.existingPhotos.length > 0) && formData.primaryPhotoIndex === -1 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Please select a primary photo by clicking the star icon on one of your photos.
                </Alert>
              )}

              {/* Add More Photos Button */}
              {(formData.photos.length + formData.existingPhotos.length) > 0 && (formData.photos.length + formData.existingPhotos.length) < 6 && (
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Add More Photos ({6 - (formData.photos.length + formData.existingPhotos.length)} remaining)
                </Button>
              )}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Configure calendar scheduling options. This is optional but allows clients to book sessions directly.
            </Alert>

            <Box sx={{
              p: 2.5,
              borderRadius: 2,
              backgroundColor: '#f8f9fa',
              border: '1px solid rgba(0,0,0,0.06)',
              mb: 1.5
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Time Slot Mode Info */}
                <Box sx={{
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: '#f0f8ff',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  mb: 0.5
                }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      Predefined Time Slots
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Create specific appointment/session times. Clients book exact slots (e.g., 9:00 AM, 9:30 AM, 10:00 AM).
                    </Typography>
                  </Box>
                </Box>

                {/* Validation Message */}
                {!weeklySchedule.some(day => day.enabled) ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Calendar scheduling is enabled</strong> - Please configure at least one day in your weekly schedule to continue.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Great!</strong> You have configured your weekly schedule. You can now proceed to the next step.
                    </Typography>
                  </Alert>
                )}

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
                  {/* Session duration selection - time slots only */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Quick select common durations:
                    </Typography>
                    <RadioGroup
                      row
                      value={sessionDuration || ''}
                      onChange={(e) => {
                        const newDuration = e.target.value;
                        setSessionDuration(newDuration);
                        setDefaultSessionLength(newDuration);
                      }}
                      sx={{ mb: 2, flexWrap: 'wrap' }}
                    >
                      {commonDurations.map((opt) => (
                        <FormControlLabel
                          key={opt}
                          value={opt}
                          control={<Radio />}
                          label={`${opt} min`}
                        />
                      ))}
                    </RadioGroup>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Or enter custom duration (5-minute increments, 15-720 minutes):
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <TextField
                        type="number"
                        size="small"
                        value={sessionDuration || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value) >= 15 && parseInt(value) <= 720 && parseInt(value) % 5 === 0)) {
                            setSessionDuration(value);
                            setDefaultSessionLength(value);
                          }
                        }}
                        inputProps={{
                          min: 15,
                          max: 720,
                          step: 5
                        }}
                        sx={{ width: 120 }}
                        placeholder="e.g., 75"
                      />
                      <Typography variant="body2" color="text.secondary">
                        minutes
                      </Typography>
                    </Box>
                  </Box>
                </Box>


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
                          onChange={(e) => setMinNotice({ ...minNotice, unit: e.target.value as 'minutes' | 'hours' | 'days' })}
                          sx={{ borderRadius: 2, backgroundColor: '#f8f9fa' }}
                        >
                          <MenuItem value="minutes">Minutes</MenuItem>
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
                          onChange={(e) => setMaxAdvance({ ...maxAdvance, unit: e.target.value as 'hours' | 'days' | 'weeks' | 'months' })}
                          sx={{ borderRadius: 2, backgroundColor: '#f8f9fa' }}
                        >
                          <MenuItem value="hours">Hours</MenuItem>
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
                            <Tooltip 
                              title="Add a block of time when you're available for bookings. Each time block represents hours you can accept appointments (e.g., 9:00 AM - 12:00 PM for morning availability)."
                              arrow
                              placement="top"
                            >
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
                            </Tooltip>
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
        );

      case 4:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Customize your service appearance and review all settings before creating.
            </Alert>

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

            {/* Service Visibility Settings */}
            <Box sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#f8f9fa',
              border: '1px solid rgba(0,0,0,0.06)'
            }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Service Visibility
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose how and where your service will be available to clients.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Public Option */}
                <Box
                  onClick={() => handleInputChange('status', 'Public')}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    border: formData.status === 'Public' ? '2px solid #7A5FFF' : '2px solid transparent',
                    backgroundColor: formData.status === 'Public' ? '#f3f6ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#7A5FFF',
                      backgroundColor: '#f8f9ff'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: formData.status === 'Public' ? '#7A5FFF' : '#ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: formData.status === 'Public' ? '#7A5FFF' : 'transparent'
                    }}>
                      {formData.status === 'Public' && (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Public Service
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Available as a standalone service on your profile. Clients can book this service directly and it can be included in bundles.
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Bundle-Only Option */}
                <Box
                  onClick={() => handleInputChange('status', 'Bundle-Only')}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    border: formData.status === 'Bundle-Only' ? '2px solid #7A5FFF' : '2px solid transparent',
                    backgroundColor: formData.status === 'Bundle-Only' ? '#f3f6ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#7A5FFF',
                      backgroundColor: '#f8f9ff'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: formData.status === 'Bundle-Only' ? '#7A5FFF' : '#ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: formData.status === 'Bundle-Only' ? '#7A5FFF' : 'transparent'
                    }}>
                      {formData.status === 'Bundle-Only' && (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Bundle-Only Service
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only available as part of bundles. Perfect for services that complement others or encourage package deals. Won't appear as standalone.
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Private Option */}
                <Box
                  onClick={() => handleInputChange('status', 'Private')}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    border: formData.status === 'Private' ? '2px solid #7A5FFF' : '2px solid transparent',
                    backgroundColor: formData.status === 'Private' ? '#f3f6ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#7A5FFF',
                      backgroundColor: '#f8f9ff'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: formData.status === 'Private' ? '#7A5FFF' : '#ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: formData.status === 'Private' ? '#7A5FFF' : 'transparent'
                    }}>
                      {formData.status === 'Private' && (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Private Service
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only visible to you. Use for drafts, internal services, or services you're not ready to offer yet.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Service Preview */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                Service Preview
              </Typography>

              <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                <ServiceCard
                  title={formData.title || 'Service Title'}
                  description={formData.description || 'Service description will appear here...'}
                  price={parseFloat(formData.price) || 0}
                  delivery={isDeliveryTimeEnabled && formData.deliveryTime ? formData.deliveryTime : 'Not specified'}
                  status={formData.status}
                  creative="You"
                  color={formData.color}
                  showMenu={false}
                />
              </Box>

              {isSchedulingEnabled && (
                <Box sx={{
                  mt: 2,
                  maxWidth: 400,
                  mx: 'auto',
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: '#f0f8ff',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}>
                  <Box sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="caption" sx={{ color: 'white', fontSize: '12px', fontWeight: 600 }}>
                      📅
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="primary.main" fontWeight={500}>
                    Calendar scheduling enabled
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

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
        zIndex: isMobile ? 10000 : 1300,
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
        pb: 2,
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {onBack && (
            <IconButton onClick={onBack} size="small">
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {mode === 'edit' ? 'Edit Service' : 'Create Service'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{
        p: { xs: 2, sm: 3 },
        flex: '1 1 auto',
        overflowY: 'auto',
        minHeight: 0,
      }}>
        <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{
        p: { xs: 2, sm: 3 },
        pt: 1,
        flexShrink: 0,
        justifyContent: 'space-between'
      }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 && !onBack}
          startIcon={activeStep === 0 ? <ArrowBackIcon /> : undefined}
        >
          {activeStep === 0 ? 'Back' : 'Previous'}
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!isStepValid(activeStep) || isSubmitting}
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {mode === 'edit' ? 'Saving...' : 'Creating...'}
                  </Typography>
                  {formData.photos.length > 0 && uploadProgress > 0 && (
                    <Typography variant="caption" sx={{ color: 'inherit' }}>
                      {uploadProgress}%
                    </Typography>
                  )}
                </Box>
              ) : (
                mode === 'edit' ? 'Save Changes' : 'Create Service'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!isStepValid(activeStep)}
            >
              Next
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
