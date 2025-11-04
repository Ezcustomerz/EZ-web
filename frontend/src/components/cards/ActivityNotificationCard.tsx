import { Box, Typography, Chip, useTheme, Button } from '@mui/material';
import { WarningAmberOutlined, ErrorOutline } from '@mui/icons-material';
import type { ActivityItem } from '../../types/activity';
import React, { useMemo, memo } from 'react';

interface ActivityNotificationProps {
  item?: ActivityItem;
  icon?: any;
  label?: string;
  description?: string;
  client?: string;
  creative?: string;
  date?: string;
  isNew?: boolean;
  status?: string;
  statusText?: string;
  onClick?: () => void;

  onActionClick?: () => void; // Function handle card button
  actionLabel?: string;       //SMC

  index?: number;
}

// Highlight component extracted for better performance
const HighlightText = memo(({ text, color }: { text: string; color: string }) => (
  <Box
    component="span"
    sx={{
      fontWeight: 600,
      color: color,
      position: 'relative',
      display: 'inline-block',
      verticalAlign: 'middle',
      px: 1,
      py: 0.25,
      mx: 0.25,
      borderRadius: 2,
      background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
      border: `1px solid ${color}30`,
      boxShadow: `0 2px 8px ${color}15`,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      overflow: 'hidden',
      zIndex: 1,
      animation: 'shimmer 3s ease-in-out infinite',
      '@keyframes shimmer': {
        '0%': {
          boxShadow: `0 2px 8px ${color}15`,
        },
        '50%': {
          boxShadow: `0 2px 12px ${color}25, 0 0 20px ${color}15`,
        },
        '100%': {
          boxShadow: `0 2px 8px ${color}15`,
        },
      },
      transition: 'all 0.3s ease',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
        animation: 'shine 3s ease-in-out infinite',
        '@keyframes shine': {
          '0%': {
            left: '-100%',
          },
          '50%': {
            left: '100%',
          },
          '100%': {
            left: '100%',
          },
        },
      },
    }}
  >
    {text}
  </Box>
));
HighlightText.displayName = 'HighlightText';

// Helper function to render description with highlights
function renderDescriptionWithHighlights(
  description: string,
  notificationType?: string,
  metadata?: Record<string, any>,
  defaultBorderColor?: string
): React.ReactNode {
  if (!notificationType || !metadata) {
    return description;
  }

  const serviceName = metadata.service_title;
  const serviceColor = metadata.service_color;
  const creativeName = metadata.creative_display_name;
  const clientName = metadata.client_display_name;
  const creativeAvatarColor = metadata.creative_avatar_background_color;

  // Helper to split and highlight
  const highlightText = (text: string, highlight: string, color?: string) => {
    const parts = text.split(highlight);
    if (parts.length === 2) {
      return (
        <>
          {parts[0]}
          <HighlightText text={highlight} color={color || defaultBorderColor || '#1976d2'} />
          {parts[1]}
        </>
      );
    }
    return null;
  };

  const highlightTwoTexts = (
    text: string,
    firstText: string,
    firstColor: string | undefined,
    secondText: string,
    secondColor: string | undefined
  ) => {
    const firstParts = text.split(firstText);
    if (firstParts.length === 2) {
      const secondParts = firstParts[1].split(secondText);
      if (secondParts.length === 2) {
        return (
          <>
            <HighlightText text={firstText} color={firstColor || defaultBorderColor || '#1976d2'} />
            {firstParts[0]}
            {secondParts[0]}
            <HighlightText text={secondText} color={secondColor || defaultBorderColor || '#1976d2'} />
            {secondParts[1]}
          </>
        );
      }
    }
    return null;
  };

  // Handle different notification types
  switch (notificationType) {
    case 'booking_created':
      if (serviceName) {
        if (clientName) {
          const result = highlightTwoTexts(description, clientName, creativeAvatarColor, serviceName, serviceColor);
          if (result) return result;
        }
        return highlightText(description, serviceName, serviceColor) || description;
      }
      break;

    case 'new_client_added':
      if (clientName) {
        return highlightText(description, clientName, creativeAvatarColor) || description;
      }
      break;

    case 'booking_placed':
      if (serviceName) {
        return highlightText(description, serviceName, serviceColor) || description;
      }
      break;

    case 'booking_approved':
    case 'payment_required':
    case 'booking_rejected':
      if (serviceName) {
        if (creativeName) {
          const result = highlightTwoTexts(description, creativeName, creativeAvatarColor, serviceName, serviceColor);
          if (result) return result;
        }
        return highlightText(description, serviceName, serviceColor) || description;
      }
      break;

    case 'booking_canceled':
      if (serviceName) {
        return highlightText(description, serviceName, serviceColor) || description;
      }
      break;
  }

  return description;
}

