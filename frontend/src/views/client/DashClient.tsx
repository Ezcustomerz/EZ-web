import { Box } from '@mui/material';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { WelcomeCard } from '../../components/cards/client/WelcomeCard';
import { UpcomingBookingsCard } from '../../components/cards/client/UpcomingBookingsCard';
import { RecentActivityCard } from '../../components/cards/client/RecentActivityCard';
import type { ActivityItem } from '../../types/activity';
import { CheckCircleOutlined, Payment } from '@mui/icons-material';

// Mock data for upcoming bookings
const upcomingBookings: any[] = [
  {
    id: 1,
    serviceTitle: 'Full Production',
    dateTime: '2024-01-15T14:00:00Z',
    creative: 'Mike Johnson',
    startsIn: '2 days',
    color: '#F3E8FF'
  },
  {
    id: 2,
    serviceTitle: 'Mixing & Mastering',
    dateTime: '2024-01-18T10:30:00Z',
    creative: 'Sarah Wilson',
    startsIn: '5 days',
    color: '#E0F2FE'
  },
  {
    id: 3,
    serviceTitle: 'Vocal Production',
    dateTime: '2024-01-20T16:00:00Z',
    creative: 'Alex Thompson',
    startsIn: '7 days',
    color: '#FEF9C3'
  },
  {
    id: 4,
    serviceTitle: 'Beat Making',
    dateTime: '2024-01-22T11:00:00Z',
    creative: 'David Chen',
    startsIn: '9 days',
    color: '#FEE2E2'
  },
  {
    id: 5,
    serviceTitle: 'Beat Making',
    dateTime: '2024-01-22T11:00:00Z',
    creative: 'David Chen',
    startsIn: '9 days',
    color: '#FEE2E2'
  },
  {
    id: 6,
    serviceTitle: 'Beat Making',
    dateTime: '2024-01-22T11:00:00Z',
    creative: 'David Chen',
    startsIn: '9 days',
    color: '#FEE2E2'
  }
];

// Unified mock data for recent activity (client side)
const recentItems: ActivityItem[] = [
  {
    label: 'Booking confirmed with Mike Johnson',
    description: 'Your booking has been confirmed.',
    date: '1 day ago',
    status: 'completed',
    counterpart: 'Mike Johnson',
    isNew: true,
    icon: CheckCircleOutlined,
  },
  {
    label: 'Session completed with Sarah Wilson',
    description: 'Your session was completed successfully.',
    date: '2 days ago',
    status: 'completed',
    counterpart: 'Sarah Wilson',
    isNew: true,
    icon: CheckCircleOutlined,
  },
  {
    label: 'Payment received from David Chen',
    description: 'Payment received and recorded.',
    date: '4 days ago',
    status: 'payment',
    counterpart: 'David Chen',
    isNew: false,
    icon: Payment,
  },
  {
    label: 'Review submitted for Emma Davis',
    description: 'Thanks for leaving a review.',
    date: '5 days ago',
    status: 'completed',
    counterpart: 'Emma Davis',
    isNew: false,
    icon: CheckCircleOutlined,
  },
];

export function ClientDashboard() {

  return (
    <LayoutClient selectedNavItem="dashboard">
      {({ isSidebarOpen, isMobile, clientProfile }) => (
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
        <WelcomeCard 
          userName={clientProfile?.display_name || "Demo User"} 
          userType={clientProfile?.title || "Country Artist"} 
        />

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
          <RecentActivityCard items={recentItems} />
        </Box>
      </Box>
      )}
    </LayoutClient>
  );
} 