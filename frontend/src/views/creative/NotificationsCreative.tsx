import { Box, Typography, Paper, Stack, Skeleton } from '@mui/material';
import { LayoutCreative } from '../../layout/creative/LayoutCreative';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../../api/notificationsService';
import { notificationsToActivityItems } from '../../utils/notificationUtils';
import type { ActivityItem } from '../../types/activity';
import { useAuth } from '../../context/auth';
import { ActivityNotificationCard } from '../../components/cards/ActivityNotificationCard';

export function NotificationsCreative() {
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
    const notificationType = item.notificationType;
    
    // Try to resolve a booking/order id from multiple possible sources
    const bookingId =
      item.relatedEntityId ||
      (item.metadata && (item.metadata.booking_id || item.metadata.order_id));

    if (item.label === 'New Client Added') {
      navigate('/creative/clients');
    } else if ((item.label === 'New Booking Request' || item.label === 'New Booking') && bookingId) {
      // Navigate to activity page and open the specific order popover
      navigate('/creative/activity');
      // Store booking_id in localStorage to open popover after navigation
      localStorage.setItem('open-order-popover', bookingId);
      // Check metadata for creative_status to determine which tab
      // If status is completed/rejected/canceled, it's in Past Orders (tab 1)
      // Otherwise, it's likely in Current Orders (tab 0)
      const creativeStatus = item.metadata?.creative_status;
      if (creativeStatus && (creativeStatus === 'completed' || creativeStatus === 'rejected' || creativeStatus === 'canceled')) {
        localStorage.setItem('activity-active-tab', '1'); // Past Orders
      } else {
        // Default to Current Orders, but fallback will check Past Orders if not found
        localStorage.setItem('activity-active-tab', '0'); // Current Orders
      }
    } else if (notificationType === 'payment_received') {
      // Check if this is a payment request notification (not booking-related)
      const isPaymentRequest = item.metadata?.payment_request_id || 
                               (item.metadata?.related_entity_type === 'payment_request');
      
      if (isPaymentRequest) {
        // Get payment request ID from metadata or related entity ID
        const paymentRequestId = item.metadata?.payment_request_id || item.relatedEntityId;
        if (paymentRequestId) {
          // Navigate to activity page and open payment actions popover
          navigate('/creative/activity');
          // Store payment request ID in localStorage to open popover after navigation
          localStorage.setItem('open-payment-actions-popover', paymentRequestId);
        }
      } else if (bookingId) {
        // Navigate to activity page and open the specific order popover
        navigate('/creative/activity');
        // Store booking_id in localStorage to open popover after navigation
        localStorage.setItem('open-order-popover', bookingId);
        // Determine tab based on creative_status from metadata
        // Payment received notifications could be in Current or Past Orders depending on status
        const creativeStatus = item.metadata?.creative_status;
        if (creativeStatus) {
          const tabIndex = (creativeStatus === 'completed' || creativeStatus === 'rejected' || creativeStatus === 'canceled') ? '1' : '0';
          localStorage.setItem('activity-active-tab', tabIndex);
        } else {
          // No status in metadata - default to Current Orders, fallback will check Past Orders if not found
          localStorage.setItem('activity-active-tab', '0');
        }
      }
    } else if (notificationType === 'session_completed' && bookingId) {
      // Navigate to activity page and open the specific order popover
      navigate('/creative/activity');
      // Store booking_id in localStorage to open popover after navigation
      localStorage.setItem('open-order-popover', bookingId);
      // Service completed notifications are typically in Past Orders (tab 1)
      // But check metadata to be sure
      const creativeStatus = item.metadata?.creative_status;
      if (creativeStatus) {
        const tabIndex = (creativeStatus === 'completed' || creativeStatus === 'rejected' || creativeStatus === 'canceled') ? '1' : '0';
        localStorage.setItem('activity-active-tab', tabIndex);
      } else {
        // Default to Past Orders for completed services
        localStorage.setItem('activity-active-tab', '1');
      }
    } else if (item.label === 'Files Sent' && bookingId) {
      // Navigate to activity page and open the specific order popover
      navigate('/creative/activity');
      // Store booking_id in localStorage to open popover after navigation
      localStorage.setItem('open-order-popover', bookingId);
      // Determine tab based on creative_status from metadata
      // If status is completed/rejected/canceled, go to Past Orders (tab 1), otherwise Current Orders (tab 0)
      // If status is not in metadata (old notifications), we'll try Current Orders first, then fallback to Past Orders
      const creativeStatus = item.metadata?.creative_status;
      if (creativeStatus) {
        const isPastOrder = creativeStatus === 'completed' || creativeStatus === 'rejected' || creativeStatus === 'canceled';
        const tabIndex = isPastOrder ? '1' : '0';
        localStorage.setItem('activity-active-tab', tabIndex);
      } else {
        // No status in metadata - default to Current Orders, fallback will check Past Orders if not found
        localStorage.setItem('activity-active-tab', '0');
      }
    } else if (item.label === 'Service Approved' && bookingId) {
      // Navigate to activity page and open the specific order popover
      navigate('/creative/activity');
      // Store booking_id in localStorage to open popover after navigation
      localStorage.setItem('open-order-popover', bookingId);
      // Determine tab based on creative_status from metadata
      // Approved orders are typically in Current Orders (awaiting_payment or in_progress)
      // But if status is completed/rejected/canceled, go to Past Orders
      const creativeStatus = item.metadata?.creative_status;
      if (creativeStatus) {
        const tabIndex = (creativeStatus === 'completed' || creativeStatus === 'rejected' || creativeStatus === 'canceled') ? '1' : '0';
        localStorage.setItem('activity-active-tab', tabIndex);
      } else {
        // No status in metadata - default to Current Orders, fallback will check Past Orders if not found
        localStorage.setItem('activity-active-tab', '0');
      }
    }
  };

  return (
    <LayoutCreative selectedNavItem="dashboard">
      {({ isSidebarOpen: _, creativeProfile: __ }) => (
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
                <Stack spacing={2}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Box
                      key={`skeleton-${index}`}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.65)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        borderRadius: 2.5,
                        p: 2,
                        mb: 2,
                        mt: 1,
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderLeft: '4px solid rgba(0, 0, 0, 0.1)',
                        animation: `fadeIn 0.5s ease-in ${index * 0.1}s both`,
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateX(-30px)' },
                          to: { opacity: 1, transform: 'translateX(0)' },
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                          {/* Icon box skeleton */}
                          <Skeleton
                            variant="rectangular"
                            width={44}
                            height={44}
                            sx={{
                              borderRadius: 2,
                              backgroundColor: 'rgba(0, 0, 0, 0.08)',
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            {/* Label and New chip skeleton */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75, gap: 1 }}>
                              <Skeleton variant="text" width="60%" height={20} />
                              {index % 3 === 0 && (
                                <Skeleton
                                  variant="rectangular"
                                  width={40}
                                  height={20}
                                  sx={{ borderRadius: 1 }}
                                />
                              )}
                            </Box>
                            {/* Description skeleton - multiple lines */}
                            <Skeleton variant="text" width="100%" height={16} sx={{ mb: 0.5 }} />
                            <Skeleton variant="text" width="85%" height={16} sx={{ mb: 1.25 }} />
                            {/* Date skeleton for mobile */}
                            <Skeleton
                              variant="text"
                              width={60}
                              height={14}
                              sx={{
                                display: { xs: 'block', md: 'none' },
                                mt: 1.25,
                              }}
                            />
                          </Box>
                        </Box>
                        {/* Date skeleton for desktop */}
                        <Skeleton
                          variant="text"
                          width={60}
                          height={14}
                          sx={{
                            ml: 1.5,
                            mt: 0.5,
                            display: { xs: 'none', md: 'block' },
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
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

