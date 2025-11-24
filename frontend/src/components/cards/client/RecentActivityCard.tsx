import { Box, Typography, Card, useTheme, Stack, Button, Chip, Skeleton } from '@mui/material';
import { MusicNote, Timeline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { ActivityNotificationCard } from '../ActivityNotificationCard';
import type { ActivityItem } from '../../../types/activity';

interface RecentActivityCardProps {
  items?: ActivityItem[];
  isLoading?: boolean;
}

export function RecentActivityCard({ items = [], isLoading = false }: RecentActivityCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [localItems, setLocalItems] = React.useState<ActivityItem[]>(items);

  // Update local items when items prop changes
  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const filteredItems = localItems; // keep all; no status chip logic
  const actualNewCount = filteredItems.filter(i => i.isNew).length;

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'auto', md: '100%' } }}>
      <Card sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: { xs: 'none', md: 1 }, backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: 1, p: 2, mb: 0, transition: 'all 0.3s ease-in-out', animation: 'fadeIn 0.6s ease-out 0.4s both', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
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
                backgroundColor: theme.palette.error.main,
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 600,
                height: 24,
                '& .MuiChip-label': { px: 1.2, py: 0.3 },
              }}
            />
          )}
        </Box>

        <Box sx={{ flex: { xs: 'none', md: 1 }, minHeight: { xs: '300px', md: 0 }, maxHeight: 'calc(100vh - 400px)', overflowY: filteredItems.length === 0 && !isLoading ? 'visible' : 'auto', overflowX: 'visible', px: 2, py: 1, pb: 2, transition: 'all 0.3s ease-in-out', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0, 0, 0, 0.05)', borderRadius: 3 }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 3, '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.3)' } }, scrollBehavior: 'smooth' }}>
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
          ) : filteredItems.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pb: { xs: 8, sm: 8, md: 10, lg: 12 }, pt: { xs: 4, sm: 4, md: 6, lg: 8 }, px: 3, textAlign: 'center', minHeight: { xs: '280px', sm: '280px', md: '300px' }, position: 'relative', background: `radial-gradient(circle at center, ${theme.palette.info.main}08 0%, ${theme.palette.primary.main}05 40%, transparent 70%)`, borderRadius: 2, animation: 'fadeIn 0.6s ease-out 0.5s both', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
              <Timeline sx={{ fontSize: { xs: 44, sm: 48, md: 52 }, color: theme.palette.info.main, mb: { xs: 2, sm: 2.5, md: 3 }, opacity: 0.9 }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.075rem', md: '1.125rem' }, fontWeight: 600, color: theme.palette.info.main, mb: { xs: 1, sm: 1.25, md: 1.5 } }}>
                You're all caught up!
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' }, color: theme.palette.info.main, maxWidth: { xs: '280px', sm: '300px', md: '320px' }, lineHeight: 1.6, opacity: 0.8, mb: { xs: 2, sm: 2.5, md: 3 } }}>
                You haven't done anything yet. Start by booking your first service!
              </Typography>
              <Button variant="outlined" size="small" startIcon={<MusicNote />} onClick={() => { navigate('/client/book'); localStorage.setItem('book-active-tab', '1'); }} sx={{ borderColor: theme.palette.info.main, color: theme.palette.info.main, fontSize: '0.8rem', fontWeight: 500, px: 2.5, py: 0.75, borderRadius: 1.5, textTransform: 'none', position: 'relative', overflow: 'hidden', transition: 'all 0.2s ease-in-out' }}>
                Connected Services
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {filteredItems.map((item, index) => (
                <ActivityNotificationCard
                  key={`${item.label}-${index}`}
                  item={item}
                  index={index}
                  onMarkAsRead={handleMarkAsRead}
                  onClick={() => {
                    // Customize behavior per notification type
                    const notificationType = item.notificationType;
                    
                    if (notificationType === 'payment_required') {
                      // Navigate to Action Needed tab (tab index 2)
                      navigate('/client/orders');
                      localStorage.setItem('orders-active-tab', '2');
                    } else if (notificationType === 'booking_rejected' || notificationType === 'booking_canceled') {
                      // Navigate to History tab (tab index 3)
                      navigate('/client/orders');
                      localStorage.setItem('orders-active-tab', '3');
                    } else if (item.label === 'Placed Booking' || item.label === 'Booking Approved') {
                      // Navigate to orders page (default tab)
                      navigate('/client/orders');
                    }
                    // We can add more cases in the future
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Card>
    </Box>
  );
} 