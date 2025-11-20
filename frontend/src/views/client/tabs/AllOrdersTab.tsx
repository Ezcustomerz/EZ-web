import { 
  Box, 
  Typography, 
  TextField, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  useTheme,
  useMediaQuery,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search, FilterList, DateRange, ShoppingBag } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlacedOrderCard } from '../../../components/cards/client/PlacedOrderCard';
import { PaymentApprovalOrderCard } from '../../../components/cards/client/PaymentApprovalOrderCard';
import { InProgressOrderCard } from '../../../components/cards/client/InProgressOrderCard';
import { LockedOrderCard } from '../../../components/cards/client/LockedOrderCard';
import { DownloadOrderCard } from '../../../components/cards/client/DownloadOrderCard';
import { CompletedOrderCard } from '../../../components/cards/client/CompletedOrderCard';
import { CanceledOrderCard } from '../../../components/cards/client/CanceledOrderCard';
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
  return fetchedOrders.map((order: Order) => ({
    id: order.id,
    serviceName: order.service_name,
    creativeName: order.creative_name,
    orderDate: order.order_date,
    description: order.description || order.service_description || '',
    price: order.price,
    calendarDate: order.booking_date || null,
    canceledDate: order.canceled_date,
    approvedDate: order.approved_at || null,
    completedDate: null, // Not available in API response, but required by component
    paymentOption: order.price === 0 || order.price === null ? 'free' :
                   order.payment_option === 'upfront' ? 'payment_upfront' : 
                   order.payment_option === 'split' ? 'split_payment' : 'payment_later',
    status: order.status === 'placed' ? 'placed' :
            order.status === 'payment_required' ? 'payment-required' :
            order.status === 'in_progress' ? 'in-progress' :
            order.status === 'locked' ? 'locked' :
            order.status === 'download' ? 'download' :
            order.status === 'completed' ? 'completed' :
            order.status === 'canceled' ? 'canceled' : 'placed',
    amountPaid: order.amount_paid || 0,
    amountRemaining: order.price - (order.amount_paid || 0),
    depositAmount: order.payment_option === 'split' ? Math.round(order.price * 0.5 * 100) / 100 : undefined,
    remainingAmount: order.payment_option === 'split' ? Math.round((order.price - Math.round(order.price * 0.5 * 100) / 100) * 100) / 100 : undefined,
    serviceId: order.service_id,
    serviceDescription: order.service_description,
    serviceDeliveryTime: order.service_delivery_time,
    serviceColor: order.service_color,
    creativeAvatarUrl: order.creative_avatar_url,
    creativeDisplayName: order.creative_display_name,
    creativeTitle: order.creative_title,
    creativeId: order.creative_id,
    creativeEmail: order.creative_email,
    creativeRating: order.creative_rating,
    creativeReviewCount: order.creative_review_count,
    creativeServicesCount: order.creative_services_count,
    creativeColor: order.creative_color,
    // Files for locked/download orders
    files: order.files && Array.isArray(order.files) && order.files.length > 0 
      ? order.files.map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size
        }))
      : undefined,
    // File count and size for display
    fileCount: order.files ? order.files.length : null,
    fileSize: order.files && order.files.length > 0 
      ? (() => {
          const totalKB = order.files.reduce((total, f) => {
            const sizeMatch = f.size.match(/([\d.]+)\s*(KB|MB)/);
            if (sizeMatch) {
              const value = parseFloat(sizeMatch[1]);
              const unit = sizeMatch[2];
              return total + (unit === 'MB' ? value * 1024 : value);
            }
            return total;
          }, 0);
          return totalKB >= 1024 ? `${(totalKB / 1024).toFixed(2)} MB` : `${totalKB.toFixed(2)} KB`;
        })()
      : null,
    invoices: order.invoices || [],
  }));
}

