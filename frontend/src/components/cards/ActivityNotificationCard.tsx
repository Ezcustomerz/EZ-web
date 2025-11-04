import { Box, Typography, Chip, useTheme, Button } from '@mui/material';
import { WarningAmberOutlined, ErrorOutline } from '@mui/icons-material';
import type { ActivityItem } from '../../types/activity';

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

export function ActivityNotificationCard({
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

  const normalized: ActivityItem = item ?? {
    icon,
    label: label ?? '',
    description,
    counterpart: client ?? creative ?? '',
    date: date ?? '',
    status: status ?? '',
    isNew,
  };

  const statusLower = (normalized.status || '').toLowerCase();

  const borderColor = (() => {
    if (statusLower === 'payment' || statusLower === 'rejected') return theme.palette.error.main; // Keep for cancelled/payment errors and rejected bookings
    if (statusLower === 'payment_needed') return theme.palette.info.main; // Blue for payment required
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
            {renderIcon()}
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
            {normalized.description && (
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
                {(() => {
                  // Helper function to render highlighted text
                  const renderHighlight = (text: string) => (
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 600,
                        color: borderColor,
                        position: 'relative',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                        px: 1,
                        py: 0.25,
                        mx: 0.25,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${borderColor}15 0%, ${borderColor}08 100%)`,
                        border: `1px solid ${borderColor}30`,
                        boxShadow: `0 2px 8px ${borderColor}15`,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        overflow: 'hidden',
                        zIndex: 1,
                        animation: 'shimmer 3s ease-in-out infinite',
                        '@keyframes shimmer': {
                          '0%': {
                            boxShadow: `0 2px 8px ${borderColor}15`,
                          },
                          '50%': {
                            boxShadow: `0 2px 12px ${borderColor}25, 0 0 20px ${borderColor}15`,
                          },
                          '100%': {
                            boxShadow: `0 2px 8px ${borderColor}15`,
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
                          background: `linear-gradient(90deg, transparent, ${borderColor}40, transparent)`,
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
                  );

                  // Special rendering for booking_created (highlight client name and service name)
                  if (normalized.notificationType === 'booking_created' && normalized.metadata?.service_title) {
                    const serviceName = normalized.metadata.service_title;
                    const clientName = normalized.metadata?.client_display_name;
                    let description = normalized.description;
                    
                    // If we have both client name and service name, highlight both
                    if (clientName && serviceName) {
                      // Split by client name first
                      const clientParts = description.split(clientName);
                      if (clientParts.length === 2) {
                        // Now split the second part by service name
                        const serviceParts = clientParts[1].split(serviceName);
                        if (serviceParts.length === 2) {
                          return (
                            <>
                              {renderHighlight(clientName)}
                              {clientParts[0]}
                              {serviceParts[0]}
                              {renderHighlight(serviceName)}
                              {serviceParts[1]}
                            </>
                          );
                        }
                      }
                    }
                    
                    // Fallback: just highlight service name if client name not found or format is different
                    const parts = description.split(serviceName);
                    if (parts.length === 2) {
                      return (
                        <>
                          {parts[0]}
                          {renderHighlight(serviceName)}
                          {parts[1]}
                        </>
                      );
                    }
                  }
                  // Special rendering for new_client_added (highlight client name)
                  if (normalized.notificationType === 'new_client_added' && normalized.metadata?.client_display_name) {
                    const clientName = normalized.metadata.client_display_name;
                    const parts = normalized.description.split(clientName);
                    if (parts.length === 2) {
                      return (
                        <>
                          {parts[0]}
                          {renderHighlight(clientName)}
                          {parts[1]}
                        </>
                      );
                    }
                  }
                  // Special rendering for booking_placed (highlight service name)
                  if (normalized.notificationType === 'booking_placed' && normalized.metadata?.service_title) {
                    const serviceName = normalized.metadata.service_title;
                    const parts = normalized.description.split(serviceName);
                    if (parts.length === 2) {
                      return (
                        <>
                          {parts[0]}
                          {renderHighlight(serviceName)}
                          {parts[1]}
                        </>
                      );
                    }
                  }
                  // Special rendering for booking_approved (highlight creative name and service name)
                  if (normalized.notificationType === 'booking_approved' && normalized.metadata?.service_title) {
                    const serviceName = normalized.metadata.service_title;
                    const creativeName = normalized.metadata?.creative_display_name;
                    let description = normalized.description;
                    
                    // If we have both creative name and service name, highlight both
                    if (creativeName && serviceName) {
                      // Split by creative name first
                      const creativeParts = description.split(creativeName);
                      if (creativeParts.length === 2) {
                        // Now split the second part by service name
                        const serviceParts = creativeParts[1].split(serviceName);
                        if (serviceParts.length === 2) {
                          return (
                            <>
                              {renderHighlight(creativeName)}
                              {creativeParts[0]}
                              {serviceParts[0]}
                              {renderHighlight(serviceName)}
                              {serviceParts[1]}
                            </>
                          );
                        }
                      }
                    }
                    
                    // Fallback: just highlight service name if creative name not found or format is different
                    const parts = description.split(serviceName);
                    if (parts.length === 2) {
                      return (
                        <>
                          {parts[0]}
                          {renderHighlight(serviceName)}
                          {parts[1]}
                        </>
                      );
                    }
                  }
                  // Special rendering for payment_required (highlight creative name and service name)
                  if (normalized.notificationType === 'payment_required' && normalized.metadata?.service_title) {
                    const serviceName = normalized.metadata.service_title;
                    const creativeName = normalized.metadata?.creative_display_name;
                    let description = normalized.description;
                    
                    // If we have both creative name and service name, highlight both
                    if (creativeName && serviceName) {
                      // Split by creative name first
                      const creativeParts = description.split(creativeName);
                      if (creativeParts.length === 2) {
                        // Now split the second part by service name
                        const serviceParts = creativeParts[1].split(serviceName);
                        if (serviceParts.length === 2) {
                          return (
                            <>
                              {renderHighlight(creativeName)}
                              {creativeParts[0]}
                              {serviceParts[0]}
                              {renderHighlight(serviceName)}
                              {serviceParts[1]}
                            </>
                          );
                        }
                      }
                    }
                    
                    // Fallback: just highlight service name if creative name not found or format is different
                    const parts = description.split(serviceName);
                    if (parts.length === 2) {
                      return (
                        <>
                          {parts[0]}
                          {renderHighlight(serviceName)}
                          {parts[1]}
                        </>
                      );
                    }
                  }
                  // Special rendering for booking_rejected (highlight creative name and service name)
                  if (normalized.notificationType === 'booking_rejected' && normalized.metadata?.service_title) {
                    const serviceName = normalized.metadata.service_title;
                    const creativeName = normalized.metadata?.creative_display_name;
                    let description = normalized.description;
                    
                    // If we have both creative name and service name, highlight both
                    if (creativeName && serviceName) {
                      // Split by creative name first
                      const creativeParts = description.split(creativeName);
                      if (creativeParts.length === 2) {
                        // Now split the second part by service name
                        const serviceParts = creativeParts[1].split(serviceName);
                        if (serviceParts.length === 2) {
                          return (
                            <>
                              {renderHighlight(creativeName)}
                              {creativeParts[0]}
                              {serviceParts[0]}
                              {renderHighlight(serviceName)}
                              {serviceParts[1]}
                            </>
                          );
                        }
                      }
                    }
                    
                    // Fallback: just highlight service name if creative name not found or format is different
                    const parts = description.split(serviceName);
                    if (parts.length === 2) {
                      return (
                        <>
                          {parts[0]}
                          {renderHighlight(serviceName)}
                          {parts[1]}
                        </>
                      );
                    }
                  }
                  // Special rendering for booking_canceled (highlight service name)
                  if (normalized.notificationType === 'booking_canceled' && normalized.metadata?.service_title) {
                    const serviceName = normalized.metadata.service_title;
                    const parts = normalized.description.split(serviceName);
                    if (parts.length === 2) {
                      return (
                        <>
                          {parts[0]}
                          {renderHighlight(serviceName)}
                          {parts[1]}
                        </>
                      );
                    }
                  }
                  // Default rendering
                  return normalized.description;
                })()}
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
}
