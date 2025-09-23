import { Box, Typography, TextField, InputAdornment, Button, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { MusicNote, Search, FilterList } from '@mui/icons-material';
import { ServiceCardSimple } from '../../../components/cards/creative/ServiceCard';
import { ServicesDetailPopover } from '../../../components/popovers/ServicesDetailPopover';
import { useState, useMemo, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faUser, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { userService } from '../../../api/userService';
import { useAuth } from '../../../context/auth';
import { errorToast } from '../../../components/toast/toast';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_time: string;
  creative_name: string;
  color: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creative_user_id: string;
  photos?: Array<{
    photo_url: string;
    photo_filename?: string;
    photo_size_bytes?: number;
    is_primary: boolean;
    display_order: number;
  }>;
}

const sortOptions = [
  { value: 'title', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'delivery', label: 'Delivery Time' },
];

export function ConnectedServicesTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();

  // Data state
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search/filter/sort state
  const [sortBy, setSortBy] = useState<'title' | 'price' | 'delivery'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [producerFilter, setCreativeFilter] = useState<string>('all');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Service detail popover state
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const fetchingRef = useRef(false);
  const lastAuthStateRef = useRef<boolean | null>(null);
  const cacheRef = useRef<{ data: Service[], timestamp: number } | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Fetch services when component mounts and user is authenticated
  useEffect(() => {
    const fetchServices = async () => {
      // Prevent duplicate calls if already fetching or auth state hasn't changed
      if (fetchingRef.current || lastAuthStateRef.current === isAuthenticated) {
        return;
      }

      fetchingRef.current = true;
      lastAuthStateRef.current = isAuthenticated;

      if (!isAuthenticated) {
        // In demo mode (not authenticated), use empty array
        setServices([]);
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      // Check cache first
      if (cacheRef.current && (Date.now() - cacheRef.current.timestamp) < CACHE_DURATION) {
        console.log('Using cached connected services data');
        setServices(cacheRef.current.data);
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      try {
        setLoading(true);
        const response = await userService.getClientConnectedServices();
        console.log('Connected services data:', response.services);
        
        // Cache the response
        cacheRef.current = {
          data: response.services,
          timestamp: Date.now()
        };
        
        setServices(response.services);
      } catch (error) {
        console.error('Failed to fetch connected services:', error);
        // Show error toast
        errorToast('Failed to load connected services. Please try again.');
        // Fallback to empty array
        setServices([]);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchServices();
  }, [isAuthenticated]);

  // Get unique creatives for filter
  const uniqueCreatives = useMemo(() => {
    const creatives = [...new Set(services.map(service => service.creative_name))];
    return creatives.sort();
  }, [services]);

  // Animation key that changes on every filter/search
  const animationKey = sortBy + '-' + sortOrder + '-' + producerFilter + '-' + search;

  // Filter and sort services
  const filteredAndSortedServices = useMemo(() => {
    const filtered = services.filter(service =>
      (producerFilter === 'all' || service.creative_name === producerFilter) &&
      (service.title.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase()) ||
        service.creative_name.toLowerCase().includes(search.toLowerCase()))
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
        cmp = parseDays(a.delivery_time) - parseDays(b.delivery_time);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [services, search, sortBy, sortOrder, producerFilter]);

  const handleServiceClick = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      // Add creative profile information to the service object
      const serviceWithCreative = {
        ...service,
        creative_display_name: service.creative_name,
        creative_title: 'Creative Professional', // Default title for connected services
        creative_avatar_url: undefined // No avatar URL available for connected services
      };
      setSelectedService(serviceWithCreative as any);
      setServiceDetailOpen(true);
    }
  };

  const handleServiceDetailClose = () => {
    setServiceDetailOpen(false);
    setSelectedService(null);
  };

  const handleBookService = () => {
    console.log('Booking service:', selectedService?.id);
    // TODO: Implement booking logic
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        minHeight: '300px',
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
        <Box sx={{
          height: '100vh',
          overflow: 'auto', // Changed from 'hidden' to 'auto' to allow scrolling and hover effects
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          py: 1,
        }}>
      {/* Search and Filter Bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: { xs: '#fff' },
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
              {/* Creative Filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="creative-label">Creative</InputLabel>
                <Select
                  labelId="creative-label"
                  value={producerFilter}
                  label="Creative"
                  onChange={e => setCreativeFilter(e.target.value)}
                  renderValue={() => {
                    let icon = faLayerGroup;
                    let label = 'All Creatives';
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
                    All Creatives
                  </MenuItem>
                  {uniqueCreatives.map(creative => (
                    <MenuItem key={creative} value={creative} sx={{
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
                          fontWeight: producerFilter === creative ? 600 : 400
                        }}
                      />
                      {creative}
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
            <InputLabel id="modal-creative-label" shrink={true}>Creative</InputLabel>
            <Select
              labelId="modal-creative-label"
              value={producerFilter}
              label="Creative"
              onChange={e => setCreativeFilter(e.target.value)}
              renderValue={() => {
                let icon = faLayerGroup;
                let label = 'All Creatives';
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
                All Creatives
              </MenuItem>
              {uniqueCreatives.map(creative => (
                <MenuItem key={creative} value={creative} sx={{
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
                      fontWeight: producerFilter === creative ? 600 : 400
                    }}
                  />
                  {creative}
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
          height: '100vh',
          textAlign: 'center',
          color: 'secondary.main',
          overflow: 'hidden',
        }}>
          <MusicNote sx={{ fontSize: 64, mb: 2, opacity: 0.4, color: 'secondary.main' }} />
          <Typography variant="h6" sx={{ mb: 1, color: 'secondary.main' }}>
            No Connected Services
          </Typography>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>
            Browse and book services from your connected creatives
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gap: { xs: 1.5, sm: 2 },
          px: { xs: 1, sm: 2 },
          pt: 2,
          pb: 4, // Increased bottom padding to accommodate hover effects
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          alignItems: 'stretch',
          minHeight: 0,
          width: '100%',
          overflow: 'visible', 
          '@keyframes fadeInCard': {
            '0%': {
              opacity: 0,
              transform: 'translateY(20px) scale(0.95)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0) scale(1)',
            },
          },
        }}>
          {filteredAndSortedServices.map((service, index) => (
            <Box
              key={service.id + '-' + animationKey}
              sx={{
                animation: `fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1) ${index * 0.1}s both`,
                pb: 1,
              }}
            >
              <ServiceCardSimple
                title={service.title}
                description={service.description}
                price={service.price}
                delivery={service.delivery_time}
                color={service.color}
                creative={service.creative_name}
                onBook={() => handleServiceClick(service.id)}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Service Detail Popover */}
      <ServicesDetailPopover
        open={serviceDetailOpen}
        onClose={handleServiceDetailClose}
        service={selectedService}
        context="client-connected"
        onBook={handleBookService}
      />
    </Box>
  );
}