import { Box, Typography, Card, Chip, useTheme, useMediaQuery } from '@mui/material';
import { Timeline } from '@mui/icons-material';
import { ActivityNotificationCard } from '../ActivityNotificationCard';
import type { ActivityItem } from '../../../types/activity';
//smc
import { useNavigate } from 'react-router-dom';



interface ActivityFeedCardProps {
  items?: ActivityItem[];
}

export function ActivityFeedCard({ items }: ActivityFeedCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigate = useNavigate(); //smc

  const displayItems = items ?? [];
  const actualNewCount = displayItems.filter(n => n.isNew).length;

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

      <Box sx={{ ...(isMobile ? { maxHeight: '400px' } : { flex: 1, minHeight: 0 }), overflowY: displayItems.length === 0 ? 'visible' : 'auto', overflowX: 'visible', px: 2, py: 1, transition: 'all 0.3s ease-in-out', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3 }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3, '&:hover': { backgroundColor: 'rgba(0,0,0,0.3)' } }, scrollBehavior: 'smooth' }}>
        {displayItems.length === 0 ? (
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
          displayItems.map((item, index) => (
            <ActivityNotificationCard
              key={`${item.label}-${index}`}
              item={item}
              index={index}
              //smc
              onClick={() => {
                // Customize behavior per notification type
                if (item.label === 'New Client Added') {
                  navigate('/creative/clients'); // Navigate to clients page
                } else if (item.label === 'New Booking Request' || item.label === 'New Booking') {
                  navigate('/creative/activity'); // Navigate to activity page
                } else if (item.label === 'Payment Received') {
                  navigate('/creative/payments'); // 
                }
                // We can add more cases in the future
              }}
            />
          ))
        )}
      </Box>
    </Card>
  );
} 