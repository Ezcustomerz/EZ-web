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
  Avatar,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  Schedule,
  AttachMoney,
  CheckCircle,
  AccessTime,
  TrendingUp,
} from '@mui/icons-material';

// Service progress stages
type ProgressStage = 'in_progress' | 'completed';

interface InProgressService {
  id: string;
  serviceType: string;
  providerName: string;
  providerAvatar?: string;
  amount: number;
  orderDate: Date;
  estimatedCompletion: Date;
  currentStage: ProgressStage;
  progressPercentage: number;
  lastUpdate: Date;
  hasNewUpdate: boolean;
  updateMessage?: string;
  completedDate?: Date; // When it was marked completed (for 24h countdown)
}

// Mock data with services in different stages
const mockInProgressServices: InProgressService[] = [
  {
    id: '1',
    serviceType: 'Beat Production',
    providerName: 'DJ Mike',
    providerAvatar: '/avatars/dj-mike.jpg',
    amount: 150.00,
    orderDate: new Date('2024-09-25'),
    estimatedCompletion: new Date('2024-10-05'),
    currentStage: 'in_progress',
    progressPercentage: 85,
    lastUpdate: new Date('2024-10-01T14:30:00'),
    hasNewUpdate: true,
    updateMessage: 'Beat production is almost complete. Final touches being added.',
  },
  {
    id: '2',
    serviceType: 'Vocal Recording',
    providerName: 'Sarah Studios',
    providerAvatar: '/avatars/sarah.jpg',
    amount: 300.00,
    orderDate: new Date('2024-09-20'),
    estimatedCompletion: new Date('2024-10-02'),
    currentStage: 'in_progress',
    progressPercentage: 60,
    lastUpdate: new Date('2024-09-30T10:15:00'),
    hasNewUpdate: false,
    updateMessage: 'Recording session completed. Now moving to editing phase.',
  },
  {
    id: '3',
    serviceType: 'Mixing & Mastering',
    providerName: 'AudioPro',
    providerAvatar: '/avatars/audiopro.jpg',
    amount: 450.00,
    orderDate: new Date('2024-09-28'),
    estimatedCompletion: new Date('2024-10-08'),
    currentStage: 'completed',
    progressPercentage: 100,
    lastUpdate: new Date('2024-10-01T16:45:00'),
    hasNewUpdate: true,
    updateMessage: 'Your track is complete and ready for download!',
    completedDate: new Date('2024-10-01T16:45:00'),
  },
];

export function InProgressTab() {
  const theme = useTheme();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | ProgressStage>('all');

  // Get progress stage info
  const getStageInfo = (stage: ProgressStage) => {
    switch (stage) {
      case 'in_progress':
        return { label: 'In Progress', color: 'info' as const, icon: <TrendingUp /> };
      case 'completed':
        return { label: 'Completed', color: 'success' as const, icon: <CheckCircle /> };
    }
  };

  // Check if service will be removed soon (completed > 20 hours ago)
  const isNearRemoval = (service: InProgressService) => {
    if (service.currentStage !== 'completed' || !service.completedDate) return false;
    const hoursSinceCompletion = (Date.now() - service.completedDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceCompletion > 20; // Show warning after 20 hours
  };

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = mockInProgressServices.filter(service => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        service.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.providerName.toLowerCase().includes(searchQuery.toLowerCase());

      // Stage filter
      const matchesStage = stageFilter === 'all' || service.currentStage === stageFilter;

      return matchesSearch && matchesStage;
    });

    // Default sort by latest updates
    filtered.sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());

    return filtered;
  }, [searchQuery, stageFilter]);

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
  };

  return (
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
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.primary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <TrendingUp sx={{ fontSize: 28, color: 'info.main' }} />
          Services In Progress
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your active services and get real-time updates from providers
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Card 
        sx={{ 
          p: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.03)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
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

          {/* Stage Filter */}
          <Box sx={{ minWidth: 150 }}>
            <FormControl fullWidth>
              <InputLabel>Filter by Stage</InputLabel>
              <Select
                value={stageFilter}
                label="Filter by Stage"
                onChange={(e) => setStageFilter(e.target.value as 'all' | ProgressStage)}
              >
                <MenuItem value="all">All Stages</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
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
          {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} in progress
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {searchQuery && (
            <Chip 
              label={`Search: "${searchQuery}"`} 
              onDelete={() => setSearchQuery('')} 
              size="small" 
              color="info"
              variant="outlined"
            />
          )}
          {stageFilter !== 'all' && (
            <Chip 
              label={`Stage: ${getStageInfo(stageFilter).label}`} 
              onDelete={() => setStageFilter('all')} 
              size="small" 
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>
      </Box>

      {/* Services List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredServices.length === 0 ? (
          <Card 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.info.main, 0.02),
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
            }}
          >
            <Schedule sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No services in progress
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {searchQuery || stageFilter !== 'all'
                ? 'Try adjusting your search or stage filters'
                : 'You don\'t have any services currently in progress'
              }
            </Typography>
          </Card>
        ) : (
          <Stack spacing={3}>
            {filteredServices.map((service) => {
              const nearRemoval = isNearRemoval(service);

              return (
                <Card 
                  key={service.id}
                  sx={{ 
                    p: 2,
                    transition: 'all 0.2s ease-in-out',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)',
                      borderColor: alpha(theme.palette.info.main, 0.3),
                    }
                  }}
                >
                  {/* Near Removal Warning */}
                  {nearRemoval && (
                    <Alert severity="warning" sx={{ mb: 1.5, py: 0.5 }}>
                      This completed service will move to your receipts page in a few hours.
                    </Alert>
                  )}

                  <Stack direction="row" spacing={2} alignItems="center">
                    
                    {/* Main Content */}
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: 'text.primary',
                          mb: 0.5,
                          fontSize: '1.1rem',
                        }}
                      >
                        {service.serviceType}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Avatar 
                          src={service.providerAvatar} 
                          sx={{ width: 20, height: 20 }}
                        >
                          {service.providerName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {service.providerName}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AttachMoney sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'success.main',
                          }}
                        >
                          ${service.amount.toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTime sx={{ fontSize: 12, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Updated {service.lastUpdate.toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Right Side Progress */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      minWidth: 80,
                      gap: 1,
                    }}>
                      {/* Progress Dots */}
                      <Stack direction="column" spacing={0.5} alignItems="center">
                        {/* In Progress Dot */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: service.currentStage === 'in_progress' || service.currentStage === 'completed'
                                ? '#FFC107' // Yellow
                                : alpha(theme.palette.grey[300], 0.5),
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            In Progress
                          </Typography>
                        </Box>
                        
                        {/* Connecting Line */}
                        <Box
                          sx={{
                            width: 1,
                            height: 12,
                            backgroundColor: service.currentStage === 'completed'
                              ? '#4CAF50' // Green
                              : alpha(theme.palette.grey[300], 0.5),
                          }}
                        />
                        
                        {/* Completed Dot */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: service.currentStage === 'completed'
                                ? '#4CAF50' // Green
                                : alpha(theme.palette.grey[300], 0.5),
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Completed
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Progress Percentage */}
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          mt: 0.5,
                        }}
                      >
                        {service.progressPercentage}%
                      </Typography>
                    </Box>

                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

    </Box>
  );
} 