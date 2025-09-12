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
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      fullScreen={isMobile}
      slots={{ transition: Transition }}
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
