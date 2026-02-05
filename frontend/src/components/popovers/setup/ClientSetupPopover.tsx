import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Slide,
  Divider,
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
  onComplete
}: ClientSetupPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const { userProfile, saveSetupData, tempSetupData, pendingSetups } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    displayName: userProfile?.name || userName,
    email: userProfile?.email || userEmail || '',
  });

  // Auto-submit when dialog opens
  useEffect(() => {
    if (open && userProfile) {
      setFormData({
        displayName: userProfile.name || userName,
        email: userProfile.email || userEmail || '',
      });
      // Automatically submit the setup
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userProfile]);

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      return false;
    }

    if (!formData.email.trim()) {
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      errorToast('Validation Error', 'Missing required information');
      onClose();
      return;
    }

    try {
      const setupData: { display_name: string; email: string } = {
        display_name: formData.displayName,
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
    } catch {
      errorToast('Setup Failed', 'Unable to save client setup. Please try again.');
      onClose();
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
        minHeight: isMobile ? 'calc(100vh - 180px)' : isTablet ? 'calc(90vh - 180px)' : '200px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 3,
          py: 4
        }}>
          <Box 
            component="svg" 
            sx={{ 
              width: '4rem', 
              height: '4rem',
              animation: 'spin 2s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
            viewBox="0 0 24 24"
            fill="none"
          >
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
            <defs>
              <linearGradient id="clientGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#1D4ED8" />
                <stop offset="100%" stopColor="#1E40AF" />
              </linearGradient>
            </defs>
          </Box>
          
          <Typography variant="h5" fontWeight={700} color="primary.main" textAlign="center">
            Setting Up Your Client Profile...
          </Typography>
          
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
            Please wait while we create your client account. This will only take a moment.
          </Typography>
        </Box>
      </DialogContent>

    </Dialog>
  );
}
