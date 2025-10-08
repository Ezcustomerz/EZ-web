import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton, 
  Box, 
  useTheme, 
  useMediaQuery, 
  Slide,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Alert,
  InputAdornment,
  Popover
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem } from '@fortawesome/free-solid-svg-icons';
import { userService, type CreativeService } from '../../../api/userService';
import { errorToast, successToast } from '../../toast/toast';
import { BundleCard } from '../../cards/creative/BundleCard';
import { useAuth } from '../../../context/auth';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface BundleCreationPopoverProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onBundleCreated?: (bundle: any) => void;
  editingBundle?: any; // Bundle data for editing mode
}

interface BundleFormData {
  title: string;
  description: string;
  selectedServices: string[];
  pricingType: 'fixed' | 'discount';
  fixedPrice: number;
  discountPercentage: number;
  status: 'Public' | 'Private';
  color: string;
}

const defaultColors = [
  '#7A5FFF', '#667eea', '#f093fb', '#f5576c', 
  '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
  '#fa709a', '#fee140', '#a8edea', '#fed6e3'
];

const steps = [
  'Bundle Details',
  'Select Services', 
  'Set Pricing',
  'Review & Create'
];

export function BundleCreationPopover({ 
  open, 
  onClose, 
  onBack,
  onBundleCreated,
  editingBundle 
}: BundleCreationPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [services, setServices] = useState<CreativeService[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null);
  
  const [formData, setFormData] = useState<BundleFormData>({
    title: '',
    description: '',
    selectedServices: [],
    pricingType: 'discount',
    fixedPrice: 0,
    discountPercentage: 10,
    status: 'Public',
    color: defaultColors[0]
  });

  // Initialize form data when editing
  useEffect(() => {
    if (editingBundle && open) {
      setFormData({
        title: editingBundle.title || '',
        description: editingBundle.description || '',
        selectedServices: editingBundle.services?.map((s: any) => s.id) || [],
        pricingType: editingBundle.pricing_option || 'discount',
        fixedPrice: editingBundle.fixed_price || 0,
        discountPercentage: editingBundle.discount_percentage || 10,
        status: editingBundle.status || 'Public',
        color: editingBundle.color || defaultColors[0]
      });
    } else if (!editingBundle && open) {
      // Reset form data for new bundle creation
      setFormData({
        title: '',
        description: '',
        selectedServices: [],
        pricingType: 'discount',
        fixedPrice: 0,
        discountPercentage: 10,
        status: 'Public',
        color: defaultColors[0]
      });
    }
  }, [editingBundle, open]);

  // Reset form when popover is closed
  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setFormData({
        title: '',
        description: '',
        selectedServices: [],
        pricingType: 'discount',
        fixedPrice: 0,
        discountPercentage: 10,
        status: 'Public',
        color: defaultColors[0]
      });
    }
  }, [open]);

  // Fetch available services
  useEffect(() => {
    if (open && isAuthenticated) {
      fetchServices();
    }
  }, [open, formData.status, isAuthenticated]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Only fetch services if user is authenticated
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping services fetch');
        setServices([]);
        return;
      }
      
      const response = await userService.getCreativeServices();
      // Filter for active services that are available for bundles
      // Include private services only if the bundle is private
      setServices(response.services.filter(service => {
        if (!service.is_active) return false;
        
        // Always include Public and Bundle-Only services
        if (service.status === 'Public' || service.status === 'Bundle-Only') {
          return true;
        }
        
        // Include Private services only if the bundle is private
        if (service.status === 'Private' && formData.status === 'Private') {
          return true;
        }
        
        return false;
      }));
    } catch (error) {
      console.error('Failed to fetch services:', error);
      errorToast('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BundleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  const selectedServicesData = useMemo(() => {
    return services.filter(service => formData.selectedServices.includes(service.id));
  }, [services, formData.selectedServices]);

  const totalIndividualPrice = useMemo(() => {
    return selectedServicesData.reduce((sum, service) => sum + service.price, 0);
  }, [selectedServicesData]);

  const bundlePrice = useMemo(() => {
    if (formData.pricingType === 'fixed') {
      return formData.fixedPrice;
    } else {
      const discountAmount = (totalIndividualPrice * formData.discountPercentage) / 100;
      return totalIndividualPrice - discountAmount;
    }
  }, [formData.pricingType, formData.fixedPrice, formData.discountPercentage, totalIndividualPrice]);

  const savings = useMemo(() => {
    return totalIndividualPrice - bundlePrice;
  }, [totalIndividualPrice, bundlePrice]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleCreateBundle = async () => {
    try {
      setSaving(true);
      
      // Prepare bundle data for API call
      const bundleData = {
        title: formData.title,
        description: formData.description,
        color: formData.color,
        status: formData.status,
        pricing_option: formData.pricingType,
        fixed_price: formData.pricingType === 'fixed' ? formData.fixedPrice : undefined,
        discount_percentage: formData.pricingType === 'discount' ? formData.discountPercentage : undefined,
        service_ids: formData.selectedServices
      };
      
      let response;
      if (editingBundle) {
        // Update existing bundle
        response = await userService.updateBundle(editingBundle.id, bundleData);
        if (response.success) {
          successToast('Bundle updated successfully!');
        } else {
          errorToast(response.message || 'Failed to update bundle');
        }
      } else {
        // Create new bundle
        response = await userService.createBundle(bundleData);
        if (response.success) {
          successToast('Bundle created successfully!');
        } else {
          errorToast(response.message || 'Failed to create bundle');
        }
      }
      
      if (response.success) {
        onBundleCreated?.(formData);
        onClose();
      }
    } catch (error: any) {
      console.error(`Failed to ${editingBundle ? 'update' : 'create'} bundle:`, error);
      const errorMessage = error.response?.data?.detail || `Failed to ${editingBundle ? 'update' : 'create'} bundle. Please try again.`;
      errorToast(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.title.trim().length > 0 && formData.description.trim().length > 0;
      case 1:
        return formData.selectedServices.length >= 2;
      case 2:
        return formData.pricingType === 'fixed' ? formData.fixedPrice > 0 : true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Bundle Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Complete Music Production Package"
              fullWidth
              required
              helperText="Give your bundle a compelling name"
            />
            
            <TextField
              label="Bundle Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what's included in this bundle and its benefits..."
              fullWidth
              multiline
              rows={4}
              required
              helperText="Explain what clients get with this bundle"
            />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <MenuItem value="Public">Public</MenuItem>
                  <MenuItem value="Private">Private</MenuItem>
                </Select>
              </FormControl>

            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Select at least 2 services to create a bundle. 
                {formData.status === 'Private' ? (
                  <>
                    <strong>Public</strong>, <strong>Private</strong>, and <strong>Bundle-Only</strong> services can be included in private bundles.
                  </>
                ) : (
                  <>
                    Only <strong>Public</strong> and <strong>Bundle-Only</strong> services can be included in public bundles.
                  </>
                )}
              </Typography>
            </Alert>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>Loading services...</Typography>
              </Box>
            ) : services.length === 0 ? (
              <Alert severity="warning">
                You need to create some services first before you can create a bundle.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {services.map((service) => (
                  <Card
                    key={service.id}
                    onClick={() => handleServiceToggle(service.id)}
                    sx={{
                      cursor: 'pointer',
                      border: formData.selectedServices.includes(service.id) 
                        ? `2px solid ${formData.color}` 
                        : '2px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: formData.color,
                        boxShadow: `0 4px 12px ${formData.color}20`
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              backgroundColor: service.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FontAwesomeIcon icon={faGem} style={{ color: '#fff', fontSize: '16px' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {service.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {service.description}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" color="primary" fontWeight={600}>
                            ${service.price}
                          </Typography>
                          {formData.selectedServices.includes(service.id) && (
                            <CheckIcon color="primary" />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {formData.selectedServices.length > 0 && (
              <Alert 
                severity={formData.selectedServices.length >= 2 ? "success" : "warning"} 
                sx={{ mt: 2 }}
              >
                {formData.selectedServices.length >= 2 
                  ? `${formData.selectedServices.length} services selected for your bundle.`
                  : `Only ${formData.selectedServices.length} service selected. You need at least 2 services to create a bundle.`
                }
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Choose how you want to price your bundle. You can set a fixed price or offer a discount percentage.
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Pricing Type</InputLabel>
              <Select
                value={formData.pricingType}
                label="Pricing Type"
                onChange={(e) => handleInputChange('pricingType', e.target.value)}
              >
                <MenuItem value="discount">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PercentIcon fontSize="small" />
                    Discount Percentage
                  </Box>
                </MenuItem>
                <MenuItem value="fixed">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoneyIcon fontSize="small" />
                    Fixed Price
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {formData.pricingType === 'discount' ? (
              <TextField
                label="Discount Percentage"
                type="number"
                value={formData.discountPercentage}
                onChange={(e) => handleInputChange('discountPercentage', Math.max(0, Math.min(100, Number(e.target.value))))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                helperText="Enter a discount percentage (0-100%)"
                fullWidth
              />
            ) : (
              <TextField
                label="Bundle Price"
                type="number"
                value={formData.fixedPrice}
                onChange={(e) => handleInputChange('fixedPrice', Math.max(0, Number(e.target.value)))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                helperText="Set a fixed price for the entire bundle"
                fullWidth
              />
            )}

            {selectedServicesData.length > 0 && (
              <Card variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  Pricing Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Individual Services Total:</Typography>
                    <Typography>${totalIndividualPrice.toFixed(2)}</Typography>
                  </Box>
                  {formData.pricingType === 'discount' && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Discount ({formData.discountPercentage}%):</Typography>
                      <Typography color="success.main">-${((totalIndividualPrice * formData.discountPercentage) / 100).toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={600}>Bundle Price:</Typography>
                    <Typography variant="h6" fontWeight={600} color="primary">
                      ${bundlePrice.toFixed(2)}
                    </Typography>
                  </Box>
                  {savings > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="success.main" fontWeight={600}>Client Saves:</Typography>
                      <Typography color="success.main" fontWeight={600}>
                        ${savings.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="success">
              Review your bundle details before creating it.
            </Alert>

            {/* Bundle Color Selection */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Bundle Color Theme
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a color theme for your bundle. This will be used in the bundle display and branding.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Preset Colors */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {defaultColors.map((color) => (
                    <Box
                      key={color}
                      onClick={() => handleInputChange('color', color)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.color === color ? '3px solid #fff' : '2px solid transparent',
                        boxShadow: formData.color === color ? '0 0 0 2px #7A5FFF' : '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                        }
                      }}
                    />
                  ))}
                </Box>
                
                {/* Custom Color Picker */}
                <Button
                  variant="outlined"
                  onClick={(e) => setColorPickerAnchor(e.currentTarget)}
                  sx={{
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: 'primary.light',
                      color: 'primary.dark'
                    }
                  }}
                >
                  Custom Color
                </Button>
              </Box>
              
              {/* Color Picker Popover */}
              <Popover
                open={Boolean(colorPickerAnchor)}
                anchorEl={colorPickerAnchor}
                onClose={() => setColorPickerAnchor(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Choose Custom Color
                  </Typography>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                </Box>
              </Popover>
            </Box>

            {/* Bundle Preview Header */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                Bundle Preview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This is how your bundle will appear to clients
              </Typography>
            </Box>

             {/* Bundle Preview using BundleCard */}
             <Box sx={{ width: '100%' }}>
              <BundleCard
                bundle={{
                  id: editingBundle?.id || 'preview',
                  title: formData.title,
                  description: formData.description,
                  color: formData.color,
                  status: formData.status,
                  pricing_option: formData.pricingType,
                  fixed_price: formData.pricingType === 'fixed' ? formData.fixedPrice : undefined,
                  discount_percentage: formData.pricingType === 'discount' ? formData.discountPercentage : undefined,
                  total_services_price: totalIndividualPrice,
                  final_price: bundlePrice,
                  services: selectedServicesData.map(service => ({
                    id: service.id,
                    title: service.title,
                    description: service.description,
                    price: service.price,
                    delivery_time: service.delivery_time,
                    status: service.status,
                    color: service.color
                  })),
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }}
                creative="You"
                showStatus={true}
              />
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
              {editingBundle ? 'Edit Bundle' : 'Create Bundle'}
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
              onClick={handleCreateBundle}
              variant="contained"
              disabled={!isStepValid(activeStep) || saving}
              startIcon={saving ? undefined : <CheckIcon />}
              sx={{ minWidth: 120 }}
            >
              {saving ? (editingBundle ? 'Updating...' : 'Creating...') : (editingBundle ? 'Update Bundle' : 'Create Bundle')}
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
