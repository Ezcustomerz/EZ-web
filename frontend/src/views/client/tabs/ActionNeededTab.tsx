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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Card,
  CardContent,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search, DateRange, ShoppingBag, FilterList } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentApprovalOrderCard } from '../../../components/cards/client/PaymentApprovalOrderCard';
import { LockedOrderCard } from '../../../components/cards/client/LockedOrderCard';
import { DownloadOrderCard } from '../../../components/cards/client/DownloadOrderCard';
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

// Function to clear cache (useful for debugging or forcing refresh)
const clearCache = () => {
  fetchCache = {
    promise: null,
    data: null,
    isFetching: false,
    timestamp: 0,
    resolved: false,
  };
  console.log('[ActionNeededTab] Cache cleared');
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'payment-required':
      return '#000000';
    case 'locked':
      return '#9c27b0';
    case 'download':
      return '#0097a7';
    default:
      return '#9e9e9e';
  }
};

// Helper function to transform orders
function transformOrders(fetchedOrders: Order[]) {
  return fetchedOrders.map((order: Order) => {
    // Debug log for split payment orders
    if (order.payment_option === 'split') {
      console.log('[ActionNeededTab] Split payment order:', {
        id: order.id,
        service_name: order.service_name,
        price: order.price,
        split_deposit_amount: order.split_deposit_amount,
        amount_paid: order.amount_paid
      });
    }
    
    return {
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
    depositAmount: order.payment_option === 'split' && order.split_deposit_amount !== undefined && order.split_deposit_amount !== null
      ? Math.round(order.split_deposit_amount * 100) / 100
      : undefined,
    remainingAmount: order.payment_option === 'split' && order.split_deposit_amount !== undefined && order.split_deposit_amount !== null
      ? Math.round((order.price - order.split_deposit_amount) * 100) / 100
      : undefined,
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
    };
  });
}

