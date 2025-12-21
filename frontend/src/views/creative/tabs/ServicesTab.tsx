import { Box, Card, Tooltip, Skeleton, CardContent } from '@mui/material';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ServiceCard } from '../../../components/cards/creative/ServiceCard';
import { userService, type CreativeService, type CreativeProfile, type CreativeBundle } from '../../../api/userService';
import { BundleCard } from '../../../components/cards/creative/BundleCard';

import { useAuth } from '../../../context/auth';
import { errorToast, successToast } from '../../../components/toast/toast';
import { ServiceCreationPopover } from '../../../components/popovers/creative/ServiceCreationPopover';
import { ServiceFormPopover } from '../../../components/popovers/creative/ServiceFormPopover';
import { BundleCreationPopover } from '../../../components/popovers/creative/BundleCreationPopover';
import { ServicesDetailPopover } from '../../../components/popovers/ServicesDetailPopover';
import { BundleDetailPopover } from '../../../components/popovers/BundleDetailPopover';
import { ConfirmDeleteDialog } from '../../../components/dialogs/ConfirmDeleteDialog';

export interface ServicesTabProps {
  search: string;
  sortBy: 'title' | 'price' | 'delivery';
  sortOrder: 'asc' | 'desc';
  visibility: 'all' | 'Public' | 'Private' | 'Bundle-Only';
  creativeProfile?: CreativeProfile | null;
}

