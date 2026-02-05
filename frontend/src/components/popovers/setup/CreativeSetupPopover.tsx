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
import { userService, type SubscriptionTier } from '../../../api/userService';
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

// Helper function to map subscription tier name to icon and color
const getTierMetadata = (name: string) => {
  const nameLower = name.toLowerCase();
  if (nameLower === 'basic') {
    return {
      icon: Star,
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      subtitle: 'Free Forever',
      popular: false,
    };
  } else if (nameLower === 'growth') {
    return {
      icon: TrendingUp,
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      subtitle: 'Most Popular',
      popular: true,
    };
  } else if (nameLower === 'pro') {
    return {
      icon: Diamond,
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      subtitle: 'Professional',
      popular: false,
    };
  }
  // Default fallback
  return {
    icon: Star,
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    subtitle: '',
    popular: false,
  };
};

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
  const { userProfile, backToPreviousSetup, saveSetupData, tempSetupData, pendingSetups } = useAuth();

  // Subscription tiers state
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    displayName: userProfile?.name || userName,
    title: '',
    customTitle: '',
    primaryContact: userProfile?.email || userEmail || '',
    secondaryContact: '',
    subscriptionTierId: '', // Will be set after tiers are loaded
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch subscription tiers on mount
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        setLoadingTiers(true);
        const tiers = await userService.getSubscriptionTiers();
        setSubscriptionTiers(tiers);
        
        // Set default to basic tier (first one or the one named 'basic')
        const basicTier = tiers.find(t => t.name.toLowerCase() === 'basic') || tiers[0];
        if (basicTier) {
          setFormData(prev => ({
            ...prev,
            subscriptionTierId: prev.subscriptionTierId || basicTier.id,
          }));
        }
      } catch {
        errorToast('Error', 'Failed to load subscription options');
      } finally {
        setLoadingTiers(false);
      }
    };

    if (open) {
      fetchTiers();
    }
  }, [open]);

  // Update form data when userProfile loads or restore from temp data
  useEffect(() => {
    if (open && subscriptionTiers.length > 0) {
      if (tempSetupData.creative) {
        // Restore from temp data if available
        const tempData = tempSetupData.creative;
        setFormData({
          displayName: tempData.display_name || userProfile?.name || userName,
          title: tempData.title || '',
          customTitle: tempData.custom_title || '',
          primaryContact: tempData.primary_contact || userProfile?.email || userEmail || '',
          secondaryContact: tempData.secondary_contact || '',
          subscriptionTierId: tempData.subscription_tier_id || subscriptionTiers.find(t => t.name.toLowerCase() === 'basic')?.id || subscriptionTiers[0]?.id || '',
        });
      } else if (userProfile) {
        setFormData(prev => ({
          ...prev,
          displayName: userProfile.name || prev.displayName,
          primaryContact: userProfile.email || prev.primaryContact,
          subscriptionTierId: prev.subscriptionTierId || subscriptionTiers.find(t => t.name.toLowerCase() === 'basic')?.id || subscriptionTiers[0]?.id || '',
        }));
      }
    }
  }, [userProfile, open, tempSetupData.creative, userName, userEmail, subscriptionTiers]);

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
        subscription_tier_id: formData.subscriptionTierId,
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
          // Let the auth context handle redirection after setup completion
        } else {
          errorToast('Setup Failed', response.message);
        }
      } else {
        // Not the last setup - just save and continue
        successToast('Creative Setup Saved!', 'Moving to next setup...');
        onClose();
      }
    } catch {
      errorToast('Setup Failed', 'Unable to save creative setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTier = subscriptionTiers.find(tier => tier.id === formData.subscriptionTierId);
  const selectedTierMetadata = selectedTier ? getTierMetadata(selectedTier.name) : null;

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
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          {option === 'Other' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: 'primary.main' }}>
                              ✨ {option}
                            </Box>
                          ) : (
                            option
                          )}
                        </Box>
                      );
                    }}
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
                    slotProps={{
                      popper: {
                        sx: {
                          zIndex: isMobile ? 10001 : 1301, // Higher than dialog z-index
                        }
                      }
                    }}
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
              {loadingTiers ? (
                <Typography>Loading subscription options...</Typography>
              ) : subscriptionTiers.map((tier) => {
                const metadata = getTierMetadata(tier.name);
                const IconComponent = metadata.icon;
                const isSelected = formData.subscriptionTierId === tier.id;
                
                return (
                  <Box key={tier.id} sx={{ mb: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      {metadata.popular && (
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
                      border: isSelected ? `2px solid ${metadata.color}` : '1px solid #e0e0e0',
                      borderRadius: 3,
                      transition: 'all 0.2s ease',
                      background: '#fff',
                      '&:hover': {
                        border: `2px solid ${metadata.color}`,
                        boxShadow: `0 4px 20px ${metadata.color}20`,
                      }
                        }}
                        onClick={() => handleInputChange('subscriptionTierId', tier.id)}
                      >
                      <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 50 }}>
                          <IconComponent 
                            sx={{ 
                              fontSize: 32, 
                              color: metadata.color,
                            }} 
                          />
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ color: metadata.color, mb: 0.5 }}>
                            {tier.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {tier.storage_display} • {(tier.fee_percentage * 100).toFixed(1)}% fee
                          </Typography>
                          <Typography variant="h5" fontWeight={800} sx={{ color: metadata.color }}>
                            ${tier.price}
                            <Typography component="span" variant="body2" sx={{ opacity: 0.7, fontWeight: 400 }}>
                              /month
                            </Typography>
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          border: `2px solid ${metadata.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isSelected ? metadata.color : 'transparent'
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
              {loadingTiers ? (
                <Typography>Loading subscription options...</Typography>
              ) : subscriptionTiers.map((tier) => {
                const metadata = getTierMetadata(tier.name);
                const IconComponent = metadata.icon;
                const isSelected = formData.subscriptionTierId === tier.id;
                
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
                    {metadata.popular && (
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
                        border: isSelected ? `3px solid ${metadata.color}` : '3px solid #e0e0e0',
                        boxShadow: isSelected ? `0 8px 32px ${metadata.color}30` : '0 2px 12px rgba(0,0,0,0.08)',
                        transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border 0.1s ease-out',
                        position: 'relative',
                        background: '#fff',
                        color: 'inherit',
                        height: '100%',
                        minHeight: 280,
                        borderRadius: 3,
                        '&:hover': {
                          boxShadow: `0 6px 25px ${metadata.color}25`,
                          border: `3px solid ${metadata.color}`,
                        }
                      }}
                      onClick={() => handleInputChange('subscriptionTierId', tier.id)}
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
                              color: metadata.color,
                              mb: 1,
                              filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none',
                            }} 
                          />
                          <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5, fontSize: '1.1rem' }}>
                            {tier.name}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.8rem' }}>
                            {metadata.subtitle}
                          </Typography>
                        </Box>

                        <Typography variant="h4" fontWeight={900} sx={{ mb: 1.5, fontSize: '1.8rem' }}>
                          ${tier.price}
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
                            {tier.storage_display}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ 
                            fontSize: '0.8rem',
                            opacity: 0.8
                          }}>
                            {(tier.fee_percentage * 100).toFixed(1)}% Platform Fee
                          </Typography>
                        </Box>

                        {tier.description && (
                          <Box sx={{ textAlign: 'left', mt: 'auto' }}>
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.75rem',
                              color: 'text.secondary'
                            }}>
                              {tier.description}
                            </Typography>
                          </Box>
                        )}
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
        py: isMobile ? 2 : 2, 
        pb: isMobile ? 10 : 2, 
        justifyContent: 'space-between',
        alignItems: 'center',
        position: isMobile ? 'sticky' : 'relative',
        bottom: isMobile ? 0 : 'auto',
        backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.98)' : 'transparent',
        backdropFilter: isMobile ? 'blur(8px)' : 'none',
        borderTop: isMobile ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
        zIndex: isMobile ? 1000 : 'auto',
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
            background: selectedTierMetadata?.gradient || 'linear-gradient(45deg, #3B82F6, #1D4ED8)',
            boxShadow: selectedTierMetadata ? `0 8px 25px ${selectedTierMetadata.color}40` : '0 8px 25px rgba(59, 130, 246, 0.4)',
            '&:hover': {
              background: selectedTierMetadata?.gradient || 'linear-gradient(45deg, #1D4ED8, #1E40AF)',
              transform: 'translateY(-2px)',
              boxShadow: selectedTierMetadata ? `0 12px 35px ${selectedTierMetadata.color}50` : '0 12px 35px rgba(59, 130, 246, 0.5)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isLoading ? 'Setting Up Your Profile...' : `🚀 Complete Creative Setup${selectedTier ? ` with ${selectedTier.name} Plan` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
