import { Box, Typography, TextField, InputAdornment, Button, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { MusicNote, Search, FilterList } from '@mui/icons-material';
import { ServiceCardSimple } from '../../../components/cards/producer/ServiceCard';
import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faUser, faLayerGroup } from '@fortawesome/free-solid-svg-icons';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery: string;
  producer: string;
  rating: number;
  reviewCount: number;
  color: string;
}

// Mock data for connected services
const mockConnectedServices: Service[] = [
  {
    id: 'service-1',
    title: 'Mixing',
    description: 'Professional mixing for your tracks',
    price: 200,
    delivery: '3 days',
    producer: 'Mike Johnson',
    rating: 4.8,
    reviewCount: 45,
    color: '#F3E8FF',
  },
  {
    id: 'service-2',
    title: 'Mastering',
    description: 'High-quality mastering for release',
    price: 150,
    delivery: '2 days',
    producer: 'Sarah Wilson',
    rating: 4.9,
    reviewCount: 32,
    color: '#E0F2FE',
  },
  {
    id: 'service-3',
    title: 'Vocal Tuning',
    description: 'Pitch correction and tuning for vocals',
    price: 100,
    delivery: '1 day',
    producer: 'Alex Thompson',
    rating: 4.7,
    reviewCount: 28,
    color: '#FEF9C3',
  },
  {
    id: 'service-4',
    title: 'Full Production',
    description: 'From songwriting to final mix',
    price: 1000,
    delivery: '10 days',
    producer: 'David Chen',
    rating: 4.9,
    reviewCount: 15,
    color: '#FEE2E2',
  },
  {
    id: 'service-5',
    title: 'Beat Making',
    description: 'Custom beats for any genre',
    price: 300,
    delivery: '4 days',
    producer: 'Emma Davis',
    rating: 4.6,
    reviewCount: 38,
    color: '#DCFCE7',
  },
  {
    id: 'service-6',
    title: 'Session Guitar',
    description: 'Professional guitar tracks for your song',
    price: 120,
    delivery: '2 days',
    producer: 'Mike Johnson',
    rating: 4.8,
    reviewCount: 22,
    color: '#E0E7FF',
  },
  {
    id: 'service-7',
    title: 'Drum Programming',
    description: 'Realistic drum programming for your track',
    price: 180,
    delivery: '3 days',
    producer: 'Sarah Wilson',
    rating: 4.7,
    reviewCount: 19,
    color: '#FFE4E6',
  },
  {
    id: 'service-8',
    title: 'Arrangement',
    description: 'Song arrangement and structure advice',
    price: 80,
    delivery: '2 days',
    producer: 'Alex Thompson',
    rating: 4.5,
    reviewCount: 12,
    color: '#F1F5F9',
  },
];

const sortOptions = [
  { value: 'title', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'delivery', label: 'Delivery Time' },
];

