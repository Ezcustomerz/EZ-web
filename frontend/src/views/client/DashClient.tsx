import { Box } from '@mui/material';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { WelcomeCard } from '../../components/cards/client/WelcomeCard';
import { UpcomingBookingsCard } from '../../components/cards/client/UpcomingBookingsCard';
import { RecentActivityCard } from '../../components/cards/client/RecentActivityCard';
import { useState, useEffect, useRef } from 'react';
import { getNotifications } from '../../api/notificationsService';
import { notificationsToActivityItems } from '../../utils/notificationUtils';
import type { ActivityItem } from '../../types/activity';

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

// Module-level cache to prevent duplicate fetches across remounts
const clientNotificationsCache = {
  promise: null as Promise<ActivityItem[]> | null,
  data: null as ActivityItem[] | null,
  timestamp: 0,
};

const CACHE_DURATION = 5000; // 5 seconds cache

export function ClientDashboard() {
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const now = Date.now();
    const cacheAge = now - clientNotificationsCache.timestamp;

    // Check if we have cached data that's still fresh
    if (clientNotificationsCache.data && cacheAge < CACHE_DURATION) {
      if (mountedRef.current) {
        setActivityItems(clientNotificationsCache.data);
        setIsLoading(false);
      }
      return;
    }

    // Check if a promise already exists - reuse it immediately
    if (clientNotificationsCache.promise) {
      setIsLoading(true);
      clientNotificationsCache.promise.then(items => {
        if (!mountedRef.current) return;
        setActivityItems(items);
        setIsLoading(false);
      }).catch(error => {
        if (!mountedRef.current) return;
        console.error('Error fetching notifications:', error);
        setActivityItems([]);
        setIsLoading(false);
      });
      return;
    }

    // No promise exists - create one
    setIsLoading(true);
    
    const fetchPromise = (async () => {
      try {
        const notifications = await getNotifications(50, 0, false, 'client');
        const items = notificationsToActivityItems(notifications);
        
        // Cache the result
        clientNotificationsCache.data = items;
        clientNotificationsCache.timestamp = Date.now();
        clientNotificationsCache.promise = null;
        
        return items;
      } catch (error) {
        clientNotificationsCache.promise = null;
        throw error;
      }
    })();

    clientNotificationsCache.promise = fetchPromise;

    fetchPromise.then(items => {
      if (!mountedRef.current) return;
      setActivityItems(items);
      setIsLoading(false);
    }).catch(error => {
      if (!mountedRef.current) return;
      console.error('Error fetching notifications:', error);
      setActivityItems([]);
      setIsLoading(false);
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <LayoutClient selectedNavItem="dashboard">
      {({ clientProfile }) => (
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
            <RecentActivityCard items={activityItems} />
          </Box>
        </Box>
      )}
    </LayoutClient>
  );
} 