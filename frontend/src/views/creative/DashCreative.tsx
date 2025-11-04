import { Box, Typography, Divider, useTheme, useMediaQuery } from '@mui/material';
import { LayoutCreative } from '../../layout/creative/LayoutCreative';
import { WelcomeCard } from '../../components/cards/creative/WelcomeCard';
import { ActivityFeedCard } from '../../components/cards/creative/ActivityFeedCard';
import type { CreativeProfile } from '../../api/userService';
import { useState, useEffect, useRef } from 'react';
import { getNotifications } from '../../api/notificationsService';
import { notificationsToActivityItems } from '../../utils/notificationUtils';
import type { ActivityItem } from '../../types/activity';
import { useAuth } from '../../context/auth';

// Module-level cache to prevent duplicate fetches across remounts
const notificationsCache = {
  promise: null as Promise<ActivityItem[]> | null,
  data: null as ActivityItem[] | null,
  timestamp: 0,
};

const CACHE_DURATION = 5000; // 5 seconds cache

export function DashCreative() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // iPad Air and smaller
  const { isAuthenticated } = useAuth();
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const cacheAge = now - notificationsCache.timestamp;

    // Check if we have cached data that's still fresh
    if (notificationsCache.data && cacheAge < CACHE_DURATION) {
      if (mountedRef.current) {
        setActivityItems(notificationsCache.data);
        setIsLoading(false);
      }
      return;
    }

    // Check if a promise already exists - reuse it immediately
    if (notificationsCache.promise) {
      setIsLoading(true);
      notificationsCache.promise.then(items => {
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
        const notifications = await getNotifications(50, 0, false, 'creative');
        const items = notificationsToActivityItems(notifications);
        
        // Cache the result
        notificationsCache.data = items;
        notificationsCache.timestamp = Date.now();
        notificationsCache.promise = null;
        
        return items;
      } catch (error) {
        notificationsCache.promise = null;
        throw error;
      }
    })();

    notificationsCache.promise = fetchPromise;

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

  return (
    <LayoutCreative selectedNavItem="dashboard">
      {({ isSidebarOpen, creativeProfile }) => (
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
          <WelcomeCard 
            userName={creativeProfile?.display_name || "Demo User"} 
            userRole={creativeProfile?.title || "Music Creative"} 
            isSidebarOpen={isSidebarOpen} 
          />

          {/* Section Divider */}
          <Box sx={{ mb: 2.5 }}>
            <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.12)' }} />
          </Box>

          {/* Activity Feed Card */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ActivityFeedCard items={activityItems} isLoading={isLoading} />
          </Box>
        </Box>
      )}
    </LayoutCreative>
  );
} 