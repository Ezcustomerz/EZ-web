import { Box, Typography, Paper, Stack, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import { LayoutCreative } from '../../layout/creative/LayoutCreative';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../../api/notificationsService';
import { notificationsToActivityItems } from '../../utils/notificationUtils';
import type { ActivityItem } from '../../types/activity';
import { useAuth } from '../../context/auth';
import { ActivityNotificationCard } from '../../components/cards/ActivityNotificationCard';

export function NotificationsCreative() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated) {
      if (mountedRef.current) {
        setActivityItems([]);
        setIsLoading(false);
      }
      return;
    }

    const fetchAllNotifications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch a large number of notifications (100 should be enough for most users)
        const notifications = await getNotifications(100, 0, false, 'creative');
        const items = notificationsToActivityItems(notifications);
        
        if (mountedRef.current) {
          setActivityItems(items);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching notifications:', err);
        if (mountedRef.current) {
          setError(err.response?.data?.detail || 'Failed to load notifications');
          setActivityItems([]);
          setIsLoading(false);
        }
      }
    };

    fetchAllNotifications();

    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated]);

  const handleMarkAsRead = (notificationId: string) => {
    setActivityItems(prevItems =>
      prevItems.map(item =>
        item.notificationId === notificationId
          ? { ...item, isNew: false }
          : item
      )
    );
  };

  const handleNotificationClick = (item: ActivityItem) => {
    // Customize behavior per notification type
    if (item.label === 'New Client Added') {
      navigate('/creative/clients');
    } else if (item.label === 'New Booking Request' || item.label === 'New Booking') {
      navigate('/creative/activity');
    } else if (item.label === 'Payment Received') {
      navigate('/creative/activity');
    }
  };

  return (
    <LayoutCreative selectedNavItem="dashboard">
      {({ isSidebarOpen, creativeProfile }) => (
        <Box
          sx={{
            p: { xs: 2, sm: 2, md: 3 },
            minHeight: { xs: '100dvh', md: '100vh' },
            height: { xs: '100dvh', md: '100vh' },
            maxHeight: { xs: '100dvh', md: '100vh' },
            overflow: { xs: 'hidden', md: 'auto' },
            display: 'flex',
            flexDirection: 'column',
            animation: 'pageSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            '@keyframes pageSlideIn': {
              '0%': {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          {/* Page Header */}
          <Box
            sx={{
              mb: 2,
              pt: { xs: 2, sm: 2, md: 1 },
              textAlign: { xs: 'center', md: 'left' },
              px: { xs: 2, md: 0 },
              '@media (max-height: 784px)': {
                my: 1,
              },
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
                color: 'primary.main',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                mb: 0.25,
              }}
            >
              Notifications
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                fontWeight: 400,
                color: 'text.secondary',
                letterSpacing: '0.01em',
              }}
            >
              All your updates and activity in one place
            </Typography>
          </Box>

          {/* Content */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: { xs: 2, md: 3 },
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
              backgroundColor: 'background.paper',
            }}
          >
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                pr: { xs: 0, md: 1 },
                '&::-webkit-scrollbar': {
                  width: 8,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 4,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  },
                },
              }}
            >
              {isLoading ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    gap: 2,
                  }}
                >
                  <CircularProgress size={48} sx={{ color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loading notifications...
                  </Typography>
                </Box>
              ) : error ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    gap: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'error.main', mb: 1 }}>
                    Error loading notifications
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {error}
                  </Typography>
                </Box>
              ) : activityItems.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    gap: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                    No notifications yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400 }}>
                    You're all caught up! When you receive notifications, they'll appear here.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {activityItems.map((item, index) => (
                    <ActivityNotificationCard
                      key={`${item.notificationId || item.label}-${index}`}
                      item={item}
                      index={index}
                      onMarkAsRead={handleMarkAsRead}
                      onClick={() => handleNotificationClick(item)}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Box>
      )}
    </LayoutCreative>
  );
}

