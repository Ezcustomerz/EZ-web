import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Star,
  LocationOn,
  ContactPhone,
  Visibility,
  Edit,
  Share,
} from '@mui/icons-material';
import { SessionPopover } from '../../../components/popovers/creative/ServicePopover';
import { ReviewPopover } from '../../../components/popovers/creative/ReviewPopover';
import { ServicesDetailPopover } from '../../../components/popovers/ServicesDetailPopover';
import { BundleDetailPopover } from '../../../components/popovers/BundleDetailPopover';
import { ServiceCardSimple } from '../../../components/cards/creative/ServiceCard';
import { InviteClientPopover } from '../../../components/popovers/creative/InviteClientPopover';
import { CreativeSettingsPopover } from '../../../components/popovers/creative/CreativeSettingsPopover';
import { userService, type CreativeProfile, type CreativeService, type CreativeBundle } from '../../../api/userService';
import { BundleCard } from '../../../components/cards/creative/BundleCard';
import { useInviteClient } from '../../../hooks/useInviteClient';
import { useAuth } from '../../../context/auth';

// Mock data for reviews
const MOCK_REVIEWS = [
  {
    id: 1,
    reviewerName: "Sarah Johnson",
    reviewerAvatar: null,
    rating: 5,
    review: "Absolutely amazing work! The mixing quality is professional grade and the turnaround time was incredible. Will definitely work with again.",
    service: "Mixing",
    date: "2024-01-15"
  },
  {
    id: 2,
    reviewerName: "Mike Chen",
    reviewerAvatar: null,
    rating: 4,
    review: "Great mastering service. The track sounds much more polished and radio-ready. Only giving 4 stars because the initial communication could have been faster.",
    service: "Mastering",
    date: "2024-01-10"
  },
  {
    id: 3,
    reviewerName: "Alex Rivera",
    reviewerAvatar: null,
    rating: 5,
    review: "Incredible vocal tuning work! You can barely tell it was processed, which is exactly what I wanted. The attention to detail is outstanding.",
    service: "Vocal Tuning",
    date: "2024-01-08"
  },
  {
    id: 4,
    reviewerName: "Emma Davis",
    reviewerAvatar: null,
    rating: 5,
    review: "Full production package was worth every penny. From the initial concept to the final mix, everything was handled professionally. The final product exceeded my expectations.",
    service: "Full Production",
    date: "2024-01-05"
  },
  {
    id: 5,
    reviewerName: "David Kim",
    reviewerAvatar: null,
    rating: 4,
    review: "Solid beat making skills. The track has great energy and the mix is clean. Would have given 5 stars but the genre wasn't exactly what I was looking for.",
    service: "Beat Making",
    date: "2024-01-03"
  },
  {
    id: 6,
    reviewerName: "Lisa Thompson",
    reviewerAvatar: null,
    rating: 5,
    review: "Session guitar work was phenomenal! The playing style perfectly matched the song's vibe and the recording quality is studio-grade. Highly recommend!",
    service: "Session Guitar",
    date: "2024-01-01"
  }
];

export interface Review {
  id: number;
  reviewerName: string;
  reviewerAvatar: string | null;
  rating: number;
  review: string;
  service: string;
  date: string;
}

export interface ProfileTabProps {
  creativeProfile?: CreativeProfile | null;
  isActive?: boolean;
  onSwitchToServicesTab?: () => void;
}

