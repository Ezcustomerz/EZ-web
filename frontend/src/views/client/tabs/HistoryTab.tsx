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
import { Search, DateRange, ShoppingBag, FilterList } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return '#4caf50';
    case 'canceled':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
};

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
    paymentOption: order.payment_option === 'upfront' ? 'payment_upfront' : 
                   order.payment_option === 'split' ? 'split_payment' : 'payment_later',
    status: order.status === 'placed' ? 'placed' :
            order.status === 'payment_required' ? 'payment-required' :
            order.status === 'in_progress' ? 'in-progress' :
            order.status === 'locked' ? 'locked' :
            order.status === 'download' ? 'download' :
            order.status === 'completed' ? 'completed' :
            order.status === 'canceled' ? 'canceled' : 'placed',
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
  }));
}

export function HistoryTab() {
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
    
    // Helper function to set history orders (backend already filters)
    const setHistoryOrders = (transformedOrders: any[]) => {
      if (mountedRef.current) {
        setOrders(transformedOrders);

        // Extract unique creatives from history orders
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
    
    // Check if we have cached data that's still fresh
    if (fetchCache.resolved && fetchCache.data && cacheAge < CACHE_DURATION) {
      // Use cached data directly (fastest path)
      if (mountedRef.current) {
        const transformedOrders = transformOrders(fetchCache.data);
        setHistoryOrders(transformedOrders);
        setLoading(false);
      }
      return;
    }
    
    // Check if a promise already exists - reuse it immediately
    if (fetchCache.promise) {
      // Reuse existing promise (handles StrictMode remounts)
      setLoading(true);
      fetchCache.promise.then(fetchedOrders => {
        if (!mountedRef.current) return;
        const transformedOrders = transformOrders(fetchedOrders);
        setHistoryOrders(transformedOrders);
        setLoading(false);
      }).catch(error => {
        if (!mountedRef.current) return;
        console.error('Failed to fetch history orders:', error);
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
        const fetchedOrders = await bookingService.getClientHistoryOrders();
        
        // Transform orders to match expected format
        const transformedOrders = transformOrders(fetchedOrders);
        
        if (mountedRef.current) {
          setHistoryOrders(transformedOrders);
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
        console.error('Failed to fetch history orders:', error);
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
    filteredOrders = filteredOrders.filter(order => order.creativeName === selectedCreative);
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
          placeholder="Search history..."
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
              <MenuItem key={creative.id} value={creative.name} sx={{
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
                <MenuItem key={creative.id} value={creative.name} sx={{
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
              No history found
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
                    />
                  );

                case 'canceled':
                  return (
                    <CanceledOrderCard
                      key={order.id}
                      {...commonProps}
                      canceledDate={order.canceledDate}
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
