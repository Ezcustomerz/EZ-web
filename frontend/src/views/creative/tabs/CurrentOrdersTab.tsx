import { Box, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, Stack } from '@mui/material';
import { RequestsTable } from '../../../components/tables/RequestsTable';
import { useEffect, useState, useRef, useCallback } from 'react';
import { bookingService, type Order } from '../../../api/bookingService';
import { useAuth } from '../../../context/auth';
import { useTheme, useMediaQuery } from '@mui/material';

// Reset check flag when orderIdToOpen changes

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
      split_deposit_amount: order.split_deposit_amount,
      description: order.description || order.service_description || '',
      clientEmail: order.creative_email,
      clientPhone: undefined, // TODO: Add client phone if available
      specialRequirements: order.description,
      amountPaid: order.amount_paid || 0,
      amountRemaining: order.price - (order.amount_paid || 0),
      depositPaid: order.payment_option === 'split' && (order.amount_paid || 0) >= (order.split_deposit_amount || Math.round(order.price * 0.5 * 100) / 100),
    };
  });
}
 
export function CurrentOrdersTab({ orderIdToOpen, onOrderOpened, onOrderNotFound }: { orderIdToOpen?: string | null; onOrderOpened?: () => void; onOrderNotFound?: () => void }) {
  const hasCheckedForOrderRef = useRef<string | null>(null);
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
        
        // Check if we're looking for an order and it's not in the list
        // Use setTimeout to ensure this runs after state update
        if (orderIdToOpen && onOrderNotFound && hasCheckedForOrderRef.current !== orderIdToOpen) {
          setTimeout(() => {
            if (mountedRef.current && hasCheckedForOrderRef.current !== orderIdToOpen) {
              hasCheckedForOrderRef.current = orderIdToOpen;
              const orderFound = transformedOrders.some(order => order.id === orderIdToOpen);
              if (!orderFound) {
                // Order not found in Current Orders, notify parent to try Past Orders
                onOrderNotFound();
              }
            }
          }, 200);
        }
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
        
        // Check if we're looking for an order and it's not in the list
        // Use setTimeout to ensure this runs after state update
        if (orderIdToOpen && onOrderNotFound && hasCheckedForOrderRef.current !== orderIdToOpen) {
          setTimeout(() => {
            if (mountedRef.current && hasCheckedForOrderRef.current !== orderIdToOpen) {
              hasCheckedForOrderRef.current = orderIdToOpen;
              const orderFound = transformedOrders.some(order => order.id === orderIdToOpen);
              if (!orderFound) {
                // Order not found in Current Orders, notify parent to try Past Orders
                onOrderNotFound();
              }
            }
          }, 200);
        }
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
          
          // Check if we're looking for an order and it's not in the list
          // Use setTimeout to ensure this runs after state update
          if (orderIdToOpen && onOrderNotFound) {
            setTimeout(() => {
              const orderFound = transformedOrders.some(order => order.id === orderIdToOpen);
              if (!orderFound) {
                // Order not found in Current Orders, notify parent to try Past Orders
                onOrderNotFound();
              }
            }, 100);
          }
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (loading) {
    return (
      <Box sx={{
        width: '100%',
        flexGrow: 1,
        py: 1,
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}>
        {isMobile ? (
          // Mobile view with search/filter and card skeletons
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            {/* Search and Filter Skeletons */}
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: '#fff',
                pb: 1,
                px: 2,
              }}
            >
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="text" width={80} height={20} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                </Box>
              </Stack>
            </Box>
            {/* Card skeletons */}
            <Box sx={{ pt: 2, px: 2, flex: 1, overflowY: 'auto' }}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <Card
                  key={`skeleton-${idx}`}
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                    animation: `fadeIn 0.5s ease-in ${idx * 0.1}s both`,
                    '@keyframes fadeIn': {
                      from: { opacity: 0, transform: 'translateY(10px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Skeleton variant="text" width="40%" height={24} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="rectangular" width={60} height={22} sx={{ borderRadius: 1.5 }} />
                        <Skeleton variant="circular" width={18} height={18} />
                      </Box>
                    </Stack>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Skeleton variant="text" width="30%" height={18} />
                      <Skeleton variant="text" width="25%" height={18} />
                    </Stack>
                    <Skeleton variant="text" width="50%" height={16} />
                  </Stack>
                </Card>
              ))}
            </Box>
          </Box>
        ) : (
          // Desktop view with search/filter and table skeleton
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            {/* Search and Filter Skeletons */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0,
                pb: 1,
                flexDirection: 'row',
                gap: 2,
                flexShrink: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="rectangular" width={280} height={40} sx={{ borderRadius: 1 }} />
                <Skeleton variant="text" width={80} height={20} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: 'auto' }}>
                <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
            {/* Desktop table skeleton */}
            <TableContainer
              sx={{
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                width: '100%',
                flex: '1 1 0',
                minHeight: 0,
                overflow: 'auto',
              }}
            >
              <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#e6f3fa' }}>
                    <TableCell><Skeleton variant="text" width={80} height={20} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} height={20} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} height={20} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} height={20} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} height={20} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} height={20} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} height={20} /></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <TableRow
                      key={`skeleton-row-${idx}`}
                      sx={{
                        animation: `fadeIn 0.5s ease-in ${idx * 0.08}s both`,
                        '@keyframes fadeIn': {
                          from: { opacity: 0 },
                          to: { opacity: 1 },
                        },
                      }}
                    >
                      <TableCell><Skeleton variant="text" width="80%" height={20} /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" height={20} /></TableCell>
                      <TableCell><Skeleton variant="text" width={60} height={20} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 1 }} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} height={20} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} height={20} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} height={20} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
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
      <RequestsTable requests={orders} context="orders" onRefresh={refreshOrders} orderIdToOpen={orderIdToOpen} onOrderOpened={onOrderOpened} onOrderNotFound={onOrderNotFound} />
    </Box>
  );
}


