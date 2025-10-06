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
  Button,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search, FilterList, DateRange, ShoppingBag } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlacedOrderCard } from '../../../components/cards/client/PlacedOrderCard';
import { PaymentApprovalOrderCard } from '../../../components/cards/client/PaymentApprovalOrderCard';
import { InProgressOrderCard } from '../../../components/cards/client/InProgressOrderCard';
import { LockedOrderCard } from '../../../components/cards/client/LockedOrderCard';
import { DownloadOrderCard } from '../../../components/cards/client/DownloadOrderCard';
import { CompletedOrderCard } from '../../../components/cards/client/CompletedOrderCard';
import { CanceledOrderCard } from '../../../components/cards/client/CanceledOrderCard';

// Dummy data for connected creatives
const dummyConnectedCreatives = [
  { id: '1', name: 'DJ Producer' },
  { id: '2', name: 'Beat Master' },
  { id: '3', name: 'Vocal Coach Pro' },
  { id: '4', name: 'Sound Designer X' },
  { id: '5', name: 'Engineer Elite' },
];

// Dummy order data
const dummyOrders = [
  {
    id: '1',
    serviceName: 'Mix & Master',
    creativeName: 'DJ Producer',
    orderDate: '2025-10-03',
    status: 'placed',
    calendarDate: '2025-10-10T14:30:00',
    description: 'Awaiting Approval',
    price: 150.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
  },
  {
    id: '2',
    serviceName: 'Podcast Editing',
    creativeName: 'Sound Designer X',
    orderDate: '2025-10-03',
    status: 'payment-approval',
    calendarDate: '2025-10-12T10:00:00',
    description: 'Payment Action Required',
    price: 180.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
  },
  {
    id: '3',
    serviceName: 'Vocal Recording Session',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-10-02',
    status: 'in-progress',
    calendarDate: null,
    description: 'Creative is working on your service',
    price: 200.00,
    approvedDate: '2025-10-03',
    completedDate: null,
    fileCount: null,
    fileSize: null,
  },
  {
    id: '4',
    serviceName: 'Beat Production',
    creativeName: 'Beat Master',
    orderDate: '2025-10-01',
    status: 'placed',
    calendarDate: null,
    description: 'Awaiting Approval',
    price: 250.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
  },
  {
    id: '5',
    serviceName: 'Mastering Service',
    creativeName: 'Engineer Elite',
    orderDate: '2025-09-30',
    status: 'payment-approval',
    calendarDate: null,
    description: 'Payment Action Required',
    price: 120.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
  },
  {
    id: '6',
    serviceName: 'Sound Design Package',
    creativeName: 'Sound Designer X',
    orderDate: '2025-09-30',
    status: 'in-progress',
    calendarDate: '2025-10-20T15:00:00',
    description: 'Creative is actively working on this',
    price: 300.00,
    approvedDate: '2025-10-01',
    completedDate: null,
    fileCount: null,
    fileSize: null,
  },
  {
    id: '7',
    serviceName: 'Audio Engineering',
    creativeName: 'Engineer Elite',
    orderDate: '2025-09-28',
    status: 'placed',
    calendarDate: null,
    description: 'Awaiting Approval',
    price: 175.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
  },
  {
    id: '8',
    serviceName: 'Track Mixing',
    creativeName: 'DJ Producer',
    orderDate: '2025-09-27',
    status: 'in-progress',
    calendarDate: null,
    description: 'Service in progress',
    price: 195.00,
    approvedDate: '2025-09-28',
    completedDate: null,
    fileCount: null,
    fileSize: null,
  },
  {
    id: '9',
    serviceName: 'Album Mastering',
    creativeName: 'Engineer Elite',
    orderDate: '2025-09-25',
    status: 'locked',
    calendarDate: '2025-10-02T16:00:00',
    description: 'Files locked until payment completed',
    price: 350.00,
    approvedDate: '2025-09-26',
    completedDate: '2025-10-04',
    fileCount: 12,
    fileSize: '2.4 GB',
  },
  {
    id: '10',
    serviceName: 'Remix Production',
    creativeName: 'Beat Master',
    orderDate: '2025-09-24',
    status: 'locked',
    calendarDate: null,
    description: 'Payment required to unlock files',
    price: 280.00,
    approvedDate: '2025-09-25',
    completedDate: '2025-10-03',
    fileCount: 5,
    fileSize: '856 MB',
  },
  {
    id: '11',
    serviceName: 'Vocal Tuning',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-09-22',
    status: 'download',
    calendarDate: '2025-09-28T11:00:00',
    description: 'Files ready for download',
    price: 150.00,
    approvedDate: '2025-09-23',
    completedDate: '2025-10-02',
    fileCount: 8,
    fileSize: '1.2 GB',
  },
  {
    id: '12',
    serviceName: 'Drum Programming',
    creativeName: 'Beat Master',
    orderDate: '2025-09-20',
    status: 'download',
    calendarDate: null,
    description: 'Your files are ready to download',
    price: 220.00,
    approvedDate: '2025-09-21',
    completedDate: '2025-10-01',
    fileCount: 15,
    fileSize: '3.1 GB',
  },
  {
    id: '13',
    serviceName: 'Beat Production',
    creativeName: 'DJ Producer',
    orderDate: '2025-09-15',
    status: 'completed',
    calendarDate: '2025-09-20T15:00:00',
    description: 'Service completed successfully',
    price: 180.00,
    approvedDate: '2025-09-16',
    completedDate: '2025-09-28',
    fileCount: 6,
    fileSize: '945 MB',
  },
  {
    id: '14',
    serviceName: 'Consultation Call',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-09-12',
    status: 'completed',
    calendarDate: '2025-09-18T10:30:00',
    description: 'Consultation completed',
    price: 100.00,
    approvedDate: '2025-09-13',
    completedDate: '2025-09-18',
    fileCount: null,
    fileSize: null,
  },
  {
    id: '15',
    serviceName: 'Audio Editing',
    creativeName: 'Beat Master',
    orderDate: '2025-09-08',
    status: 'completed',
    calendarDate: null,
    description: 'All edits have been completed',
    price: 250.00,
    approvedDate: '2025-09-09',
    completedDate: '2025-09-25',
    fileCount: 10,
    fileSize: '1.8 GB',
  },
  {
    id: '16',
    serviceName: 'Music Video Shoot',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-09-05',
    status: 'canceled',
    calendarDate: null,
    description: 'Service was canceled',
    price: 500.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    canceledDate: '2025-09-07',
  },
  {
    id: '17',
    serviceName: 'Track Mastering',
    creativeName: 'DJ Producer',
    orderDate: '2025-08-28',
    status: 'canceled',
    calendarDate: '2025-09-05T16:00:00',
    description: 'Booking canceled by client',
    price: 175.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    canceledDate: '2025-08-30',
  },
];

