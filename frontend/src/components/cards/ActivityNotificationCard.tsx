import { Box, Typography, Chip, useTheme } from '@mui/material';
import { WarningAmberOutlined, ErrorOutline } from '@mui/icons-material';
import type { ActivityItem } from '../../types/activity';

interface ActivityNotificationProps {
  item?: ActivityItem;
  icon?: any;
  label?: string;
  description?: string;
  client?: string;
  producer?: string;
  date?: string;
  isNew?: boolean;
  status?: string;
  statusText?: string;
  onClick?: () => void;
  index?: number;
}

export function ActivityNotificationCard({
  item,
  icon,
  label,
  description,
  client,
  producer,
  date,
  isNew,
  status,
  onClick,
  index = 0,
}: ActivityNotificationProps) {
  const theme = useTheme();

  const normalized: ActivityItem = item ?? {
    icon,
    label: label ?? '',
    description,
    counterpart: client ?? producer ?? '',
    date: date ?? '',
    status: status ?? '',
    isNew,
  };

  const statusLower = (normalized.status || '').toLowerCase();

  const borderColor = (() => {
    if (statusLower === 'payment') return theme.palette.error.main;
    if (statusLower === 'completed' || statusLower === 'booking' || statusLower === 'review') return theme.palette.success.main;
    if (statusLower === 'revision' || statusLower === 'connection' || statusLower === 'waiting' || statusLower === 'warning') return theme.palette.warning.main;
    return theme.palette.info.main;
  })();

  const isWarning = statusLower === 'warning' || statusLower === 'waiting';
  const isUrgent = statusLower === 'urgent' || statusLower === 'payment';

  const IconComponent: any = normalized.icon;

  function renderIcon() {
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
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1.5,
        p: 1.5,
        mb: 2,
        mt: 1,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: `1px solid rgba(0, 0, 0, 0.06)`,
        borderLeft: `4px solid ${borderColor}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          transform: onClick ? 'scale(1.03) translateY(-8px)' : 'none',
          backgroundColor: theme.palette.background.paper,
          boxShadow: onClick ? '0 2px 8px rgba(0, 0, 0, 0.10)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              color: borderColor,
              mt: 0.25,
            }}
          >
            {renderIcon()}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                {normalized.label}
              </Typography>
              {normalized.isNew && (
                <Chip
                  label="New"
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    fontSize: '0.6rem',
                    height: 18,
                    ml: 1,
                    '& .MuiChip-label': {
                      px: 0.8,
                      py: 0.2,
                    },
                  }}
                />
              )}
            </Box>
            {normalized.description && (
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  mb: 1,
                  lineHeight: 1.4,
                }}
              >
                {normalized.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.06)',
                  color: 'text.secondary',
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                }}
              >
                {normalized.counterpart}
              </Box>
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                color: 'rgba(0, 0, 0, 0.4)',
                whiteSpace: 'nowrap',
                display: { xs: 'block', md: 'none' },
                mt: 1,
              }}
            >
              {normalized.date}
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            color: 'rgba(0, 0, 0, 0.4)',
            whiteSpace: 'nowrap',
            ml: 1,
            mt: 0.25,
            display: { xs: 'none', md: 'block' },
          }}
        >
          {normalized.date}
        </Typography>
      </Box>
    </Box>
  );
}