export function ConnectedServicesTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Search/filter/sort state
  const [sortBy, setSortBy] = useState<'title' | 'price' | 'delivery'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [producerFilter, setProducerFilter] = useState<string>('all');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Get unique producers for filter
  const uniqueProducers = useMemo(() => {
    const producers = [...new Set(mockConnectedServices.map(service => service.producer))];
    return producers.sort();
  }, []);

  // Animation key that changes on every filter/search
  const animationKey = sortBy + '-' + sortOrder + '-' + producerFilter + '-' + search;
  
  // Filter and sort services
  const filteredAndSortedServices = useMemo(() => {
    const filtered = mockConnectedServices.filter(service =>
      (producerFilter === 'all' || service.producer === producerFilter) &&
      (service.title.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase()) ||
        service.producer.toLowerCase().includes(search.toLowerCase()))
    );
    
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
      if (sortBy === 'price') cmp = a.price - b.price;
      if (sortBy === 'delivery') {
        const parseDays = (str: string) => {
          const match = str.match(/(\d+)/g);
          if (!match) return 0;
          return Math.min(...match.map(Number));
        };
        cmp = parseDays(a.delivery) - parseDays(b.delivery);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [search, sortBy, sortOrder, producerFilter]);

  const handleServiceClick = (serviceId: string) => {
    console.log('Service clicked:', serviceId);
    // TODO: Navigate to service booking page
  };

  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 1,
      overflowY: { xs: 'auto', sm: 'auto', md: 'auto' },
      minHeight: 0,
    }}>
      {/* Search and Filter Bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: { xs: '#fff', sm: 'transparent' },
          boxShadow: { xs: '0 2px 8px 0 rgba(122,95,255,0.04)', sm: 'none' },
          px: 0,
          pt: { xs: 0, sm: 0.5 },
        }}
      >
        <Box
          sx={{
            px: { xs: 1, sm: 2 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            justifyContent: { xs: 'flex-start', sm: 'space-between' },
            alignItems: { sm: 'center' },
            mb: 0,
          }}
        >
          <TextField
            size="small"
            placeholder="Search services..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 220 } }}
          />
          
          {isMobile ? (
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilterModalOpen(true)}
              sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: 0, py: 1, px: 1, borderRadius: 2, fontWeight: 600 }}
            >
              Filters
            </Button>
          ) : (
            <>
              {/* Producer Filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="producer-label">Producer</InputLabel>
                <Select
                  labelId="producer-label"
                  value={producerFilter}
                  label="Producer"
                  onChange={e => setProducerFilter(e.target.value)}
                  renderValue={() => {
                    let icon = faLayerGroup;
                    let label = 'All Producers';
                    if (producerFilter !== 'all') {
                      icon = faUser;
                      label = producerFilter;
                    }
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FontAwesomeIcon icon={icon} style={{ marginRight: 8, color: '#888', fontSize: 16 }} />
                        <span>{label}</span>
                      </Box>
                    );
                  }}
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
                      '& .fa-icon': {
                        fontWeight: 600,
                      },
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: 'transparent !important',
                    },
                  }}>
                    <FontAwesomeIcon 
                      icon={faLayerGroup} 
                      className="fa-icon"
                      style={{ 
                        marginRight: 12, 
                        fontSize: 16,
                        fontWeight: producerFilter === 'all' ? 600 : 400 
                      }} 
                    />
                    All Producers
                  </MenuItem>
                  {uniqueProducers.map(producer => (
                    <MenuItem key={producer} value={producer} sx={{
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        color: theme.palette.primary.main,
                        backgroundColor: 'transparent !important',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'transparent',
                        fontWeight: 600,
                        '& .fa-icon': {
                          fontWeight: 600,
                        },
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'transparent !important',
                      },
                    }}>
                      <FontAwesomeIcon 
                        icon={faUser} 
                        className="fa-icon"
                        style={{ 
                          marginRight: 12, 
                          fontSize: 16,
                          fontWeight: producerFilter === producer ? 600 : 400 
                        }} 
                      />
                      {producer}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Sort By */}
              <FormControl size="small" sx={{ minWidth: 140, ml: { sm: 'auto' } }}>
                <InputLabel id="sort-label">Sort By</InputLabel>
                <Select
                  labelId="sort-label"
                  value={sortBy + '-' + sortOrder}
                  label="Sort By"
                  onChange={e => {
                    const [field, order] = (e.target.value as string).split('-');
                    setSortBy(field as 'title' | 'price' | 'delivery');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  renderValue={() => {
                    const opt = sortOptions.find(o => o.value === sortBy);
                    const icon = sortOrder === 'asc' ? faArrowUp : faArrowDown;
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <FontAwesomeIcon icon={icon} style={{ marginRight: 8, color: '#888', fontSize: 18 }} />
                        <span>{opt?.label || ''}</span>
                      </Box>
                    );
                  }}
                >
                  {sortOptions.map(opt => [
                    <MenuItem key={opt.value + '-desc'} value={opt.value + '-desc'} disableRipple sx={{
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        color: theme.palette.primary.main,
                        backgroundColor: 'transparent !important',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'transparent',
                        fontWeight: 600,
                        '& .fa-icon': {
                          fontWeight: 600,
                        },
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'transparent !important',
                      },
                    }}>
                      <FontAwesomeIcon 
                        icon={faArrowDown} 
                        className="fa-icon"
                        style={{ 
                          marginRight: 12, 
                          fontSize: 18,
                          fontWeight: (sortBy === opt.value && sortOrder === 'desc') ? 600 : 400 
                        }} 
                      />
                      <Box sx={{ flex: 1, fontWeight: (sortBy === opt.value && sortOrder === 'desc') ? 600 : 400 }}>{opt.label}</Box>
                    </MenuItem>,
                    <MenuItem key={opt.value + '-asc'} value={opt.value + '-asc'} disableRipple sx={{
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        color: theme.palette.primary.main,
                        backgroundColor: 'transparent !important',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'transparent',
                        fontWeight: 600,
                        '& .fa-icon': {
                          fontWeight: 600,
                        },
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'transparent !important',
                      },
                    }}>
                      <FontAwesomeIcon 
                        icon={faArrowUp} 
                        className="fa-icon"
                        style={{ 
                          marginRight: 12, 
                          fontSize: 18,
                          fontWeight: (sortBy === opt.value && sortOrder === 'asc') ? 600 : 400 
                        }} 
                      />
                      <Box sx={{ flex: 1, fontWeight: (sortBy === opt.value && sortOrder === 'asc') ? 600 : 400 }}>{opt.label}</Box>
                    </MenuItem>
                  ])}
                </Select>
              </FormControl>
            </>
          )}
        </Box>
      </Box>

      {/* Filter Modal for Mobile */}
      <Dialog
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: { borderRadius: 3, p: 1, background: 'rgba(255,255,255,0.98)' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1.5 }}>Filters</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5, px: 4, overflow: 'visible' }}>
          <FormControl size="small" fullWidth sx={{ minWidth: 0 }} margin="dense">
            <InputLabel id="modal-producer-label" shrink={true}>Producer</InputLabel>
            <Select
              labelId="modal-producer-label"
              value={producerFilter}
              label="Producer"
              onChange={e => setProducerFilter(e.target.value)}
              renderValue={() => {
                let icon = faLayerGroup;
                let label = 'All Producers';
                if (producerFilter !== 'all') {
                  icon = faUser;
                  label = producerFilter;
                }
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={icon} style={{ marginRight: 8, color: '#888', fontSize: 16 }} />
                    <span>{label}</span>
                  </Box>
                );
              }}
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
                  '& .fa-icon': {
                    fontWeight: 600,
                  },
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                <FontAwesomeIcon 
                  icon={faLayerGroup} 
                  className="fa-icon"
                  style={{ 
                    marginRight: 12, 
                    fontSize: 16,
                    fontWeight: producerFilter === 'all' ? 600 : 400 
                  }} 
                />
                All Producers
              </MenuItem>
              {uniqueProducers.map(producer => (
                <MenuItem key={producer} value={producer} sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    color: theme.palette.primary.main,
                    backgroundColor: 'transparent !important',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'transparent',
                    fontWeight: 600,
                    '& .fa-icon': {
                      fontWeight: 600,
                    },
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'transparent !important',
                  },
                }}>
                  <FontAwesomeIcon 
                    icon={faUser} 
                    className="fa-icon"
                    style={{ 
                      marginRight: 12, 
                      fontSize: 16,
                      fontWeight: producerFilter === producer ? 600 : 400 
                    }} 
                  />
                  {producer}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth sx={{ minWidth: 0 }} margin="dense">
            <InputLabel id="modal-sort-label" shrink={true}>Sort By</InputLabel>
            <Select
              labelId="modal-sort-label"
              value={sortBy + '-' + sortOrder}
              label="Sort By"
              onChange={e => {
                const [field, order] = (e.target.value as string).split('-');
                setSortBy(field as 'title' | 'price' | 'delivery');
                setSortOrder(order as 'asc' | 'desc');
              }}
              renderValue={() => {
                const opt = sortOptions.find(o => o.value === sortBy);
                const icon = sortOrder === 'asc' ? faArrowUp : faArrowDown;
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <FontAwesomeIcon icon={icon} style={{ marginRight: 8, color: '#888', fontSize: 18 }} />
                    <span>{opt?.label || ''}</span>
                  </Box>
                );
              }}
            >
              {sortOptions.map(opt => [
                <MenuItem key={opt.value + '-desc'} value={opt.value + '-desc'} disableRipple sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    color: theme.palette.primary.main,
                    backgroundColor: 'transparent !important',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'transparent',
                    fontWeight: 600,
                    '& .fa-icon': {
                      fontWeight: 600,
                    },
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'transparent !important',
                  },
                }}>
                  <FontAwesomeIcon 
                    icon={faArrowDown} 
                    className="fa-icon"
                    style={{ 
                      marginRight: 12, 
                      fontSize: 18,
                      fontWeight: (sortBy === opt.value && sortOrder === 'desc') ? 600 : 400 
                    }} 
                  />
                  <Box sx={{ flex: 1, fontWeight: (sortBy === opt.value && sortOrder === 'desc') ? 600 : 400 }}>{opt.label}</Box>
                </MenuItem>,
                <MenuItem key={opt.value + '-asc'} value={opt.value + '-asc'} disableRipple sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    color: theme.palette.primary.main,
                    backgroundColor: 'transparent !important',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'transparent',
                    fontWeight: 600,
                    '& .fa-icon': {
                      fontWeight: 600,
                    },
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'transparent !important',
                  },
                }}>
                  <FontAwesomeIcon 
                    icon={faArrowUp} 
                    className="fa-icon"
                    style={{ 
                      marginRight: 12, 
                      fontSize: 18,
                      fontWeight: (sortBy === opt.value && sortOrder === 'asc') ? 600 : 400 
                    }} 
                  />
                  <Box sx={{ flex: 1, fontWeight: (sortBy === opt.value && sortOrder === 'asc') ? 600 : 400 }}>{opt.label}</Box>
                </MenuItem>
              ])}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterModalOpen(false)} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>Apply</Button>
        </DialogActions>
      </Dialog>

      {filteredAndSortedServices.length === 0 ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          color: 'secondary.main',
        }}>
          <MusicNote sx={{ fontSize: 64, mb: 2, opacity: 0.4, color: 'secondary.main' }} />
          <Typography variant="h6" sx={{ mb: 1, color: 'secondary.main' }}>
            No Connected Services
          </Typography>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>
            Browse and book services from your connected producers
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gap: { xs: 1.5, sm: 2 },
          px: { xs: 1, sm: 2 },
          pt: 2,
          pb: 1,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          alignItems: 'stretch',
          minHeight: 0,
          width: '100%',
          overflow: 'hidden',
        }}>
          {filteredAndSortedServices.map((service, index) => (
            <Box
              key={service.id + '-' + animationKey}
              sx={{
                animation: `fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1) ${index * 0.1}s both`,
              }}
            >
              <ServiceCardSimple
                title={service.title}
                description={service.description}
                price={service.price}
                delivery={service.delivery}
                color={service.color}
                producer={service.producer}
                onBook={() => handleServiceClick(service.id)}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
} 