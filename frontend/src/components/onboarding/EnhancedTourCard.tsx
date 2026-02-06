import React from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { Close, ArrowBack, ArrowForward } from '@mui/icons-material';
import type { TooltipRenderProps } from 'react-joyride';
import { useTheme } from '@mui/material/styles';

interface EnhancedTourCardProps extends TooltipRenderProps {
  illustration?: React.ReactNode;
  totalSteps?: number;
}

export function EnhancedTourCard({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  illustration,
  totalSteps = 4,
}: EnhancedTourCardProps) {
  const theme = useTheme();

  const progress = ((index + 1) / totalSteps) * 100;

  return (
    <Box
      {...tooltipProps}
      sx={{
        background: theme.palette.background.paper,
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        border: `1px solid ${theme.palette.divider}`,
        maxWidth: 500,
        minWidth: 320,
        overflow: 'hidden',
        animation: 'cardFadeIn 0.3s ease-out',
        '@keyframes cardFadeIn': {
          '0%': {
            opacity: 0,
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: 1,
            transform: 'scale(1)',
          },
        },
      }}
    >
      {/* Illustration Preview */}
      {illustration && <Box>{illustration}</Box>}

      {/* Content Section */}
      <Box sx={{ p: 3 }}>
        {/* Header with step indicator and close button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Circular step indicator with progress ring */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Progress ring background */}
              <svg width="48" height="48" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke={theme.palette.primary.main}
                  strokeWidth="3"
                  strokeDasharray={`${progress * 1.256} 125.6`}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dasharray 0.3s ease',
                  }}
                />
              </svg>
              {/* Step number */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #9d8aff 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                }}
              >
                <Typography
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  {index + 1}
                </Typography>
              </Box>
            </Box>

            {/* Step counter text */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  display: 'block',
                }}
              >
                Step {index + 1} of {totalSteps}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                }}
              >
                {Math.round(progress)}% Complete
              </Typography>
            </Box>
          </Box>

          {/* Close button */}
          <IconButton
            {...closeProps}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Title and Description */}
        <Box sx={{ mb: 3 }}>
          {step.content && typeof step.content === 'object' && 'title' in step.content && (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: '1.35rem',
                color: 'text.primary',
                mb: 1.5,
                lineHeight: 1.3,
              }}
            >
              {step.content.title}
            </Typography>
          )}

          {step.content && typeof step.content === 'object' && 'description' in step.content && (
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: '1rem',
                lineHeight: 1.7,
              }}
            >
              {step.content.description}
            </Typography>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Back button */}
          {index > 0 && (
            <Button
              {...backProps}
              variant="outlined"
              startIcon={<ArrowBack sx={{ fontSize: 20 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1.25,
                borderColor: '#e5e7eb',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  backgroundColor: `${theme.palette.primary.main}08`,
                },
              }}
            >
              Back
            </Button>
          )}

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Next/Finish button */}
          <Button
            {...primaryProps}
            variant="contained"
            endIcon={!isLastStep && <ArrowForward sx={{ fontSize: 20 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: 2,
              px: 4,
              py: 1.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #9d8aff 100%)`,
              boxShadow: `0 4px 14px ${theme.palette.primary.main}40`,
              '&:hover': {
                boxShadow: `0 6px 20px ${theme.palette.primary.main}50`,
                transform: 'translateY(-1px)',
                background: `linear-gradient(135deg, #6b4eff 0%, #8d7aff 100%)`,
              },
              transition: 'all 0.2s ease',
              animation: isLastStep ? 'none' : 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  boxShadow: `0 4px 14px ${theme.palette.primary.main}40`,
                },
                '50%': {
                  boxShadow: `0 4px 20px ${theme.palette.primary.main}60`,
                },
              },
            }}
          >
            {isLastStep ? '✓ Got it!' : 'Next Step'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
