import React from 'react';
import { Box, Button, Typography, IconButton, LinearProgress } from '@mui/material';
import { Close, ArrowBack, ArrowForward, SkipNext } from '@mui/icons-material';
import type { TooltipRenderProps } from 'react-joyride';
import { useTheme } from '@mui/material/styles';

interface MainTourTooltipProps extends TooltipRenderProps {
  onSkipSection?: () => void;
  currentSection?: string;
  totalSteps?: number;
}

export function MainTourTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  onSkipSection,
  currentSection,
  totalSteps = 8,
}: MainTourTooltipProps) {
  const theme = useTheme();
  
  // Section names for display
  const sectionNames: Record<string, string> = {
    intro: 'Introduction',
    bookings: 'Bookings & Orders',
    portfolio: 'Portfolio & Calendar',
    settings: 'Settings & Payments',
  };

  const progress = ((index + 1) / totalSteps) * 100;

  return (
    <Box
      {...tooltipProps}
      sx={{
        background: theme.palette.background.paper,
        backdropFilter: 'blur(10px)',
        borderRadius: `${theme.shape.borderRadius}px`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        maxWidth: 420,
        minWidth: 300,
        p: 3,
        animation: 'fadeSlideIn 0.3s ease-out',
        '@keyframes fadeSlideIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(10px) scale(0.95)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          },
        },
      }}
    >
      {/* Header with close button */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          {/* Step counter and section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              Step {index + 1} of {totalSteps}
            </Typography>
            {currentSection && (
              <>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  •
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                  }}
                >
                  {sectionNames[currentSection] || currentSection}
                </Typography>
              </>
            )}
          </Box>

          {/* Progress bar */}
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                backgroundColor: theme.palette.primary.main,
              },
            }}
          />
        </Box>

        {/* Close button */}
        <IconButton
          {...closeProps}
          size="small"
          sx={{
            ml: 1,
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ mb: 3 }}>
        {/* Title */}
        {step.content && typeof step.content === 'object' && 'title' in step.content && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              color: 'text.primary',
              mb: 1,
              lineHeight: 1.3,
            }}
          >
            {step.content.title}
          </Typography>
        )}

        {/* Description */}
        {step.content && typeof step.content === 'object' && 'description' in step.content && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.9rem',
              lineHeight: 1.6,
            }}
          >
            {step.content.description}
          </Typography>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Back button (only show if not first step) */}
          {index > 0 && (
            <Button
              {...backProps}
              variant="outlined"
              size="small"
              startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: `${theme.shape.borderRadius / 2}px`,
                borderColor: '#e5e7eb',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              Back
            </Button>
          )}

          {/* Skip Section button (if provided) */}
          {onSkipSection && currentSection !== 'intro' && (
            <Button
              onClick={onSkipSection}
              variant="text"
              size="small"
              startIcon={<SkipNext sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: `${theme.shape.borderRadius / 2}px`,
                color: 'text.secondary',
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              Skip Section
            </Button>
          )}
        </Box>

        {/* Next/Finish button */}
        <Button
          {...primaryProps}
          variant="contained"
          size="small"
          endIcon={!isLastStep && <ArrowForward sx={{ fontSize: 18 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: `${theme.shape.borderRadius / 2}px`,
            backgroundColor: theme.palette.primary.main,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {isLastStep ? 'Finish' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
}
