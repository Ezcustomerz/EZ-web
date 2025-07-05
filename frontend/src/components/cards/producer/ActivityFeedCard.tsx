import { Box, Typography, Card, Chip, useTheme, useMediaQuery } from '@mui/material';
import {
  BookmarkOutlined,
  PaymentOutlined,
  MessageOutlined,
  ScheduleOutlined,
} from '@mui/icons-material';

interface Notification {
  icon: any;
  label: string;
  description: string;
  client: string;
  date: string;
  isNew: boolean;
  type: string;
  borderColor: string;
}

interface ActivityFeedCardProps {
  notifications?: Notification[];
  newCount?: number;
}

export function ActivityFeedCard({ newCount = 3 }: ActivityFeedCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const notifications: Notification[] = [
    {
      icon: BookmarkOutlined,
      label: 'New Booking Request',
      description: 'Sarah Chen wants to book your studio for next week',
      client: 'Sarah Chen',
      date: '2h ago',
      isNew: true,
      type: 'booking',
      borderColor: theme.palette.info.main,
    },
    {
      icon: PaymentOutlined,
      label: 'Payment Received',
      description: 'Session payment completed successfully',
      client: 'Marcus Johnson',
      date: '4h ago',
      isNew: true,
      type: 'payment',
      borderColor: theme.palette.success.main,
    },
    {
      icon: MessageOutlined,
      label: 'New Message',
      description: 'Project update and feedback on latest track',
      client: 'Alex Rivera',
      date: '6h ago',
      isNew: true,
      type: 'message',
      borderColor: theme.palette.primary.main,
    },
    {
      icon: ScheduleOutlined,
      label: 'Session Reminder',
      description: 'Recording session starts in 2 hours',
      client: 'Emma Williams',
      date: '1d ago',
      isNew: false,
      type: 'reminder',
      borderColor: theme.palette.custom.amber,
    },
    {
      icon: PaymentOutlined,
      label: 'Payment Processed',
      description: 'Monthly subscription fee processed',
      client: 'Jordan Smith',
      date: '1d ago',
      isNew: false,
      type: 'payment',
      borderColor: theme.palette.success.main,
    },
    {
      icon: BookmarkOutlined,
      label: 'Booking Confirmed',
      description: 'Studio session confirmed for Friday afternoon',
      client: 'Taylor Brown',
      date: '2d ago',
      isNew: false,
      type: 'booking',
      borderColor: theme.palette.info.main,
    },
    {
      icon: MessageOutlined,
      label: 'New Message',
      description: 'Track revision feedback and notes attached',
      client: 'Casey Wilson',
      date: '2d ago',
      isNew: false,
      type: 'message',
      borderColor: theme.palette.primary.main,
    },
    {
      icon: ScheduleOutlined,
      label: 'Session Completed',
      description: 'Recording session finished, files uploaded',
      client: 'Morgan Davis',
      date: '3d ago',
      isNew: false,
      type: 'session',
      borderColor: theme.palette.custom.amber,
    },
    {
      icon: BookmarkOutlined,
      label: 'New Booking Request',
      description: 'Weekend recording session requested',
      client: 'Riley Johnson',
      date: '3d ago',
      isNew: false,
      type: 'booking',
      borderColor: theme.palette.info.main,
    },
    {
      icon: PaymentOutlined,
      label: 'Payment Received',
      description: 'Invoice #1234 paid in full',
      client: 'Avery Martinez',
      date: '4d ago',
      isNew: false,
      type: 'payment',
      borderColor: theme.palette.success.main,
    },
    {
      icon: MessageOutlined,
      label: 'Client Review',
      description: '5-star review received for recent project',
      client: 'Jamie Lee',
      date: '5d ago',
      isNew: false,
      type: 'review',
      borderColor: theme.palette.primary.main,
    },
    {
      icon: ScheduleOutlined,
      label: 'Session Rescheduled',
      description: 'Tuesday session moved to Wednesday 2PM',
      client: 'Blake Anderson',
      date: '5d ago',
      isNew: false,
      type: 'schedule',
      borderColor: theme.palette.custom.amber,
    },
  ];

  return (
    <Card sx={{ 
      position: 'relative', 
      zIndex: 1, 
      // Responsive flex behavior
      flex: isMobile ? 'none' : 1, 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0,
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      borderRadius: 2,
      p: 3,
      transition: 'all 0.3s ease-in-out',
      animation: 'fadeIn 0.6s ease-out 0.4s both',
      // Add bottom margin for better mobile scrolling
      mb: isMobile ? 4 : 0,
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    }}>
      {/* Activity Feed Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap',
        gap: 1,
      }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.25,
            }}
          >
            Recent Activity
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              color: 'text.secondary',
            }}
          >
            Latest updates and interactions
          </Typography>
        </Box>
        <Chip
          label={`${newCount} new`}
          size="small"
          sx={{
            backgroundColor: theme.palette.error.main,
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 600,
            height: 24,
            '& .MuiChip-label': {
              px: 1.2,
              py: 0.3,
            },
          }}
        />
      </Box>

      {/* Notifications List */}
      <Box
        sx={{
          // Responsive sizing behavior
          ...(isMobile 
            ? { maxHeight: '400px' } 
            : { flex: 1 }
          ),
          overflowY: 'auto',
          overflowX: 'visible',
          px: 2,
          py: 1,
          transition: 'all 0.3s ease-in-out',
          // Custom scrollbar styling
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 3,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          // Smooth scrolling
          scrollBehavior: 'smooth',
        }}
      >
        {notifications.map((notification, index) => {
          const IconComponent = notification.icon;
          return (
            <Box
              key={index}
              sx={{
                backgroundColor: '#fafbfc',
                borderRadius: 1.5,
                p: 1.5,
                mb: 2,
                mt: 1,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                border: `1px solid rgba(0, 0, 0, 0.06)`,
                borderLeft: `4px solid ${notification.borderColor}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'scale(1.03) translateY(-8px)',
                  backgroundColor: '#f1f5f9',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                animation: `slideInLeft 0.6s ease-out ${index * 0.1 + 0.5}s both`,
                '@keyframes slideInLeft': {
                  from: { opacity: 0, transform: 'translateX(-30px)' },
                  to: { opacity: 1, transform: 'translateX(0)' },
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                  <IconComponent
                    sx={{
                      width: 18,
                      height: 18,
                      color: notification.borderColor,
                      mt: 0.25,
                    }}
                  />
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
                        {notification.label}
                      </Typography>
                      {notification.isNew && (
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
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        mb: 1,
                        lineHeight: 1.4,
                      }}
                    >
                      {notification.description}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1,
                    }}>
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
                        {notification.client}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    color: 'rgba(0, 0, 0, 0.4)',
                    whiteSpace: 'nowrap',
                    ml: 1,
                  }}
                >
                  {notification.date}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
} 