export function ProfileTab({ creativeProfile: propCreativeProfile, isActive = true, onSwitchToServicesTab }: ProfileTabProps = {}) {
  const { isAuthenticated, openAuth } = useAuth();
  const [servicesOpen, setServicesOpen] = useState(false);

  const handleServiceClick = (service: CreativeService) => {
    // Add creative profile information to the service object
    const serviceWithCreative = {
      ...service,
      creative_display_name: creativeProfile?.display_name,
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
      creative_display_name: creativeProfile?.display_name,
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

  const handleEditClick = () => {
    if (isAuthenticated) {
      setSettingsOpen(true);
    } else {
      openAuth();
    }
  };
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [creativeProfile, setCreativeProfile] = useState<CreativeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [services, setServices] = useState<CreativeService[]>([]);
  const [bundles, setBundles] = useState<CreativeBundle[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const { inviteClientOpen, handleInviteClient, closeInviteClient } = useInviteClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<CreativeService | null>(null);
  const [bundleDetailOpen, setBundleDetailOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<CreativeBundle | null>(null);

  // Use creative profile from props (passed from LayoutCreative)
  useEffect(() => {
    // Always show loading initially, then update when profile is available
    if (propCreativeProfile) {
      // Add a delay to show skeleton loaders briefly for better UX
      // This ensures users see the loading animation even if data loads quickly
      const timer = setTimeout(() => {
        setCreativeProfile(propCreativeProfile);
        setProfileLoading(false);
        setProfileError(null);
      }, 800); // Delay to show loading state - ensures skeleton is visible
      return () => clearTimeout(timer);
    } else {
      // If no prop provided, keep loading state
      setProfileLoading(true);
      setProfileError(null);
    }
  }, [propCreativeProfile]);

  // Consolidated services fetching logic
  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      
      // Only fetch services if user is authenticated
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping services fetch');
        setServices([]);
        setBundles([]);
        setServicesLoading(false);
        return;
      }
      
      const response = await userService.getCreativeServices();
      
      // Only show active and public services
      const activeServices = response.services.filter(service => 
        service.is_active && 
        service.status === 'Public'
      );
      setServices(activeServices);
      
      // Only show active and public bundles
      const activeBundles = response.bundles.filter(bundle => 
        bundle.is_active && 
        bundle.status === 'Public'
      );
      setBundles(activeBundles);
    } catch (error) {
      console.error('Failed to fetch creative services and bundles:', error);
      setServices([]);
      setBundles([]);
    } finally {
      setServicesLoading(false);
    }
  };

  // Fetch services on initial load and when tab becomes active
  useEffect(() => {
    if (isActive) {
      if (isAuthenticated) {
        fetchServices();
      } else {
        // If not authenticated, set loading to false and empty arrays
        setServicesLoading(false);
        setServices([]);
        setBundles([]);
      }
    }
  }, [isActive, isAuthenticated]);

  // Refresh services when profile is updated
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchServices();
    }
  }, [refreshTrigger]);

  // Listen for profile updates from settings popover
  useEffect(() => {
    const handleProfileUpdate = () => {
      // Trigger a refresh by updating the refresh trigger
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('creativeProfileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('creativeProfileUpdated', handleProfileUpdate);
    };
  }, []);

  // Note: Removed parent-controlled dialog logic that was interfering with SessionPopover
  // The SessionPopover should be independent of the parent's seeAllDialogOpen state

  // Show loading state - only if tab is active
  if (profileLoading && isActive) {
    return (
      <Box sx={{
        height: { xs: '100vh', md: '100vh' },
        py: { xs: 0.5, md: 2 },
        overflow: { xs: 'auto', md: 'hidden' },
        overflowX: 'hidden',
        display: 'block',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        mx: 0,
        px: 0,
        animation: 'fadeIn 0.5s ease-in',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}>
        <Container 
          maxWidth="lg" 
          sx={{ 
            px: { xs: 1, sm: 1.5, md: 3 },
            minHeight: 265,
            width: '100%',
            maxWidth: { xs: '100%', md: '1200px' },
            boxSizing: 'border-box',
            mx: 'auto',
            '&.MuiContainer-root': {
              paddingLeft: { xs: '8px !important', sm: '12px !important', md: '24px !important' },
              paddingRight: { xs: '8px !important', sm: '12px !important', md: '24px !important' }
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            gap: { xs: 1, md: 4 },
            alignItems: { xs: 'stretch', md: 'stretch' },
            height: '100%',
            overflow: 'visible',
            pb: { xs: 20, md: 0 },
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            minWidth: 0
          }}>
            {/* Left Column - Profile Card Skeleton */}
            <Box sx={{ 
              width: { xs: '100%', md: '33.333%' },
              minWidth: 0,
              maxWidth: { xs: '100%', md: '33.333%' },
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              flexShrink: 0,
              flexGrow: 0
            }}>
              <Card sx={{ 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                borderRadius: 3,
                position: { xs: 'relative', md: 'sticky' },
                top: { xs: 0, md: 24 },
                height: { xs: 'auto', md: '100%' },
                minHeight: { xs: 'auto', md: '100%' },
                maxHeight: { xs: 'none', md: '100%' },
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                overflow: 'hidden',
                mx: 0,
                mb: { xs: 2, md: 0 }
              }}>
                {/* Profile Header Skeleton */}
                <Box sx={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  pt: { xs: 1.5, sm: 2, md: 3 },
                  pb: { xs: 1.5, sm: 2, md: 3 },
                  px: { xs: 1.5, sm: 2, md: 3 },
                  textAlign: 'center',
                  position: 'relative',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24
                }}>
                  {/* Action Buttons Skeleton */}
                  <Box sx={{ 
                    position: 'absolute',
                    top: { xs: 8, md: 16 },
                    right: { xs: 8, md: 16 },
                    display: 'flex',
                    gap: { xs: 0.5, md: 1 },
                  }}>
                    <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                    <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                  </Box>
                  
                  {/* Avatar Skeleton */}
                  <Skeleton 
                    variant="circular" 
                    width={100} 
                    height={100} 
                    sx={{ 
                      mx: 'auto', 
                      mb: { xs: 1, md: 2 },
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                    }} 
                  />
                  
                  {/* Name Skeleton */}
                  <Skeleton 
                    variant="text" 
                    width="60%" 
                    height={32} 
                    sx={{ 
                      mx: 'auto', 
                      mb: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                    }} 
                  />
                  
                  {/* Title Skeleton */}
                  <Skeleton 
                    variant="text" 
                    width="50%" 
                    height={24} 
                    sx={{ 
                      mx: 'auto',
                      bgcolor: 'rgba(255, 255, 255, 0.25)',
                    }} 
                  />
                </Box>

                {/* Profile Content Skeleton */}
                <CardContent sx={{ 
                  pt: { xs: 1.5, sm: 2, md: 3 },
                  pb: { xs: 2, sm: 2.5, md: 3 },
                  px: { xs: 1.5, sm: 2, md: 3 },
                  flex: { xs: '0 1 auto', md: 1 },
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Stats Skeleton */}
                  <Box sx={{ mb: { xs: 1.5, md: 2 } }}>
                    {[1, 2, 3].map((i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: { xs: 1, md: 1.5 } }}>
                        <Skeleton variant="circular" width={20} height={20} />
                        <Skeleton variant="text" width="70%" height={20} />
                      </Box>
                    ))}
                  </Box>

                  {/* Profile Highlights Skeleton */}
                  <Box sx={{ 
                    p: { xs: 0.75, sm: 1, md: 1 }, 
                    pb: { xs: 1.5, sm: 2, md: 3 },
                    bgcolor: 'grey.50', 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}>
                    <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
                    {[1, 2, 3].map((i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: i < 3 ? 0.5 : 0 }}>
                        <Skeleton variant="text" width="45%" height={16} />
                        <Skeleton variant="text" width="30%" height={16} />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Right Column - About & Services Skeleton */}
            <Box sx={{ 
              width: { xs: '100%' },
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              {/* About Section Skeleton */}
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                borderRadius: 3,
                minHeight: '155px',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="95%" height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="85%" height={20} />
                </CardContent>
              </Card>

              {/* Services Section Skeleton */}
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                borderRadius: 3,
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Skeleton variant="text" width="40%" height={28} />
                    <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    gap: 2,
                    minHeight: 265
                  }}>
                    {/* Service Card Skeletons */}
                    {[1, 2].map((i) => (
                      <Box key={i} sx={{ 
                        width: { xs: '100%', sm: '50%' },
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <Card sx={{ 
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                          borderRadius: 2,
                          height: '100%',
                        }}>
                          <CardContent sx={{ p: 2 }}>
                            <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1, mb: 2 }} />
                            <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
                            <Skeleton variant="text" width="100%" height={16} sx={{ mb: 0.5 }} />
                            <Skeleton variant="text" width="80%" height={16} sx={{ mb: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                              <Skeleton variant="text" width="30%" height={20} />
                              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  // Don't render anything if tab is not active
  if (!isActive) {
    return null;
  }

  // Show error state - only if tab is active
  if (profileError || !creativeProfile) {
    return (
      <Box sx={{
        height: { xs: '100vh', md: 'auto' },
        minHeight: { xs: '100vh', md: '100vh' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6" color="error">
          {profileError || 'Failed to load profile'}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{
        height: { xs: '100vh', md: '100vh' },
        py: { xs: 0.5, md: 2 },
        overflow: { xs: 'auto', md: 'hidden' },
        overflowX: 'hidden',
        display: isActive ? 'block' : 'none',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        mx: 0,
        px: 0,
        animation: 'pageSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        '@keyframes pageSlideIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}>
        <Container 
          maxWidth="lg" 
          sx={{ 
            px: { xs: 1, sm: 1.5, md: 3 },
            minHeight: 265,
            width: '100%',
            maxWidth: { xs: '100%', md: '1200px' },
            boxSizing: 'border-box',
            mx: 'auto',
            '&.MuiContainer-root': {
              paddingLeft: { xs: '8px !important', sm: '12px !important', md: '24px !important' },
              paddingRight: { xs: '8px !important', sm: '12px !important', md: '24px !important' }
            }
          }}
        >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: { xs: 1, md: 4 },
          alignItems: { xs: 'stretch', md: 'stretch' },
          height: '100%',
          overflow: 'visible',
          pb: { xs: 20, md: 0 },
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          minWidth: 0
        }}>
          {/* Left Column - Profile Info */}
          <Box sx={{ 
            width: { xs: '100%', md: '33.333%' },
            minWidth: 0,
            maxWidth: { xs: '100%', md: '33.333%' },
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            flexShrink: 0,
            flexGrow: 0
          }}>
            <Card sx={{ 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              borderRadius: 3,
              position: { xs: 'relative', md: 'sticky' },
              top: { xs: 0, md: 24 },
              height: { xs: 'auto', md: '100%' },
              minHeight: { xs: 'auto', md: '100%' },
              maxHeight: { xs: 'none', md: '100%' },
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflow: 'hidden',
              mx: 0,
              mb: { xs: 2, md: 0 }
            }}>
              {/* Profile Header */}
              <Box sx={{
                background: creativeProfile.avatar_background_color 
                  ? `linear-gradient(135deg, ${creativeProfile.avatar_background_color} 0%, ${creativeProfile.avatar_background_color}CC 100%)`
                  : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: 'white',
                pt: { xs: 1.5, sm: 2, md: 3 },
                pb: { xs: 1.5, sm: 2, md: 3 },
                px: { xs: 1.5, sm: 2, md: 3 },
                textAlign: 'center',
                position: 'relative',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'visible',
                mx: 0,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24
              }}>
                {/* Action Buttons */}
                <Box sx={{ 
                  position: 'absolute',
                  top: { xs: 8, md: 16 },
                  right: { xs: 8, md: 16 },
                  display: 'flex',
                  gap: { xs: 0.5, md: 1 },
                  flexShrink: 0
                }}>
                  <Button
                    variant="outlined"
                    onClick={handleInviteClient}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      minWidth: 'auto',
                      width: { xs: 36, md: 40 },
                      height: { xs: 36, md: 40 },
                      p: 0,
                      flexShrink: 0,
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      }
                    }}
                  >
                    <Share sx={{ fontSize: { xs: 18, md: 24 } }} />
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleEditClick}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      minWidth: 'auto',
                      width: { xs: 36, md: 40 },
                      height: { xs: 36, md: 40 },
                      p: 0,
                      flexShrink: 0,
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      }
                    }}
                  >
                    <Edit sx={{ fontSize: { xs: 18, md: 24 } }} />
                  </Button>
                </Box>
                <Avatar
                  src={creativeProfile.profile_banner_url || undefined}
                  sx={{
                    width: { xs: 60, sm: 80, md: 100 },
                    height: { xs: 60, sm: 80, md: 100 },
                    mx: 'auto',
                    mb: { xs: 1, md: 2 },
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    flexShrink: 0
                  }}
                >
                  {creativeProfile.display_name?.charAt(0) || 'C'}
                </Avatar>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  gutterBottom
                  sx={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {creativeProfile.display_name}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    opacity: 0.9, 
                    mb: 1,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {creativeProfile.title}
                </Typography>
              </Box>

              <CardContent sx={{ 
                pt: { xs: 1.5, sm: 2, md: 3 },
                pb: { xs: 2, sm: 2.5, md: 3 },
                px: { xs: 1.5, sm: 2, md: 3 },
                flex: { xs: '0 1 auto', md: 1 },
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'visible',
                mx: 0,
                '&.MuiCardContent-root': {
                  paddingLeft: { xs: '12px !important', sm: '16px !important', md: '24px !important' },
                  paddingRight: { xs: '12px !important', sm: '16px !important', md: '24px !important' },
                  paddingTop: { xs: '12px !important', sm: '16px !important', md: '24px !important' },
                  paddingBottom: { xs: '16px !important', sm: '20px !important', md: '24px !important' }
                }
              }}>
                {/* Profile Stats */}
                <Box sx={{ mb: { xs: 1.5, md: 2 }, minWidth: 0, width: '100%', flex: '0 1 auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: { xs: 1, md: 1.5 }, minWidth: 0, width: '100%', gap: 0.5 }}>
                    <Star sx={{ color: 'warning.main', fontSize: { xs: 16, md: 20 }, flexShrink: 0, mt: 0.2 }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        flex: 1,
                        minWidth: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      No ratings yet
                    </Typography>
                    {/* Hide View All button when showing "No ratings yet" */}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: { xs: 1, md: 1.5 }, minWidth: 0, width: '100%', gap: 0.5 }}>
                    <LocationOn sx={{ color: 'text.secondary', fontSize: { xs: 16, md: 20 }, flexShrink: 0, mt: 0.2 }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {creativeProfile.availability_location || 'Availability not set'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: { xs: 1.5, md: 2 }, minWidth: 0, width: '100%', gap: 0.5 }}>
                    <ContactPhone sx={{ color: 'text.secondary', fontSize: { xs: 16, md: 20 }, flexShrink: 0, mt: 0.2 }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {creativeProfile.primary_contact || 'Contact not set'}
                    </Typography>
                  </Box>

                  {/* Profile Highlights */}
                  <Box sx={{ 
                    p: { xs: 0.75, sm: 1, md: 1 }, 
                    pb: { xs: 1.5, sm: 2, md: 3 },
                    mb: 0,
                    mt: { xs: 0.5, md: 0 },
                    bgcolor: 'grey.50', 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: 'grey.200',
                    minWidth: 0,
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflow: 'visible'
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600} 
                      gutterBottom 
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        mb: { xs: 0.5, md: 1 }
                      }}
                    >
                      Profile Highlights
                    </Typography>
                    {creativeProfile.profile_highlights && creativeProfile.profile_highlights.length > 0 ? (
                      creativeProfile.profile_highlights.map((highlight, index) => {
                        let value = 'Not set';
                        
                        // Use custom values from profile_highlight_values for all highlights
                        const statKey = highlight.replace(/\s+/g, '').toLowerCase();
                        value = creativeProfile.profile_highlight_values?.[statKey] || 'Not set';
                        
                        return (
                          <Box 
                            key={highlight} 
                            sx={{ 
                              display: 'flex', 
                              flexDirection: { xs: 'column', sm: 'row' },
                              justifyContent: 'space-between', 
                              mb: index < creativeProfile.profile_highlights!.length - 1 ? 0.5 : 0,
                              gap: { xs: 0.25, sm: 1 },
                              minWidth: 0,
                              width: '100%'
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                flex: 1,
                                minWidth: 0,
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word'
                              }}
                            >
                              {highlight}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight={600} 
                              sx={{ 
                                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                flexShrink: 0,
                                textAlign: { xs: 'left', sm: 'right' },
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                maxWidth: { xs: '100%', sm: '60%' }
                              }}
                            >
                              {value}
                            </Typography>
                          </Box>
                        );
                      })
                    ) : (
                      // Fallback to default display if no highlights are configured
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.7rem' }, 
                          fontStyle: 'italic',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          lineHeight: 1.4
                        }}
                      >
                        No profile highlights configured yet. Use the edit button to customize your profile highlights.
                      </Typography>
                    )}
                  </Box>
                </Box>

              </CardContent>
            </Card>
          </Box>

          {/* Right Column - Services & Info */}
          <Box sx={{ 
            width: { xs: '100%' },
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1
              
            }}>
              {/* About Section */}
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                borderRadius: 3,
                display: 'flex',
                minHeight: '155px',
                flexDirection: 'column',
                position: 'relative'
              }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    About {creativeProfile.display_name}
                  </Typography>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pb: 3 }}>
                    {creativeProfile.description ? (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          lineHeight: 1.6, 
                          flex: 1,
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {creativeProfile.description}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ 
                          mt: 1,
                          textAlign: 'right',
                          fontSize: '0.7rem'
                        }}>
                          {creativeProfile.description.length}/500 characters
                        </Typography>
                      </>
                    ) : (
                      <Box sx={{ 
                        flex: 1,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center' }}>
                          No description available yet. Add a description to tell clients about yourself and your services.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Services Section */}
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Available Services
                    </Typography>
                    {/* Only show View All button if there are more services than displayed (2) */}
                    {services.length > 2 && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => setServicesOpen(true)}
                        sx={{ 
                          fontSize: '0.8rem',
                          py: 0.5,
                          px: 1.5,
                          textTransform: 'none'
                        }}
                      >
                        View All
                      </Button>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {servicesLoading ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' }, 
                        gap: 2,
                        pb: 2,
                        minHeight: 265
                      }}>
                        {/* Service Card Skeletons */}
                        {[1, 2].map((i) => (
                          <Box key={i} sx={{ 
                            width: { xs: '100%', sm: '50%' },
                            display: 'flex',
                            flexDirection: 'column'
                          }}>
                            <Card sx={{ 
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                              borderRadius: 2,
                              height: '100%',
                            }}>
                              <CardContent sx={{ p: 2 }}>
                                <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1, mb: 2 }} />
                                <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
                                <Skeleton variant="text" width="100%" height={16} sx={{ mb: 0.5 }} />
                                <Skeleton variant="text" width="80%" height={16} sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                  <Skeleton variant="text" width="30%" height={20} />
                                  <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                                </Box>
                              </CardContent>
                            </Card>
                          </Box>
                        ))}
                      </Box>
                    ) : services.length === 0 ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        py: 8,
                        gap: 2,
                        minHeight: 265
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                          No services available yet. Add services to showcase your offerings to clients.
                        </Typography>
                        {onSwitchToServicesTab && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={onSwitchToServicesTab}
                            sx={{
                              textTransform: 'none',
                              px: 3,
                              py: 1,
                              borderRadius: 2,
                              fontWeight: 600,
                              position: 'relative',
                              overflow: 'hidden',
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
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: '20%',
                                left: '15%',
                                width: 4,
                                height: 4,
                                background: 'rgba(255,255,255,0.92)',
                                boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                                borderRadius: '50%',
                                transform: 'scale(0)',
                                opacity: 0,
                                transition: 'all 0.2s ease-in-out',
                              },
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: '70%',
                                right: '20%',
                                width: 3,
                                height: 3,
                                background: 'rgba(255,255,255,0.92)',
                                boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                                borderRadius: '50%',
                                transform: 'scale(0)',
                                opacity: 0,
                                transition: 'all 0.2s ease-in-out',
                              },
                              '&:hover, &:focus': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.5)',
                                '&::before': {
                                  animation: 'sparkle 0.8s ease-in-out',
                                },
                                '&::after': {
                                  animation: 'sparkle2 0.8s ease-in-out 0.1s',
                                },
                                '& .spark-element': {
                                  '&:nth-of-type(1)': {
                                    animation: 'sparkle3 0.8s ease-in-out 0.2s',
                                  },
                                  '&:nth-of-type(2)': {
                                    animation: 'sparkle 0.8s ease-in-out 0.3s',
                                  },
                                },
                              },
                            }}
                          >
                            <Box
                              className="spark-element"
                              sx={{
                                position: 'absolute',
                                top: '10%',
                                right: '10%',
                                width: 2,
                                height: 2,
                                background: 'rgba(255,255,255,0.92)',
                                boxShadow: '0 0 4px 1px rgba(255,255,255,0.35)',
                                borderRadius: '50%',
                                transform: 'scale(0)',
                                opacity: 0,
                                transition: 'all 0.2s ease-in-out',
                              }}
                            />
                            <Box
                              className="spark-element"
                              sx={{
                                position: 'absolute',
                                bottom: '15%',
                                left: '25%',
                                width: 2.5,
                                height: 2.5,
                                background: 'rgba(255,255,255,0.92)',
                                boxShadow: '0 0 4px 1px rgba(255,255,255,0.35)',
                                borderRadius: '50%',
                                transform: 'scale(0)',
                                opacity: 0,
                                transition: 'all 0.2s ease-in-out',
                              }}
                            />
                            Add Service
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' }, 
                        gap: 2,
                        pb: 2,
                        minHeight: 265
                      }}>
                        {/* Show configured primary and secondary services/bundles */}
                        {(() => {
                          const primaryId = creativeProfile.primary_service_id;
                          const secondaryId = creativeProfile.secondary_service_id;
                          
                          // Check if configured IDs are services or bundles
                          const primaryService = services.find(s => s.id === primaryId);
                          const secondaryService = services.find(s => s.id === secondaryId);
                          const primaryBundle = bundles.find(b => b.id === primaryId);
                          const secondaryBundle = bundles.find(b => b.id === secondaryId);
                          
                          // Create items array with the configured services/bundles
                          const items = [];
                          
                          if (primaryService) {
                            items.push({ type: 'service', data: primaryService });
                          } else if (primaryBundle) {
                            items.push({ type: 'bundle', data: primaryBundle });
                          }
                          
                          if (secondaryService) {
                            items.push({ type: 'service', data: secondaryService });
                          } else if (secondaryBundle) {
                            items.push({ type: 'bundle', data: secondaryBundle });
                          }
                          
                          // If no configured items, fall back to first 2 services
                          if (items.length === 0) {
                            items.push(...services.slice(0, 2).map(service => ({ type: 'service', data: service })));
                          }
                          
                          return items.map((item) => (
                            <Box key={`${item.type}-${item.data.id}`} sx={{ 
                              width: { xs: '100%', sm: '50%' },
                              display: 'flex',
                              flexDirection: 'column'
                            }}>
                              {item.type === 'service' ? (
                                <ServiceCardSimple
                                  title={item.data.title}
                                  description={item.data.description}
                                  price={(item.data as CreativeService).price}
                                  delivery={(item.data as CreativeService).delivery_time}
                                  color={item.data.color}
                                  creative={creativeProfile.display_name}
                                  onBook={() => handleServiceClick(item.data as CreativeService)}
                                  requires_booking={(item.data as CreativeService).requires_booking}
                                />
                              ) : (
                                <BundleCard
                                  bundle={item.data as CreativeBundle}
                                  creative={creativeProfile.display_name}
                                  showStatus={false}
                                  onClick={() => handleBundleClick(item.data as CreativeBundle)}
                                />
                              )}
                            </Box>
                          ));
                        })()}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
        </Container>
      </Box>

      {/* Popovers - moved outside main container for proper z-index */}
      <SessionPopover
        open={servicesOpen}
        onClose={() => setServicesOpen(false)}
        services={services.map(service => ({
          id: service.id,
          title: service.title,
          description: service.description,
          price: service.price,
          delivery: service.delivery_time,
          color: service.color,
          creative: creativeProfile?.display_name || 'Creative',
          requires_booking: service.requires_booking
        }))}
        bundles={bundles}
        onServiceClick={(service) => {
          // Find the full service object from services array
          const fullService = services.find(s => s.id === service.id);
          if (fullService) {
            handleServiceClick(fullService);
            // Keep SessionPopover open
          }
        }}
        onBundleClick={(bundle) => {
          // Find the full bundle object from bundles array
          const fullBundle = bundles.find(b => b.id === bundle.id);
          if (fullBundle) {
            handleBundleClick(fullBundle);
            // Keep SessionPopover open
          }
        }}
      />

      <ReviewPopover
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        reviews={MOCK_REVIEWS}
      />

      <InviteClientPopover
        open={inviteClientOpen}
        onClose={closeInviteClient}
      />

      <CreativeSettingsPopover
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onProfileUpdated={() => setRefreshTrigger(prev => prev + 1)}
      />

      {/* Service Detail Popover */}
      <ServicesDetailPopover
        open={serviceDetailOpen}
        onClose={handleServiceDetailClose}
        service={selectedService}
        context="profile-tab"
      />

      {/* Bundle Detail Popover */}
      <BundleDetailPopover
        open={bundleDetailOpen}
        onClose={handleBundleDetailClose}
        bundle={selectedBundle}
        context="profile-tab"
      />
    </>
  );
} 