export function ServicesTab({ search, sortBy, sortOrder, visibility, creativeProfile }: ServicesTabProps) {
  const { isAuthenticated, userProfile, openAuth } = useAuth();
  const [services, setServices] = useState<CreativeService[]>([]);
  const [bundles, setBundles] = useState<CreativeBundle[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceCreationOpen, setServiceCreationOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [bundleCreationOpen, setBundleCreationOpen] = useState(false);
  const [editingService, setEditingService] = useState<CreativeService | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<CreativeService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bundle editing and deletion state
  const [editingBundle, setEditingBundle] = useState<CreativeBundle | null>(null);
  const [bundleDeleteDialogOpen, setBundleDeleteDialogOpen] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState<CreativeBundle | null>(null);
  const [isDeletingBundle, setIsDeletingBundle] = useState(false);
  
  // Service detail popover state
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<CreativeService | null>(null);
  
  // Bundle detail popover state
  const [bundleDetailOpen, setBundleDetailOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<CreativeBundle | null>(null);
  
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Check for serviceId in URL params and open service popover
  useEffect(() => {
    const serviceId = searchParams.get('serviceId');
    if (serviceId && services.length > 0 && !serviceDetailOpen) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        const serviceWithCreative = {
          ...service,
          creative_display_name: creativeProfile?.display_name || userProfile?.name,
          creative_title: creativeProfile?.title,
          creative_avatar_url: creativeProfile?.profile_banner_url
        };
        setSelectedService(serviceWithCreative as any);
        setServiceDetailOpen(true);
        // Remove serviceId from URL to clean it up
        searchParams.delete('serviceId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, services, serviceDetailOpen, creativeProfile, userProfile, setSearchParams]);

  // Fetch services when component mounts or when authenticated
  useEffect(() => {
    const fetchServices = async () => {
      if (!isAuthenticated || !userProfile?.roles.includes('creative')) {
        setServices([]);
        setBundles([]);
        setServicesLoading(false);
        hasFetchedRef.current = false;
        lastUserIdRef.current = null;
        return;
      }

      const currentUserId = userProfile.user_id;
      
      // Prevent duplicate calls for the same user
      if (hasFetchedRef.current && lastUserIdRef.current === currentUserId) {
        return;
      }

      try {
        setServicesLoading(true);
        hasFetchedRef.current = true;
        lastUserIdRef.current = currentUserId;
        const response = await userService.getCreativeServices();
        setServices(response.services);
        setBundles(response.bundles);
      } catch (error) {
        console.error('Failed to fetch services and bundles:', error);
        errorToast('Failed to load services and bundles');
        setServices([]);
        setBundles([]);
        hasFetchedRef.current = false;
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, [isAuthenticated, userProfile]);

  // Function to refresh services and bundles list
  const refreshServices = async () => {
    if (!isAuthenticated || !userProfile?.roles?.includes('creative')) {
      return;
    }

    try {
      setServicesLoading(true);
      const response = await userService.getCreativeServices();
      setServices(response.services);
      setBundles(response.bundles);
    } catch (error) {
      console.error('Failed to refresh services and bundles:', error);
      errorToast('Failed to refresh services and bundles');
    } finally {
      setServicesLoading(false);
    }
  };

  // Handle edit service
  const handleEditService = async (service: CreativeService) => {
    // Fetch calendar settings for the service first
    try {
      const calendarResponse = await userService.getServiceCalendarSettings(service.id);
      if (calendarResponse.success && calendarResponse.calendar_settings) {
        // Add calendar settings to the service object
        const serviceWithCalendar = {
          ...service,
          calendar_settings: calendarResponse.calendar_settings
        };
        console.log('Service with calendar settings:', serviceWithCalendar);
        setEditingService(serviceWithCalendar);
      } else {
        console.log('No calendar settings found for service');
        setEditingService(service);
      }
    } catch (error) {
      console.error('Failed to fetch calendar settings:', error);
      // Still open edit form even if calendar settings fetch fails
      setEditingService(service);
    }
    
    // Open the form after setting the service with calendar settings
    setServiceFormOpen(true);
  };

  // Handle delete service
  const handleDeleteService = (service: CreativeService) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  // Handle edit bundle
  const handleEditBundle = (bundle: CreativeBundle) => {
    setEditingBundle(bundle);
    setBundleCreationOpen(true);
  };

  // Handle delete bundle
  const handleDeleteBundle = (bundle: CreativeBundle) => {
    setBundleToDelete(bundle);
    setBundleDeleteDialogOpen(true);
  };

  const handleServiceClick = (service: CreativeService) => {
    // Add creative profile information to the service object
    const serviceWithCreative = {
      ...service,
      creative_display_name: creativeProfile?.display_name || userProfile?.name,
      creative_title: creativeProfile?.title,
      creative_avatar_url: creativeProfile?.profile_banner_url
    };
    setSelectedService(serviceWithCreative as any);
    setServiceDetailOpen(true);
  };

  const handleBundleClick = (bundle: CreativeBundle) => {
    // Add creative profile information to the bundle object
    const bundleWithCreative = {
      ...bundle,
      creative_display_name: creativeProfile?.display_name || userProfile?.name,
      creative_title: creativeProfile?.title,
      creative_avatar_url: creativeProfile?.profile_banner_url
    };
    setSelectedBundle(bundleWithCreative as any);
    setBundleDetailOpen(true);
  };

  const handleServiceDetailClose = () => {
    setServiceDetailOpen(false);
    setSelectedService(null);
  };

  const handleBundleDetailClose = () => {
    setBundleDetailOpen(false);
    setSelectedBundle(null);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      setIsDeleting(true);
      const response = await userService.deleteService(serviceToDelete.id);
      
      if (response.success) {
        successToast(response.message);
        await refreshServices(); // Refresh the services list
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
      } else {
        errorToast(response.message || 'Failed to delete service');
      }
    } catch (error: any) {
      console.error('Failed to delete service:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete service. Please try again.';
      errorToast(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleConfirmBundleDelete = async () => {
    if (!bundleToDelete) return;

    try {
      setIsDeletingBundle(true);
      const response = await userService.deleteBundle(bundleToDelete.id);
      
      if (response.success) {
        successToast(response.message);
        await refreshServices(); // Refresh the services and bundles list
        setBundleDeleteDialogOpen(false);
        setBundleToDelete(null);
      } else {
        errorToast(response.message || 'Failed to delete bundle');
      }
    } catch (error: any) {
      console.error('Failed to delete bundle:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete bundle. Please try again.';
      errorToast(errorMessage);
    } finally {
      setIsDeletingBundle(false);
    }
  };

  const handleCancelBundleDelete = () => {
    if (!isDeletingBundle) {
      setBundleDeleteDialogOpen(false);
      setBundleToDelete(null);
    }
  };


  const animationKey = sortBy + '-' + sortOrder + '-' + visibility + '-' + search;
  const sortedItems = useMemo(() => {
    // Filter services
    const filteredServices = services.filter(s =>
      ((visibility === 'all') ||
       (s.status === visibility)) &&
      (s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()))
    );

    // Filter bundles (only show if visibility is 'all' or 'Public')
    const filteredBundles = bundles.filter(b =>
      ((visibility === 'all') || (visibility === 'Public')) &&
      (b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase()))
    );

    // Combine services and bundles into a unified list
    const allItems = [
      ...filteredServices.map(s => ({ type: 'service' as const, data: s })),
      ...filteredBundles.map(b => ({ type: 'bundle' as const, data: b }))
    ];

    return [...allItems].sort((a, b) => {
      // Apply the sort by criteria directly
      let cmp = 0;
      if (sortBy === 'title') cmp = a.data.title.localeCompare(b.data.title);
      if (sortBy === 'price') {
        const priceA = a.type === 'service' ? a.data.price : a.data.final_price;
        const priceB = b.type === 'service' ? b.data.price : b.data.final_price;
        cmp = priceA - priceB;
      }
      if (sortBy === 'delivery') {
        const deliveryA = a.type === 'service' ? a.data.delivery_time : 'Varies by service';
        const deliveryB = b.type === 'service' ? b.data.delivery_time : 'Varies by service';
        const parseDays = (str: string) => {
          if (str === 'Varies by service') return 999; // Put bundles at the end
          const match = str.match(/(\d+)/g);
          if (!match) return 0;
          return Math.min(...match.map(Number));
        };
        cmp = parseDays(deliveryA) - parseDays(deliveryB);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [services, bundles, search, sortBy, sortOrder, visibility]);

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      flexGrow: 1,
      py: 2,
      overflowY: 'auto',
      overflowX: 'hidden',
      minHeight: 0,
      boxSizing: 'border-box',
    }}>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1, sm: 1.7 },
          px: { xs: 1.5, sm: 2 },
          pb: 6, // Increased bottom padding to accommodate hover effects (scale + translateY)
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '1fr 1fr 1fr',
          },
          alignItems: 'stretch',
          minHeight: 0,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Build Your Setlist Card (Service Creation CTA, with Note Trail Animation) */}
        <Box
          sx={{
            animation: 'fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1)',
            '@keyframes fadeInCard': {
              '0%': { opacity: 0, transform: 'scale(0.97) translateY(16px)' },
              '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
            },
            gridColumn: '1',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            overflow: 'visible',
            boxSizing: 'border-box',
          }}
        >
          <Tooltip title="Make a new service or bundle existing services" arrow>
            <Card
              tabIndex={0}
              role="button"
              aria-label="Build Your Setlist"
              onClick={() => {
                // Only show popover if user is authenticated and has creative role
                if (isAuthenticated && userProfile?.roles.includes('creative')) {
                  setServiceCreationOpen(true);
                } else if (!isAuthenticated) {
                  openAuth();
                }
              }}
              sx={{
                position: 'relative',
                height: '100%',
                width: '100%',
                maxWidth: '100%',
                minHeight: { xs: 80, sm: 210 },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'column' },
                alignItems: 'center',
                justifyContent: 'flex-start',
                borderRadius: 1.2,
                boxShadow: '0 2px 8px 0 rgba(122,95,255,0.07), 0 1px 3px 0 rgba(51,155,255,0.05)',
                cursor: 'pointer',
                p: 0,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #f7f7fb 0%, #e9eaf6 100%)',
                border: '2.5px dashed #b7aaff',
                borderColor: '#b7aaff',
                transition: 'box-shadow 0.22s, transform 0.22s, border 0.22s, background 0.22s',
                outline: 'none',
                pt: { xs: 0.7, sm: 2.2 },
                pb: { xs: 0.7, sm: 2.2 },
                px: { xs: 0.7, sm: 2.2 },
                boxSizing: 'border-box',
                '&:hover, &:focus': {
                  boxShadow: '0 0 0 4px rgba(122,95,255,0.09), 0 4px 16px 0 rgba(51,155,255,0.07)',
                  transform: 'translateY(-3px)',
                  borderColor: '#7A5FFF',
                  background: 'linear-gradient(135deg, #f3f6ff 0%, #e3eafc 100%)',
                },
              }}
            >
              {/* Background overlays: stylized waveform only */}
              <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 38, left: 0, width: '100%', opacity: 0.20 }}>
                  <svg width="100%" height="90" viewBox="0 0 240 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '90px' }}>
                    {/* Wider, more expansive jagged waveform */}
                    <polyline points="0,70 15,30 30,85 45,18 60,88 75,44 90,89 105,24 120,78 135,12 150,84 165,36 180,70 195,30 210,85 225,18 240,70" stroke="#7A5FFF" strokeWidth="3.2" fill="none" opacity="0.45" />
                  </svg>
                </Box>
              </Box>
              {/* Corner badge: Service or Bundle with icon */}
              <Box sx={{
                position: 'absolute',
                top: { xs: 6, sm: 12 },
                right: { xs: 6, sm: 12 },
                zIndex: 2,
                background: 'linear-gradient(90deg, #FFCD38 0%, #b7aaff 100%)',
                color: '#23243a',
                fontWeight: 700,
                fontSize: { xs: '0.60rem', sm: '0.72rem' },
                px: { xs: 0.8, sm: 1.5 },
                py: { xs: 0.15, sm: 0.3 },
                borderRadius: 0.7,
                boxShadow: '0 1px 4px 0 rgba(122,95,255,0.10)',
                letterSpacing: '0.03em',
                opacity: 0.93,
                display: 'flex',
                alignItems: 'center',
                pr: { xs: 0.5, sm: 1 },
              }}>
                {/* Layers icon (Lucide/MUI) */}
                <svg width={window.innerWidth < 600 ? 11 : 15} height={window.innerWidth < 600 ? 11 : 15} viewBox="0 0 24 24" fill="none" stroke="#7A5FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: window.innerWidth < 600 ? 2 : 4, marginTop: window.innerWidth < 600 ? -0.5 : -1 }}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                Service or Bundle
              </Box>
              {/* Main Content */}
              <Box sx={{ zIndex: 1, width: '100%', display: 'flex', flexDirection: { xs: 'column', sm: 'column' }, alignItems: 'center', justifyContent: 'center', flexGrow: 1, pt: { xs: 0.5, sm: 4 }, pb: { xs: 0.5, sm: 2.5 }, px: { xs: 0.5, sm: 2 }, position: 'relative' }}>
                {/* Note trail animation container (absolute, pointer-events none) */}
                <Box
                  className="note-trail-container"
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: 38,
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                >
                  {/* Music notes, only animate on hover/focus (prefers-reduced-motion: no-preference) */}
                  <Box
                    className="note-svg note1"
                    sx={{
                      position: 'absolute',
                      left: -8,
                      top: 0,
                      opacity: 0,
                      '@media (hover: hover)': {
                        '.MuiCard-root:hover &, .MuiCard-root:focus &': {
                          animation: 'noteFloat1 1.2s 0.05s both',
                          opacity: 1,
                        },
                      },
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none !important',
                      },
                      zIndex: 2,
                    }}
                  >
                    {/* SVG music note */}
                    <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 20c2 0 3.5-1.5 3.5-3.5V6.5h6V4H9.5V16.5C9.5 18 8 19.5 6 19.5S2.5 18 2.5 16.5 4 13.5 6 13.5" stroke="#7A5FFF" strokeWidth="2" fill="#b7aaff" fillOpacity="0.18" />
                    </svg>
                  </Box>
                  <Box
                    className="note-svg note2"
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: 6,
                      opacity: 0,
                      '@media (hover: hover)': {
                        '.MuiCard-root:hover &, .MuiCard-root:focus &': {
                          animation: 'noteFloat2 1.25s 0.18s both',
                          opacity: 1,
                        },
                      },
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none !important',
                      },
                      zIndex: 2,
                    }}
                  >
                    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 18c1.5 0 2.5-1.2 2.5-2.7V5.5h5V3.5H7.5V15.3C7.5 16.5 6.5 17.7 5 17.7S2.5 16.5 2.5 15.3 3.5 13.5 5 13.5" stroke="#7A5FFF" strokeWidth="1.7" fill="#b7aaff" fillOpacity="0.13" />
                    </svg>
                  </Box>
                  <Box
                    className="note-svg note3"
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 16,
                      opacity: 0,
                      '@media (hover: hover)': {
                        '.MuiCard-root:hover &, .MuiCard-root:focus &': {
                          animation: 'noteFloat3 1.1s 0.32s both',
                          opacity: 1,
                        },
                      },
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none !important',
                      },
                      zIndex: 2,
                    }}
                  >
                    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 16c1.2 0 2-1 2-2.2V4.5h4V2.5H6V13.8C6 15 5.2 16 4 16S2 15 2 13.8 2.8 12.5 4 12.5" stroke="#7A5FFF" strokeWidth="1.3" fill="#b7aaff" fillOpacity="0.10" />
                    </svg>
                  </Box>
                  {/* Keyframes for note float */}
                  <style>{`
                    @keyframes noteFloat1 {
                      0% { opacity: 0; transform: translateY(0) translateX(0) scale(1); }
                      10% { opacity: 0.7; }
                      60% { opacity: 1; transform: translateY(-30px) translateX(-8px) scale(1.08); }
                      100% { opacity: 0; transform: translateY(-48px) translateX(-16px) scale(1.12); }
                    }
                    @keyframes noteFloat2 {
                      0% { opacity: 0; transform: translateY(0) translateX(0) scale(1); }
                      10% { opacity: 0.7; }
                      60% { opacity: 1; transform: translateY(-32px) translateX(10px) scale(1.10); }
                      100% { opacity: 0; transform: translateY(-54px) translateX(18px) scale(1.13); }
                    }
                    @keyframes noteFloat3 {
                      0% { opacity: 0; transform: translateY(0) translateX(0) scale(1); }
                      10% { opacity: 0.7; }
                      60% { opacity: 1; transform: translateY(-28px) translateX(0px) scale(1.07); }
                      100% { opacity: 0; transform: translateY(-44px) translateX(-6px) scale(1.10); }
                    }
                  `}</style>
                </Box>
                {/* Central icon: checklist with floating + icons, smaller and spaced */}
                <Box sx={{ mt: 0.5, mb: 2.2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'transform 0.18s' }}>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2.2,
                      background: 'linear-gradient(135deg, #fff 60%, #b7aaff 100%)',
                      boxShadow: '0 2px 16px 0 rgba(122,95,255,0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #b7aaff',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.18s, transform 0.18s',
                      animation: 'setlistIconBounce 1.5s infinite cubic-bezier(0.4,0,0.2,1)',
                      '@media (hover: hover)': {
                        '.MuiCard-root:hover &, .MuiCard-root:focus &': {
                          animation: 'setlistIconBounce 1.5s infinite cubic-bezier(0.4,0,0.2,1), setlistIconSpin 0.7s cubic-bezier(0.4,0,0.2,1) 1',
                        },
                      },
                      '@keyframes setlistIconBounce': {
                        '0%': { boxShadow: '0 0 0 0 rgba(183,170,255,0.13), 0 2px 16px 0 rgba(122,95,255,0.10)', transform: 'scale(1) rotate(0deg)' },
                        '60%': { boxShadow: '0 0 0 12px rgba(183,170,255,0.10), 0 2px 16px 0 rgba(122,95,255,0.10)', transform: 'scale(1.06) rotate(-2deg)' },
                        '100%': { boxShadow: '0 0 0 0 rgba(183,170,255,0.13), 0 2px 16px 0 rgba(122,95,255,0.10)', transform: 'scale(1) rotate(0deg)' },
                      },
                      '@keyframes setlistIconSpin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  >
                    {/* Checklist icon */}
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="6" y="6" width="20" height="20" rx="5" fill="#b7aaff" />
                      <path d="M11 16l3 3 7-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {/* Floating + icons */}
                    <Box sx={{ position: 'absolute', top: 2, right: 2, background: '#fff', borderRadius: '50%', width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px 0 rgba(122,95,255,0.10)', border: '1.2px solid #b7aaff', fontSize: 10, color: '#b7aaff', fontWeight: 700 }}>+</Box>
                    <Box sx={{ position: 'absolute', bottom: 2, left: 2, background: '#fff', borderRadius: '50%', width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px 0 rgba(122,95,255,0.10)', border: '1px solid #b7aaff', fontSize: 8, color: '#b7aaff', fontWeight: 700 }}>+</Box>
                  </Box>
                </Box>
                {/* Title and subtitle */}
                <Box sx={{ mt: { xs: 0.5, sm: 1.2 }, mb: { xs: 0.2, sm: 0.5 }, width: '100%', display: 'flex', flexDirection: { xs: 'column', sm: 'column' }, alignItems: { xs: 'center', sm: 'center' }, textAlign: { xs: 'center', sm: 'center' } }}>
                  <span style={{ fontWeight: 900, fontSize: window.innerWidth < 600 ? '1rem' : '1.18rem', color: '#7A5FFF', letterSpacing: '0.01em', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(122,95,255,0.10)' }}>
                    Click to create a new service or bundle
                  </span>
                </Box>
              </Box>
            </Card>
          </Tooltip>
        </Box>
        {/* Service and Bundle Cards */}
        {servicesLoading ? (
          // Show skeleton loaders while loading
          Array.from({ length: 6 }).map((_, idx) => (
            <Box
              key={`skeleton-${idx}`}
              sx={{
                animation: `fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1) ${(idx + 1) * 0.07}s both`,
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                overflow: 'visible',
                boxSizing: 'border-box',
              }}
            >
              <Card
                sx={{
                  height: '100%',
                  width: '100%',
                  maxWidth: '100%',
                  minHeight: { xs: 135, sm: 170 },
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 1,
                  boxShadow: '0px 1.5px 6px rgba(59,130,246,0.05)',
                  p: { xs: 1.2, sm: 1.6 },
                  backgroundColor: 'background.paper',
                  boxSizing: 'border-box',
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, width: '100%' }}>
                  {/* Top row: Title + Menu skeleton */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, minWidth: 0, width: '100%' }}>
                    <Box sx={{ mb: 1, flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, minWidth: 0 }}>
                        <Skeleton variant="circular" width={14} height={14} />
                        <Skeleton variant="text" width="60%" height={24} />
                      </Box>
                      <Skeleton variant="text" width="40%" height={16} sx={{ mb: 0.5 }} />
                      <Skeleton variant="rectangular" width={50} height={4} sx={{ borderRadius: '2px', mt: 0.5 }} />
                    </Box>
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                  
                  {/* Description skeleton */}
                  <Box sx={{ flex: 1, mb: 2 }}>
                    <Skeleton variant="text" width="100%" height={16} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="90%" height={16} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="75%" height={16} />
                  </Box>
                  
                  {/* Bottom row: Price and delivery skeleton */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Skeleton variant="text" width={60} height={20} />
                      <Skeleton variant="text" width={80} height={16} />
                    </Box>
                    <Skeleton variant="rectangular" width={24} height={24} sx={{ borderRadius: 1 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))
        ) : (
          sortedItems.map((item, idx) => (
            <Box
              key={`${item.type}-${item.data.id}-${animationKey}`}
              sx={{
                animation: `fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1) ${(idx + 1) * 0.07}s both`,
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                overflow: 'visible',
                boxSizing: 'border-box',
              }}
            >
              {item.type === 'service' ? (
                <ServiceCard
                  title={item.data.title}
                  description={item.data.description}
                  price={item.data.price}
                  delivery={item.data.delivery_time}
                  status={item.data.status}
                  creative={creativeProfile?.display_name || userProfile?.name || 'Unknown Creative'}
                  onEdit={() => handleEditService(item.data)}
                  onDelete={() => handleDeleteService(item.data)}
                  color={item.data.color}
                  showMenu={true}
                  onClick={() => handleServiceClick(item.data)}
                  requires_booking={item.data.requires_booking}
                />
              ) : (
                <BundleCard
                  bundle={item.data}
                  creative={creativeProfile?.display_name || userProfile?.name || 'Unknown Creative'}
                  showMenu={true}
                  onEdit={() => handleEditBundle(item.data)}
                  onDelete={() => handleDeleteBundle(item.data)}
                  onClick={() => handleBundleClick(item.data)}
                />
              )}
            </Box>
          ))
        )}
      </Box>

      {/* Service Creation Popover */}
      <ServiceCreationPopover
        open={serviceCreationOpen}
        onClose={() => setServiceCreationOpen(false)}
        onCreateService={() => {
          setServiceCreationOpen(false);
          setServiceFormOpen(true);
        }}
        onCreateBundle={() => {
          setServiceCreationOpen(false);
          setBundleCreationOpen(true);
        }}
      />

      {/* Service Form Popover */}
      <ServiceFormPopover
        open={serviceFormOpen}
        onClose={() => {
          setServiceFormOpen(false);
          setEditingService(null); // Clear editing state when closing
        }}
        onBack={() => {
          setServiceFormOpen(false);
          setEditingService(null); // Clear editing state when going back
          setServiceCreationOpen(true);
        }}
        onSubmit={async () => {
          // Service creation is handled in ServiceFormPopover
          // This callback is called after successful creation
          await refreshServices();
          setServiceFormOpen(false);
          setEditingService(null);
        }}
        mode={editingService ? 'edit' : 'create'}
        creativeProfile={creativeProfile}
        initialService={editingService ? {
          id: editingService.id,
          title: editingService.title,
          description: editingService.description,
          price: editingService.price,
          delivery_time: editingService.delivery_time,
          status: editingService.status,
          color: editingService.color,
          payment_option: editingService.payment_option,
          split_deposit_amount: editingService.split_deposit_amount,
          photos: editingService.photos || [],
          requires_booking: editingService.requires_booking,
          calendar_settings: editingService.calendar_settings,
        } : null}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Service"
        itemName={serviceToDelete?.title}
        description="This will remove the service from your profile. You can always create a new service later."
        isDeleting={isDeleting}
      />

      {/* Bundle Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={bundleDeleteDialogOpen}
        onClose={handleCancelBundleDelete}
        onConfirm={handleConfirmBundleDelete}
        title="Delete Bundle"
        itemName={bundleToDelete?.title}
        description="This will remove the bundle from your profile. You can always create a new bundle later."
        isDeleting={isDeletingBundle}
      />

      {/* Bundle Creation Popover */}
      <BundleCreationPopover
        open={bundleCreationOpen}
        onClose={() => {
          setBundleCreationOpen(false);
          setEditingBundle(null);
        }}
        onBack={() => {
          setBundleCreationOpen(false);
          setEditingBundle(null);
          setServiceCreationOpen(true);
        }}
        onBundleCreated={(bundle) => {
          console.log('Bundle created/updated:', bundle);
          refreshServices();
          setEditingBundle(null);
        }}
        editingBundle={editingBundle}
      />

      {/* Service Detail Popover */}
      <ServicesDetailPopover
        open={serviceDetailOpen}
        onClose={handleServiceDetailClose}
        service={selectedService}
        context="services-tab"
      />

      {/* Bundle Detail Popover */}
      <BundleDetailPopover
        open={bundleDetailOpen}
        onClose={handleBundleDetailClose}
        bundle={selectedBundle}
        context="services-tab"
      />
    </Box>
  );
} 
