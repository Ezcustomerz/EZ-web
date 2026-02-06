import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Build, AccountCircle, Payment, Close, Celebration } from '@mui/icons-material';
import { IconButton } from '@mui/material';

interface WelcomeModalProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeModal({ open, onStart, onSkip }: WelcomeModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const steps = [
    {
      label: 'Create Your First Service',
      description: 'Set up what you offer to clients - your services, pricing, and delivery times.',
      icon: <Build sx={{ fontSize: 28, color: theme.palette.primary.main }} />,
    },
    {
      label: 'Complete Your Profile',
      description: 'Add your bio, profile picture, and showcase your best work to attract bookings.',
      icon: <AccountCircle sx={{ fontSize: 28, color: theme.palette.primary.main }} />,
    },
    {
      label: 'Connect Bank Account',
      description: 'Connect your bank account through Stripe to receive payments.',
      icon: <Payment sx={{ fontSize: 28, color: theme.palette.primary.main }} />,
    },
    {
      label: 'Get Your Share Link',
      description: 'Get your unique link to share with clients - no account needed for them to book!',
      icon: <Celebration sx={{ fontSize: 28, color: '#10b981' }} />,
    },
  ];

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 600,
          m: 2,
          background: 'linear-gradient(135deg, #ffffff 0%, #faf9fc 100%)',
          boxShadow: '0 20px 60px rgba(122, 95, 255, 0.15)',
          animation: 'modalSlideUp 0.4s ease-out',
          '@keyframes modalSlideUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(40px) scale(0.95)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0) scale(1)',
            },
          },
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Close button */}
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
          <IconButton
            onClick={onSkip}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            pt: 5,
            pb: 3,
            px: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, transparent 100%)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Decorative icon */}
          <Box
            sx={{
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #9d8aff 100%)`,
              boxShadow: `0 8px 24px ${theme.palette.primary.main}40`,
              mb: 2,
            }}
          >
            <Build sx={{ fontSize: 32, color: 'white' }} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            Welcome to EZ Customer!
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              maxWidth: 400,
              mx: 'auto',
            }}
          >
            Get set up in 4 simple steps and start making money
          </Typography>
        </Box>

        {/* Stepper Section */}
        <Box sx={{ px: 4, py: 4 }}>
          <Stepper orientation="vertical" activeStep={-1}>
            {steps.map((step, index) => (
              <Step key={step.label} expanded>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${theme.palette.primary.main}15`,
                        border: `2px solid ${theme.palette.primary.main}30`,
                      }}
                    >
                      {step.icon}
                    </Box>
                  )}
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'text.primary',
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.6,
                      ml: -1,
                    }}
                  >
                    {step.description}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Actions */}
        <Box
          sx={{
            px: 4,
            pb: 4,
            pt: 2,
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={onStart}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #9d8aff 100%)`,
              boxShadow: `0 4px 14px ${theme.palette.primary.main}40`,
              '&:hover': {
                boxShadow: `0 6px 20px ${theme.palette.primary.main}50`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Let's Get Started
          </Button>
          <Button
            variant="text"
            size="large"
            fullWidth={isMobile}
            onClick={onSkip}
            sx={{
              py: 1.5,
              fontSize: '0.95rem',
              fontWeight: 500,
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Skip for now
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
