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
  Autocomplete,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';

import { errorToast, successToast } from '../../../components/toast/toast';
import { userService } from '../../../api/userService';
import { useAuth } from '../../../context/auth';

export interface ClientSetupPopoverProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  onBack?: () => void;
  isFirstSetup?: boolean;
  onComplete?: () => void;
}

const CLIENT_TITLES = [
  'Other', // Move to top for easy access
  
  // Music Industry Clients
  'Recording Artist',
  'Singer-Songwriter',
  'Band Member',
  'Music Producer',
  'Record Label',
  'Music Manager',
  'A&R Representative',
  'Music Publisher',
  'Independent Artist',
  'Country Artist',
  'Hip Hop Artist',
  'Pop Artist',
  'Rock Artist',
  'Electronic Artist',
  'Jazz Musician',
  'Classical Musician',
  'Folk Artist',
  'R&B Artist',
  'Rapper',
  'DJ',
  'Songwriter',
  'Composer',
  'Music Director',
  
  // Media & Entertainment
  'Filmmaker',
  'Video Producer',
  'Content Creator',
  'YouTuber',
  'Podcaster',
  'Radio Host',
  'TV Producer',
  'Documentary Maker',
  'Commercial Producer',
  'Music Video Director',
  
  // Business & Corporate
  'Marketing Manager',
  'Brand Manager',
  'Creative Director',
  'Advertising Executive',
  'Small Business Owner',
  'Startup Founder',
  'Event Planner',
  'Wedding Planner',
  'Corporate Executive',
  'Entrepreneur',
  
  // Publishing & Media
  'Author',
  'Publisher',
  'Magazine Editor',
  'Journalist',
  'Blogger',
  'Social Media Manager',
  'Influencer',
  
  // Technology & Digital
  'App Developer',
  'Software Company',
  'Tech Startup',
  'Gaming Company',
  'Digital Agency',
  'Web Development Agency',
  
  // Other Creative Industries
  'Fashion Designer',
  'Interior Designer',
  'Architect',
  'Art Gallery',
  'Museum',
  'Theater Producer',
  'Event Organizer',
  'Non-Profit Organization',
  'Educational Institution',
  'Client',
] as const;

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function ClientSetupPopover({ 
  open, 
  onClose, 
  userName = '', 
  userEmail = '',
  onBack,
  isFirstSetup = false,
  onComplete
}: ClientSetupPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile, backToPreviousSetup, saveSetupData, tempSetupData, pendingSetups } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    displayName: userProfile?.name || userName,
    title: '',
    customTitle: '',
    email: userProfile?.email || userEmail || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when userProfile loads or restore from temp data
  useEffect(() => {
    if (open) {
      if (tempSetupData.client) {
        // Restore from temp data if available
        const tempData = tempSetupData.client;
        setFormData({
          displayName: tempData.display_name || userProfile?.name || userName,
          title: tempData.title || '',
          customTitle: tempData.custom_title || '',
          email: tempData.email || userProfile?.email || userEmail || '',
        });
      } else if (userProfile) {
        setFormData(prev => ({
          ...prev,
          displayName: userProfile.name || prev.displayName,
          email: userProfile.email || prev.email,
        }));
      }
    }
  }, [userProfile, open, tempSetupData.client, userName, userEmail]);

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
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
        email: formData.email,
      };

      // If onComplete is provided, this is individual setup - call individual endpoint
      if (onComplete) {
        const response = await userService.setupClientProfile(setupData);
        
        if (response.success) {
          successToast('Client Profile Created!', 'Your client profile has been set up successfully.');
          onClose();
          onComplete();
        } else {
          errorToast('Setup Failed', response.message);
        }
        return;
      }

      // Otherwise, this is batch setup - save data temporarily
      saveSetupData('client', setupData);
      
      // Check if this is the last setup - if so, commit all data to database
      const isLastSetup = pendingSetups.length === 1; // Current setup is the last one
      
      if (isLastSetup) {
        // This is the final setup - commit all data to database
        const batchData = {
          creative_data: tempSetupData.creative,
          client_data: setupData,
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
        successToast('Client Setup Saved!', 'Moving to next setup...');
        onClose();
      }
    } catch (err: any) {
      console.error('Client setup error:', err);
      errorToast('Setup Failed', 'Unable to save client setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            border: '1px solid rgba(59, 130, 246, 0.18)',
            background: 'linear-gradient(180deg, #ffffff 0%, #f0f8ff 100%)',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            m: '2.5vw',
            overflow: 'hidden',
          } : {
            width: 'min(800px, 90vw)',
            maxWidth: '90vw',
            minHeight: 500,
            maxHeight: '90vh',
            borderRadius: 3,
            boxShadow: '0 28px 60px rgba(0,0,0,0.22)',
            border: '1px solid rgba(59, 130, 246, 0.18)',
            background: 'linear-gradient(180deg, #ffffff 0%, #f0f8ff 100%)',
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
          color: 'primary.main',
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
          {/* Client briefcase/business icon */}
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            fill="url(#clientGradient)"
            stroke="white"
            strokeWidth="1"
          />
          <path
            d="M2 17L12 22L22 17"
            fill="url(#clientGradient)"
            stroke="white"
            strokeWidth="1"
          />
          <path
            d="M2 12L12 17L22 12"
            fill="url(#clientGradient)"
            stroke="white"
            strokeWidth="1"
          />
          
          {/* Define gradient */}
          <defs>
            <linearGradient id="clientGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
          </defs>
          
          {/* Business sparkle effects */}
          <circle cx="6" cy="5" r="0.8" fill="#60A5FA" opacity="0.8" />
          <circle cx="18" cy="6" r="0.6" fill="#93C5FD" opacity="0.7" />
          <circle cx="5" cy="15" r="0.7" fill="#DBEAFE" opacity="0.9" />
          <circle cx="19" cy="16" r="0.5" fill="#BFDBFE" opacity="0.8" />
        </Box>
        Set Up Your Client Profile
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ 
        pb: 2, 
        px: isMobile ? 2 : isTablet ? 3 : 4, 
        maxHeight: isMobile ? 'calc(100vh - 180px)' : isTablet ? 'calc(90vh - 180px)' : '400px', 
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
                    options={CLIENT_TITLES}
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

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email || 'Primary email for project communication'}
                placeholder="your.email@example.com"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
          </Box>

        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ 
        px: isMobile ? 2 : isTablet ? 3 : 4, 
        py: isMobile ? 2 : 2, 
        pb: isMobile ? 10 : 2, // Extra bottom padding on mobile to avoid interface elements
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
            minWidth: isMobile ? 180 : isTablet ? 220 : 260,
            py: 1.5,
            px: isMobile ? 1 : 2,
            fontSize: isMobile ? '1rem' : isTablet ? '1.05rem' : '1.1rem',
            fontWeight: 700,
            borderRadius: 2,
            background: 'linear-gradient(45deg, #3B82F6, #1D4ED8)',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1D4ED8, #1E40AF)',
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 35px rgba(59, 130, 246, 0.5)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isLoading ? 'Setting Up Your Profile...' : '🚀 Complete Client Setup'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
