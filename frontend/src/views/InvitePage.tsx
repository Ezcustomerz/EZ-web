import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  PersonAdd,
  Star,
  LocationOn,
  Work,
  Visibility,
  ContactPhone,
} from '@mui/icons-material';
import { useAuth } from '../context/auth';
import { inviteService, type ValidateInviteResponse } from '../api/inviteService';
import { userService, type CreativeProfile, type CreativeService, type CreativeBundle, type PublicServicesAndBundlesResponse } from '../api/userService';

import { SessionPopover } from '../components/popovers/creative/ServicePopover';
import { ReviewPopover } from '../components/popovers/creative/ReviewPopover';
import { ServicesDetailPopover } from '../components/popovers/ServicesDetailPopover';
import { BundleDetailPopover } from '../components/popovers/BundleDetailPopover';
import { ServiceCardSimple } from '../components/cards/creative/ServiceCard';
import { BundleCard } from '../components/cards/creative/BundleCard';
import { errorToast } from '../components/toast/toast';

export function InvitePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const navigate = useNavigate();
  const { session, openAuth } = useAuth();
  const theme = useTheme();
  
  // Check if viewport height is small (mobile-like behavior)
  const isShortViewport = useMediaQuery('(max-height: 715px)');
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [validationData, setValidationData] = useState<ValidateInviteResponse | null>(null);
  const [userFromValidation, setUserFromValidation] = useState<any>(null);
  const [creativeProfile, setCreativeProfile] = useState<CreativeProfile | null>(null);
  const [services, setServices] = useState<CreativeService[]>([]);
  const [bundles, setBundles] = useState<CreativeBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [servicesOpen, setServicesOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<CreativeService | null>(null);
  const [bundleDetailOpen, setBundleDetailOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<CreativeBundle | null>(null);

  // InvitePage is a public page - no need to fetch user profiles
  // The auth context will handle user profile loading when needed

  const validateInvite = useCallback(async () => {
    if (!inviteToken) return;

    setLoading(true);
    try {
      const response = await inviteService.validateInviteToken(inviteToken);
      setValidationData(response);

      // Store user info from validation response
      if (response.user) {
        setUserFromValidation(response.user);
      }

      if (!response.success || !response.valid) {
        setError(response.message || 'Invalid invite link');
        setLoading(false);
        return;
      }

      // Fetch full creative profile if we have the creative user ID
      if (response.creative?.user_id) {
        try {
          const profile = await userService.getCreativeProfileById(response.creative.user_id);
          setCreativeProfile(profile);
          
          // Fetch creative services and bundles
          const servicesResponse: PublicServicesAndBundlesResponse = await userService.getCreativeServicesById(response.creative.user_id);
          setServices(servicesResponse.services);
          setBundles(servicesResponse.bundles);
        } catch (profileError) {
          errorToast('Failed to fetch creative profile');
          // Continue with basic info from validation
        }
      }
    } catch (err) {
      setError('Failed to validate invite link');
    } finally {
      setLoading(false);
    }
  }, [inviteToken]);

  useEffect(() => {
    if (inviteToken) {
      validateInvite();
    } else {
      setError('Invalid invite link');
      setLoading(false);
    }
  }, [inviteToken, validateInvite]);

  const handleSignUp = () => {
    // Store invite token in localStorage to survive OAuth redirects
    if (inviteToken) {
      localStorage.setItem('pendingInviteToken', inviteToken);
      localStorage.setItem('invitePreSelectClient', 'true');
    }
    openAuth();
  };

  const handleAcceptInvite = () => {
    // Store invite token and open auth - let the auth flow handle everything
    if (inviteToken) {
      localStorage.setItem('pendingInviteToken', inviteToken);
      localStorage.setItem('invitePreSelectClient', 'true');
    }
    openAuth();
  };

  const handleServiceClick = (service: CreativeService) => {
    // Add creative profile information to the service object
    const serviceWithCreative = {
      ...service,
      creative_display_name: creative?.display_name,
      creative_title: creative?.title,
      creative_avatar_url: (creative as CreativeProfile)?.profile_banner_url
    };
    setSelectedService(serviceWithCreative as any);
    setServiceDetailOpen(true);
  };

  const handleBundleClick = (bundle: CreativeBundle) => {
    // Add creative profile information to the bundle object
    const bundleWithCreative = {
      ...bundle,
      creative_display_name: creative?.display_name,
      creative_title: creative?.title,
      creative_avatar_url: (creative as CreativeProfile)?.profile_banner_url
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


  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3, color: 'primary.main' }} />
          <Typography variant="h6" color="text.secondary">
            Loading profile...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !validationData?.valid) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        px: 2
      }}>
        <Card sx={{
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          borderRadius: 3
        }}>
          <CardContent sx={{ p: 4 }}>
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Invalid Link
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {error || 'This link is invalid or has expired.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              size="large"
              fullWidth
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }


  // Use the full creative profile if available, otherwise fall back to basic validation data
  const creative = creativeProfile || validationData?.creative;

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: { xs: 2, md: 2 }
    }}>
      <Container maxWidth="lg" sx={{
        px: { xs: 2, md: 3 }
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: isMobile || isShortViewport ? 'column' : 'row',
          gap: isMobile || isShortViewport ? 2 : 4,
          alignItems: 'stretch',
          height: isMobile || isShortViewport ? 'auto' : 'calc(100vh - 64px)',
          minHeight: isMobile || isShortViewport ? 'calc(100vh - 64px)' : 'auto'
        }}>
          {/* Left Column - Profile Info */}
          <Box sx={{
            width: isMobile || isShortViewport ? '100%' : '33.333%',
            minWidth: isMobile || isShortViewport ? 'auto' : '300px',
            height: isMobile || isShortViewport ? 'auto' : '100%',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: isMobile || isShortViewport ? 0 : 1
          }}>
            <Card sx={{
              height: isMobile || isShortViewport ? 'fit-content' : '100%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              borderRadius: 3,
              position: isMobile || isShortViewport ? 'relative' : 'sticky',
              top: isMobile || isShortViewport ? 0 : 24,
              display: 'flex',
              flexDirection: 'column',
              flex: 1
            }}>
              {/* Profile Header */}
              <Box sx={{
                background: (creative as CreativeProfile)?.avatar_background_color 
                  ? `linear-gradient(135deg, ${(creative as CreativeProfile).avatar_background_color} 0%, ${(creative as CreativeProfile).avatar_background_color}CC 100%)`
                  : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: 'white',
                p: 3,
                textAlign: 'center'
              }}>
                <Avatar
                  src={(creative as CreativeProfile)?.profile_banner_url || undefined}
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
                  {creative?.display_name?.charAt(0) || 'C'}
                </Avatar>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {creative?.display_name}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                  {creative?.title}
                </Typography>

              </Box>

              <CardContent sx={{
                p: 3,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
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
                      {(creative as CreativeProfile)?.availability_location || 'Availability not set'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Work sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {creative?.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ContactPhone sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {(creative as CreativeProfile)?.primary_contact || 'Contact not set'}
                    </Typography>
                  </Box>

                  {/* Profile Highlights */}
                  <Box sx={{
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ fontSize: '0.8rem' }}>
                      Profile Highlights
                    </Typography>
                    {(creative as CreativeProfile)?.profile_highlights && (creative as CreativeProfile).profile_highlights!.length > 0 ? (
                      (creative as CreativeProfile).profile_highlights!.map((highlight, index) => {
                        let value = 'Not set';
                        
                        // Use custom values from profile_highlight_values for all highlights
                        const statKey = highlight.replace(/\s+/g, '').toLowerCase();
                        value = (creative as CreativeProfile)?.profile_highlight_values?.[statKey] || 'Not set';
                        
                        return (
                          <Box key={highlight} sx={{ display: 'flex', justifyContent: 'space-between', mb: index < (creative as CreativeProfile).profile_highlights!.length - 1 ? 0.3 : 0 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{highlight}</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>{value}</Typography>
                          </Box>
                        );
                      })
                    ) : (
                      // Fallback to default display if no highlights are configured
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                        No profile highlights configured yet.
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Action Button */}
                <Box>
                  {userFromValidation?.has_client_role ? (
                    <Box>
                      <Alert severity="success" sx={{ mb: 1, textAlign: 'left', py: 0.8 }}>
                        <CheckCircle sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        {session ? "Ready to connect!" : "Account ready - let's connect!"}
                      </Alert>
                      <Button
                        variant="contained"
                        size="medium"
                        fullWidth
                        onClick={handleAcceptInvite}
                        startIcon={<CheckCircle />}
                        sx={{
                          py: 1,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          borderRadius: 2
                        }}
                      >
                        {session ? 'Connect Now' : 'Sign In & Connect'}
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Alert severity="info" sx={{ mb: 1, textAlign: 'left', py: 0.8 }}>
                        Connect with {creative?.display_name} to start collaborating on EZ!
                      </Alert>
                      <Button
                        variant="contained"
                        size="medium"
                        fullWidth
                        onClick={handleSignUp}
                        startIcon={<PersonAdd />}
                        sx={{
                          py: 1,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          borderRadius: 2
                        }}
                      >
                        Connect with {creative?.display_name}
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Right Column - Services & Info */}
          <Box sx={{
            width: isMobile || isShortViewport ? '100%' : '66.667%',
            flex: 1,
            height: isMobile || isShortViewport ? 'auto' : '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              height: isMobile || isShortViewport ? 'auto' : '100%'
            }}>
              {/* About Section */}
              <Card sx={{
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                borderRadius: 3,
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    About {creative?.display_name}
                  </Typography>
                  {(creative as CreativeProfile)?.description ? (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, flex: 1 }}>
                      {(creative as CreativeProfile).description}
                    </Typography>
                  ) : (
                    <Box sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center' }}>
                        No description available.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Services Section */}
              <Card sx={{
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                borderRadius: 3,
                flex: 2,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Available Services
                    </Typography>
                    {/* Only show View All button if there are 3+ services */}
                    {services.length >= 3 && (
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
                    {services.length === 0 ? (
                      <Box sx={{ 
                        position: 'relative',
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flex: 1
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                          No services available yet.
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        flex: 1
                      }}>
                        {/* Show configured primary and secondary services, plus first bundle if available */}
                        {(() => {
                          const primaryId = (creative as CreativeProfile)?.primary_service_id;
                          const secondaryId = (creative as CreativeProfile)?.secondary_service_id;
                          
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
                                  creative={creative?.display_name || 'Creative'}
                                  onBook={() => handleServiceClick(item.data as CreativeService)}
                                  requires_booking={(item.data as CreativeService).requires_booking}
                                />
                              ) : (
                                <BundleCard
                                  bundle={item.data as CreativeBundle}
                                  creative={creative?.display_name || 'Creative'}
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

      {/* Popovers */}
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
          creative: creative?.display_name || 'Creative',
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
        reviews={[
          {
            id: 1,
            reviewerName: 'Sarah M.',
            reviewerAvatar: null,
            rating: 5,
            review: 'Amazing work! Taiki delivered exactly what I needed and more. The quality was outstanding.',
            service: 'Music Production',
            date: '2024-01-15'
          },
          {
            id: 2,
            reviewerName: 'Mike R.',
            reviewerAvatar: null,
            rating: 5,
            review: 'Professional and fast delivery. The mixing was perfect and the communication was great throughout. wow',
            service: 'Mixing & Mastering',
            date: '2024-01-10'
          },
          {
            id: 3,
            reviewerName: 'Alex K.',
            reviewerAvatar: null,
            rating: 4,
            review: 'Great beat making skills. Very creative and responsive to feedback.',
            service: 'Beat Making',
            date: '2024-01-05'
          }
        ]}
      />

      {/* Service Detail Popover */}
      <ServicesDetailPopover
        open={serviceDetailOpen}
        onClose={handleServiceDetailClose}
        service={selectedService}
        context="invite-page"
      />

      {/* Bundle Detail Popover */}
      <BundleDetailPopover
        open={bundleDetailOpen}
        onClose={handleBundleDetailClose}
        bundle={selectedBundle}
        context="invite-page"
      />
    </Box>
  );
}
