import { Box } from '@mui/material';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { WelcomeCard } from '../../components/cards/client/WelcomeCard';
import { UpcomingBookingsCard } from '../../components/cards/client/UpcomingBookingsCard';
import { RecentActivityCard } from '../../components/cards/client/RecentActivityCard';
import { useState, useEffect, useRef } from 'react';
import { getNotifications } from '../../api/notificationsService';
import { notificationsToActivityItems } from '../../utils/notificationUtils';
import type { ActivityItem } from '../../types/activity';
import { useAuth } from '../../context/auth';
import { bookingService, type Order } from '../../api/bookingService';

interface UpcomingBooking {
  id: number;
  bookingId: string; // The actual booking/order UUID
  serviceId: string;
  serviceTitle: string;
  dateTime: string;
  creative: string;
  startsIn: string;
  color: string;
}

/**
 * Format a date and time to a readable string
 * booking_date is already formatted as "YYYY-MM-DDTHH:MM:SSZ" by the backend
 */
function formatDateTime(bookingDate: string): string {
  try {
    if (!bookingDate) return 'Date TBD';
    
    const date = new Date(bookingDate);
    
    // Format: "Mon, Jan 15, 2024 at 2:00 PM"
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return bookingDate;
  }
}

/**
 * Calculate relative time until booking (e.g., "2 days", "3 hours")
 * booking_date is already formatted as "YYYY-MM-DDTHH:MM:SSZ" by the backend
 */
function calculateStartsIn(bookingDate: string): string {
  try {
    if (!bookingDate) return 'Unknown';
    
    const bookingDateTime = new Date(bookingDate);
    const now = new Date();
    const diffInMs = bookingDateTime.getTime() - now.getTime();
    
    if (diffInMs < 0) {
      return 'Past';
    }
    
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`;
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'}`;
    } else {
      return 'Soon';
    }
  } catch (error) {
    console.error('Error calculating starts in:', error);
    return 'Unknown';
  }
}

/**
 * Transform Order[] to UpcomingBooking[] format
 */
function transformOrdersToBookings(orders: Order[]): UpcomingBooking[] {
  return orders
    .filter(order => order.booking_date) // Only scheduled bookings with booking_date
    .map((order, index) => {
      // The backend already formats booking_date as "YYYY-MM-DDTHH:MM:SSZ"
      const bookingDate = order.booking_date || '';
      
      return {
        id: parseInt(order.id.replace(/-/g, '').substring(0, 10), 16) || index + 1, // Convert UUID to number
        bookingId: order.id, // The actual booking/order UUID
        serviceId: order.service_id,
        serviceTitle: order.service_name || 'Unknown Service',
        dateTime: formatDateTime(bookingDate),
        creative: order.creative_display_name || order.creative_name || 'Unknown Creative',
        startsIn: calculateStartsIn(bookingDate),
        color: order.service_color || '#3b82f6'
      };
    });
}

// Module-level cache to prevent duplicate fetches across remounts
const clientNotificationsCache = {
  promise: null as Promise<ActivityItem[]> | null,
  data: null as ActivityItem[] | null,
  timestamp: 0,
};

const clientUpcomingBookingsCache = {
  promise: null as Promise<UpcomingBooking[]> | null,
  data: null as UpcomingBooking[] | null,
  timestamp: 0,
};

const CACHE_DURATION = 5000; // 5 seconds cache

export function ClientDashboard() {
  const { isAuthenticated } = useAuth();
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Don't fetch notifications if user is not authenticated
    if (!isAuthenticated) {
      if (mountedRef.current) {
        setActivityItems([]);
        setIsLoading(false);
      }
      return;
    }
    
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
        const notifications = await getNotifications(25, 0, false, 'client');
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
  }, [isAuthenticated]);

  // Fetch upcoming bookings
  useEffect(() => {
    mountedRef.current = true;
    
    // Don't fetch bookings if user is not authenticated
    if (!isAuthenticated) {
      if (mountedRef.current) {
        setUpcomingBookings([]);
        setIsLoadingBookings(false);
      }
      return;
    }
    
    const now = Date.now();
    const cacheAge = now - clientUpcomingBookingsCache.timestamp;

    // Check if we have cached data that's still fresh
    if (clientUpcomingBookingsCache.data && cacheAge < CACHE_DURATION) {
      if (mountedRef.current) {
        setUpcomingBookings(clientUpcomingBookingsCache.data);
        setIsLoadingBookings(false);
      }
      return;
    }

    // Check if a promise already exists - reuse it immediately
    if (clientUpcomingBookingsCache.promise) {
      setIsLoadingBookings(true);
      clientUpcomingBookingsCache.promise.then(bookings => {
        if (!mountedRef.current) return;
        setUpcomingBookings(bookings);
        setIsLoadingBookings(false);
      }).catch(error => {
        if (!mountedRef.current) return;
        console.error('Error fetching upcoming bookings:', error);
        setUpcomingBookings([]);
        setIsLoadingBookings(false);
      });
      return;
    }

    // No promise exists - create one
    setIsLoadingBookings(true);
    
    const fetchPromise = (async () => {
      try {
        const orders = await bookingService.getClientUpcomingBookings();
        const bookings = transformOrdersToBookings(orders);
        
        // Cache the result
        clientUpcomingBookingsCache.data = bookings;
        clientUpcomingBookingsCache.timestamp = Date.now();
        clientUpcomingBookingsCache.promise = null;
        
        return bookings;
      } catch (error) {
        clientUpcomingBookingsCache.promise = null;
        throw error;
      }
    })();

    clientUpcomingBookingsCache.promise = fetchPromise;

    fetchPromise.then(bookings => {
      if (!mountedRef.current) return;
      setUpcomingBookings(bookings);
      setIsLoadingBookings(false);
    }).catch(error => {
      if (!mountedRef.current) return;
      console.error('Error fetching upcoming bookings:', error);
      setUpcomingBookings([]);
      setIsLoadingBookings(false);
    });

    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated]);

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
          <UpcomingBookingsCard bookings={upcomingBookings} isLoading={isLoadingBookings} />

          {/* Recent Activity Section */}
          <RecentActivityCard items={activityItems} isLoading={isLoading} />
        </Box>
      </Box>
      )}
    </LayoutClient>
  );
} 