import { Box } from '@mui/material';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { WelcomeCard } from '../../components/cards/client/WelcomeCard';
import { UpcomingBookingsCard } from '../../components/cards/client/UpcomingBookingsCard';
import { RecentActivityCard } from '../../components/cards/client/RecentActivityCard';

// Mock data for upcoming bookings
const upcomingBookings = [
  {
    id: 1,
    serviceTitle: "Full Production Package",
    dateTime: "Dec 15, 2024 • 2:00 PM",
    producer: "Mike Johnson",
    startsIn: "2 days",
    color: "#F3E8FF"
  },
  {
    id: 2,
    serviceTitle: "Mixing & Mastering",
    dateTime: "Dec 20, 2024 • 10:00 AM",
    producer: "Sarah Wilson",
    startsIn: "1 week",
    color: "#E0F2FE"
  },
  {
    id: 3,
    serviceTitle: "Vocal Recording Session",
    dateTime: "Dec 25, 2024 • 1:00 PM",
    producer: "John Doe",
    startsIn: "3 days",
    color: "#FEF3C7"
  },
  {
    id: 4,
    serviceTitle: "Vocal Recording Session",
    dateTime: "Dec 25, 2024 • 1:00 PM",
    producer: "John Doe",
    startsIn: "3 days",
    color: "#FEF3C7"
  },
  {
    id: 5,
    serviceTitle: "Vocal Recording Session",
    dateTime: "Dec 25, 2024 • 1:00 PM",
    producer: "John Doe",
    startsIn: "3 days",
    color: "#FEF3C7"
  },
  {
    id: 6,
    serviceTitle: "Vocal Recording Session",
    dateTime: "Dec 25, 2024 • 1:00 PM",
    producer: "John Doe",
    startsIn: "3 days",
    color: "#FEF3C7"
  },
];

// Mock data for recent activity
const recentActivity = [
  {
    id: 1,
    action: "Booked Full Production Package",
    timestamp: "2 hours ago",
    status: "waiting",
    icon: null,
    statusText: "Waiting for file retrieval",
    producer: "Mike Johnson"
  },
  {
    id: 2,
    action: "Payment required for Mixing & Mastering",
    timestamp: "1 day ago",
    status: "payment",
    icon: null,
    statusText: "Payment required",
    producer: "Sarah Wilson"
  },
  {
    id: 3,
    action: "Downloaded final mix",
    timestamp: "3 days ago",
    status: "completed",
    icon: null,
    statusText: "File downloaded",
    producer: "Alex Thompson"
  },
  {
    id: 4,
    action: "Booked Vocal Recording Session",
    timestamp: "1 week ago",
    status: "completed",
    icon: null,
    statusText: "Session completed",
    producer: "John Doe"
  },
  {
    id: 5,
    action: "Connected with Producer Mike Johnson",
    timestamp: "1 week ago",
    status: "completed",
    icon: null,
    statusText: "Connection established",
    producer: "Mike Johnson"
  },
  {
    id: 6,
    action: "Payment completed for Full Production",
    timestamp: "2 weeks ago",
    status: "completed",
    icon: null,
    statusText: "Payment successful",
    producer: "David Chen"
  },
  {
    id: 7,
    action: "Requested revision for Mixing & Mastering",
    timestamp: "2 weeks ago",
    status: "waiting",
    icon: null,
    statusText: "Revision in progress",
    producer: "Lisa Rodriguez"
  },
  {
    id: 8,
    action: "Booked Studio Session",
    timestamp: "3 weeks ago",
    status: "completed",
    icon: null,
    statusText: "Session completed",
    producer: "James Wilson"
  }
];

export function ClientDashboard() {

  return (
    <LayoutClient selectedNavItem="dashboard">
      <Box sx={{
        p: { xs: 2, sm: 2, md: 2.5 },
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
        '@media (max-height: 784px)': {
          p: { xs: 1, sm: 1.5, md: 2 },
          pt: { md: 1 },
        },
      }}>
        {/* Welcome Card */}
        <WelcomeCard />

        {/* Main Content Grid - Half and Half */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2,
          flex: { xs: 'none', md: 0.82 }, // No flex on mobile, flex on desktop
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