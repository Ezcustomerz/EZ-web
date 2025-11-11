import { Box, CircularProgress } from '@mui/material';
import { RequestsTable } from '../../../components/tables/RequestsTable';
import { useEffect, useState, useRef, useCallback } from 'react';
import { bookingService, type Order } from '../../../api/bookingService';
import { useAuth } from '../../../context/auth';

// Module-level cache to prevent duplicate fetches across remounts
// This persists across StrictMode remounts to prevent duplicate API calls
let fetchCache: {
  promise: Promise<Order[]> | null;
  data: Order[] | null;
  isFetching: boolean;
  timestamp: number;
  resolved: boolean;
} = {
  promise: null,
  data: null,
  isFetching: false,
  timestamp: 0,
  resolved: false,
};

const CACHE_DURATION = 5000; // Cache for 5 seconds to handle StrictMode remounts

// Helper function to transform orders
function transformOrders(fetchedOrders: Order[]) {
  // No need to filter - backend endpoint already filters for current orders
  return fetchedOrders.map((order: Order) => {
      // Map creative_status to display status
      const statusMap: Record<string, string> = {
        'pending_approval': 'Pending Approval',
        'awaiting_payment': 'Awaiting Payment',
        'in_progress': 'In Progress',
        'completed': 'Complete',
        'complete': 'Complete',
        'canceled': 'Canceled',
        'rejected': 'Canceled',
      };
      
      const displayStatus = statusMap[order.creative_status || 'pending_approval'] || 'Pending Approval';

    // Format booking date - backend sends UTC ISO string, keep as is for proper timezone conversion
    let bookingDateDisplay = null;
    if (order.booking_date) {
      try {
        // Backend sends ISO string format (YYYY-MM-DDTHH:MM:SSZ), parse it
        const parsedDate = new Date(order.booking_date);
        
        // Validate the date is valid
        if (!isNaN(parsedDate.getTime())) {
          // Keep as ISO string - timezone conversion will happen in display components
          bookingDateDisplay = parsedDate.toISOString();
        } else {
          console.warn('Invalid booking date:', order.booking_date);
          bookingDateDisplay = null;
        }
      } catch (error) {
        console.warn('Error parsing booking date:', order.booking_date, error);
        bookingDateDisplay = null;
      }
    }

    return {
      id: order.id,
      client: order.creative_name, // For creative, this is the client name
      service: {
        id: order.service_id,
        title: order.service_name,
        description: order.service_description || '',
        delivery_time: order.service_delivery_time || '',
        color: order.service_color || '#667eea',
        payment_option: order.payment_option || 'later',
        photos: [], // TODO: Add service photos if needed
      },
      amount: order.price,
      status: displayStatus,
      date: order.order_date,
      bookingDate: bookingDateDisplay,
      description: order.description || order.service_description || '',
      clientEmail: order.creative_email,
      clientPhone: undefined, // TODO: Add client phone if available
      specialRequirements: order.description,
      amountPaid: 0, // TODO: Calculate from payment records
      amountRemaining: order.price,
      depositPaid: false,
    };
  });
}
 
export function CurrentOrdersTab() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Function to refresh orders
  const refreshOrders = useCallback(async () => {
    // Don't refresh if not authenticated
    if (!isAuthenticated) {
      if (mountedRef.current) {
        setOrders([]);
        setLoading(false);
      }
      return;
    }

    // Clear cache to force fresh fetch
    fetchCache.promise = null;
    fetchCache.data = null;
    fetchCache.resolved = false;
    fetchCache.isFetching = false;
    
    setLoading(true);
    try {
      const fetchedOrders = await bookingService.getCreativeCurrentOrders();
      const transformedOrders = transformOrders(fetchedOrders);
      
      if (mountedRef.current) {
        setOrders(transformedOrders);
        setLoading(false);
      }
      
      // Update cache
      fetchCache.data = fetchedOrders;
      fetchCache.isFetching = false;
      fetchCache.resolved = true;
      fetchCache.timestamp = Date.now();
    } catch (error) {
      console.error('Failed to refresh orders:', error);
      if (mountedRef.current) {
        setLoading(false);
      }
      throw error;
    }
  }, [isAuthenticated]);

  // Fetch orders on mount - only once
  useEffect(() => {
    mountedRef.current = true;
    
    // Don't fetch orders if user is not authenticated
    if (!isAuthenticated) {
      if (mountedRef.current) {
        setOrders([]);
        setLoading(false);
      }
      return;
    }
    
    const now = Date.now();
    const cacheAge = now - fetchCache.timestamp;
    
    // Check if we have cached data that's still fresh
    if (fetchCache.resolved && fetchCache.data && cacheAge < CACHE_DURATION) {
      // Use cached data directly (fastest path)
      if (mountedRef.current) {
        const transformedOrders = transformOrders(fetchCache.data);
        setOrders(transformedOrders);
        setLoading(false);
      }
      return;
    }
    
    // Reuse existing promise if it's currently fetching
    if (fetchCache.promise && fetchCache.isFetching) {
      // Reuse existing promise (handles StrictMode remounts)
      fetchCache.promise.then(fetchedOrders => {
        if (!mountedRef.current) return;
        const transformedOrders = transformOrders(fetchedOrders);
        setOrders(transformedOrders);
        setLoading(false);
      }).catch(error => {
        if (!mountedRef.current) return;
        console.error('Failed to fetch orders:', error);
        setLoading(false);
      });
      return;
    }

    // Start new fetch
    fetchCache.isFetching = true;
    fetchCache.resolved = false;
    fetchCache.timestamp = now;
    setLoading(true);

    const fetchOrders = async () => {
      try {
        const fetchedOrders = await bookingService.getCreativeCurrentOrders();
        
        // Transform orders to match RequestsTable expected format
        const transformedOrders = transformOrders(fetchedOrders);
        
        if (mountedRef.current) {
          setOrders(transformedOrders);
          setLoading(false);
        }
        // Cache the resolved data
        fetchCache.data = fetchedOrders;
        fetchCache.isFetching = false;
        fetchCache.resolved = true;
        // Keep the data and promise in cache for CACHE_DURATION to handle remounts
        setTimeout(() => {
          const now = Date.now();
          if (now - fetchCache.timestamp >= CACHE_DURATION) {
            fetchCache.promise = null;
            fetchCache.data = null;
            fetchCache.resolved = false;
          }
        }, CACHE_DURATION);
        return fetchedOrders;
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
        fetchCache.isFetching = false;
        // Clear cache on error
        fetchCache.promise = null;
        throw error;
      }
    };

    fetchCache.promise = fetchOrders();
    fetchCache.promise.catch(() => {
      // Error already handled in fetchOrders
    });

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated]); // Re-run when authentication changes

  if (loading) {
    return (
      <Box sx={{
        width: '100%',
        flexGrow: 1,
        py: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 1,
      overflow: 'visible',
    }}>
      <RequestsTable requests={orders} context="orders" onRefresh={refreshOrders} />
    </Box>
  );
}


