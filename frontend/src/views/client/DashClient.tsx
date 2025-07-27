import { Box } from '@mui/material';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { WelcomeCard } from '../../components/cards/client/WelcomeCard';
import { UpcomingBookingsCard } from '../../components/cards/client/UpcomingBookingsCard';
import { RecentActivityCard } from '../../components/cards/client/RecentActivityCard';

// Mock data for upcoming bookings
const upcomingBookings: any[] = [
];

// Mock data for recent activity
const recentActivity: any[] = [
];

export function ClientDashboard() {

  return (
    <LayoutClient selectedNavItem="dashboard">
      <Box sx={{
        px: { xs: 1.5, sm: 1.5, md: 2.5 },
        pt: { xs: 1.5, sm: 1.5, md: 2.5 },
        pb: { xs: 1.5, sm: 1.5, md: 0.5 },
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 'auto', md: '100vh' },
        overflow: { xs: 'visible', md: 'hidden' },
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
      }}>
        {/* Welcome Card */}
        <WelcomeCard />

        {/* Main Content Grid - Half and Half */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2,
          flex: { xs: 'none', md: 1 }, 
          minHeight: 0,
          overflow: { xs: 'visible', md: 'visible' },
          pb: 2, // Increase bottom padding to ensure cards are fully visible
        }}>
          {/* Upcoming Bookings Section */}
          <UpcomingBookingsCard bookings={upcomingBookings} />

          {/* Recent Activity Section */}
          <RecentActivityCard activities={recentActivity} />
        </Box>
      </Box>
    </LayoutClient>
  );
} 