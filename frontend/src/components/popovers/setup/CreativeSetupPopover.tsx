import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
  Divider,
  Slide,
  Card,
  CardContent,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Star,
  TrendingUp,
  Diamond,
  Storage,
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';

import { errorToast, successToast } from '../../toast/toast';
import { userService } from '../../../api/userService';
import { useAuth } from '../../../context/auth';

export interface CreativeSetupPopoverProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  onBack?: () => void;
  isFirstSetup?: boolean;
  onComplete?: () => void;
}

const CREATIVE_TITLES = [
  'Other', // Move to top for easy access
  
  // Music & Audio
  'Music Creative',
  'Audio Engineer',
  'Mixing Engineer',
  'Mastering Engineer',
  'Beat Maker',
  'Composer',
  'Sound Designer',
  'Recording Engineer',
  'Session Musician',
  'Vocalist',
  'Songwriter',
  'Arranger',
  'DJ',
  'Podcast Creative',
  'Voice Over Artist',
  
  // Visual & Design
  'Graphic Designer',
  'UI/UX Designer',
  'Web Designer',
  'Logo Designer',
  'Brand Designer',
  'Illustrator',
  'Digital Artist',
  'Motion Graphics Designer',
  'Animator',
  '3D Artist',
  'Character Designer',
  'Concept Artist',
  
  // Video & Film
  'Video Editor',
  'Film Director',
  'Cinematographer',
  'Video Creative',
  'Documentary Filmmaker',
  'Content Creator',
  'YouTuber',
  'Colorist',
  'VFX Artist',
  
  // Photography
  'Photographer',
  'Portrait Photographer',
  'Wedding Photographer',
  'Product Photographer',
  'Event Photographer',
  'Photo Editor',
  'Retoucher',
  
  // Writing & Content
  'Writer',
  'Copywriter',
  'Content Writer',
  'Screenwriter',
  'Blogger',
  'Technical Writer',
  'Creative Writer',
  'Editor',
  'Proofreader',
  
  // Marketing & Social
  'Social Media Manager',
  'Digital Marketer',
  'SEO Specialist',
  'Email Marketing Specialist',
  'Influencer',
  
  // Development & Tech
  'Web Developer',
  'App Developer',
  'Game Developer',
  'Software Developer',
  
  // Other Creative Fields
  'Artist',
  'Painter',
  'Sculptor',
  'Fashion Designer',
  'Interior Designer',
  'Architect',
  'Consultant',
  'Coach',
  'Tutor',
] as const;