export function AllServicesTab() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creativeFilter, setCreativeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [orders, setOrders] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [connectedCreatives, setConnectedCreatives] = useState<Array<{ id: string; name: string }>>([]);
  const mountedRef = useRef(true);

  // Fetch orders on mount - only once
  useEffect(() => {
    mountedRef.current = true;
    
    // Don't fetch orders if user is not authenticated
    if (!isAuthenticated) {
      if (mountedRef.current) {
        setOrders([]);
        setConnectedCreatives([]);
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
        
        // Extract unique creatives
        const creatives = Array.from(
          new Map(
            transformedOrders.map(order => [
              order.creativeId,
              { id: order.creativeId, name: order.creativeName }
            ])
          ).values()
        );
        setConnectedCreatives(creatives);
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
        
        // Extract unique creatives
        const creatives = Array.from(
          new Map(
            transformedOrders.map(order => [
              order.creativeId,
              { id: order.creativeId, name: order.creativeName }
            ])
          ).values()
        );
        setConnectedCreatives(creatives);
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
        const fetchedOrders = await bookingService.getClientOrders();
        
        // Transform orders to match expected format
        const transformedOrders = transformOrders(fetchedOrders);
        
        if (mountedRef.current) {
          setOrders(transformedOrders);

          // Extract unique creatives
          const creatives = Array.from(
            new Map(
              transformedOrders.map(order => [
                order.creativeId,
                { id: order.creativeId, name: order.creativeName }
              ])
            ).values()
          );
          setConnectedCreatives(creatives);
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
  }, [isAuthenticated]);
  

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handleCreativeChange = (event: SelectChangeEvent) => {
    setCreativeFilter(event.target.value);
  };

  const handleDateChange = (event: SelectChangeEvent) => {
    setDateFilter(event.target.value);
  };

  // Function to refresh orders after cancellation
  const handleRefreshOrders = async () => {
    // Don't refresh if not authenticated
    if (!isAuthenticated) {
      setOrders([]);
      setConnectedCreatives([]);
      setLoading(false);
      return;
    }

    // Clear the cache to force a fresh fetch
    fetchCache.promise = null;
    fetchCache.data = null;
    fetchCache.resolved = false;
    fetchCache.isFetching = false;
    fetchCache.timestamp = 0;

    // Trigger a re-fetch
    setLoading(true);
    try {
      const fetchedOrders = await bookingService.getClientOrders();
      const transformedOrders = transformOrders(fetchedOrders);
      
      setOrders(transformedOrders);
      
      // Extract unique creatives
      const creatives = Array.from(
        new Map(
          transformedOrders.map(order => [
            order.creativeId,
            { id: order.creativeId, name: order.creativeName }
          ])
        ).values()
      );
      setConnectedCreatives(creatives);
      
      // Update cache
      fetchCache.data = fetchedOrders;
      fetchCache.resolved = true;
      fetchCache.timestamp = Date.now();
    } catch (error) {
      console.error('Failed to refresh orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const getFilteredOrders = () => {
    return orders.filter(order => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          order.serviceName.toLowerCase().includes(query) ||
          order.creativeName.toLowerCase().includes(query) ||
          order.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Creative filter
      if (creativeFilter !== 'all') {
        const creative = connectedCreatives.find(c => c.id === creativeFilter);
        if (creative && order.creativeName !== creative.name) {
          return false;
        }
      }

      // Date filter (based on order date)
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.orderDate);
        const now = new Date();
        const diffTime = now.getTime() - orderDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (dateFilter) {
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
          case '3months':
            if (diffDays > 90) return false;
            break;
          case '6months':
            if (diffDays > 180) return false;
            break;
          case 'year':
            if (diffDays > 365) return false;
            break;
        }
      }

      return true;
    });
  };

  const filteredOrders = getFilteredOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return '#ff9800';
      case 'payment-required':
        return '#00bcd4';
      case 'in-progress':
        return '#2196f3';
      case 'download':
        return '#0097a7';
      case 'completed':
        return '#4caf50';
      case 'canceled':
        return '#f44336';
      case 'locked':
        return '#9c27b0';
      default:
        return theme.palette.primary.main;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
      {/* Search and Filters Section */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        alignItems: { xs: 'stretch', md: 'center' }
      }}>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: { xs: 1, md: 2 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
            },
          }}
        />

        {isMobile ? (
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFilterModalOpen(true)}
            sx={{ 
              width: '100%',
              minWidth: 0,
              py: 1,
              px: 2,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Filters
          </Button>
        ) : (
          <>
            {/* Status Filter */}
            <FormControl 
              sx={{ 
                minWidth: { xs: '100%', md: 180 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            >
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={statusFilter}
            label="Status"
            onChange={handleStatusChange}
            startAdornment={
              <InputAdornment position="start">
                <FilterList sx={{ fontSize: 20, ml: 0.5 }} />
              </InputAdornment>
            }
          >
            <MenuItem value="all" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                All Statuses
              </Box>
            </MenuItem>
            <MenuItem value="placed" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('placed') 
                }} />
                Placed
              </Box>
            </MenuItem>
            <MenuItem value="payment-required" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('payment-required') 
                }} />
                Payment Required
              </Box>
            </MenuItem>
            <MenuItem value="in-progress" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('in-progress') 
                }} />
                In Progress
              </Box>
            </MenuItem>
            <MenuItem value="download" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('download') 
                }} />
                Download
              </Box>
            </MenuItem>
            <MenuItem value="completed" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('completed') 
                }} />
                Completed
              </Box>
            </MenuItem>
            <MenuItem value="locked" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('locked') 
                }} />
                Locked
              </Box>
            </MenuItem>
            <MenuItem value="canceled" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('canceled') 
                }} />
                Canceled
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Connected Creative Filter */}
        <FormControl 
          sx={{ 
            minWidth: { xs: '100%', md: 200 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        >
          <InputLabel id="creative-filter-label">Connected Creative</InputLabel>
          <Select
            labelId="creative-filter-label"
            id="creative-filter"
            value={creativeFilter}
            label="Connected Creative"
            onChange={handleCreativeChange}
          >
            <MenuItem value="all" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              All Creatives
            </MenuItem>
            {connectedCreatives.map((creative) => (
              <MenuItem key={creative.id} value={creative.id} sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                {creative.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date Range Filter */}
        <FormControl 
          sx={{ 
            minWidth: { xs: '100%', md: 180 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        >
          <InputLabel id="date-filter-label">Time Period</InputLabel>
          <Select
            labelId="date-filter-label"
            id="date-filter"
            value={dateFilter}
            label="Time Period"
            onChange={handleDateChange}
            startAdornment={
              <InputAdornment position="start">
                <DateRange sx={{ fontSize: 20, ml: 0.5 }} />
              </InputAdornment>
            }
          >
            <MenuItem value="all" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              All Time
            </MenuItem>
            <MenuItem value="week" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              Past Week
            </MenuItem>
            <MenuItem value="month" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              Past Month
            </MenuItem>
            <MenuItem value="3months" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              Past 3 Months
            </MenuItem>
            <MenuItem value="6months" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              Past 6 Months
            </MenuItem>
            <MenuItem value="year" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              Past Year
            </MenuItem>
          </Select>
        </FormControl>
          </>
        )}
      </Box>

      {/* Filter Modal for Mobile */}
      <Dialog
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        fullWidth
        maxWidth="xs"
        disableEnforceFocus
        PaperProps={{
          sx: { borderRadius: 3, p: 1, background: 'rgba(255,255,255,0.98)' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1.5 }}>Filters</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5, px: 4, overflow: 'visible' }}>
          {/* Status Filter */}
          <FormControl size="small" fullWidth sx={{ minWidth: 0 }} margin="dense">
            <InputLabel id="modal-status-filter-label" shrink={true}>Status</InputLabel>
            <Select
              labelId="modal-status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={handleStatusChange}
              startAdornment={
                <InputAdornment position="start">
                  <FilterList sx={{ fontSize: 20, ml: 0.5 }} />
                </InputAdornment>
              }
            >
              <MenuItem value="all" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  All Statuses
                </Box>
              </MenuItem>
              <MenuItem value="placed" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor('placed') 
                  }} />
                  Placed
                </Box>
              </MenuItem>
              <MenuItem value="payment-required" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor('payment-required') 
                  }} />
                  Payment Required
                </Box>
              </MenuItem>
              <MenuItem value="in-progress" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor('in-progress') 
                  }} />
                  In Progress
                </Box>
              </MenuItem>
              <MenuItem value="download" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor('download') 
                  }} />
                  Download
                </Box>
              </MenuItem>
              <MenuItem value="completed" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor('completed') 
                  }} />
                  Completed
                </Box>
              </MenuItem>
              <MenuItem value="locked" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor('locked') 
                  }} />
                  Locked
                </Box>
              </MenuItem>
              <MenuItem value="canceled" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor('canceled') 
                  }} />
                  Canceled
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Connected Creative Filter */}
          <FormControl size="small" fullWidth sx={{ minWidth: 0 }} margin="dense">
            <InputLabel id="modal-creative-filter-label" shrink={true}>Connected Creative</InputLabel>
            <Select
              labelId="modal-creative-filter-label"
              value={creativeFilter}
              label="Connected Creative"
              onChange={handleCreativeChange}
            >
              <MenuItem value="all" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                All Creatives
              </MenuItem>
              {connectedCreatives.map((creative) => (
                <MenuItem key={creative.id} value={creative.id} sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    color: theme.palette.primary.main,
                    backgroundColor: 'transparent !important',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'transparent',
                    fontWeight: 600,
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'transparent !important',
                  },
                }}>
                  {creative.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Range Filter */}
          <FormControl size="small" fullWidth sx={{ minWidth: 0 }} margin="dense">
            <InputLabel id="modal-date-filter-label" shrink={true}>Time Period</InputLabel>
            <Select
              labelId="modal-date-filter-label"
              value={dateFilter}
              label="Time Period"
              onChange={handleDateChange}
              startAdornment={
                <InputAdornment position="start">
                  <DateRange sx={{ fontSize: 20, ml: 0.5 }} />
                </InputAdornment>
              }
            >
              <MenuItem value="all" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                All Time
              </MenuItem>
              <MenuItem value="week" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                Past Week
              </MenuItem>
              <MenuItem value="month" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                Past Month
              </MenuItem>
              <MenuItem value="3months" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                Past 3 Months
              </MenuItem>
              <MenuItem value="6months" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                Past 6 Months
              </MenuItem>
              <MenuItem value="year" sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                Past Year
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterModalOpen(false)} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>Apply</Button>
        </DialogActions>
      </Dialog>

      {/* Orders Content Area */}
      <Box sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        overflowY: 'auto',
        overflowX: 'visible',
        pr: 1,
        pt: 3,
        maxHeight: 'calc(100vh - 300px)',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          },
        },
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 8,
            gap: 1
          }}>
            <Search sx={{ fontSize: 64, color: 'primary.main', opacity: 0.4 }} />
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 500 }}>
              No orders found
            </Typography>
            <Typography variant="body2" sx={{ color: 'primary.main', opacity: 0.8 }}>
              Try adjusting your filters or search query
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ShoppingBag />}
              onClick={() => navigate('/client/book')}
              sx={{
                mt: 2,
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  borderColor: 'primary.dark',
                  color: 'primary.dark',
                  backgroundColor: 'action.hover',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Browse Services
            </Button>
          </Box>
        ) : (
          filteredOrders.map((order) => {
            const commonProps = {
              id: order.id,
              serviceName: order.serviceName,
              creativeName: order.creativeName,
              orderDate: order.orderDate,
              description: order.description,
              price: order.price,
            };

            switch (order.status) {
              case 'placed':
                return <PlacedOrderCard 
                  key={order.id}
                  {...commonProps} 
                  calendarDate={order.calendarDate}
                  paymentOption={order.paymentOption}
                  serviceId={order.serviceId}
                  serviceDescription={order.serviceDescription}
                  serviceDeliveryTime={order.serviceDeliveryTime}
                  serviceColor={order.serviceColor}
                  onOrderCanceled={handleRefreshOrders}
                />;
              
              case 'payment-required':
                return <PaymentApprovalOrderCard 
                  key={order.id}
                  {...commonProps} 
                  calendarDate={order.calendarDate}
                  paymentOption={(order.paymentOption === 'split_payment' || order.paymentOption === 'payment_upfront') ? order.paymentOption : 'payment_upfront'}
                  depositAmount={order.depositAmount}
                  remainingAmount={order.remainingAmount}
                  amountPaid={order.amountPaid || 0}
                  serviceId={order.serviceId}
                  serviceDescription={order.serviceDescription}
                  serviceDeliveryTime={order.serviceDeliveryTime}
                  serviceColor={order.serviceColor}
                  creativeId={order.creativeId}
                  creativeDisplayName={order.creativeDisplayName}
                  creativeTitle={order.creativeTitle}
                  creativeEmail={order.creativeEmail}
                  creativeRating={order.creativeRating}
                  creativeReviewCount={order.creativeReviewCount}
                  creativeServicesCount={order.creativeServicesCount}
                  creativeColor={order.creativeColor}
                />;
              
              case 'in-progress':
                return (
                  <InProgressOrderCard
                    key={order.id}
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    calendarDate={order.calendarDate}
                    paymentOption={order.paymentOption}
                    amountPaid={order.amountPaid}
                    amountRemaining={order.amountRemaining}
                    serviceId={order.serviceId}
                    serviceDescription={order.serviceDescription}
                    serviceDeliveryTime={order.serviceDeliveryTime}
                    serviceColor={order.serviceColor}
                    creativeId={order.creativeId}
                    creativeDisplayName={order.creativeDisplayName}
                    creativeTitle={order.creativeTitle}
                    creativeEmail={order.creativeEmail}
                    creativeRating={order.creativeRating}
                    creativeReviewCount={order.creativeReviewCount}
                    creativeServicesCount={order.creativeServicesCount}
                    creativeColor={order.creativeColor}
                    creativeAvatarUrl={order.creativeAvatarUrl}
                  />
                );
              
              case 'locked':
                return (
                  <LockedOrderCard
                    key={order.id}
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    completedDate={order.completedDate}
                    calendarDate={order.calendarDate}
                    fileCount={order.fileCount}
                    fileSize={order.fileSize}
                    files={order.files}
                    paymentOption={order.paymentOption}
                    depositAmount={order.depositAmount}
                    remainingAmount={order.remainingAmount}
                    amountPaid={order.amountPaid}
                    serviceId={order.serviceId}
                    serviceDescription={order.serviceDescription}
                    serviceDeliveryTime={order.serviceDeliveryTime}
                    serviceColor={order.serviceColor}
                    creativeId={order.creativeId}
                    creativeDisplayName={order.creativeDisplayName}
                    creativeTitle={order.creativeTitle}
                    creativeEmail={order.creativeEmail}
                    creativeRating={order.creativeRating}
                    creativeReviewCount={order.creativeReviewCount}
                    creativeServicesCount={order.creativeServicesCount}
                    creativeColor={order.creativeColor}
                    creativeAvatarUrl={order.creativeAvatarUrl}
                  />
                );
              
              case 'download':
                return (
                  <DownloadOrderCard
                    key={order.id}
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    completedDate={order.completedDate}
                    calendarDate={order.calendarDate}
                    fileCount={order.fileCount}
                    fileSize={order.fileSize}
                    paymentOption={order.paymentOption}
                    files={order.files}
                    serviceId={order.serviceId}
                    serviceDescription={order.serviceDescription}
                    serviceDeliveryTime={order.serviceDeliveryTime}
                    serviceColor={order.serviceColor}
                    creativeId={order.creativeId}
                    creativeDisplayName={order.creativeDisplayName}
                    creativeTitle={order.creativeTitle}
                    creativeEmail={order.creativeEmail}
                    creativeRating={order.creativeRating}
                    creativeReviewCount={order.creativeReviewCount}
                    creativeServicesCount={order.creativeServicesCount}
                    creativeColor={order.creativeColor}
                    creativeAvatarUrl={order.creativeAvatarUrl}
                    invoices={order.invoices}
                  />
                );
              
              case 'completed':
                return (
                  <CompletedOrderCard
                    key={order.id}
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    completedDate={order.completedDate}
                    calendarDate={order.calendarDate}
                    fileCount={order.fileCount}
                    fileSize={order.fileSize}
                    paymentOption={order.paymentOption}
                    files={order.files}
                    serviceId={order.serviceId}
                    serviceDescription={order.serviceDescription}
                    serviceDeliveryTime={order.serviceDeliveryTime}
                    serviceColor={order.serviceColor}
                    creativeId={order.creativeId}
                    creativeDisplayName={order.creativeDisplayName}
                    creativeTitle={order.creativeTitle}
                    creativeEmail={order.creativeEmail}
                    creativeRating={order.creativeRating}
                    creativeReviewCount={order.creativeReviewCount}
                    creativeServicesCount={order.creativeServicesCount}
                    creativeColor={order.creativeColor}
                    creativeAvatarUrl={order.creativeAvatarUrl}
                    invoices={order.invoices}
                  />
                );
              
              case 'canceled':
                return (
                  <CanceledOrderCard
                    key={order.id}
                    {...commonProps}
                    canceledDate={(order as any).canceledDate}
                    paymentOption={order.paymentOption}
                    serviceId={order.serviceId}
                    serviceDescription={order.serviceDescription}
                    serviceDeliveryTime={order.serviceDeliveryTime}
                    serviceColor={order.serviceColor}
                    creativeId={order.creativeId}
                    creativeDisplayName={order.creativeDisplayName}
                    creativeTitle={order.creativeTitle}
                    creativeEmail={order.creativeEmail}
                    creativeRating={order.creativeRating}
                    creativeReviewCount={order.creativeReviewCount}
                    creativeServicesCount={order.creativeServicesCount}
                    creativeColor={order.creativeColor}
                    creativeAvatarUrl={order.creativeAvatarUrl}
                    invoices={order.invoices}
                  />
                );
              
              default:
                return null;
            }
          })
        )}
      </Box>
    </Box>
  );
}
