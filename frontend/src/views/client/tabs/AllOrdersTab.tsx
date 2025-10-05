// Updated: Card content should be fully visible now
import { 
  Box, 
  Typography, 
  TextField, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  useTheme,
  Card,
  CardContent,
  Avatar,
  Divider,
  Button
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search, FilterList, DateRange, CalendarToday, AttachMoney, Payment as PaymentIcon, CheckCircle, Folder, InsertDriveFile, Download as DownloadIcon, Replay, Cancel } from '@mui/icons-material';
import { useState } from 'react';

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'placed':
        return 'Service Placed';
      case 'payment-approval':
        return 'Payment Approval';
      case 'in-progress':
        return 'In Progress';
      case 'download':
        return 'Ready to Download';
      case 'completed':
        return 'Completed';
      case 'canceled':
        return 'Canceled';
      case 'locked':
        return 'Locked';
      default:
        return status;
    }
  };

  const getDescriptionColor = (status: string) => {
    if (status === 'payment-approval') {
      return '#00bcd4';
    } else if (status === 'in-progress') {
      return '#2196f3';
    } else if (status === 'locked') {
      return '#9c27b0';
    } else if (status === 'download') {
      return '#0097a7';
    } else if (status === 'completed') {
      return '#4caf50';
    } else if (status === 'canceled') {
      return '#f44336';
    }
    return '#ff9800';
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

      {/* Active Filters Display */}
      {(statusFilter !== 'all' || creativeFilter !== 'all' || dateFilter !== 'all' || searchQuery) && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
            Active filters:
          </Typography>
          {searchQuery && (
            <Chip
              label={`Search: "${searchQuery}"`}
              size="small"
              onDelete={() => setSearchQuery('')}
              sx={{ borderRadius: 1.5 }}
            />
          )}
          {statusFilter !== 'all' && (
            <Chip
              label={`Status: ${statusFilter.replace('-', ' ')}`}
              size="small"
              onDelete={() => setStatusFilter('all')}
              sx={{ 
                borderRadius: 1.5,
                bgcolor: getStatusColor(statusFilter),
                color: 'white',
                '& .MuiChip-deleteIcon': {
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: 'white',
                  }
                }
              }}
            />
          )}
          {creativeFilter !== 'all' && (
            <Chip
              label={`Creative: ${dummyConnectedCreatives.find(c => c.id === creativeFilter)?.name}`}
              size="small"
              onDelete={() => setCreativeFilter('all')}
              sx={{ borderRadius: 1.5 }}
            />
          )}
          {dateFilter !== 'all' && (
            <Chip
              label={`Period: ${
                dateFilter === 'week' ? 'Past Week' :
                dateFilter === 'month' ? 'Past Month' :
                dateFilter === '3months' ? 'Past 3 Months' :
                dateFilter === '6months' ? 'Past 6 Months' :
                dateFilter === 'year' ? 'Past Year' : dateFilter
              }`}
              size="small"
              onDelete={() => setDateFilter('all')}
              sx={{ borderRadius: 1.5 }}
            />
          )}
        </Box>
      )}

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
        {dummyOrders.map((order) => (
          <Card 
            key={order.id}
            sx={{ 
              borderRadius: 2,
              transition: 'all 0.2s ease',
              border: '2px solid',
              borderColor: order.status === 'payment-approval' 
                ? 'rgba(0, 188, 212, 0.3)' 
                : order.status === 'placed'
                ? 'rgba(255, 152, 0, 0.3)'
                : order.status === 'in-progress'
                ? 'rgba(33, 150, 243, 0.3)'
                : order.status === 'locked'
                ? 'rgba(156, 39, 176, 0.3)'
                : order.status === 'download'
                ? 'rgba(0, 151, 167, 0.3)'
                : order.status === 'completed'
                ? 'rgba(76, 175, 80, 0.3)'
                : order.status === 'canceled'
                ? 'rgba(244, 67, 54, 0.3)'
                : 'divider',
              overflow: 'visible',
              minHeight: 'fit-content',
              height: 'auto',
              backgroundColor: order.status === 'payment-approval'
                ? theme.palette.mode === 'dark' 
                  ? 'rgba(0, 188, 212, 0.05)' 
                  : 'rgba(0, 188, 212, 0.02)'
                : order.status === 'placed'
                ? theme.palette.mode === 'dark'
                  ? 'rgba(255, 152, 0, 0.05)'
                  : 'rgba(255, 152, 0, 0.02)'
                : order.status === 'in-progress'
                ? theme.palette.mode === 'dark'
                  ? 'rgba(33, 150, 243, 0.05)'
                  : 'rgba(33, 150, 243, 0.02)'
                : order.status === 'locked'
                ? theme.palette.mode === 'dark'
                  ? 'rgba(156, 39, 176, 0.05)'
                  : 'rgba(156, 39, 176, 0.02)'
                : order.status === 'download'
                ? theme.palette.mode === 'dark'
                  ? 'rgba(0, 151, 167, 0.05)'
                  : 'rgba(0, 151, 167, 0.02)'
                : order.status === 'completed'
                ? theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.05)'
                  : 'rgba(76, 175, 80, 0.02)'
                : order.status === 'canceled'
                ? theme.palette.mode === 'dark'
                  ? 'rgba(244, 67, 54, 0.05)'
                  : 'rgba(244, 67, 54, 0.02)'
                : 'transparent',
              '&:hover': {
                boxShadow: order.status === 'payment-approval'
                  ? theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(0, 188, 212, 0.3)' 
                    : '0 4px 20px rgba(0, 188, 212, 0.2)'
                  : order.status === 'placed'
                  ? theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(255, 152, 0, 0.3)'
                    : '0 4px 20px rgba(255, 152, 0, 0.2)'
                  : order.status === 'in-progress'
                  ? theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(33, 150, 243, 0.3)'
                    : '0 4px 20px rgba(33, 150, 243, 0.2)'
                  : order.status === 'locked'
                  ? theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(156, 39, 176, 0.3)'
                    : '0 4px 20px rgba(156, 39, 176, 0.2)'
                  : order.status === 'download'
                  ? theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0, 151, 167, 0.3)'
                    : '0 4px 20px rgba(0, 151, 167, 0.2)'
                  : order.status === 'completed'
                  ? theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(76, 175, 80, 0.3)'
                    : '0 4px 20px rgba(76, 175, 80, 0.2)'
                  : order.status === 'canceled'
                  ? theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(244, 67, 54, 0.3)'
                    : '0 4px 20px rgba(244, 67, 54, 0.2)'
                  : theme.palette.mode === 'dark' 
                    ? '0 2px 12px rgba(0,0,0,0.3)' 
                    : '0 2px 12px rgba(0,0,0,0.08)',
                borderColor: order.status === 'payment-approval'
                  ? '#00bcd4'
                  : order.status === 'placed'
                  ? '#ff9800'
                  : order.status === 'in-progress'
                  ? '#2196f3'
                  : order.status === 'locked'
                  ? '#9c27b0'
                  : order.status === 'download'
                  ? '#0097a7'
                  : order.status === 'completed'
                  ? '#4caf50'
                  : order.status === 'canceled'
                  ? '#f44336'
                  : theme.palette.primary.main,
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
              {/* Header Section with Avatar */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                {/* Avatar */}
                <Avatar 
                  sx={{ 
                    width: 48, 
                    height: 48,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '1.2rem',
                    fontWeight: 600,
                  }}
                >
                  {order.creativeName.charAt(0)}
                </Avatar>

                {/* Service Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                      {order.serviceName}
                    </Typography>
                    {/* Status Description - Inline with Service Name */}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: getDescriptionColor(order.status),
                        fontStyle: 'italic',
                        fontSize: '0.7rem',
                      }}
                    >
                      • {order.description}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    by {order.creativeName}
                  </Typography>
                </Box>
                
                {/* Status Chip */}
                <Chip
                  label={getStatusLabel(order.status)}
                  size="small"
                  sx={{
                    bgcolor: getStatusColor(order.status),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                    alignSelf: 'flex-start',
                  }}
                />
              </Box>

              <Divider sx={{ mb: 1.5 }} />

              {/* Details Grid */}
              <Box sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                mb: 0.5,
                alignItems: 'flex-end',
              }}>
                {/* Ordered Service Date */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Ordered On
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DateRange sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(order.orderDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                  </Box>
                </Box>

                {/* Approved Date (Optional - for in-progress, locked, download but not completed) */}
                {order.approvedDate && order.status !== 'completed' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Approved On
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DateRange sx={{ fontSize: 16, color: '#4caf50' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(order.approvedDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Calendar Date (Optional - not shown for completed or canceled) */}
                {order.calendarDate && order.status !== 'completed' && order.status !== 'canceled' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Booking Set For
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(order.calendarDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })} at {new Date(order.calendarDate).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true
                        })}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Completed Date (for locked/download/completed status) */}
                {order.completedDate && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Completed On
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(order.completedDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Canceled Date (for canceled status) */}
                {order.status === 'canceled' && (order as any).canceledDate && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Canceled On
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Cancel sx={{ fontSize: 16, color: '#f44336' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date((order as any).canceledDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* File Count (for locked/download status) */}
                {order.fileCount && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Files
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Folder sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {order.fileCount} files
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* File Size (for locked/download status) */}
                {order.fileSize && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Size
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <InsertDriveFile sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {order.fileSize}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Files Button (for completed status with files) */}
                {order.status === 'completed' && order.fileCount && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Deliverables
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Folder sx={{ fontSize: 16 }} />}
                      size="small"
                      sx={{
                        borderColor: '#4caf50',
                        color: '#4caf50',
                        borderRadius: 2,
                        px: 2,
                        height: '32px',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        '&:hover': {
                          borderColor: '#4caf50',
                          backgroundColor: 'rgba(76, 175, 80, 0.08)',
                        }
                      }}
                    >
                      View Files
                    </Button>
                  </Box>
                )}

                {/* Spacer */}
                <Box sx={{ flex: 1 }} />

                {/* Price, Pay Button, or Download Button */}
                {order.status === 'payment-approval' || order.status === 'locked' || order.status === 'download' ? (
                  <Box sx={{ position: 'relative' }}>
                    <Button
                      variant="contained"
                      startIcon={order.status === 'download' ? <DownloadIcon sx={{ fontSize: 18 }} /> : <PaymentIcon sx={{ fontSize: 18 }} />}
                      size="small"
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: 2,
                        px: 3,
                        height: '40px',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        position: 'relative',
                        overflow: 'visible',
                        boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                        transition: 'all 0.2s ease-in-out',
                        minWidth: 'auto',
                        zIndex: 1,
                        '@keyframes sparkle': {
                          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                          '50%': { transform: 'scale(1) rotate(180deg)', opacity: 1 },
                          '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                        },
                        '@keyframes sparkle2': {
                          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                          '60%': { transform: 'scale(1) rotate(240deg)', opacity: 1 },
                          '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                        },
                        '@keyframes sparkle3': {
                          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                          '40%': { transform: 'scale(1) rotate(120deg)', opacity: 1 },
                          '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                        },
                        '@keyframes sparkle4': {
                          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                          '55%': { transform: 'scale(1) rotate(200deg)', opacity: 1 },
                          '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                        },
                        '@keyframes sparkle5': {
                          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                          '45%': { transform: 'scale(1) rotate(160deg)', opacity: 1 },
                          '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '15%',
                          left: '20%',
                          width: 5,
                          height: 5,
                          background: 'radial-gradient(circle, white, transparent)',
                          borderRadius: '50%',
                          transform: 'scale(0)',
                          opacity: 0,
                          transition: 'all 0.2s ease-in-out',
                          zIndex: 10,
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: '70%',
                          left: '75%',
                          width: 4,
                          height: 4,
                          background: 'radial-gradient(circle, white, transparent)',
                          borderRadius: '50%',
                          transform: 'scale(0)',
                          opacity: 0,
                          transition: 'all 0.2s ease-in-out',
                          zIndex: 10,
                        },
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px 0 rgba(59, 130, 246, 0.5)',
                          '&::before': {
                            animation: 'sparkle 0.5s ease-in-out infinite',
                          },
                          '&::after': {
                            animation: 'sparkle2 0.5s ease-in-out infinite 0.1s',
                          },
                          '& .sparkle-3': {
                            animation: 'sparkle3 0.5s ease-in-out infinite 0.2s',
                          },
                          '& .sparkle-4': {
                            animation: 'sparkle4 0.5s ease-in-out infinite 0.15s',
                          },
                          '& .sparkle-5': {
                            animation: 'sparkle5 0.5s ease-in-out infinite 0.25s',
                          },
                        },
                      }}
                    >
                      <Box
                        className="sparkle-3"
                        sx={{
                          position: 'absolute',
                          top: '30%',
                          right: '25%',
                          width: 4,
                          height: 4,
                          background: 'radial-gradient(circle, white, transparent)',
                          borderRadius: '50%',
                          transform: 'scale(0)',
                          opacity: 0,
                          zIndex: 10,
                          pointerEvents: 'none',
                        }}
                      />
                      <Box
                        className="sparkle-4"
                        sx={{
                          position: 'absolute',
                          top: '60%',
                          left: '35%',
                          width: 5,
                          height: 5,
                          background: 'radial-gradient(circle, white, transparent)',
                          borderRadius: '50%',
                          transform: 'scale(0)',
                          opacity: 0,
                          zIndex: 10,
                          pointerEvents: 'none',
                        }}
                      />
                      <Box
                        className="sparkle-5"
                        sx={{
                          position: 'absolute',
                          top: '40%',
                          left: '80%',
                          width: 4,
                          height: 4,
                          background: 'radial-gradient(circle, white, transparent)',
                          borderRadius: '50%',
                          transform: 'scale(0)',
                          opacity: 0,
                          zIndex: 10,
                          pointerEvents: 'none',
                        }}
                      /                    >
                      {order.status === 'download' 
                        ? 'Download Files' 
                        : order.status === 'locked' 
                        ? `Unlock Files - $${order.price.toFixed(2)}` 
                        : `Pay $${order.price.toFixed(2)}`}
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'flex-end' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Price
      </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      <AttachMoney sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                      <Typography variant="body1" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        {order.price.toFixed(2)}
      </Typography>
        </Box>
                  </Box>
                )}

                {/* Book Service Button (for canceled status) */}
                {order.status === 'canceled' && (
                  <Box sx={{ 
                    position: 'relative',
                    '&:hover .sparkle-3': {
                      animation: 'sparkle3 0.6s ease-out 0.15s',
                    },
                    '&:hover .sparkle-4': {
                      animation: 'sparkle4 0.6s ease-out 0.2s',
                    },
                    '&:hover .sparkle-5': {
                      animation: 'sparkle5 0.6s ease-out 0.25s',
                    },
                    '@keyframes sparkle3': {
                      '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                      '40%': { transform: 'scale(1) rotate(120deg)', opacity: 1 },
                      '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                    },
                    '@keyframes sparkle4': {
                      '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                      '55%': { transform: 'scale(1) rotate(200deg)', opacity: 1 },
                      '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                    },
                    '@keyframes sparkle5': {
                      '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                      '45%': { transform: 'scale(1) rotate(160deg)', opacity: 1 },
                      '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                    },
                  }}>
                    <Button
                      variant="contained"
                      startIcon={<Replay sx={{ fontSize: 18 }} />}
                      size="small"
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: 2,
                        px: 2.5,
                        height: '36px',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        position: 'relative',
                        overflow: 'visible',
                        boxShadow: '0 2px 8px 0 rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease-in-out',
                        zIndex: 1,
                        '@keyframes sparkle': {
                          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                          '50%': { transform: 'scale(1) rotate(180deg)', opacity: 1 },
                          '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                        },
                        '@keyframes sparkle2': {
                          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                          '60%': { transform: 'scale(1) rotate(240deg)', opacity: 1 },
                          '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '15%',
                          left: '20%',
                          width: 5,
                          height: 5,
                          background: 'radial-gradient(circle, white, transparent)',
                          borderRadius: '50%',
                          transform: 'scale(0)',
                          opacity: 0,
                          transition: 'all 0.2s ease-in-out',
                          zIndex: 10,
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: '70%',
                          left: '75%',
                          width: 4,
                          height: 4,
                          background: 'radial-gradient(circle, white, transparent)',
                          borderRadius: '50%',
                          transform: 'scale(0)',
                          opacity: 0,
                          transition: 'all 0.2s ease-in-out',
                          zIndex: 10,
                        },
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px 0 rgba(59, 130, 246, 0.4)',
                          '&::before': {
                            animation: 'sparkle 0.6s ease-out',
                          },
                          '&::after': {
                            animation: 'sparkle2 0.6s ease-out 0.1s',
                          },
                        }
                      }}
                    >
                      Book Service
                    </Button>
                    {/* Additional sparkles */}
                    <Box
                      className="sparkle-3"
                      sx={{
                        position: 'absolute',
                        top: '40%',
                        right: '25%',
                        width: 4,
                        height: 4,
                        background: 'radial-gradient(circle, white, transparent)',
                        borderRadius: '50%',
                        transform: 'scale(0)',
                        opacity: 0,
                        zIndex: 10,
                        pointerEvents: 'none',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                    <Box
                      className="sparkle-4"
                      sx={{
                        position: 'absolute',
                        top: '20%',
                        left: '35%',
                        width: 5,
                        height: 5,
                        background: 'radial-gradient(circle, white, transparent)',
                        borderRadius: '50%',
                        transform: 'scale(0)',
                        opacity: 0,
                        zIndex: 10,
                        pointerEvents: 'none',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                    <Box
                      className="sparkle-5"
                      sx={{
                        position: 'absolute',
                        top: '75%',
                        left: '80%',
                        width: 4,
                        height: 4,
                        background: 'radial-gradient(circle, white, transparent)',
                        borderRadius: '50%',
                        transform: 'scale(0)',
                        opacity: 0,
                        zIndex: 10,
                        pointerEvents: 'none',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                  </Box>
                )}

                {/* Book Again Button (for completed status) */}
                {order.status === 'completed' && (
                  <Box sx={{ 
                    position: 'relative',
                    '&:hover .sparkle-3': {
                      animation: 'sparkle3 0.6s ease-out 0.15s',
                    },
                    '&:hover .sparkle-4': {
                      animation: 'sparkle4 0.6s ease-out 0.2s',
                    },
                    '&:hover .sparkle-5': {
                      animation: 'sparkle5 0.6s ease-out 0.25s',
                    },
                    '@keyframes sparkle3': {
                      '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                      '40%': { transform: 'scale(1) rotate(120deg)', opacity: 1 },
                      '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                    },
                    '@keyframes sparkle4': {
                      '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                      '55%': { transform: 'scale(1) rotate(200deg)', opacity: 1 },
                      '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                    },
                    '@keyframes sparkle5': {
                      '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                      '45%': { transform: 'scale(1) rotate(160deg)', opacity: 1 },
                      '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                    },
                  }}>
                    <Button
                      variant="contained"
                      startIcon={<Replay sx={{ fontSize: 18 }} />}
                      size="small"
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: 2,
                        px: 2.5,
                        height: '36px',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        position: 'relative',
                        overflow: 'visible',
                        boxShadow: '0 2px 8px 0 rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease-in-out',
                        zIndex: 1,
                        '@keyframes sparkle': {
                          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                          '50%': { transform: 'scale(1) rotate(180deg)', opacity: 1 },
                          '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                        },
                        '@keyframes sparkle2': {
                          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                          '60%': { transform: 'scale(1) rotate(240deg)', opacity: 1 },
                          '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '15%',
                          left: '20%',
                          width: 5,
                          height: 5,
                          background: 'radial-gradient(circle, white, transparent)',
                          borderRadius: '50%',
                          transform: 'scale(0)',
                          opacity: 0,
                          transition: 'all 0.2s ease-in-out',
                          zIndex: 10,
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: '70%',
                          left: '75%',
                          width: 4,
                          height: 4,
                          background: 'radial-gradient(circle, white, transparent)',
                          borderRadius: '50%',
                          transform: 'scale(0)',
                          opacity: 0,
                          transition: 'all 0.2s ease-in-out',
                          zIndex: 10,
                        },
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px 0 rgba(59, 130, 246, 0.4)',
                          '&::before': {
                            animation: 'sparkle 0.6s ease-out',
                          },
                          '&::after': {
                            animation: 'sparkle2 0.6s ease-out 0.1s',
                          },
                        }
                      }}
                    >
                      Book Again
                    </Button>
                    {/* Additional sparkles */}
                    <Box
                      className="sparkle-3"
                      sx={{
                        position: 'absolute',
                        top: '40%',
                        right: '25%',
                        width: 4,
                        height: 4,
                        background: 'radial-gradient(circle, white, transparent)',
                        borderRadius: '50%',
                        transform: 'scale(0)',
                        opacity: 0,
                        zIndex: 10,
                        pointerEvents: 'none',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                    <Box
                      className="sparkle-4"
                      sx={{
                        position: 'absolute',
                        top: '20%',
                        left: '35%',
                        width: 5,
                        height: 5,
                        background: 'radial-gradient(circle, white, transparent)',
                        borderRadius: '50%',
                        transform: 'scale(0)',
                        opacity: 0,
                        zIndex: 10,
                        pointerEvents: 'none',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                    <Box
                      className="sparkle-5"
                      sx={{
                        position: 'absolute',
                        top: '75%',
                        left: '80%',
                        width: 4,
                        height: 4,
                        background: 'radial-gradient(circle, white, transparent)',
                        borderRadius: '50%',
                        transform: 'scale(0)',
                        opacity: 0,
                        zIndex: 10,
                        pointerEvents: 'none',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
} 