const SUBSCRIPTION_TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    subtitle: 'Free Forever',
    price: '$0',
    priceNum: 0,
    storage: '10GB',
    platformFee: '3.5%',
    color: '#10B981',
    icon: Star,
    features: ['10GB Storage', '3.5% Platform Fee', 'Basic Support', 'Standard Analytics'],
    popular: false,
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  },
  {
    id: 'growth',
    name: 'Growth',
    subtitle: 'Most Popular',
    price: '$25',
    priceNum: 25,
    storage: '50-100GB',
    platformFee: '2.0%',
    color: '#3B82F6',
    icon: TrendingUp,
    features: ['50-100GB Storage', '2.0% Platform Fee', 'Priority Support', 'Advanced Analytics', 'Custom Branding'],
    popular: true,
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Professional',
    price: '$125',
    priceNum: 125,
    storage: '200GB-1TB',
    platformFee: '0.5%',
    color: '#8B5CF6',
    icon: Diamond,
    features: ['200GB-1TB Storage', '0.5% Platform Fee', '24/7 Premium Support', 'Enterprise Analytics', 'White-label Options', 'API Access'],
    popular: false,
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  },
] as const;

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function CreativeSetupPopover({ 
  open, 
  onClose, 
  userName = '', 
  userEmail = '',
  onBack,
  isFirstSetup = true,
  onComplete
}: CreativeSetupPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile, backToPreviousSetup, saveSetupData, tempSetupData, pendingSetups, originalSelectedRoles } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    displayName: userProfile?.name || userName,
    title: '',
    customTitle: '',
    primaryContact: userProfile?.email || userEmail || '',
    secondaryContact: '',
    subscriptionTier: 'basic',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when userProfile loads or restore from temp data
  useEffect(() => {
    if (open) {
      if (tempSetupData.creative) {
        // Restore from temp data if available
        const tempData = tempSetupData.creative;
        setFormData({
          displayName: tempData.display_name || userProfile?.name || userName,
          title: tempData.title || '',
          customTitle: tempData.custom_title || '',
          primaryContact: tempData.primary_contact || userProfile?.email || userEmail || '',
          secondaryContact: tempData.secondary_contact || '',
          subscriptionTier: tempData.subscription_tier || 'basic',
        });
      } else if (userProfile) {
        setFormData(prev => ({
          ...prev,
          displayName: userProfile.name || prev.displayName,
          primaryContact: userProfile.email || prev.primaryContact,
        }));
      }
    }
  }, [userProfile, open, tempSetupData.creative, userName, userEmail]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.title) {
      newErrors.title = 'Title is required';
    }

    if (formData.title === 'Other' && !formData.customTitle.trim()) {
      newErrors.customTitle = 'Please specify your title';
    }

    // Validate contact fields - at least one should be provided
    if (!formData.primaryContact.trim() && !formData.secondaryContact.trim()) {
      newErrors.primaryContact = 'Please provide at least one contact method';
    }

    // Validate email format for any field that looks like an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.primaryContact && formData.primaryContact.includes('@') && !emailRegex.test(formData.primaryContact)) {
      newErrors.primaryContact = 'Please enter a valid email address';
    }
    if (formData.secondaryContact && formData.secondaryContact.includes('@') && !emailRegex.test(formData.secondaryContact)) {
      newErrors.secondaryContact = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      errorToast('Validation Error', 'Please fix the errors below');
      return;
    }

    setIsLoading(true);
    try {
      const setupData = {
        display_name: formData.displayName,
        title: formData.title,
        custom_title: formData.title === 'Other' ? formData.customTitle : undefined,
        primary_contact: formData.primaryContact || undefined,
        secondary_contact: formData.secondaryContact || undefined,
        subscription_tier: formData.subscriptionTier,
      };

      // If onComplete is provided, this is individual setup - call individual endpoint
      if (onComplete) {
        const response = await userService.setupCreativeProfile(setupData);
        
        if (response.success) {
          successToast('Creative Profile Created!', 'Your creative profile has been set up successfully.');
          onClose();
          onComplete();
        } else {
          errorToast('Setup Failed', response.message);
        }
        return;
      }

      // Otherwise, this is batch setup - save data temporarily
      saveSetupData('creative', setupData);
      
      // Check if this is the last setup - if so, commit all data to database
      const isLastSetup = pendingSetups.length === 1; // Current setup is the last one
      
      if (isLastSetup) {
        // This is the final setup - commit all data to database
        const batchData = {
          creative_data: setupData,
          client_data: tempSetupData.client,
          advocate_data: tempSetupData.advocate || undefined,
        };
        
        const response = await userService.batchSetupProfiles(batchData);
        
        if (response.success) {
          successToast('All Setups Complete!', 'Welcome to EZ! Your profiles have been created.');
          onClose();
        } else {
          errorToast('Setup Failed', response.message);
        }
      } else {
        // Not the last setup - just save and continue
        successToast('Creative Setup Saved!', 'Moving to next setup...');
        onClose();
      }
    } catch (err: any) {
      console.error('Creative setup error:', err);
      errorToast('Setup Failed', 'Unable to save creative setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTier = SUBSCRIPTION_TIERS.find(tier => tier.id === formData.subscriptionTier);

  return (
    <Dialog
      open={open}
      onClose={undefined} // Non-dismissible
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      maxWidth={false}
      disableEscapeKeyDown={true}
      sx={{
        zIndex: isMobile ? 10000 : 1300,
        '& .MuiDialog-paper': {
          zIndex: isMobile ? 10000 : 1300,
        }
      }}
      PaperProps={{
        sx: {
          ...(isMobile ? {
            borderRadius: 0,
            p: 0,
            backgroundColor: '#fff',
            boxShadow: theme.shadows[8],
            height: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 10000,
          } : isTablet ? {
            width: '95vw',
            maxWidth: '95vw',
            height: '90vh',
            maxHeight: '90vh',
            borderRadius: 3,
            boxShadow: '0 28px 60px rgba(0,0,0,0.22)',
            border: '1px solid rgba(122, 95, 255, 0.18)',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            m: '2.5vw',
            overflow: 'hidden',
          } : {
            width: 'min(1000px, 90vw)',
            maxWidth: '90vw',
            minHeight: 700,
            maxHeight: '90vh',
            borderRadius: 3,
            boxShadow: '0 28px 60px rgba(0,0,0,0.22)',
            border: '1px solid rgba(122, 95, 255, 0.18)',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            overflow: 'hidden',
          })
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: isMobile ? 'rgba(0,0,0,0.32)' : 'rgba(10, 10, 20, 0.45)',
            backdropFilter: isMobile ? 'none' : 'blur(2px)',
            zIndex: isMobile ? 9999 : 1299,
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 800,
          color: 'secondary.main',
          fontSize: '1.5rem',
          py: isMobile ? 5 : 4,
        }}
              >
          <Box 
            component="svg" 
            sx={{ 
              width: '2rem', 
              height: '2rem', 
              mr: 1, 
              verticalAlign: 'middle',
              display: 'inline-block'
            }}
            viewBox="0 0 24 24"
            fill="none"
          >
            {/* Creative diamond shape with gradient colors */}
            <path
              d="M12 3L18 9L12 21L6 9L12 3Z"
              fill="url(#creativeGradient)"
              stroke="white"
              strokeWidth="1"
            />
            
            {/* Define gradient */}
            <defs>
              <linearGradient id="creativeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="25%" stopColor="#4ECDC4" />
                <stop offset="50%" stopColor="#45B7D1" />
                <stop offset="75%" stopColor="#96CEB4" />
                <stop offset="100%" stopColor="#FECA57" />
              </linearGradient>
            </defs>
            
            {/* Sparkle effects */}
            <circle cx="8" cy="6" r="1" fill="#FFD700" opacity="0.8" />
            <circle cx="16" cy="7" r="0.8" fill="#FF69B4" opacity="0.7" />
            <circle cx="7" cy="14" r="0.6" fill="#00CED1" opacity="0.9" />
            <circle cx="17" cy="15" r="0.7" fill="#98FB98" opacity="0.8" />
          </Box>
          Set Up Your Creative Profile
        </DialogTitle>

      <Divider />

      <DialogContent sx={{ 
        pb: 2, 
        px: isMobile ? 2 : isTablet ? 3 : 4, 
        maxHeight: isMobile ? 'calc(100vh - 180px)' : isTablet ? 'calc(90vh - 180px)' : '500px', 
        overflow: 'auto',
        overflowX: 'hidden'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? 2.5 : isTablet ? 3 : 3.5, 
          py: isMobile ? 1.5 : 2,
          width: '100%',
          maxWidth: '100%'
        }}>
          
          {/* Basic Information */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.1rem',
              '&::before': {
                content: '""',
                width: 3,
                height: 18,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                mr: 1.5,
              }
            }}>
              Basic Information
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2.5,
              width: '100%',
              maxWidth: '100%'
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                gap: 2.5,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    error={!!errors.displayName}
                    helperText={errors.displayName}
                    required
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
                  <Autocomplete
                    options={CREATIVE_TITLES}
                    value={formData.title || null}
                    onChange={(_, newValue) => handleInputChange('title', newValue || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Title"
                        required
                        error={!!errors.title}
                        helperText={errors.title}
                        placeholder="Search or select your title..."
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        {option === 'Other' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: 'primary.main' }}>
                            ✨ {option}
                          </Box>
                        ) : (
                          option
                        )}
                      </Box>
                    )}
                    filterOptions={(options, { inputValue }) => {
                      const filtered = options.filter((option) =>
                        option.toLowerCase().includes(inputValue.toLowerCase())
                      );
                      
                      // Always show "Other" at the top of filtered results if it matches
                      if (inputValue.toLowerCase().includes('other') || inputValue === '') {
                        const withoutOther = filtered.filter(option => option !== 'Other');
                        return ['Other', ...withoutOther];
                      }
                      
                      return filtered;
                    }}
                    sx={{ width: '100%' }}
                    clearOnEscape
                    openOnFocus
                  />
                </Box>
              </Box>

              {formData.title === 'Other' && (
                <TextField
                  fullWidth
                  label="Custom Title"
                  value={formData.customTitle}
                  onChange={(e) => handleInputChange('customTitle', e.target.value)}
                  error={!!errors.customTitle}
                  helperText={errors.customTitle}
                  placeholder="Enter your custom title"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              )}

              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                gap: 2.5,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
                  <TextField
                    fullWidth
                    label="Primary Contact"
                    value={formData.primaryContact}
                    onChange={(e) => handleInputChange('primaryContact', e.target.value)}
                    error={!!errors.primaryContact}
                    helperText={errors.primaryContact || 'Email or phone number - for client communication'}
                    placeholder="email@example.com or +1234567890"
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
                  <TextField
                    fullWidth
                    label="Secondary Contact"
                    value={formData.secondaryContact}
                    onChange={(e) => handleInputChange('secondaryContact', e.target.value)}
                    error={!!errors.secondaryContact}
                    helperText={errors.secondaryContact || 'Optional - alternative contact method'}
                    placeholder="email@example.com or +1234567890"
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Subscription Tiers - The Flashiest Part */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 700, 
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #e879f9, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              '&::before': {
                content: '""',
                width: 3,
                height: 18,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #e879f9, #c084fc)',
                mr: 1.5,
              }
            }}>
              Choose Your Plan ✨
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.9rem' }}>
              Select the plan that best fits your needs. You can upgrade or downgrade anytime.
            </Typography>
            
            {/* Mobile View - Stacked Cards */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              {SUBSCRIPTION_TIERS.map((tier) => {
                const IconComponent = tier.icon;
                const isSelected = formData.subscriptionTier === tier.id;
                
                return (
                  <Box key={tier.id} sx={{ mb: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      {tier.popular && (
                        <Chip
                          label="Popular"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -10,
                            right: 12,
                            background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 20,
                            zIndex: 1,
                          }}
                        />
                      )}
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: isSelected ? `2px solid ${tier.color}` : '1px solid #e0e0e0',
                          borderRadius: 3,
                          transition: 'all 0.2s ease',
                          background: '#fff',
                          '&:hover': {
                            border: `2px solid ${tier.color}`,
                            boxShadow: `0 4px 20px ${tier.color}20`,
                          }
                        }}
                        onClick={() => handleInputChange('subscriptionTier', tier.id)}
                      >
                      <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 50 }}>
                          <IconComponent 
                            sx={{ 
                              fontSize: 32, 
                              color: tier.color,
                            }} 
                          />
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ color: tier.color, mb: 0.5 }}>
                            {tier.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {tier.storage} • {tier.platformFee} fee
                          </Typography>
                          <Typography variant="h5" fontWeight={800} sx={{ color: tier.color }}>
                            {tier.price}
                            <Typography component="span" variant="body2" sx={{ opacity: 0.7, fontWeight: 400 }}>
                              /month
                            </Typography>
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          border: `2px solid ${tier.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isSelected ? tier.color : 'transparent'
                        }}>
                          {isSelected && (
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: 'white' 
                            }} />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Desktop View - Side by Side Cards */}
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' },
              gap: 2,
              width: '100%'
            }}>
              {SUBSCRIPTION_TIERS.map((tier) => {
                const IconComponent = tier.icon;
                const isSelected = formData.subscriptionTier === tier.id;
                
                return (
                  <Box 
                    key={tier.id} 
                    sx={{ 
                      flex: 1,
                      minWidth: 0,
                      maxWidth: 'calc(33.333% - 11px)',
                      position: 'relative'
                    }}
                  >
                    {tier.popular && (
                      <Chip
                        label="🔥 Most Popular"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          zIndex: 1,
                        }}
                      />
                    )}
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: isSelected ? `3px solid ${tier.color}` : '3px solid #e0e0e0',
                        boxShadow: isSelected ? `0 8px 32px ${tier.color}30` : '0 2px 12px rgba(0,0,0,0.08)',
                        transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border 0.1s ease-out',
                        position: 'relative',
                        background: '#fff',
                        color: 'inherit',
                        height: '100%',
                        minHeight: 280,
                        borderRadius: 3,
                        '&:hover': {
                          boxShadow: `0 6px 25px ${tier.color}25`,
                          border: `3px solid ${tier.color}`,
                        }
                      }}
                      onClick={() => handleInputChange('subscriptionTier', tier.id)}
                    >
                      
                      <CardContent sx={{ 
                        textAlign: 'center', 
                        p: 2.5, 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column' 
                      }}>
                        <Box sx={{ mb: 1.5 }}>
                          <IconComponent 
                            sx={{ 
                              fontSize: 36, 
                              color: tier.color,
                              mb: 1,
                              filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none',
                            }} 
                          />
                          <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5, fontSize: '1.1rem' }}>
                            {tier.name}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.8rem' }}>
                            {tier.subtitle}
                          </Typography>
                        </Box>

                        <Typography variant="h4" fontWeight={900} sx={{ mb: 1.5, fontSize: '1.8rem' }}>
                          {tier.price}
                          <Typography component="span" variant="body2" sx={{ opacity: 0.7 }}>
                            /mo
                          </Typography>
                        </Typography>

                        <Box sx={{ 
                          mb: 1.5, 
                          p: 1.5, 
                          bgcolor: 'rgba(0,0,0,0.02)', 
                          borderRadius: 2,
                          flexGrow: 1,
                        }}>
                          <Typography variant="body2" fontWeight={600} sx={{ 
                            fontSize: '0.85rem', 
                            mb: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Storage sx={{ fontSize: 14, mr: 0.5 }} />
                            {tier.storage}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ 
                            fontSize: '0.8rem',
                            opacity: 0.8
                          }}>
                            {tier.platformFee} Platform Fee
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'left', mt: 'auto' }}>
                          {tier.features.slice(0, 3).map((feature, index) => (
                            <Typography key={index} variant="body2" sx={{ 
                              mb: 0.3, 
                              display: 'flex', 
                              alignItems: 'center',
                              fontSize: '0.75rem'
                            }}>
                              <Box sx={{ 
                                width: 4, 
                                height: 4, 
                                borderRadius: '50%', 
                                bgcolor: tier.color,
                                mr: 0.8,
                                flexShrink: 0
                              }} />
                              {feature}
                            </Typography>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          </Box>

        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ 
        px: isMobile ? 2 : isTablet ? 3 : 4, 
        py: isMobile ? 1 : 2, 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Back Button */}
        <Button
          onClick={isFirstSetup ? onBack : (onComplete ? onBack : backToPreviousSetup)}
          variant="outlined"
          size="large"
          disabled={isLoading}
          sx={{
            minWidth: isMobile ? 120 : 140,
            py: 1.5,
            px: isMobile ? 1 : 2,
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: 600,
            borderRadius: 2,
            borderColor: '#94a3b8',
            color: '#64748b',
            '&:hover': {
              borderColor: '#64748b',
              backgroundColor: '#f1f5f9',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isFirstSetup ? '← Back to Roles' : (onComplete ? 'Cancel' : '← Back to Previous')}
        </Button>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ 
            minWidth: isMobile ? 200 : isTablet ? 240 : 280,
            py: 1.5,
            px: isMobile ? 1 : 2,
            fontSize: isMobile ? '1rem' : isTablet ? '1.05rem' : '1.1rem',
            fontWeight: 700,
            borderRadius: 2,
            background: selectedTier?.gradient || 'linear-gradient(45deg, #3B82F6, #1D4ED8)',
            boxShadow: selectedTier ? `0 8px 25px ${selectedTier.color}40` : '0 8px 25px rgba(59, 130, 246, 0.4)',
            '&:hover': {
              background: selectedTier?.gradient || 'linear-gradient(45deg, #1D4ED8, #1E40AF)',
              transform: 'translateY(-2px)',
              boxShadow: selectedTier ? `0 12px 35px ${selectedTier.color}50` : '0 12px 35px rgba(59, 130, 246, 0.5)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isLoading ? 'Setting Up Your Profile...' : `🚀 Complete Creative Setup with ${selectedTier?.name} Plan`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
