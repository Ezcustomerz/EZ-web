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
import { errorToast, successToast } from '../toast/toast';
import { userService } from '../../api/userService';
import { useAuth } from '../../context/auth';

export interface AdvocateSetupPopoverProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  onBack?: () => void;
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
  userName = '', 
  userEmail = '',
  onBack
}: AdvocateSetupPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAuth();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await userService.setupAdvocateProfile();
      
      if (response.success) {
        successToast('Setup Complete!', response.message);
        onClose();
      } else {
        errorToast('Setup Failed', response.message);
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
        zIndex: isMobile ? 9999 : 1300,
        '& .MuiDialog-paper': {
          zIndex: isMobile ? 9999 : 1300,
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
            zIndex: 9999,
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
            zIndex: isMobile ? 9998 : 1299,
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
          {/* Advocate network/referral icon */}
          <path
            d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"
            fill="url(#advocateGradient)"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M21 9V7L15 1L9 7V9C9 10 9 12 11 12H13C15 12 15 10 15 9Z"
            fill="url(#advocateGradient)"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M16 5.5L19 8.5L16 11.5"
            fill="none"
            stroke="url(#advocateGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 5.5L5 8.5L8 11.5"
            fill="none"
            stroke="url(#advocateGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="18" r="3" fill="url(#advocateGradient)" stroke="white" strokeWidth="0.5"/>
          <circle cx="6" cy="18" r="2" fill="url(#advocateGradient)" stroke="white" strokeWidth="0.5"/>
          <circle cx="18" cy="18" r="2" fill="url(#advocateGradient)" stroke="white" strokeWidth="0.5"/>
          
          {/* Define gradient */}
          <defs>
            <linearGradient id="advocateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>
          
          {/* Network sparkle effects */}
          <circle cx="7" cy="4" r="0.8" fill="#DDD6FE" opacity="0.8" />
          <circle cx="17" cy="5" r="0.6" fill="#C4B5FD" opacity="0.7" />
          <circle cx="4" cy="14" r="0.7" fill="#E9D5FF" opacity="0.9" />
          <circle cx="20" cy="15" r="0.5" fill="#F3E8FF" opacity="0.8" />
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
        py: isMobile ? 1 : 2, 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Back Button */}
        <Button
          onClick={onBack}
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
          ← Back to Roles
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
