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
import { PaymentApprovalOrderCard } from '../../../components/cards/client/PaymentApprovalOrderCard';
import { LockedOrderCard } from '../../../components/cards/client/LockedOrderCard';
import { DownloadOrderCard } from '../../../components/cards/client/DownloadOrderCard';

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'payment-approval':
      return '#00bcd4';
    case 'locked':
      return '#9c27b0';
    case 'download':
      return '#0097a7';
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

// Dummy order data - filtered to only action-needed orders (payment-approval, locked, download)
const dummyActionNeededOrders = [
  {
    id: '2',
    serviceName: 'Podcast Editing',
    creativeName: 'Sound Designer X',
    orderDate: '2025-10-03',
    status: 'payment-approval' as const,
    calendarDate: '2025-10-12T10:00:00',
    description: 'Payment Action Required',
    price: 180.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'payment_upfront' as const,
    depositAmount: undefined,
    remainingAmount: undefined,
    serviceId: 'svc_2',
    serviceDescription: 'Complete podcast editing including noise reduction and mastering',
    serviceDeliveryTime: '3-5 days',
    serviceColor: '#4ecdc4',
    creativeId: 'creative_4',
    creativeDisplayName: 'Sound Designer X',
    creativeTitle: 'Audio Engineer & Sound Designer',
    creativeEmail: 'sounddesigner@ez.com',
    creativeRating: 4.8,
    creativeReviewCount: 16,
    creativeServicesCount: 11,
    creativeColor: '#4ecdc4',
    creativeAvatarUrl: undefined,
  },
  {
    id: '5',
    serviceName: 'Mastering Service',
    creativeName: 'Engineer Elite',
    orderDate: '2025-09-30',
    status: 'payment-approval' as const,
    calendarDate: null,
    description: 'Payment Action Required',
    price: 120.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'split_payment' as const,
    depositAmount: 60.00,
    remainingAmount: 60.00,
    serviceId: 'svc_5',
    serviceDescription: 'High-quality mastering for final polish',
    serviceDeliveryTime: '2-3 days',
    serviceColor: '#ff6b6b',
    creativeId: 'creative_5',
    creativeDisplayName: 'Engineer Elite',
    creativeTitle: 'Mastering Engineer',
    creativeEmail: 'engineer@ez.com',
    creativeRating: 4.9,
    creativeReviewCount: 28,
    creativeServicesCount: 6,
    creativeColor: '#ff6b6b',
    creativeAvatarUrl: undefined,
  },
  {
    id: '9',
    serviceName: 'Album Mastering',
    creativeName: 'Engineer Elite',
    orderDate: '2025-09-25',
    status: 'locked' as const,
    calendarDate: '2025-10-02T16:00:00',
    description: 'Files locked until payment completed',
    price: 350.00,
    approvedDate: '2025-09-26',
    completedDate: '2025-10-04',
    fileCount: 12,
    fileSize: '2.4 GB',
    paymentOption: 'split_payment' as const,
    serviceId: 'svc_9',
    serviceDescription: 'Complete album mastering service',
    serviceDeliveryTime: '14-21 days',
    serviceColor: '#00b894',
    creativeId: 'creative_5',
    creativeDisplayName: 'Mike "Engineer" Elite',
    creativeTitle: 'Audio Engineer & Mastering Specialist',
    creativeEmail: 'mike@engineerelite.com',
    creativeRating: 5.0,
    creativeReviewCount: 203,
    creativeServicesCount: 15,
    creativeColor: '#00b894',
    creativeAvatarUrl: undefined,
  },
  {
    id: '10',
    serviceName: 'Remix Production',
    creativeName: 'Beat Master',
    orderDate: '2025-09-24',
    status: 'locked' as const,
    calendarDate: null,
    description: 'Payment required to unlock files',
    price: 280.00,
    approvedDate: '2025-09-25',
    completedDate: '2025-10-03',
    fileCount: 5,
    fileSize: '856 MB',
    paymentOption: 'payment_later' as const,
    serviceId: 'svc_10',
    serviceDescription: 'Professional remix production',
    serviceDeliveryTime: '7-10 days',
    serviceColor: '#0984e3',
    creativeId: 'creative_2',
    creativeDisplayName: 'Marcus "Beat" Thompson',
    creativeTitle: 'Drum Programmer & Producer',
    creativeEmail: 'marcus@beatmaster.com',
    creativeRating: 4.8,
    creativeReviewCount: 124,
    creativeServicesCount: 18,
    creativeColor: '#0984e3',
    creativeAvatarUrl: undefined,
  },
  {
    id: '11',
    serviceName: 'Vocal Tuning',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-09-22',
    status: 'download' as const,
    calendarDate: '2025-09-28T11:00:00',
    description: 'Files ready for download',
    price: 150.00,
    approvedDate: '2025-09-23',
    completedDate: '2025-10-02',
    fileCount: 8,
    fileSize: '1.2 GB',
    paymentOption: 'payment_upfront' as const,
    serviceId: 'svc_11',
    serviceDescription: 'Professional vocal tuning and pitch correction',
    serviceDeliveryTime: '2-4 days',
    serviceColor: '#00cec9',
    files: [
      { id: 'file_1', name: 'Lead_Vocals_Tuned.wav', type: 'Audio (WAV)', size: '256 MB' },
      { id: 'file_2', name: 'Backup_Vocals_Tuned.wav', type: 'Audio (WAV)', size: '198 MB' },
      { id: 'file_3', name: 'Harmony_Track_1.wav', type: 'Audio (WAV)', size: '142 MB' },
      { id: 'file_4', name: 'Harmony_Track_2.wav', type: 'Audio (WAV)', size: '138 MB' },
      { id: 'file_5', name: 'Vocal_Stems.zip', type: 'Archive (ZIP)', size: '425 MB' },
      { id: 'file_6', name: 'Project_Notes.pdf', type: 'Document (PDF)', size: '2.4 MB' },
      { id: 'file_7', name: 'Pitch_Reference.txt', type: 'Text (TXT)', size: '8 KB' },
      { id: 'file_8', name: 'Final_Mix_Preview.mp3', type: 'Audio (MP3)', size: '12 MB' },
    ],
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
    id: '12',
    serviceName: 'Drum Programming',
    creativeName: 'Beat Master',
    orderDate: '2025-09-20',
    status: 'download' as const,
    calendarDate: null,
    description: 'Your files are ready to download',
    price: 220.00,
    approvedDate: '2025-09-21',
    completedDate: '2025-10-01',
    fileCount: 15,
    fileSize: '3.1 GB',
    paymentOption: 'split_payment' as const,
    serviceId: 'svc_12',
    serviceDescription: 'Custom drum programming for your tracks',
    serviceDeliveryTime: '5-7 days',
    serviceColor: '#fdcb6e',
    files: [
      { id: 'file_9', name: 'Kick_Pattern_1.wav', type: 'Audio (WAV)', size: '185 MB' },
      { id: 'file_10', name: 'Kick_Pattern_2.wav', type: 'Audio (WAV)', size: '178 MB' },
      { id: 'file_11', name: 'Snare_Layer_1.wav', type: 'Audio (WAV)', size: '156 MB' },
      { id: 'file_12', name: 'Snare_Layer_2.wav', type: 'Audio (WAV)', size: '164 MB' },
      { id: 'file_13', name: 'Hi_Hat_Groove.wav', type: 'Audio (WAV)', size: '142 MB' },
      { id: 'file_14', name: 'Percussion_Elements.wav', type: 'Audio (WAV)', size: '298 MB' },
      { id: 'file_15', name: 'Full_Drum_Mix.wav', type: 'Audio (WAV)', size: '512 MB' },
      { id: 'file_16', name: 'Drum_Stems_Separated.zip', type: 'Archive (ZIP)', size: '876 MB' },
      { id: 'file_17', name: 'MIDI_Files.zip', type: 'Archive (ZIP)', size: '45 MB' },
      { id: 'file_18', name: 'Drum_Patterns_Reference.pdf', type: 'Document (PDF)', size: '5.2 MB' },
      { id: 'file_19', name: 'BPM_Tempo_Map.txt', type: 'Text (TXT)', size: '12 KB' },
      { id: 'file_20', name: 'Groove_Video_Tutorial.mp4', type: 'Video (MP4)', size: '458 MB' },
      { id: 'file_21', name: 'Sample_Pack_Used.zip', type: 'Archive (ZIP)', size: '328 MB' },
      { id: 'file_22', name: 'Alternate_Mix_Preview.mp3', type: 'Audio (MP3)', size: '18 MB' },
      { id: 'file_23', name: 'Session_Screenshot.png', type: 'Image (PNG)', size: '2.8 MB' },
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
    id: '20',
    serviceName: 'Production Tips Session',
    creativeName: 'Sound Designer X',
    orderDate: '2025-09-25',
    status: 'download' as const,
    calendarDate: '2025-09-26T14:00:00',
    description: 'Files ready for download',
    price: 0.00,
    approvedDate: '2025-09-25',
    completedDate: '2025-09-26',
    fileCount: 3,
    fileSize: '45 MB',
    paymentOption: 'free' as const,
    serviceId: 'svc_20',
    serviceDescription: 'Free production tips and tricks session recording',
    serviceDeliveryTime: '1 hour',
    serviceColor: '#6c5ce7',
    files: [
      { id: 'file_24', name: 'Session_Recording.mp4', type: 'Video (MP4)', size: '38 MB' },
      { id: 'file_25', name: 'Production_Tips_PDF.pdf', type: 'Document (PDF)', size: '4.5 MB' },
      { id: 'file_26', name: 'Resource_Links.txt', type: 'Text (TXT)', size: '6 KB' },
    ],
    creativeId: 'creative_4',
    creativeDisplayName: 'Alex Rivera',
    creativeTitle: 'Sound Designer & Educator',
    creativeEmail: 'alex@sounddesignerx.com',
    creativeRating: 4.7,
    creativeReviewCount: 56,
    creativeServicesCount: 9,
    creativeColor: '#6c5ce7',
    creativeAvatarUrl: undefined,
  },
];

export function ActionNeededTab() {
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
  let filteredOrders = [...dummyActionNeededOrders];

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
              No action needed orders found
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
                case 'payment-approval':
                  return (
                    <PaymentApprovalOrderCard
                      {...commonProps}
                      calendarDate={order.calendarDate}
                      paymentOption={(order.paymentOption === 'split_payment' || order.paymentOption === 'payment_upfront') ? order.paymentOption : 'payment_upfront'}
                      depositAmount={order.depositAmount}
                      remainingAmount={order.remainingAmount}
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
                      {...commonProps}
                      approvedDate={order.approvedDate}
                      completedDate={order.completedDate}
                      calendarDate={order.calendarDate}
                      fileCount={order.fileCount}
                      fileSize={order.fileSize}
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

                case 'download':
                  return (
                    <DownloadOrderCard
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