export const ActivityNotificationCard = memo(function ActivityNotificationCard({
  item,
  icon,
  label,
  description,
  client,
  creative,
  date,
  isNew,
  status,
  onClick,
  onActionClick,
  actionLabel,
  index = 0,
}: ActivityNotificationProps) {
  const theme = useTheme();

  const normalized: ActivityItem = useMemo(() => item ?? {
    icon,
    label: label ?? '',
    description,
    counterpart: client ?? creative ?? '',
    date: date ?? '',
    status: status ?? '',
    isNew,
  }, [item, icon, label, description, client, creative, date, status, isNew]);

  const statusLower = useMemo(() => (normalized.status || '').toLowerCase(), [normalized.status]);

  const borderColor = useMemo(() => {
    if (statusLower === 'payment' || statusLower === 'rejected') return theme.palette.error.main;
    if (statusLower === 'payment_needed') return theme.palette.info.main;
    if (statusLower === 'completed' || statusLower === 'booking' || statusLower === 'review') return theme.palette.success.main;
    if (statusLower === 'revision' || statusLower === 'connection' || statusLower === 'waiting' || statusLower === 'warning') return theme.palette.warning.main;
    return theme.palette.info.main;
  }, [statusLower, theme.palette]);

  const isWarning = useMemo(() => statusLower === 'warning' || statusLower === 'waiting', [statusLower]);
  const isUrgent = useMemo(() => statusLower === 'urgent' || statusLower === 'payment', [statusLower]);

  const IconComponent: any = normalized.icon;

  const iconElement = useMemo(() => {
    if (isWarning) {
      return <WarningAmberOutlined sx={{ width: 18, height: 18, color: borderColor }} />;
    }
    if (isUrgent) {
      return <ErrorOutline sx={{ width: 18, height: 18, color: borderColor }} />;
    }
    if (IconComponent) {
      return (
        <IconComponent
          sx={{
            width: 18,
            height: 18,
            color: borderColor,
          }}
        />
      );
    }
    return null;
  }, [isWarning, isUrgent, IconComponent, borderColor]);

  const renderedDescription = useMemo(() => {
    if (!normalized.description) return null;
    return renderDescriptionWithHighlights(
      normalized.description,
      normalized.notificationType,
      normalized.metadata,
      borderColor
    );
  }, [normalized.description, normalized.notificationType, normalized.metadata, borderColor]);

  return (
    <Box
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 2.5,
        p: 2,
        mb: 2,
        mt: 1,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: `1px solid rgba(255, 255, 255, 0.4)`,
        borderLeft: `4px solid ${borderColor}`,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'visible',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 2.5,
          background: `linear-gradient(135deg, ${borderColor}15 0%, transparent 50%)`,
          opacity: 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        },
        '&:hover': {
          transform: onClick ? 'translateY(-2px)' : 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          boxShadow: onClick 
            ? `0 8px 24px rgba(0, 0, 0, 0.1), 0 0 0 1px ${borderColor}15`
            : '0 8px 32px rgba(0, 0, 0, 0.08)',
          borderColor: `${borderColor}40`,
          '&::before': {
            opacity: onClick ? 0.6 : 0,
          },
          '& .icon-glow': {
            boxShadow: `0 0 12px ${borderColor}25`,
            transform: 'scale(1.05)',
          },
        },
        animation: `slideInLeft 0.6s ease-out ${index * 0.1 + 0.5}s both`,
        '@keyframes slideInLeft': {
          from: { opacity: 0, transform: 'translateX(-30px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
          <Box
            className="icon-glow"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              minWidth: 44,
              background: `linear-gradient(135deg, ${borderColor}20 0%, ${borderColor}08 100%)`,
              borderRadius: 2,
              border: `1px solid ${borderColor}30`,
              boxShadow: `0 4px 12px ${borderColor}20`,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, ${borderColor}15, transparent)`,
                opacity: 0.5,
              },
              '& svg': {
                width: 22,
                height: 22,
                color: borderColor,
                filter: `drop-shadow(0 2px 4px ${borderColor}30)`,
                position: 'relative',
                zIndex: 1,
              },
            }}
          >
            {iconElement}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75, gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.925rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  letterSpacing: '-0.01em',
                }}
              >
                {normalized.label}
              </Typography>
              {normalized.isNew && (
                <Chip
                  label="New"
                  size="small"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    color: 'white',
                    fontSize: '0.625rem',
                    height: 20,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    boxShadow: `0 2px 8px ${theme.palette.primary.main}40`,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '& .MuiChip-label': {
                      px: 1,
                      py: 0.2,
                    },
                  }}
                />
              )}
            </Box>
            {renderedDescription && (
              <Typography
                variant="body2"
                component="div"
                sx={{
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  mb: 1.25,
                  lineHeight: 1.5,
                  opacity: 0.85,
                }}
              >
                {renderedDescription}
              </Typography>
            )}
{/* Counterpart pills removed - names are now highlighted in description */}
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: 'text.secondary',
                opacity: 0.6,
                whiteSpace: 'nowrap',
                display: { xs: 'block', md: 'none' },
                mt: 1.25,
                fontWeight: 500,
              }}
            >
              {normalized.date}
            </Typography>

            {onActionClick && (
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card onClick
                  onActionClick();
                }}
              >
                {actionLabel || 'Go to Activity'}
              </Button>
            </Box>
          )}
          </Box>
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            color: 'text.secondary',
            opacity: 0.6,
            whiteSpace: 'nowrap',
            ml: 1.5,
            mt: 0.5,
            display: { xs: 'none', md: 'block' },
            fontWeight: 500,
          }}
        >
          {normalized.date}
        </Typography>
      </Box>
    </Box>
  );
});
