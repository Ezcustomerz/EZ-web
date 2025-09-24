import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Stack,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  FileDownload,
  CalendarToday,
  Person,
  AttachMoney,
  DateRange,
  Sort,
  Receipt,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Mock data interface - replace with your actual data structure
interface ServiceReceipt {
  id: string;
  serviceType: string;
  providerName: string;
  amount: number;
  orderDate: Date;
  completedDate: Date;
  status: 'completed' | 'delivered';
  receiptUrl?: string; // URL to download PDF receipt
}

// Mock data - replace with actual API call
const mockReceipts: ServiceReceipt[] = [
  {
    id: '1',
    serviceType: 'Beat Production',
    providerName: 'DJ Mike',
    amount: 150.00,
    orderDate: new Date('2024-09-01'),
    completedDate: new Date('2024-09-03'),
    status: 'completed',
    receiptUrl: '/receipts/receipt-1.pdf',
  },
  {
    id: '2',
    serviceType: 'Vocal Recording',
    providerName: 'Sarah Studios',
    amount: 300.00,
    orderDate: new Date('2024-08-15'),
    completedDate: new Date('2024-08-20'),
    status: 'delivered',
    receiptUrl: '/receipts/receipt-2.pdf',
  },
  {
    id: '3',
    serviceType: 'Mixing & Mastering',
    providerName: 'AudioPro',
    amount: 450.00,
    orderDate: new Date('2024-07-10'),
    completedDate: new Date('2024-07-18'),
    status: 'completed',
    receiptUrl: '/receipts/receipt-3.pdf',
  },
];

export function CompletedServicesTab() {
  const theme = useTheme();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'amount'>('newest');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Filter and sort receipts
  const filteredReceipts = useMemo(() => {
    let filtered = mockReceipts.filter(receipt => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        receipt.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.providerName.toLowerCase().includes(searchQuery.toLowerCase());

      // Date filter
      const matchesDateRange = (!dateFrom || receipt.completedDate >= dateFrom) &&
                              (!dateTo || receipt.completedDate <= dateTo);

      return matchesSearch && matchesDateRange;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.completedDate.getTime() - a.completedDate.getTime();
      } else {
        return b.amount - a.amount;
      }
    });

    return filtered;
  }, [searchQuery, sortBy, dateFrom, dateTo]);

  // Download handler
  const handleDownload = (receipt: ServiceReceipt) => {
    // In real implementation, this would trigger the actual PDF download
    console.log('Downloading receipt:', receipt.id);
    // Example: window.open(receipt.receiptUrl, '_blank');
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom(null);
    setDateTo(null);
    setSortBy('newest');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 2, sm: 3 },
        gap: 3,
      }}>
        
        {/* Header */}
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              color: 'primary.main',
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Receipt sx={{ fontSize: 28 }} />
            Service Receipts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Download your past service receipts and track your order history
          </Typography>
        </Box>

        {/* Filters and Search */}
        <Card 
          sx={{ 
            p: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
            {/* Search */}
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                fullWidth
                placeholder="Search services or providers..."
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Box>

            {/* Date From */}
            <Box sx={{ minWidth: 150 }}>
              <DatePicker
                label="From Date"
                value={dateFrom}
                onChange={setDateFrom}
                slotProps={{
                  textField: {
                    size: 'medium',
                  }
                }}
              />
            </Box>

            {/* Date To */}
            <Box sx={{ minWidth: 150 }}>
              <DatePicker
                label="To Date"
                value={dateTo}
                onChange={setDateTo}
                slotProps={{
                  textField: {
                    size: 'medium',
                  }
                }}
              />
            </Box>

            {/* Sort By */}
            <Box sx={{ minWidth: 150 }}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'amount')}
                  startAdornment={<Sort sx={{ ml: 1, mr: 0.5, color: 'text.secondary' }} />}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="amount">Highest Amount</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Clear Filters */}
            <Box sx={{ minWidth: 120 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                sx={{ height: 56 }}
              >
                Clear Filters
              </Button>
            </Box>
          </Stack>
        </Card>

        {/* Results Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredReceipts.length} receipt{filteredReceipts.length !== 1 ? 's' : ''} found
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {searchQuery && (
              <Chip 
                label={`Search: "${searchQuery}"`} 
                onDelete={() => setSearchQuery('')} 
                size="small" 
                color="primary"
                variant="outlined"
              />
            )}
            {(dateFrom || dateTo) && (
              <Chip 
                label="Date filtered" 
                onDelete={() => { setDateFrom(null); setDateTo(null); }} 
                size="small" 
                color="secondary"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        {/* Receipts List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {filteredReceipts.length === 0 ? (
            <Card 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.grey[50], 0.5),
              }}
            >
              <Receipt sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No receipts found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {searchQuery || dateFrom || dateTo 
                  ? 'Try adjusting your search or date filters'
                  : 'You don\'t have any completed service receipts yet'
                }
              </Typography>
            </Card>
          ) : (
            <Stack spacing={2}>
              {filteredReceipts.map((receipt) => (
                <Card 
                  key={receipt.id}
                  sx={{ 
                    p: 3,
                    transition: 'all 0.2s ease-in-out',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                      transform: 'translateY(-2px)',
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                    }
                  }}
                >
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
                    
                    {/* Service Info */}
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: 'text.primary',
                          mb: 0.5,
                        }}
                      >
                        {receipt.serviceType}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {receipt.providerName}
                        </Typography>
                      </Box>
                      <Chip 
                        label={receipt.status === 'completed' ? 'Completed' : 'Delivered'} 
                        color={receipt.status === 'completed' ? 'success' : 'info'}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Box>

                    {/* Dates */}
                    <Box sx={{ minWidth: 200 }}>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Ordered: {receipt.orderDate.toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DateRange sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Completed: {receipt.completedDate.toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Amount */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 100 }}>
                      <AttachMoney sx={{ fontSize: 20, color: 'success.main' }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'success.main',
                        }}
                      >
                        ${receipt.amount.toFixed(2)}
                      </Typography>
                    </Box>

                    {/* Download Button */}
                    <Box>
                      <Tooltip title="Download PDF Receipt">
                        <Button
                          variant="contained"
                          startIcon={<FileDownload />}
                          onClick={() => handleDownload(receipt)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                              transform: 'scale(1.02)',
                            }
                          }}
                        >
                          Download
                        </Button>
                      </Tooltip>
                    </Box>

                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

      </Box>
    </LocalizationProvider>
  );
} 