export function AllServicesTab() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creativeFilter, setCreativeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handleCreativeChange = (event: SelectChangeEvent) => {
    setCreativeFilter(event.target.value);
  };

  const handleDateChange = (event: SelectChangeEvent) => {
    setDateFilter(event.target.value);
  };

  // Filter logic
  const getFilteredOrders = () => {
    return dummyOrders.filter(order => {
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
        const creative = dummyConnectedCreatives.find(c => c.id === creativeFilter);
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
      case 'payment-approval':
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
            <MenuItem value="payment-approval" sx={{
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
                  bgcolor: getStatusColor('payment-approval') 
                }} />
                Payment Approval
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
            {dummyConnectedCreatives.map((creative) => (
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
      </Box>

      {/* Orders Content Area */}
      <Box sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        overflowY: 'auto',
        overflowX: 'visible',
        pr: 1,
        pt: 1,
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
        {filteredOrders.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 8,
            gap: 2
          }}>
            <Search sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.3 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              No orders found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mb: 1 }}>
              Try adjusting your filters or search query
            </Typography>
            <Button
              variant="contained"
              startIcon={<ShoppingBag />}
              onClick={() => navigate('/client/book')}
              sx={{
                mt: 2,
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px 0 rgba(59, 130, 246, 0.5)',
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
              key: order.id,
              id: order.id,
              serviceName: order.serviceName,
              creativeName: order.creativeName,
              orderDate: order.orderDate,
              description: order.description,
              price: order.price,
            };

            switch (order.status) {
              case 'placed':
                return <PlacedOrderCard {...commonProps} calendarDate={order.calendarDate} />;
              
              case 'payment-approval':
                return <PaymentApprovalOrderCard {...commonProps} calendarDate={order.calendarDate} />;
              
              case 'in-progress':
                return (
                  <InProgressOrderCard
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    calendarDate={order.calendarDate}
                  />
                );
              
              case 'locked':
                return (
                  <LockedOrderCard
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    completedDate={order.completedDate}
                    calendarDate={order.calendarDate}
                    fileCount={order.fileCount}
                    fileSize={order.fileSize}
                  />
                );
              
              case 'download':
                return (
                  <DownloadOrderCard
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    completedDate={order.completedDate}
                    calendarDate={order.calendarDate}
                    fileCount={order.fileCount}
                    fileSize={order.fileSize}
                  />
                );
              
              case 'completed':
                return (
                  <CompletedOrderCard
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    completedDate={order.completedDate}
                    calendarDate={order.calendarDate}
                    fileCount={order.fileCount}
                  />
                );
              
              case 'canceled':
                return (
                  <CanceledOrderCard
                    {...commonProps}
                    canceledDate={(order as any).canceledDate}
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
