import { Box } from '@mui/material';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { WelcomeCard } from '../../components/cards/client/WelcomeCard';
import { UpcomingBookingsCard } from '../../components/cards/client/UpcomingBookingsCard';
import { RecentActivityCard } from '../../components/cards/client/RecentActivityCard';

// Mock data for upcoming bookings
const upcomingBookings: any[] = [
  {
    id: 1,
    serviceTitle: 'Full Production',
    dateTime: '2024-01-15T14:00:00Z',
    producer: 'Mike Johnson',
    startsIn: '2 days',
    color: '#F3E8FF'
  },
  {
    id: 2,
    serviceTitle: 'Mixing & Mastering',
    dateTime: '2024-01-18T10:30:00Z',
    producer: 'Sarah Wilson',
    startsIn: '5 days',
    color: '#E0F2FE'
  },
  {
    id: 3,
    serviceTitle: 'Vocal Production',
    dateTime: '2024-01-20T16:00:00Z',
    producer: 'Alex Thompson',
    startsIn: '7 days',
    color: '#FEF9C3'
  },
  {
    id: 4,
    serviceTitle: 'Beat Making',
    dateTime: '2024-01-22T11:00:00Z',
    producer: 'David Chen',
    startsIn: '9 days',
    color: '#FEE2E2'
  },
  {
    id: 5,
    serviceTitle: 'Beat Making',
    dateTime: '2024-01-22T11:00:00Z',
    producer: 'David Chen',
    startsIn: '9 days',
    color: '#FEE2E2'
  },
  {
    id: 6,
    serviceTitle: 'Beat Making',
    dateTime: '2024-01-22T11:00:00Z',
    producer: 'David Chen',
    startsIn: '9 days',
    color: '#FEE2E2'
  }
];

// Mock data for recent activity
const recentActivity: any[] = [
  {
    id: 1,
    action: 'Booking confirmed with Mike Johnson',
    timestamp: '1 day ago',
    status: 'completed',
    statusText: 'Confirmed',
    producer: 'Mike Johnson'
  },
  {
    id: 2,
    action: 'Session completed with Sarah Wilson',
    timestamp: '2 days ago',
    status: 'completed',
    statusText: 'Completed',
    producer: 'Sarah Wilson'
  },
  {
    id: 3,
    action: 'Booking requested with Alex Thompson',
    timestamp: '3 days ago',
    status: 'waiting',
    statusText: 'Pending',
    producer: 'Alex Thompson'
  },
  {
    id: 4,
    action: 'Payment received from David Chen',
    timestamp: '4 days ago',
    status: 'payment',
    statusText: 'Payment',
    producer: 'David Chen'
  },
  {
    id: 5,
    action: 'Review submitted for Emma Davis',
    timestamp: '5 days ago',
    status: 'completed',
    statusText: 'Completed',
    producer: 'Emma Davis'
  },
  {
    id: 6,
    action: 'Review submitted for Emma Davis',
    timestamp: '5 days ago',
    status: 'completed',
    statusText: 'Completed',
    producer: 'Emma Davis'
  },
  {
    id: 7,
    action: 'Review submitted for Emma Davis',
    timestamp: '5 days ago',
    status: 'completed',
    statusText: 'Completed',
    producer: 'Emma Davis'
  },
  {
    id: 8,
    action: 'Review submitted for Emma Davis',
    timestamp: '5 days ago',
    status: 'completed',
    statusText: 'Completed',
    producer: 'Emma Davis'
  },
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