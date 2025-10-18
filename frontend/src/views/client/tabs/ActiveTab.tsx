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
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search, DateRange } from '@mui/icons-material';
import { useState } from 'react';
import { InProgressOrderCard } from '../../../components/cards/client/InProgressOrderCard';

// Dummy data for connected creatives
const dummyConnectedCreatives = [
  { id: '1', name: 'DJ Producer' },
  { id: '2', name: 'Beat Master' },
  { id: '3', name: 'Vocal Coach Pro' },
  { id: '4', name: 'Sound Designer X' },
  { id: '5', name: 'Engineer Elite' },
];

// Dummy order data - filtered to only in-progress orders
const dummyInProgressOrders = [
  {
    id: '3',
    serviceName: 'Vocal Recording Session',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-10-02',
    status: 'in-progress' as const,
    calendarDate: null,
    description: 'Creative is working on your service',
    price: 200.00,
    approvedDate: '2025-10-03',
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'split_payment' as const,
    amountPaid: 100.00,
    amountRemaining: 100.00,
    serviceId: 'svc_3',
    serviceDescription: 'Professional vocal recording session in a premium studio',
    serviceDeliveryTime: '2-3 days',
    serviceColor: '#fd79a8',
    creativeId: 'creative_3',
    creativeDisplayName: 'Vocal Coach Pro',
    creativeTitle: 'Vocal Coach & Recording Engineer',
    creativeEmail: 'vocalcoach@ez.com',
    creativeRating: 5.0,
    creativeReviewCount: 12,
    creativeServicesCount: 8,
    creativeColor: '#fd79a8',
    creativeAvatarUrl: undefined,
  },
  {
    id: '6',
    serviceName: 'Beat Production',
    creativeName: 'Beat Master',
    orderDate: '2025-09-30',
    status: 'in-progress' as const,
    calendarDate: '2025-10-05T13:00:00',
    description: 'Creative is working on your service',
    price: 220.00,
    approvedDate: '2025-10-01',
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'payment_upfront' as const,
    amountPaid: 220.00,
    amountRemaining: 0.00,
    serviceId: 'svc_6',
    serviceDescription: 'Custom beat production tailored to your style',
    serviceDeliveryTime: '7-10 days',
    serviceColor: '#6c5ce7',
    creativeId: 'creative_2',
    creativeDisplayName: 'Beat Master',
    creativeTitle: 'Producer & Beat Maker',
    creativeEmail: 'beatmaster@ez.com',
    creativeRating: 4.7,
    creativeReviewCount: 31,
    creativeServicesCount: 15,
    creativeColor: '#6c5ce7',
    creativeAvatarUrl: undefined,
  },
  {
    id: '8',
    serviceName: 'Sound Design',
    creativeName: 'Sound Designer X',
    orderDate: '2025-09-28',
    status: 'in-progress' as const,
    calendarDate: null,
    description: 'Creative is working on your service',
    price: 275.00,
    approvedDate: '2025-09-29',
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'payment_later' as const,
    amountPaid: 0.00,
    amountRemaining: 275.00,
    serviceId: 'svc_8',
    serviceDescription: 'Custom sound design for your project',
    serviceDeliveryTime: '10-14 days',
    serviceColor: '#74b9ff',
    creativeId: 'creative_4',
    creativeDisplayName: 'Sound Designer X',
    creativeTitle: 'Audio Engineer & Sound Designer',
    creativeEmail: 'sounddesigner@ez.com',
    creativeRating: 4.8,
    creativeReviewCount: 16,
    creativeServicesCount: 11,
    creativeColor: '#74b9ff',
    creativeAvatarUrl: undefined,
  },
  {
    id: '19',
    serviceName: 'Portfolio Review Session',
    creativeName: 'Beat Master',
    orderDate: '2025-09-28',
    status: 'in-progress' as const,
    calendarDate: '2025-09-29T15:00:00',
    description: 'Creative is working on your service',
    price: 0.00,
    approvedDate: '2025-09-28',
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'free' as const,
    amountPaid: 0.00,
    amountRemaining: 0.00,
    serviceId: 'svc_19',
    serviceDescription: 'Free portfolio review and feedback session',
    serviceDeliveryTime: '1 hour',
    serviceColor: '#a29bfe',
    creativeId: 'creative_2',
    creativeDisplayName: 'Beat Master',
    creativeTitle: 'Producer & Beat Maker',
    creativeEmail: 'beatmaster@ez.com',
    creativeRating: 4.7,
    creativeReviewCount: 31,
    creativeServicesCount: 15,
    creativeColor: '#a29bfe',
    creativeAvatarUrl: undefined,
  },
];

export function ActiveTab() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreative, setSelectedCreative] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('none');

  const handleCreativeChange = (event: SelectChangeEvent) => {
    setSelectedCreative(event.target.value);
  };

  const handleDateFilterChange = (event: SelectChangeEvent) => {
    setDateFilter(event.target.value);
  };

  const handlePriceSortChange = (event: SelectChangeEvent) => {
    setPriceSort(event.target.value);
  };

  // Filter and sort logic
  let filteredOrders = [...dummyInProgressOrders];

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
            {dummyConnectedCreatives.map((creative) => (
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
      </Box>

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
            <Search sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.3 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              No in progress orders found
      </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled'}}>
              Try adjusting your filters or search query
      </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
            {filteredOrders.map((order) => {
              const commonProps = {
                key: order.id,
                id: order.id,
                serviceName: order.serviceName,
                creativeName: order.creativeName,
                orderDate: order.orderDate,
                description: order.description,
                price: order.price,
              };

              return (
                <InProgressOrderCard
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
