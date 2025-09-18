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
} from '@mui/material';
import {
  Star,
  LocationOn,
  Work,
  ContactPhone,
  Visibility,
  Edit,
} from '@mui/icons-material';
import { SessionPopover } from '../../../components/popovers/creative/ServicePopover';
import { ReviewPopover } from '../../../components/popovers/creative/ReviewPopover';
import { ServiceCardSimple } from '../../../components/cards/creative/ServiceCard';
import { userService, type CreativeProfile, type CreativeService, type CreativeServicesListResponse } from '../../../api/userService';

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
  const [servicesOpen, setServicesOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [creativeProfile, setCreativeProfile] = useState<CreativeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [services, setServices] = useState<CreativeService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Use creative profile from props (passed from LayoutCreative)
  useEffect(() => {
    if (propCreativeProfile) {
      // Use profile from props (already fetched by LayoutCreative)
      setCreativeProfile(propCreativeProfile);
      setProfileLoading(false);
      setProfileError(null);
    } else {
      // If no prop provided, show loading state
      // Don't make API call - let LayoutCreative handle it
      setProfileLoading(true);
      setProfileError(null);
    }
  }, [propCreativeProfile]);

  // Refresh data when tab becomes active
  useEffect(() => {
    if (isActive) {
      // Refresh services when tab becomes active
      const refreshServices = async () => {
        try {
          setServicesLoading(true);
          const response: CreativeServicesListResponse = await userService.getCreativeServices();
          // Only show active, enabled, and public services
          const activeServices = response.services.filter(service => 
            service.is_active && 
            service.is_enabled && 
            service.status === 'Public'
          );
          setServices(activeServices);
        } catch (error) {
          console.error('Failed to refresh creative services:', error);
          // Don't clear services on error, keep existing ones
        } finally {
          setServicesLoading(false);
        }
      };

      refreshServices();
    }
  }, [isActive]);

  // Fetch creative services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const response: CreativeServicesListResponse = await userService.getCreativeServices();
        // Only show active, enabled, and public services
        const activeServices = response.services.filter(service => 
          service.is_active && 
          service.is_enabled && 
          service.status === 'Public'
        );
        setServices(activeServices);
      } catch (error) {
        console.error('Failed to fetch creative services:', error);
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Note: Removed parent-controlled dialog logic that was interfering with SessionPopover
  // The SessionPopover should be independent of the parent's seeAllDialogOpen state

  // Show loading state
  if (profileLoading) {
    return (
      <Box sx={{
        height: { xs: '100vh', md: 'auto' },
        minHeight: { xs: '100vh', md: '100vh' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Show error state
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
        height: { xs: '100vh', md: 'auto' },
        minHeight: { xs: '100vh', md: '100vh' },
        py: { xs: 1, md: 2 },
        overflow: { xs: 'hidden', md: 'visible' },
        display: isActive ? 'block' : 'none'
      }}>
        <Container maxWidth="lg" sx={{ 
          px: { xs: 1, md: 3 },
          height: { xs: '100%', md: 'auto' }
        }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: { xs: 1, md: 4 },
          alignItems: { xs: 'stretch', md: 'flex-start' },
          height: { xs: '100%', md: 'auto' },
          overflow: { xs: 'auto', md: 'visible' },
          pb: { xs: 20, md: 0 }
        }}>
          {/* Left Column - Profile Info */}
          <Box sx={{ 
            width: { xs: '100%', md: '33.333%' },
            minWidth: { md: '300px' }
          }}>
            <Card sx={{ 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              borderRadius: 3,
              position: { xs: 'relative', md: 'sticky' },
              top: { xs: 0, md: 24 }
            }}>
              {/* Profile Header */}
              <Box sx={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: 'white',
                p: 3,
                textAlign: 'center',
                position: 'relative'
              }}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
          sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '0.8rem',
                    py: 0.5,
                    px: 1.5,
              textTransform: 'none',
              '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  Edit
                </Button>
                <Avatar
                  src={creativeProfile.profile_banner_url || undefined}
                  sx={{
                    width: { xs: 80, md: 100 },
                    height: { xs: 80, md: 100 },
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    border: '3px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {creativeProfile.display_name?.charAt(0) || 'C'}
                </Avatar>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {creativeProfile.display_name}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                  {creativeProfile.title}
                </Typography>
              </Box>

              <CardContent sx={{ 
                p: 3
              }}>
                {/* Profile Stats */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Star sx={{ color: 'warning.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                      No ratings yet
                    </Typography>
                    {/* Hide View All button when showing "No ratings yet" */}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <LocationOn sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {creativeProfile.availability_location || 'Availability not set'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Work sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {creativeProfile.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ContactPhone sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {creativeProfile.primary_contact || 'Contact not set'}
                    </Typography>
                  </Box>

                  {/* Quick Stats */}
                  <Box sx={{ 
                    p: 1, 
                    pb: 3,
                    bgcolor: 'grey.50', 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ fontSize: '0.8rem' }}>
                      Quick Stats
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Projects</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                        {creativeProfile.projects_count > 0 ? `${creativeProfile.projects_count}+` : '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Experience</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                        {creativeProfile.experience_years > 0 ? `${creativeProfile.experience_years}+ years` : 'Not set'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Average Response Time</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                        {creativeProfile.average_response_hours > 0 ? `${creativeProfile.average_response_hours}h` : 'Not set'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

              </CardContent>
            </Card>
          </Box>

          {/* Right Column - Services & Info */}
          <Box sx={{ 
            width: { xs: '100%', md: '66.667%' },
            flex: 1
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
                flex: 1,
                minHeight: '200px'
              }}>
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    About {creativeProfile.display_name}
                  </Typography>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {creativeProfile.description ? (
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {creativeProfile.description}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, alignSelf: 'flex-end', display: 'block', textAlign: 'right' }}>
                          {creativeProfile.description.length}/500 characters
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        position: 'relative', 
                        height: '100%', 
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
                flex: 2,
                minHeight: '320px'
              }}>
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                  
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {servicesLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        <CircularProgress size={40} />
                      </Box>
                    ) : services.length === 0 ? (
                      <Box sx={{ 
                        position: 'relative',
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flex: 1,
                        gap: 2
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
                        flex: 1
                      }}>
                        {/* Show up to 2 services */}
                        {services.slice(0, 2).map((service) => (
                          <Box key={service.id} sx={{ 
                            width: { xs: '100%', sm: '50%' },
                            display: 'flex',
                            flexDirection: 'column'
                          }}>
                            <ServiceCardSimple
                              title={service.title}
                              description={service.description}
                              price={service.price}
                              delivery={service.delivery_time}
                              color={service.color}
                              creative={creativeProfile.display_name}
                            />
                          </Box>
                        ))}
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
          creative: creativeProfile?.display_name || 'Creative'
        }))}
      />

      <ReviewPopover
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        reviews={MOCK_REVIEWS}
      />
    </>
  );
} 