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
import { Search, DateRange, ShoppingBag, FilterList } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompletedOrderCard } from '../../../components/cards/client/CompletedOrderCard';
import { CanceledOrderCard } from '../../../components/cards/client/CanceledOrderCard';

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

// Dummy data for connected creatives
const dummyConnectedCreatives = [
  { id: '1', name: 'DJ Producer' },
  { id: '2', name: 'Beat Master' },
  { id: '3', name: 'Vocal Coach Pro' },
  { id: '4', name: 'Sound Designer X' },
  { id: '5', name: 'Engineer Elite' },
];

// Dummy order data - filtered to only history orders (completed, canceled)
const dummyHistoryOrders = [
  {
    id: '13',
    serviceName: 'Beat Production',
    creativeName: 'DJ Producer',
    orderDate: '2025-09-15',
    status: 'completed' as const,
    calendarDate: '2025-09-20T15:00:00',
    description: 'Service completed successfully',
    price: 180.00,
    approvedDate: '2025-09-16',
    completedDate: '2025-09-28',
    fileCount: 6,
    fileSize: '945 MB',
    paymentOption: 'payment_upfront' as const,
    serviceId: 'svc_13',
    serviceDescription: 'Custom beat production service',
    serviceDeliveryTime: '7-10 days',
    serviceColor: '#e84393',
    files: [
      { id: 'file_27', name: 'Main_Beat_Master.wav', type: 'Audio (WAV)', size: '245 MB' },
      { id: 'file_28', name: 'Beat_Stems.zip', type: 'Archive (ZIP)', size: '512 MB' },
      { id: 'file_29', name: 'MIDI_Project.zip', type: 'Archive (ZIP)', size: '87 MB' },
      { id: 'file_30', name: 'Mix_Notes.pdf', type: 'Document (PDF)', size: '3.2 MB' },
      { id: 'file_31', name: 'Beat_Preview.mp3', type: 'Audio (MP3)', size: '15 MB' },
      { id: 'file_32', name: 'Alternate_Version.wav', type: 'Audio (WAV)', size: '82 MB' },
    ],
    creativeId: 'creative_1',
    creativeDisplayName: 'DJ Producer',
    creativeTitle: 'Music Producer & Beat Maker',
    creativeEmail: 'contact@djproducer.com',
    creativeRating: 4.9,
    creativeReviewCount: 156,
    creativeServicesCount: 22,
    creativeColor: '#e84393',
    creativeAvatarUrl: undefined,
  },
  {
    id: '14',
    serviceName: 'Consultation Call',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-09-12',
    status: 'completed' as const,
    calendarDate: '2025-09-18T10:30:00',
    description: 'Consultation completed',
    price: 0.00,
    approvedDate: '2025-09-13',
    completedDate: '2025-09-18',
    fileCount: null,
    fileSize: null,
    paymentOption: 'free' as const,
    serviceId: 'svc_14',
    serviceDescription: 'Free consultation call to discuss your project',
    serviceDeliveryTime: '30 minutes',
    serviceColor: '#2d3436',
    files: [],
    creativeId: 'creative_3',
    creativeDisplayName: 'Sarah Johnson',
    creativeTitle: 'Vocal Coach & Producer',
    creativeEmail: 'sarah@vocalcoachpro.com',
    creativeRating: 4.9,
    creativeReviewCount: 87,
    creativeServicesCount: 12,
    creativeColor: '#00cec9',
    creativeAvatarUrl: undefined,
  },
  {
    id: '15',
    serviceName: 'Audio Editing',
    creativeName: 'Beat Master',
    orderDate: '2025-09-08',
    status: 'completed' as const,
    calendarDate: null,
    description: 'All edits have been completed',
    price: 250.00,
    approvedDate: '2025-09-09',
    completedDate: '2025-09-25',
    fileCount: 10,
    fileSize: '1.8 GB',
    paymentOption: 'payment_later' as const,
    serviceId: 'svc_15',
    serviceDescription: 'Professional audio editing service',
    serviceDeliveryTime: '5-7 days',
    serviceColor: '#667eea',
    files: [
      { id: 'file_33', name: 'Track_01_Edited.wav', type: 'Audio (WAV)', size: '186 MB' },
      { id: 'file_34', name: 'Track_02_Edited.wav', type: 'Audio (WAV)', size: '192 MB' },
      { id: 'file_35', name: 'Track_03_Edited.wav', type: 'Audio (WAV)', size: '178 MB' },
      { id: 'file_36', name: 'Track_04_Edited.wav', type: 'Audio (WAV)', size: '184 MB' },
      { id: 'file_37', name: 'Full_Mix_Edited.wav', type: 'Audio (WAV)', size: '425 MB' },
      { id: 'file_38', name: 'Editing_Before_After.pdf', type: 'Document (PDF)', size: '8.5 MB' },
      { id: 'file_39', name: 'EQ_Settings.txt', type: 'Text (TXT)', size: '4 KB' },
      { id: 'file_40', name: 'Compression_Chain.txt', type: 'Text (TXT)', size: '3 KB' },
      { id: 'file_41', name: 'Preview_Mix.mp3', type: 'Audio (MP3)', size: '22 MB' },
      { id: 'file_42', name: 'Session_File.zip', type: 'Archive (ZIP)', size: '625 MB' },
    ],
    creativeId: 'creative_2',
    creativeDisplayName: 'Marcus "Beat" Thompson',
    creativeTitle: 'Drum Programmer & Producer',
    creativeEmail: 'marcus@beatmaster.com',
    creativeRating: 4.8,
    creativeReviewCount: 124,
    creativeServicesCount: 18,
    creativeColor: '#fdcb6e',
    creativeAvatarUrl: undefined,
  },
  {
    id: '22',
    serviceName: 'Podcast Editing',
    creativeName: 'DJ Producer',
    orderDate: '2025-07-20',
    status: 'completed' as const,
    calendarDate: null,
    description: 'Service completed successfully',
    price: 175.00,
    approvedDate: '2025-07-21',
    completedDate: '2025-08-15',
    fileCount: 8,
    fileSize: '1.1 GB',
    paymentOption: 'split_payment' as const,
    serviceId: 'svc_22',
    serviceDescription: 'Professional podcast editing and post-production',
    serviceDeliveryTime: '3-5 days',
    serviceColor: '#3498db',
    files: [
      { id: 'file_48', name: 'Episode_01_Final.mp3', type: 'Audio (MP3)', size: '125 MB' },
      { id: 'file_49', name: 'Episode_02_Final.mp3', type: 'Audio (MP3)', size: '132 MB' },
      { id: 'file_50', name: 'Episode_03_Final.mp3', type: 'Audio (MP3)', size: '118 MB' },
      { id: 'file_51', name: 'Episode_04_Final.mp3', type: 'Audio (MP3)', size: '128 MB' },
      { id: 'file_52', name: 'Intro_Outro_Music.wav', type: 'Audio (WAV)', size: '245 MB' },
      { id: 'file_53', name: 'Show_Notes.pdf', type: 'Document (PDF)', size: '5.2 MB' },
      { id: 'file_54', name: 'Timestamps.txt', type: 'Text (TXT)', size: '12 KB' },
      { id: 'file_55', name: 'Raw_Files_Backup.zip', type: 'Archive (ZIP)', size: '425 MB' },
    ],
    creativeId: 'creative_1',
    creativeDisplayName: 'DJ Producer',
    creativeTitle: 'Music Producer & Beat Maker',
    creativeEmail: 'contact@djproducer.com',
    creativeRating: 4.9,
    creativeReviewCount: 156,
    creativeServicesCount: 22,
    creativeColor: '#3498db',
    creativeAvatarUrl: undefined,
  },
  {
    id: '16',
    serviceName: 'Music Video Shoot',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-09-05',
    status: 'canceled' as const,
    calendarDate: null,
    description: 'Service was canceled',
    price: 500.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    canceledDate: '2025-09-07',
    paymentOption: 'payment_upfront' as const,
    serviceId: 'svc_16',
    serviceDescription: 'Professional music video production',
    serviceDeliveryTime: '30-45 days',
    serviceColor: '#f093fb',
    creativeId: 'creative_3',
    creativeDisplayName: 'Sarah Johnson',
    creativeTitle: 'Vocal Coach & Producer',
    creativeEmail: 'sarah@vocalcoachpro.com',
    creativeRating: 4.9,
    creativeReviewCount: 87,
    creativeServicesCount: 12,
    creativeColor: '#f093fb',
    creativeAvatarUrl: undefined,
  },
  {
    id: '17',
    serviceName: 'Track Mastering',
    creativeName: 'DJ Producer',
    orderDate: '2025-08-28',
    status: 'canceled' as const,
    calendarDate: '2025-09-05T16:00:00',
    description: 'Booking canceled by client',
    price: 175.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    canceledDate: '2025-08-30',
    paymentOption: 'split_payment' as const,
    serviceId: 'svc_17',
    serviceDescription: 'Professional track mastering service',
    serviceDeliveryTime: '3-5 days',
    serviceColor: '#45b7d1',
    creativeId: 'creative_1',
    creativeDisplayName: 'DJ Producer',
    creativeTitle: 'Music Producer & Beat Maker',
    creativeEmail: 'contact@djproducer.com',
    creativeRating: 4.9,
    creativeReviewCount: 156,
    creativeServicesCount: 22,
    creativeColor: '#45b7d1',
    creativeAvatarUrl: undefined,
  },
];

export function HistoryTab() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreative, setSelectedCreative] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
  let filteredOrders = [...dummyHistoryOrders];

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
              No history found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled'}}>
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

              switch (order.status) {
                case 'completed':
                  return (
                    <CompletedOrderCard
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
