import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
  Divider,
  Slide,
  Card,
  CardContent,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';

import { errorToast, successToast } from '../../../components/toast/toast';
import { userService } from '../../../api/userService';
import { useAuth } from '../../../context/auth';

export interface AdvocateSetupPopoverProps {
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

export function AdvocateSetupPopover({ 
  open, 
  onClose, 
  onBack,
  isFirstSetup = false,
  onComplete
}: AdvocateSetupPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const [isLoading, setIsLoading] = useState(false);
  const { backToPreviousSetup, saveSetupData, tempSetupData, pendingSetups } = useAuth();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // If onComplete is provided, this is individual setup - call individual endpoint
      if (onComplete) {
        const response = await userService.setupAdvocateProfile();
        
        if (response.success) {
          successToast('Advocate Profile Created!', 'Your advocate profile has been set up successfully.');
          onClose();
          onComplete();
        } else {
          errorToast('Setup Failed', response.message);
        }
        return;
      }

      // Otherwise, this is batch setup - save advocate data temporarily (advocate uses hardcoded data on backend)
      saveSetupData('advocate', { setup_complete: true });
      
      // Check if this is the last setup - if so, commit all data to database
      const isLastSetup = pendingSetups.length === 1; // Current setup is the last one
      
      if (isLastSetup) {
        // This is the final setup - commit all data to database
        const batchData = {
          creative_data: tempSetupData.creative,
          client_data: tempSetupData.client,
          advocate_data: { setup_complete: true }, // Advocate uses hardcoded data
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
        successToast('Advocate Setup Saved!', 'Moving to next setup...');
        onClose();
      }
    } catch (err: any) {
      console.error('Advocate setup error:', err);
      const errorMessage = err.response?.data?.detail || 'Unable to complete advocate setup. Please try again.';
      errorToast('Setup Failed', errorMessage);
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
            border: '1px solid rgba(139, 92, 246, 0.18)',
            background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            m: '2.5vw',
            overflow: 'hidden',
          } : {
            width: 'min(800px, 90vw)',
            maxWidth: '90vw',
            minHeight: 400,
            maxHeight: '90vh',
            borderRadius: 3,
            boxShadow: '0 28px 60px rgba(0,0,0,0.22)',
            border: '1px solid rgba(139, 92, 246, 0.18)',
            background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
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
          color: '#8B5CF6',
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
          {/* Advocate handshake/partnership icon */}
          <path
            d="M12 2L13.5 8.5L20 7L14 12L18 18L12 16L6 18L10 12L4 7L10.5 8.5L12 2Z"
            fill="url(#advocateGradient)"
            stroke="white"
            strokeWidth="1"
          />
          
          {/* Connection lines representing network */}
          <path
            d="M8 10L12 12L16 10"
            stroke="url(#advocateGradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M6 8L12 12L18 8"
            stroke="url(#advocateGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          
          {/* Define gradient */}
          <defs>
            <linearGradient id="advocateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>
          
          {/* Partnership sparkle effects */}
          <circle cx="8" cy="6" r="1" fill="#DDD6FE" opacity="0.8" />
          <circle cx="16" cy="6" r="1" fill="#C4B5FD" opacity="0.7" />
          <circle cx="12" cy="20" r="0.8" fill="#E9D5FF" opacity="0.9" />
        </Box>
        Set Up Your Advocate Profile
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ 
        pb: 2, 
        px: isMobile ? 2 : isTablet ? 3 : 4, 
        maxHeight: isMobile ? 'calc(100vh - 180px)' : isTablet ? 'calc(90vh - 180px)' : '300px', 
        overflow: 'auto',
        overflowX: 'hidden'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? 2.5 : isTablet ? 3 : 3.5, 
          py: isMobile ? 1.5 : 2,
          width: '100%',
          maxWidth: '100%',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          
          {/* Placeholder Content */}
          <Card sx={{
            width: '100%',
            maxWidth: 600,
            background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                🚀 Advocate Program
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                Welcome to the EZ Advocate program! You'll be able to earn commissions by referring creatives to our platform.
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                <strong>Coming Soon:</strong> Full integration with FirstPromoter affiliate system
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ 
            p: 3, 
            backgroundColor: 'rgba(139, 92, 246, 0.05)', 
            borderRadius: 2, 
            border: '1px solid rgba(139, 92, 246, 0.2)',
            width: '100%',
            maxWidth: 500
          }}>
            <Typography variant="h6" fontWeight={600} color="#8B5CF6" gutterBottom>
              Demo Mode
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This is currently in demo mode. Your advocate profile will be created with placeholder data.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Dummy Data Advocate</strong> - Full affiliate system integration coming soon!
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 1,
            opacity: 0.7
          }}>
            <Typography variant="body2" color="text.secondary">
              🔗 Referral System
            </Typography>
            <Typography variant="body2" color="text.secondary">
              💰 Commission Tracking  
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📊 Analytics Dashboard
            </Typography>
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
            background: 'linear-gradient(45deg, #8B5CF6, #A855F7)',
            boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #7C3AED, #8B5CF6)',
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 35px rgba(139, 92, 246, 0.5)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isLoading ? 'Setting Up Your Profile...' : '🚀 Complete Advocate Setup'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
