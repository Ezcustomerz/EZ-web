import { Box, Typography, Card, Chip, useTheme, useMediaQuery, CircularProgress, Skeleton, Button, Stack } from '@mui/material';
import { Timeline, Notifications } from '@mui/icons-material';
import React from 'react';
import { ActivityNotificationCard } from '../ActivityNotificationCard';
import type { ActivityItem } from '../../../types/activity';
//smc
import { useNavigate } from 'react-router-dom';



interface ActivityFeedCardProps {
  items?: ActivityItem[];
  isLoading?: boolean;
  onOpenPaymentActionsPopover?: (paymentRequestId: string) => void;
}

const DISPLAY_LIMIT = 5; // Show only 5 items initially

export function ActivityFeedCard({ items, isLoading = false, onOpenPaymentActionsPopover }: ActivityFeedCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigate = useNavigate(); //smc
  const [localItems, setLocalItems] = React.useState<ActivityItem[]>(items ?? []);

  // Update local items when items prop changes
  React.useEffect(() => {
    setLocalItems(items ?? []);
  }, [items]);

  const displayItems = localItems.slice(0, DISPLAY_LIMIT);
  const hasMoreItems = localItems.length > DISPLAY_LIMIT;
  const actualNewCount = localItems.filter(n => n.isNew).length;

  // Handle when a notification is marked as read
  const handleMarkAsRead = React.useCallback((notificationId: string) => {
    setLocalItems(prevItems => 
      prevItems.map(item => 
        item.notificationId === notificationId 
          ? { ...item, isNew: false }
          : item
      )
    );
  }, []);

  return (
    <Card sx={{ 
      position: 'relative', 
      zIndex: 1, 
      flex: isMobile ? 'none' : 1, 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0,
      height: '100%',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      borderRadius: 1,
      p: 3,
      transition: 'all 0.3s ease-in-out',
      animation: 'fadeIn 0.6s ease-out 0.4s both',
      mb: isMobile ? 4 : 0,
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
            Recent Activity
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            Latest updates and interactions
          </Typography>
        </Box>
        {actualNewCount > 0 && (
          <Chip
            label={`${actualNewCount} new`}
            size="small"
            sx={{
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 600,
              height: 24,
              '& .MuiChip-label': { px: 1.2, py: 0.3 },
            }}
          />
        )}
      </Box>

      <Box sx={{ ...(isMobile ? { maxHeight: '400px' } : { flex: 1, minHeight: 0 }), overflowY: displayItems.length === 0 && !isLoading ? 'visible' : 'auto', overflowX: 'visible', px: 2, py: 1, transition: 'all 0.3s ease-in-out', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3 }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3, '&:hover': { backgroundColor: 'rgba(0,0,0,0.3)' } }, scrollBehavior: 'smooth' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  borderRadius: 2.5,
                  p: 2,
                  mb: 2,
                  mt: 1,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                }}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="rectangular" width={44} height={44} sx={{ borderRadius: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="80%" height={20} />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : displayItems.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pb: { xs: 8, sm: 8, md: 10, lg: 12 }, pt: { xs: 4, sm: 4, md: 6, lg: 8 }, px: 3, textAlign: 'center', minHeight: { xs: '280px', sm: '280px', md: '300px' }, position: 'relative', background: `radial-gradient(circle at center, ${theme.palette.info.main}08 0%, ${theme.palette.primary.main}05 40%, transparent 70%)`, borderRadius: 2, animation: 'fadeIn 0.6s ease-out 0.5s both', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
              <Timeline sx={{ fontSize: { xs: 44, sm: 48, md: 52 }, color: theme.palette.info.main, mb: { xs: 2, sm: 2.5, md: 3 }, opacity: 0.9 }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.075rem', md: '1.125rem' }, fontWeight: 600, color: theme.palette.info.main, mb: { xs: 1, sm: 1.25, md: 1.5 } }}>
                All quiet here!
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' }, color: theme.palette.info.main, maxWidth: { xs: '280px', sm: '300px', md: '320px' }, lineHeight: 1.6, opacity: 0.8 }}>
                You haven't received any bookings or updates yet. Build your public profile to attract clients!
              </Typography>
            </Box>
        ) : (
          <>
            <Stack spacing={2}>
              {displayItems.map((item, index) => (
                <ActivityNotificationCard
                  key={`${item.label}-${index}`}
                  item={item}
                  index={index}
                  onMarkAsRead={handleMarkAsRead}
                  //smc
                  onClick={() => {
                    // Customize behavior per notification type
                    const notificationType = item.notificationType;
                    
                    // Try to resolve a booking/order id from multiple possible sources
                    const bookingId =
                      item.relatedEntityId ||
                      (item.metadata && (item.metadata.booking_id || item.metadata.order_id));

                    if (item.label === 'New Client Added') {
                      navigate('/creative/clients'); // Navigate to clients page
                    } else if ((item.label === 'New Booking Request' || item.label === 'New Booking') && bookingId) {
                      // Navigate to activity page and open the specific order popover
                      navigate('/creative/activity');
                      // Store booking_id in localStorage to open popover after navigation
                      localStorage.setItem('open-order-popover', bookingId);
                      // New booking requests are typically in Current Orders (Pending Approval status)
                      localStorage.setItem('activity-active-tab', '0');
                    } else if (notificationType === 'payment_received') {
                      // Check if this is a payment request notification (not booking-related)
                      const isPaymentRequest = item.metadata?.payment_request_id || 
                                               (item.metadata?.related_entity_type === 'payment_request');
                      
                      if (isPaymentRequest) {
                        // Get payment request ID from metadata or related entity ID
                        const paymentRequestId = item.metadata?.payment_request_id || item.relatedEntityId;
                        if (paymentRequestId && onOpenPaymentActionsPopover) {
                          onOpenPaymentActionsPopover(paymentRequestId);
                        }
                      } else if (bookingId) {
                        // Navigate to activity page and open the specific order popover
                        navigate('/creative/activity');
                        // Store booking_id in localStorage to open popover after navigation
                        localStorage.setItem('open-order-popover', bookingId);
                        // Determine tab based on creative_status from metadata
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
                      const creativeStatus = item.metadata?.creative_status;
                      if (creativeStatus) {
                        const tabIndex = (creativeStatus === 'completed' || creativeStatus === 'rejected' || creativeStatus === 'canceled') ? '1' : '0';
                        localStorage.setItem('activity-active-tab', tabIndex);
                      } else {
                        // No status in metadata - default to Current Orders, fallback will check Past Orders if not found
                        localStorage.setItem('activity-active-tab', '0');
                      }
                    }
                    // We can add more cases in the future
                  }}
                />
              ))}
            </Stack>
            {hasMoreItems && (
              <Box sx={{ pt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Notifications />}
                  onClick={() => {
                    // Navigate to dedicated notifications page
                    navigate('/creative/notifications');
                  }}
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    px: 2.5,
                    py: 0.75,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                    },
                  }}
                >
                  View All Notifications ({localItems.length})
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Card>
  );
} 