import React from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { Close, ArrowBack, ArrowForward, Check } from '@mui/icons-material';
import type { TooltipRenderProps } from 'react-joyride';
import { useTheme } from '@mui/material/styles';

interface MiniTourTooltipProps extends TooltipRenderProps {
  totalSteps?: number;
}

export function MiniTourTooltip({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  size,
  totalSteps,
}: MiniTourTooltipProps) {
  const theme = useTheme();

  return (
    <Box
      {...tooltipProps}
      sx={{
        background: theme.palette.background.paper,
        backdropFilter: 'blur(10px)',
        borderRadius: `${theme.shape.borderRadius}px`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        maxWidth: 380,
        minWidth: 280,
        p: 2.5,
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
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        {/* Progress dots */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {Array.from({ length: size || totalSteps || 1 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                width: i === index ? 12 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  i === index
                    ? theme.palette.primary.main
                    : i < index
                    ? theme.palette.primary.light
                    : 'rgba(0, 0, 0, 0.12)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
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
      <Box sx={{ mb: 2 }}>
        {/* Title */}
        {step.content && typeof step.content === 'object' && 'title' in step.content && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              color: 'text.primary',
              mb: 0.75,
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
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            {step.content.description}
          </Typography>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
        {/* Back button */}
        {index > 0 && (
          <Button
            {...backProps}
            variant="outlined"
            size="small"
            startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.85rem',
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

        <Box sx={{ flex: 1 }} />

        {/* Next/Got it button */}
        <Button
          {...primaryProps}
          variant="contained"
          size="small"
          endIcon={
            isLastStep ? (
              <Check sx={{ fontSize: 16 }} />
            ) : (
              <ArrowForward sx={{ fontSize: 16 }} />
            )
          }
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            borderRadius: `${theme.shape.borderRadius / 2}px`,
            backgroundColor: theme.palette.primary.main,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {isLastStep ? 'Got it!' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
}