export function ActionNeededTab() {
  console.log('[ActionNeededTab] Component rendering');
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreative, setSelectedCreative] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [orders, setOrders] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [connectedCreatives, setConnectedCreatives] = useState<Array<{ id: string; name: string }>>([]);
  const mountedRef = useRef(true);

  // Helper function to set action-needed orders (backend already filters)
  const setActionNeededOrders = (transformedOrders: any[]) => {
    if (mountedRef.current) {
      setOrders(transformedOrders);

      // Extract unique creatives from action-needed orders
      const creatives = Array.from(
        new Map(
          transformedOrders.map(order => [
            order.creativeId,
            { id: order.creativeId, name: order.creativeName }
          ])
        ).values()
      );
      setConnectedCreatives(creatives);
    }
  };

  // Fetch orders on mount - only once
  useEffect(() => {
    console.log('[ActionNeededTab] useEffect running, isAuthenticated:', isAuthenticated);
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
    
    // Check if cached data is still valid
    if (fetchCache.resolved && fetchCache.data && cacheAge < CACHE_DURATION) {
      // Use cached data directly (fastest path)
      if (mountedRef.current) {
        const transformedOrders = transformOrders(fetchCache.data);
        setActionNeededOrders(transformedOrders);
        setLoading(false);
      }
      return;
    }
    
    // Check if a promise already exists - reuse it immediately
    // This must be checked BEFORE creating a new one to prevent race conditions
    if (fetchCache.promise) {
      // Reuse existing promise (handles StrictMode remounts)
      setLoading(true);
      fetchCache.promise.then(fetchedOrders => {
        if (!mountedRef.current) return;
        const transformedOrders = transformOrders(fetchedOrders);
        setActionNeededOrders(transformedOrders);
        setLoading(false);
      }).catch(error => {
        if (!mountedRef.current) return;
        console.error('Failed to fetch orders:', error);
        setLoading(false);
      });
      return;
    }
    
    // No promise exists - create one
    // Clear stale cache data if it exists
    if (cacheAge >= CACHE_DURATION) {
      fetchCache.data = null;
      fetchCache.resolved = false;
    }
    
    // Set flags BEFORE creating promise to prevent race conditions
    fetchCache.isFetching = true;
    fetchCache.resolved = false;
    fetchCache.timestamp = now;
    
        // Create promise synchronously - assign immediately
        const fetchOrders = async () => {
      try {
        const fetchedOrders = await bookingService.getClientActionNeededOrders();
        
        // Transform orders to match expected format
        const transformedOrders = transformOrders(fetchedOrders);
        
        if (mountedRef.current) {
          setActionNeededOrders(transformedOrders);
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

    // Assign promise synchronously - this happens immediately
    // This must happen synchronously so subsequent mounts see it
    fetchCache.promise = fetchOrders();
    fetchCache.promise.catch(() => {
      // Error already handled in fetchOrders
    });
    
    // Set loading and attach promise handler
    setLoading(true);
    fetchCache.promise.then(fetchedOrders => {
      if (!mountedRef.current) return;
      const transformedOrders = transformOrders(fetchedOrders);
      setActionNeededOrders(transformedOrders);
      setLoading(false);
    }).catch(error => {
      if (!mountedRef.current) return;
      console.error('Failed to fetch orders:', error);
      setLoading(false);
    });

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated]);

  // Function to refresh orders after status change
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
      const fetchedOrders = await bookingService.getClientActionNeededOrders();
      const transformedOrders = transformOrders(fetchedOrders);
      
      setActionNeededOrders(transformedOrders);
      
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

  const handleCreativeChange = (event: SelectChangeEvent) => {
    setSelectedCreative(event.target.value);
  };

  const handleDateFilterChange = (event: SelectChangeEvent) => {
    setDateFilter(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  // Filter and sort logic
  let filteredOrders = [...orders];

  // Apply search filter
  if (searchQuery) {
    filteredOrders = filteredOrders.filter(order =>
      order.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.creativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply creative filter
  if (selectedCreative !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.creativeId === selectedCreative);
  }

  // Apply status filter
  if (statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
  }

  // Apply date filter
  if (dateFilter !== 'all') {
    const now = new Date();
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case 'week':
          return diffDays <= 7;
        case 'month':
          return diffDays <= 30;
        case '3months':
          return diffDays <= 90;
        case '6months':
          return diffDays <= 180;
        case 'year':
          return diffDays <= 365;
        default:
          return true;
      }
    });
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
        {/* Search and Filters Skeletons */}
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', md: 'center' }
        }}>
          <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2, flex: { xs: 1, md: 2 } }} />
          {isMobile ? (
            <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2, width: '100%' }} />
          ) : (
            <>
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2, width: 200 }} />
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2, width: 180 }} />
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2, width: 180 }} />
            </>
          )}
        </Box>

        {/* Order Card Skeletons */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'visible',
          pr: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card
              key={`skeleton-${idx}`}
              sx={{
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                animation: `fadeIn 0.5s ease-in ${idx * 0.1}s both`,
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(10px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Skeleton variant="text" width="35%" height={20} />
                      <Skeleton variant="text" width="25%" height={14} />
                    </Box>
                    <Skeleton variant="text" width="40%" height={14} sx={{ mb: 1.5 }} />
                    <Skeleton variant="rectangular" height={1} width="100%" sx={{ mb: 1.5 }} />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 0.5 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Skeleton variant="text" width={60} height={12} />
                        <Skeleton variant="text" width={80} height={16} />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Skeleton variant="text" width={50} height={12} />
                        <Skeleton variant="text" width={70} height={16} />
                      </Box>
                    </Box>
                  </Box>
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1.5, alignSelf: 'flex-start' }} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

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
          placeholder="Search action needed orders..."
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
            value={selectedCreative}
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
            onChange={handleDateFilterChange}
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
          {/* Connected Creative Filter */}
          <FormControl size="small" fullWidth sx={{ minWidth: 0 }} margin="dense">
            <InputLabel id="modal-creative-filter-label" shrink={true}>Connected Creative</InputLabel>
            <Select
              labelId="modal-creative-filter-label"
              value={selectedCreative}
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
              onChange={handleDateFilterChange}
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
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterModalOpen(false)} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>Apply</Button>
        </DialogActions>
      </Dialog>

      {/* Orders List */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto',
        overflowX: 'visible',
        pr: 1,
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
        {filteredOrders.length === 0 ? (
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
              No action needed orders found
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
            {filteredOrders.map((order) => {
              const commonProps = {
                id: order.id,
                serviceName: order.serviceName,
                creativeName: order.creativeName,
                orderDate: order.orderDate,
                description: order.description,
                price: order.price,
              };

              switch (order.status) {
                case 'payment-required':
                  // Calculate deposit and remaining amounts based on payment option
                  const calculatePaymentAmounts = (order: any, paymentOption: string, price: number) => {
                    if (price === 0 || paymentOption === 'free') {
                      return { depositAmount: 0, remainingAmount: 0 };
                    }
                    if (paymentOption === 'split_payment') {
                      // Use split_deposit_amount from order, or depositAmount if available
                      const depositAmount = order.split_deposit_amount !== undefined && order.split_deposit_amount !== null
                        ? Math.round(order.split_deposit_amount * 100) / 100
                        : (order.depositAmount || 0);
                      const remainingAmount = depositAmount > 0 ? Math.round((price - depositAmount) * 100) / 100 : price;
                      return { depositAmount, remainingAmount };
                    }
                    if (paymentOption === 'payment_upfront') {
                      return { depositAmount: price, remainingAmount: 0 };
                    }
                    // payment_later
                    return { depositAmount: 0, remainingAmount: price };
                  };
                  const paymentAmounts = calculatePaymentAmounts(order, order.paymentOption, order.price);
                  
                  return (
                    <PaymentApprovalOrderCard
                      key={order.id}
                      {...commonProps}
                      calendarDate={order.calendarDate}
                      paymentOption={(order.paymentOption === 'split_payment' || order.paymentOption === 'payment_upfront') ? order.paymentOption : 'payment_upfront'}
                      depositAmount={paymentAmounts.depositAmount}
                      remainingAmount={paymentAmounts.remainingAmount}
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
                      onOrderStatusChanged={handleRefreshOrders}
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
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
