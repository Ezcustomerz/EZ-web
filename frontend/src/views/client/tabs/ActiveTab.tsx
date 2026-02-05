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
import { Search, DateRange, FilterList, AttachMoney } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { InProgressOrderCard } from '../../../components/cards/client/InProgressOrderCard';
import { bookingService, type Order } from '../../../api/bookingService';
import { useAuth } from '../../../context/auth';

// Cache for orders to prevent duplicate API calls
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

// Transform API orders to component format
function transformOrders(fetchedOrders: Order[]) {
  // Backend already filters for in-progress orders, so we just transform
  return fetchedOrders.map((order: Order) => {
      const amountPaid = order.amount_paid || 0;
      const amountRemaining = Math.max(0, order.price - amountPaid);
      
      return {
        id: order.id,
        serviceName: order.service_name,
        creativeName: order.creative_name,
        orderDate: order.order_date,
        description: order.description || order.service_description || '',
        price: order.price,
        calendarDate: order.booking_date || null,
        paymentOption: order.price === 0 || order.price === null ? 'free' :
                       order.payment_option === 'upfront' ? 'payment_upfront' : 
                       order.payment_option === 'split' ? 'split_payment' : 'payment_later',
        amountPaid: amountPaid,
        amountRemaining: amountRemaining,
        approvedDate: order.approved_at || null,
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
      };
    });
}

export function ActiveTab() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreative, setSelectedCreative] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('none');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Fetch orders on component mount with caching to prevent duplicate calls
  useEffect(() => {
    mountedRef.current = true;
    
    // Don't fetch orders if user is not authenticated
    if (!isAuthenticated) {
      if (mountedRef.current) {
        setOrders([]);
        setLoading(false);
        setError(null);
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
    
    // Check if a promise already exists - reuse it immediately
    // This must be checked BEFORE creating a new one to prevent race conditions
    if (fetchCache.promise) {
      // Reuse existing promise (handles StrictMode remounts)
      setLoading(true);
      fetchCache.promise.then(fetchedOrders => {
        if (!mountedRef.current) return;
        const transformedOrders = transformOrders(fetchedOrders);
        setOrders(transformedOrders);
        setError(null);
        setLoading(false);
      }).catch(error => {
        if (!mountedRef.current) return;
        setError(error.message || 'Failed to load orders');
        setLoading(false);
      });
      return;
    }
    
    // No promise exists - create one
    // This should only execute for the first mount
    // Set flags BEFORE creating promise to prevent race conditions
        fetchCache.isFetching = true;
        fetchCache.resolved = false;
        fetchCache.timestamp = now;
        
        // Create promise synchronously - assign immediately
        const fetchOrders = async () => {
        try {
          const fetchedOrders = await bookingService.getClientInProgressOrders();
          
          // Transform orders to match expected format
          const transformedOrders = transformOrders(fetchedOrders);
          
          if (mountedRef.current) {
            setOrders(transformedOrders);
            setError(null);
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
          if (mountedRef.current) {
            setError((error as any).message || 'Failed to load orders');
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
        setOrders(transformedOrders);
        setError(null);
        setLoading(false);
      }).catch(error => {
        if (!mountedRef.current) return;
        setError(error.message || 'Failed to load orders');
        setLoading(false);
      });

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated]);

  const handleCreativeChange = (event: SelectChangeEvent) => {
    setSelectedCreative(event.target.value);
  };

  const handleDateFilterChange = (event: SelectChangeEvent) => {
    setDateFilter(event.target.value);
  };

  const handlePriceSortChange = (event: SelectChangeEvent) => {
    setPriceSort(event.target.value);
  };

  // Extract unique creatives from orders
  const connectedCreatives = Array.from(
    new Map(
      orders.map(order => [
        order.creativeId,
        { id: order.creativeId, name: order.creativeName }
      ])
    ).values()
  );

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

  // Apply price sorting
  if (priceSort === 'low-high') {
    filteredOrders.sort((a, b) => a.price - b.price);
  } else if (priceSort === 'high-low') {
    filteredOrders.sort((a, b) => b.price - a.price);
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
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2, width: 150 }} />
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
          pt: 3,
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
          placeholder="Search in progress orders..."
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

        {/* Price Sort */}
        <FormControl 
          sx={{ 
            minWidth: { xs: '100%', md: 150 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        >
          <InputLabel id="price-sort-label">Price</InputLabel>
          <Select
            labelId="price-sort-label"
            id="price-sort"
            value={priceSort}
            label="Price"
            onChange={handlePriceSortChange}
          >
            <MenuItem value="none" sx={{
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
              No Sort
            </MenuItem>
            <MenuItem value="low-high" sx={{
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
              Low to High
            </MenuItem>
            <MenuItem value="high-low" sx={{
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
              High to Low
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

          {/* Price Sort */}
          <FormControl size="small" fullWidth sx={{ minWidth: 0 }} margin="dense">
            <InputLabel id="modal-price-sort-label" shrink={true}>Price</InputLabel>
            <Select
              labelId="modal-price-sort-label"
              value={priceSort}
              label="Price"
              onChange={handlePriceSortChange}
              startAdornment={
                <InputAdornment position="start">
                  <AttachMoney sx={{ fontSize: 20, ml: 0.5 }} />
                </InputAdornment>
              }
            >
              <MenuItem value="none" sx={{
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
                No Sort
              </MenuItem>
              <MenuItem value="low-high" sx={{
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
                Low to High
              </MenuItem>
              <MenuItem value="high-low" sx={{
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
                High to Low
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
        {error ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 8,
            gap: 1
          }}>
            <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 500 }}>
              Error loading orders
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {error}
            </Typography>
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
              No in progress orders found
      </Typography>
            <Typography variant="body2" sx={{ color: 'primary.main', opacity: 0.8 }}>
              Try adjusting your filters or search query
      </Typography>
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
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
} 
