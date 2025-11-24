import { Box, Typography, TextField, InputAdornment, Button, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { MusicNote, Search, FilterList } from '@mui/icons-material';
import { ServiceCardSimple } from '../../../components/cards/creative/ServiceCard';
import { BundleCard } from '../../../components/cards/creative/BundleCard';
import { ServicesDetailPopover } from '../../../components/popovers/ServicesDetailPopover';
import { BundleDetailPopover } from '../../../components/popovers/BundleDetailPopover';
import { BookingServicePopover } from '../../../components/popovers/client/BookingServicePopover';
import { CreativeDetailPopover } from '../../../components/popovers/client/CreativeDetailPopover';
import { useState, useMemo, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faUser, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { userService } from '../../../api/userService';
import { useAuth } from '../../../context/auth';
import { errorToast } from '../../../components/toast/toast';
import { useSearchParams } from 'react-router-dom';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_time: string;
  creative_name: string;
  creative_display_name?: string;
  creative_title?: string;
  creative_avatar_url?: string;
  color: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creative_user_id: string;
  requires_booking: boolean;
  photos?: Array<{
    photo_url: string;
    photo_filename?: string;
    photo_size_bytes?: number;
    is_primary: boolean;
    display_order: number;
  }>;
}

interface Bundle {
  id: string;
  title: string;
  description: string;
  color: string;
  status: string;
  pricing_option: string;
  fixed_price?: number;
  discount_percentage?: number;
  total_services_price: number;
  final_price: number;
  services: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    delivery_time: string;
    status: string;
    color: string;
    photos?: Array<{
      photo_url: string;
      photo_filename?: string;
      photo_size_bytes?: number;
      is_primary: boolean;
      display_order: number;
    }>;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creative_name?: string;
  creative_display_name?: string;
  creative_title?: string;
  creative_avatar_url?: string;
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Data state
  const [services, setServices] = useState<Service[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
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
  
  // Bundle detail popover state
  const [bundleDetailOpen, setBundleDetailOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  // Booking popover state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [serviceToBook, setServiceToBook] = useState<Service | null>(null);

  // Connected creatives state
  const [creatives, setCreatives] = useState<any[]>([]);
  
  // Creative detail popover state
  const [creativeDetailOpen, setCreativeDetailOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<any>(null);

  const fetchingRef = useRef(false);
  const lastAuthStateRef = useRef<boolean | null>(null);
  const cacheRef = useRef<{ data: Service[], timestamp: number } | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Refs for creatives fetching
  const creativesFetchingRef = useRef(false);
  const lastCreativesAuthStateRef = useRef<boolean | null>(null);
  const creativesCacheRef = useRef<{ data: any[], timestamp: number } | null>(null);

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
        const response = await userService.getClientConnectedServicesAndBundles();
        
        console.log('Connected services data:', response.services);
        console.log('Connected bundles data:', response.bundles);
        
        // Cache the response
        cacheRef.current = {
          data: response.services,
          timestamp: Date.now()
        };
        
        setServices(response.services);
        setBundles(response.bundles);
      } catch (error) {
        console.error('Failed to fetch connected services and bundles:', error);
        // Show error toast
        errorToast('Failed to load connected services. Please try again.');
        // Fallback to empty array
        setServices([]);
        setBundles([]);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchServices();
  }, [isAuthenticated]);

  // Check for serviceId in URL params and open booking popover
  useEffect(() => {
    const serviceId = searchParams.get('serviceId');
    if (serviceId && services.length > 0 && !bookingOpen) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        // Add creative profile information to the service object
        const serviceWithCreative = {
          ...service,
          creative_display_name: service.creative_display_name || service.creative_name,
          creative_title: service.creative_title,
          creative_avatar_url: service.creative_avatar_url
        };
        setServiceToBook(serviceWithCreative as any);
        setBookingOpen(true);
        // Remove serviceId from URL to clean it up
        searchParams.delete('serviceId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, services, bookingOpen, setSearchParams]);

  // Fetch connected creatives for creative detail popover
  useEffect(() => {
    const fetchCreatives = async () => {
      // Prevent duplicate calls if already fetching or auth state hasn't changed
      if (creativesFetchingRef.current || lastCreativesAuthStateRef.current === isAuthenticated) {
        return;
      }

      creativesFetchingRef.current = true;
      lastCreativesAuthStateRef.current = isAuthenticated;

      if (!isAuthenticated) {
        // In demo mode (not authenticated), use empty array
        setCreatives([]);
        creativesFetchingRef.current = false;
        return;
      }

      // Check cache first
      if (creativesCacheRef.current && (Date.now() - creativesCacheRef.current.timestamp) < CACHE_DURATION) {
        console.log('Using cached connected creatives data');
        setCreatives(creativesCacheRef.current.data);
        creativesFetchingRef.current = false;
        return;
      }

      try {
        const response = await userService.getClientCreatives();
        
        console.log('Connected creatives data:', response.creatives);
        
        // Cache the response
        creativesCacheRef.current = {
          data: response.creatives,
          timestamp: Date.now()
        };
        
        setCreatives(response.creatives);
      } catch (error) {
        console.error('Failed to fetch connected creatives:', error);
        setCreatives([]);
      } finally {
        creativesFetchingRef.current = false;
      }
    };

    fetchCreatives();
  }, [isAuthenticated]);

  // Get unique creatives for filter
  const uniqueCreatives = useMemo(() => {
    const serviceCreatives = services.map(service => service.creative_display_name || service.creative_name);
    const bundleCreatives = bundles.map(bundle => bundle.creative_display_name || bundle.creative_name || 'Creative');
    const allCreatives = [...serviceCreatives, ...bundleCreatives];
    const creatives = [...new Set(allCreatives)];
    return creatives.sort();
  }, [services, bundles]);

  // Animation key that changes on every filter/search
  const animationKey = sortBy + '-' + sortOrder + '-' + producerFilter + '-' + search;

  // Filter and sort services and bundles
  const filteredAndSortedItems = useMemo(() => {
    // Filter services
    const filteredServices = services.filter(service =>
      (producerFilter === 'all' || (service.creative_display_name || service.creative_name) === producerFilter) &&
      (service.title.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase()) ||
        (service.creative_display_name || service.creative_name).toLowerCase().includes(search.toLowerCase()))
    );

    // Filter bundles
    const filteredBundles = bundles.filter(bundle =>
      (producerFilter === 'all' || (bundle.creative_display_name || bundle.creative_name) === producerFilter) &&
      (bundle.title.toLowerCase().includes(search.toLowerCase()) ||
        bundle.description.toLowerCase().includes(search.toLowerCase()) ||
        (bundle.creative_display_name || bundle.creative_name || 'Creative').toLowerCase().includes(search.toLowerCase()))
    );

    // Combine and sort
    const allItems = [
      ...filteredServices.map(item => ({ ...item, type: 'service' as const })),
      ...filteredBundles.map(item => ({ ...item, type: 'bundle' as const }))
    ];

    return [...allItems].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
      if (sortBy === 'price') {
        const aPrice = a.type === 'service' ? a.price : a.final_price;
        const bPrice = b.type === 'service' ? b.price : b.final_price;
        cmp = aPrice - bPrice;
      }
      if (sortBy === 'delivery') {
        if (a.type === 'service' && b.type === 'service') {
          const parseDays = (str: string) => {
            const match = str.match(/(\d+)/g);
            if (!match) return 0;
            return Math.min(...match.map(Number));
          };
          cmp = parseDays(a.delivery_time) - parseDays(b.delivery_time);
        } else {
          // For bundles, use average delivery time of services
          const aDelivery = a.type === 'service' ? 
            (() => {
              const match = a.delivery_time.match(/(\d+)/g);
              return match ? Math.min(...match.map(Number)) : 0;
            })() : 
            a.services.reduce((sum, s) => {
              const match = s.delivery_time.match(/(\d+)/g);
              return sum + (match ? Math.min(...match.map(Number)) : 0);
            }, 0) / a.services.length;
          
          const bDelivery = b.type === 'service' ? 
            (() => {
              const match = b.delivery_time.match(/(\d+)/g);
              return match ? Math.min(...match.map(Number)) : 0;
            })() : 
            b.services.reduce((sum, s) => {
              const match = s.delivery_time.match(/(\d+)/g);
              return sum + (match ? Math.min(...match.map(Number)) : 0);
            }, 0) / b.services.length;
          
          cmp = aDelivery - bDelivery;
        }
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [services, bundles, search, sortBy, sortOrder, producerFilter]);

  const handleServiceClick = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      // Add creative profile information to the service object
      const serviceWithCreative = {
        ...service,
        creative_display_name: service.creative_display_name || service.creative_name,
        creative_title: service.creative_title,
        creative_avatar_url: service.creative_avatar_url
      };
      setSelectedService(serviceWithCreative as any);
      setServiceDetailOpen(true);
    }
  };

  const handleBundleClick = (bundleId: string) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (bundle) {
      setSelectedBundle(bundle);
      setBundleDetailOpen(true);
    }
  };

  const handleServiceDetailClose = () => {
    setServiceDetailOpen(false);
    setSelectedService(null);
  };

  const handleBundleDetailClose = () => {
    setBundleDetailOpen(false);
    setSelectedBundle(null);
  };

  const handleBookService = () => {
    if (selectedService) {
      setServiceToBook(selectedService);
      setBookingOpen(true);
      // Close the service detail popover
      setServiceDetailOpen(false);
      setSelectedService(null);
    }
  };

  const handleBookingClose = () => {
    setBookingOpen(false);
    setServiceToBook(null);
  };

  const handleConfirmBooking = async (bookingData: { serviceId: string }) => {
    console.log('Confirming booking for service:', bookingData.serviceId);
    // TODO: Implement actual booking API call
    // For now, just close the popover
    handleBookingClose();
  };

  const handleCreativeClick = (creativeData: any) => {
    // Find the full creative data from the connected creatives list
    const fullCreative = creatives.find(creative => 
      creative.name === creativeData.name || 
      creative.id === creativeData.id
    );
    
    if (fullCreative) {
      setSelectedCreative(fullCreative);
      setCreativeDetailOpen(true);
    } else {
      // Fallback to the provided data if not found in connected creatives
      setSelectedCreative(creativeData);
      setCreativeDetailOpen(true);
    }
  };

  const handleCreativeDetailClose = () => {
    setCreativeDetailOpen(false);
    setSelectedCreative(null);
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
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          py: 1,
          width: '100%',
          maxWidth: '100%',
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

      {filteredAndSortedItems.length === 0 ? (
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
          maxWidth: '100%',
          boxSizing: 'border-box',
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
          {filteredAndSortedItems.map((item, index) => (
            <Box
              key={item.id + '-' + animationKey}
              sx={{
                animation: `fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1) ${index * 0.1}s both`,
                pb: 1,
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                overflow: 'visible',
                boxSizing: 'border-box',
              }}
            >
              {item.type === 'service' ? (
                <ServiceCardSimple
                  title={item.title}
                  description={item.description}
                  price={item.price}
                  delivery={item.delivery_time}
                  color={item.color}
                  creative={item.creative_display_name || item.creative_name}
                  onBook={() => handleServiceClick(item.id)}
                  requires_booking={item.requires_booking}
                />
              ) : (
                <BundleCard
                  bundle={item}
                  creative={item.creative_display_name || item.creative_name || 'Creative'}
                  showStatus={false}
                  showMenu={false}
                  onClick={() => handleBundleClick(item.id)}
                />
              )}
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
        onCreativeClick={handleCreativeClick}
      />

      {/* Bundle Detail Popover */}
      <BundleDetailPopover
        open={bundleDetailOpen}
        onClose={handleBundleDetailClose}
        bundle={selectedBundle}
        context="client-connected"
        onBook={() => console.log('Booking bundle:', selectedBundle?.id)}
      />

      {/* Booking Service Popover */}
      <BookingServicePopover
        open={bookingOpen}
        onClose={handleBookingClose}
        service={serviceToBook}
        onConfirmBooking={handleConfirmBooking}
        onCreativeClick={handleCreativeClick}
      />

      {/* Creative Detail Popover */}
      {selectedCreative && (
        <CreativeDetailPopover
          open={creativeDetailOpen}
          onClose={handleCreativeDetailClose}
          creative={selectedCreative}
        />
      )}
    </Box>
  );
}