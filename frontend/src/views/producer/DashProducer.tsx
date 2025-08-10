import { Box, Typography, Divider, useTheme, useMediaQuery } from '@mui/material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';
import { WelcomeCard } from '../../components/cards/producer/WelcomeCard';
import { ActivityFeedCard } from '../../components/cards/producer/ActivityFeedCard';
import type { ActivityItem } from '../../types/activity';
import { GraphicEqOutlined, Payment, Download, PersonAddOutlined, CheckCircleOutlined, History } from '@mui/icons-material';

export function DashProducer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // iPad Air and smaller

  const items: ActivityItem[] = [
    { icon: GraphicEqOutlined, label: 'New Booking', description: "Client 'Sarah Wilson' booked your Full Production Package for Dec 15, 2024", counterpart: 'Sarah Wilson', date: '2 hours ago', status: 'booking', isNew: true },
    { icon: Payment, label: 'Payment Received', description: 'Payment of $500 received for Mixing & Mastering session', counterpart: 'Mike Johnson', date: '1 day ago', status: 'payment', isNew: true },
    { icon: Download, label: 'File Uploaded', description: 'Client uploaded new vocal tracks for revision', counterpart: 'Alex Thompson', date: '2 days ago', status: 'file', isNew: false },
    { icon: PersonAddOutlined, label: 'New Connection', description: "Client 'Emma Davis' connected with your profile", counterpart: 'Emma Davis', date: '3 days ago', status: 'connection', isNew: false },
    { icon: CheckCircleOutlined, label: 'Session Completed', description: "Vocal Recording session with 'David Chen' completed successfully", counterpart: 'David Chen', date: '1 week ago', status: 'completed', isNew: false },
    { icon: History, label: 'Revision Request', description: 'Client requested changes to the final mix', counterpart: 'Lisa Rodriguez', date: '1 week ago', status: 'revision', isNew: false },
  ];

  return (
    <LayoutProducer selectedNavItem="dashboard">
      {({ isSidebarOpen }) => (
        <Box
          sx={{
            p: { xs: 1.5, sm: 1.5, md: 2.5 },
            // Responsive height and overflow behavior
            height: isMobile ? 'auto' : '100vh',
            minHeight: isMobile ? '100vh' : 'auto',
            overflowY: isMobile ? 'auto' : 'hidden',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: 'all 0.3s ease-in-out',
            // Add top padding on mobile to account for menu button
            pt: isMobile ? 5 : { xs: 2, md: 4 },
            // Ensure proper scrolling on mobile
            WebkitOverflowScrolling: isMobile ? 'touch' : 'auto',
          }}
        >
          {/* Welcome Card */}
          <WelcomeCard userName="Demo User" userRole="Music Producer" isSidebarOpen={isSidebarOpen} />

          {/* Section Divider */}
          <Box sx={{ position: 'relative', zIndex: 1, mb: 2, animation: 'fadeIn 0.6s ease-out 0.35s both', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
            <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.12)', my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: -1.5 }}>
              <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', backgroundColor: 'background.default', px: 2 }}>
                Activity Feed
              </Typography>
            </Box>
          </Box>

          {/* Activity Feed Card */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ActivityFeedCard items={items} />
          </Box>
        </Box>
      )}
    </LayoutProducer>
  );
} 