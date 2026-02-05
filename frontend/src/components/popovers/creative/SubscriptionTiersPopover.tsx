import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Button,
} from '@mui/material';
import {
  Close,
  Star,
  TrendingUp,
  Diamond,
} from '@mui/icons-material';
import { userService, type SubscriptionTier, type CreativeProfile } from '../../../api/userService';
import { subscriptionService } from '../../../api/subscriptionService';
import { errorToast, successToast } from '../../../components/toast/toast';
import { useAuth } from '../../../context/auth';

interface SubscriptionTiersPopoverProps {
  open: boolean;
  onClose: () => void;
}

// Helper function to map subscription tier to icon, color, and metadata based on position
// Tiers are ordered by price (ascending) from the API
const getTierMetadata = (index: number, totalTiers: number, tierName: string) => {
  // Check if this tier is named "Growth" - this should be the popular one
  const isGrowthTier = tierName.toLowerCase().includes('growth');
  
  // First tier (lowest price) - Basic/Plain tier
  if (index === 0) {
    return {
      icon: Star,
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      subtitle: isGrowthTier ? 'Most Popular' : 'Start for completely free',
      popular: isGrowthTier,
    };
  }
  // Second tier (middle price) - Growth tier (most common position)
  else if (index === 1 && totalTiers >= 2) {
    return {
      icon: TrendingUp,
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      subtitle: isGrowthTier ? 'Most Popular' : 'Enhanced Features',
      popular: isGrowthTier,
    };
  }
  // Third tier or higher (highest price) - Pro tier
  else {
    return {
      icon: Diamond,
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      subtitle: isGrowthTier ? 'Most Popular' : 'Professional',
      popular: isGrowthTier,
    };
  }
};

export function SubscriptionTiersPopover({ open, onClose }: SubscriptionTiersPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const { isAuthenticated } = useAuth();
  
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [currentTierId, setCurrentTierId] = useState<string | null>(null);
  const [currentTierLevel, setCurrentTierLevel] = useState<number>(0);
  const [processingTierId, setProcessingTierId] = useState<string | null>(null);

  // Fetch subscription tiers when popover opens
  useEffect(() => {
    if (open && isAuthenticated) {
      const fetchData = async () => {
        try {
          setLoadingTiers(true);
          // Fetch subscription tiers
          const tiers = await userService.getSubscriptionTiers();
          
          // Fetch current creative profile to get current subscription tier
          let profile: CreativeProfile | null = null;
          try {
            profile = await userService.getCreativeProfile();
          } catch {
            // Silently continue - profile fetch is optional
          }

          setSubscriptionTiers(tiers);
          if (profile?.subscription_tier_id) {
            setCurrentTierId(profile.subscription_tier_id);
            // Find and set the current tier level
            const currentTier = tiers.find(t => t.id === profile.subscription_tier_id);
            if (currentTier) {
              setCurrentTierLevel(currentTier.tier_level);
            }
          }
        } catch {
          errorToast('Error', 'Failed to load subscription tiers');
        } finally {
          setLoadingTiers(false);
        }
      };

      fetchData();
    }
  }, [open, isAuthenticated]);

  // Helper to determine button action based on tier level
  const getTierAction = (tier: SubscriptionTier): 'current' | 'upgrade' | 'downgrade' | 'hidden' => {
    // Find the highest tier level available
    const maxTierLevel = Math.max(...subscriptionTiers.map(t => t.tier_level));
    
    if (currentTierId === tier.id) {
      // If this is the current tier AND it's the highest tier, hide the button entirely
      if (currentTierLevel >= maxTierLevel) {
        return 'hidden';
      }
      return 'current';
    }
    
    if (tier.tier_level > currentTierLevel) {
      return 'upgrade';
    }
    
    if (tier.tier_level < currentTierLevel) {
      return 'downgrade';
    }
    
    // Same tier level but different tier (e.g., Basic and Beta both at level 1)
    // Hide button to prevent lateral moves
    return 'hidden';
  };

  // Handler for upgrade button click
  const handleUpgradeClick = async (tierId: string, tierPrice: number) => {
    try {
      // Check if this is a free tier
      if (tierPrice === 0) {
        errorToast('Error', 'This is a free tier. No payment required.');
        return;
      }

      setProcessingTierId(tierId);
      
      // Create checkout session
      const { checkout_url } = await subscriptionService.createCheckoutSession(tierId);
      
      // Redirect to Stripe Checkout
      window.location.href = checkout_url;
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: unknown } } }).response?.data
        : undefined;
      const msg = typeof data?.detail === 'string' ? data.detail : 'Failed to start subscription checkout';
      errorToast('Error', msg);
      setProcessingTierId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      sx={{
        zIndex: 1400,
      }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          m: 0,
          maxHeight: isMobile ? '100vh' : '90vh',
          background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
          boxShadow: isMobile 
            ? 'none' 
            : '0 25px 50px rgba(51, 65, 85, 0.15), 0 0 0 1px rgba(51, 65, 85, 0.05)',
          overflow: isMobile ? 'hidden' : 'visible',
          position: 'relative',
          ...(isMobile && {
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }),
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          pt: 3,
          px: 3,
          background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
          color: 'white',
          borderRadius: isMobile ? 0 : '12px 12px 0 0',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(51, 65, 85, 0.25)',
          position: 'relative',
          zIndex: 1,
          ...(!isMobile && {
            marginTop: '-1px',
            marginLeft: '-1px',
            marginRight: '-1px',
            width: 'calc(100% + 2px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-2px',
              right: '-2px',
              bottom: 0,
              background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
              borderRadius: '12px 12px 0 0',
              zIndex: -1,
            },
          }),
        }}
      >
        <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
          Subscription Plans
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        p: { xs: 2, sm: 3 }, 
        pt: 3, 
        overflow: 'auto', 
        position: 'relative',
        ...(isMobile && {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }),
      }}>
        {loadingTiers ? (
          <Box>
            {/* Mobile Skeleton View */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              {[1, 2].map((index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 50 }}>
                          <Skeleton variant="circular" width={32} height={32} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 0.5 }} />
                          <Skeleton variant="text" width="40%" height={36} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        <Skeleton variant="rounded" width="50%" height={32} sx={{ borderRadius: '20px' }} />
                        <Skeleton variant="rounded" width="45%" height={32} sx={{ borderRadius: '20px' }} />
                      </Box>
                      <Skeleton variant="rounded" width="100%" height={44} sx={{ borderRadius: 2 }} />
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
            
            {/* Desktop Skeleton View */}
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' },
              gap: 3,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'stretch',
            }}>
              {[1, 2].map((index) => (
                <Box
                  key={index}
                  sx={{
                    flex: '0 1 auto',
                    minWidth: 280,
                    maxWidth: 350,
                    position: 'relative',
                  }}
                >
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #e0e0e0',
                      height: '100%',
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <Skeleton variant="circular" width={48} height={48} />
                      </Box>
                      <Skeleton variant="text" width="70%" height={32} sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" width="50%" height={20} sx={{ mb: 2 }} />
                      <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
                      <Box sx={{ mb: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Skeleton variant="rounded" width="100%" height={32} sx={{ borderRadius: '20px' }} />
                        <Skeleton variant="rounded" width="100%" height={32} sx={{ borderRadius: '20px' }} />
                      </Box>
                      <Skeleton variant="rounded" width="100%" height={44} sx={{ borderRadius: 2, mt: 3 }} />
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>
        ) : subscriptionTiers.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              gap: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
              No subscription plans available
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400 }}>
              Please contact support if you believe this is an error.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 3,
                mt: 2,
              }}
            >
              <Box
                sx={{
                  display: 'inline-block',
                  px: 3,
                  py: 0.75,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.15) 0%, rgba(30, 41, 59, 0.15) 100%)',
                  textAlign: 'center',
                  border: '1px solid rgba(51, 65, 85, 0.25)',
                  boxShadow: '0 2px 8px rgba(51, 65, 85, 0.1)',
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.9rem', 
                    color: '#334155', 
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Simple and flexible pricing.
                </Typography>
              </Box>
            </Box>
            
            {/* Mobile View - Stacked Cards */}
            <Box sx={{ 
              display: { xs: 'block', sm: 'none' }, 
              position: 'relative',
              overflow: 'visible',
              pb: 2,
            }}>
              {subscriptionTiers.map((tier, index) => {
                const metadata = getTierMetadata(index, subscriptionTiers.length, tier.name);
                const IconComponent = metadata.icon;
                const isCurrentTier = currentTierId === tier.id;
                
                return (
                  <Box key={tier.id} sx={{ mb: 2, isolation: 'isolate' }}>
                    <Box 
                      sx={{ 
                        position: 'relative',
                        isolation: 'isolate',
                      }}
                    >
                      {metadata.popular && (
                        <Chip
                          label={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box 
                                component="span" 
                                sx={{ 
                                  display: 'inline-block',
                                  filter: 'grayscale(100%) brightness(0)',
                                  WebkitFilter: 'grayscale(100%) brightness(0)',
                                }}
                              >
                                🔥
                              </Box>
                              <Box component="span">Popular</Box>
                            </Box>
                          }
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -10,
                            right: 12,
                            background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(212, 175, 55, 0.9) 100%)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 20,
                            zIndex: 2,
                            border: '1px solid rgba(184, 134, 11, 0.5)',
                            boxShadow: '0 0 0 2px #fff, 0 2px 4px rgba(0, 0, 0, 0.1)',
                          }}
                        />
                      )}
                        <Card
                          sx={{
                            cursor: 'default',
                            border: isCurrentTier 
                              ? '2px solid #334155' 
                              : metadata.popular 
                                ? '2px solid rgba(184, 134, 11, 0.4)'
                                : '1px solid rgba(51, 65, 85, 0.15)',
                            borderRadius: 3,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: '#fff',
                            position: 'relative',
                            boxShadow: isCurrentTier ? '0 4px 20px rgba(51, 65, 85, 0.25)' : '0 2px 8px rgba(51, 65, 85, 0.08)',
                            '&:hover': {
                              border: metadata.popular 
                                ? '3px solid rgba(184, 134, 11, 0.8)'
                                : isCurrentTier
                                  ? '3px solid #334155'
                                  : '2px solid rgba(51, 65, 85, 0.4)',
                              boxShadow: isCurrentTier 
                                ? '0 8px 32px rgba(51, 65, 85, 0.35)'
                                : metadata.popular
                                  ? '0 8px 24px rgba(184, 134, 11, 0.3)'
                                  : '0 8px 24px rgba(51, 65, 85, 0.2)',
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 50 }}>
                              <IconComponent 
                                sx={{ 
                                  fontSize: 32, 
                                  color: '#334155',
                                }} 
                              />
                            </Box>
                            
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
                                {tier.name}
                              </Typography>
                              {metadata.subtitle && (
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}>
                                  {metadata.subtitle}
                                </Typography>
                              )}
                              <Typography variant="h5" fontWeight={800} sx={{ color: '#334155' }}>
                                ${tier.price}
                                <Typography component="span" variant="body2" sx={{ opacity: 0.7, fontWeight: 400, color: 'text.secondary' }}>
                                  /month
                                </Typography>
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                            <Box
                              sx={{
                                display: 'inline-block',
                                px: 2,
                                py: 0.75,
                                borderRadius: '20px',
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                              }}
                            >
                              <Typography variant="body2" sx={{ color: metadata.popular ? 'rgba(184, 134, 11, 0.95)' : 'text.primary', fontWeight: 500 }}>
                                {tier.storage_display}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'inline-block',
                                px: 2,
                                py: 0.75,
                                borderRadius: '20px',
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                              }}
                            >
                              <Typography variant="body2" sx={{ color: metadata.popular ? 'rgba(184, 134, 11, 0.95)' : 'text.primary', fontWeight: 500, fontSize: '0.85rem' }}>
                                {(tier.fee_percentage * 100).toFixed(1)}% platform fee
                              </Typography>
                            </Box>
                            {tier.description && (
                              <>
                                {tier.description.includes('/') ? (
                                  tier.description.split('/').map((part, index) => {
                                    const trimmedPart = part.trim();
                                    if (!trimmedPart) return null;
                                    return (
                                      <Box
                                        key={index}
                                        sx={{
                                          display: 'inline-block',
                                          px: 2,
                                          py: 0.75,
                                          borderRadius: '20px',
                                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                          border: '1px solid rgba(0, 0, 0, 0.1)',
                                        }}
                                      >
                                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                                          {trimmedPart}
                                        </Typography>
                                      </Box>
                                    );
                                  })
                                ) : (
                                  <Box
                                    sx={{
                                      display: 'inline-block',
                                      px: 2,
                                      py: 1,
                                      borderRadius: '20px',
                                      backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                      border: '1px solid rgba(0, 0, 0, 0.08)',
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                                      {tier.description}
                                    </Typography>
                                  </Box>
                                )}
                              </>
                            )}
                          </Box>

                          {/* Action Button */}
                          {(() => {
                            const action = getTierAction(tier);
                            
                            if (action === 'hidden') {
                              return null; // Don't show button for same-level tiers
                            }
                            
                            if (action === 'current') {
                              return (
                                <Box sx={{ width: '100%' }}>
                                  <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={(e) => e.preventDefault()}
                                    sx={{
                                      background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                                      color: '#fff',
                                      fontWeight: 600,
                                      py: 1.5,
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      cursor: 'default',
                                      opacity: 0.7,
                                      '&:hover': {
                                        opacity: 0.8,
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(51, 65, 85, 0.3)',
                                      },
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    Current Plan
                                  </Button>
                                </Box>
                              );
                            }
                            
                            const buttonText = action === 'upgrade' ? 'Upgrade' : 'Downgrade';
                            const isUpgrade = action === 'upgrade';
                            
                            return (
                              <Box sx={{ width: '100%' }}>
                                <Button
                                  variant="contained"
                                  fullWidth
                                  onClick={() => handleUpgradeClick(tier.id, tier.price)}
                                  disabled={processingTierId === tier.id}
                                  sx={{
                                    background: isUpgrade
                                      ? metadata.popular
                                        ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(212, 175, 55, 0.9) 100%)'
                                        : 'linear-gradient(135deg, #7A5FFF 0%, #9F7AEA 100%)'
                                      : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    '&:hover': {
                                      background: isUpgrade
                                        ? metadata.popular
                                          ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(184, 134, 11, 0.95) 100%)'
                                          : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                                        : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: isUpgrade
                                        ? metadata.popular
                                          ? '0 4px 12px rgba(184, 134, 11, 0.4)'
                                          : '0 4px 12px rgba(51, 65, 85, 0.4)'
                                        : '0 4px 12px rgba(71, 85, 105, 0.4)',
                                    },
                                    '&:disabled': {
                                      opacity: 0.6,
                                      cursor: 'not-allowed',
                                    },
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  {processingTierId === tier.id ? 'Processing...' : buttonText}
                                </Button>
                              </Box>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Desktop View - Centered 2 Cards */}
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' },
              gap: 3,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'stretch',
              position: 'relative',
            }}>
              {subscriptionTiers.map((tier, index) => {
                const metadata = getTierMetadata(index, subscriptionTiers.length, tier.name);
                const IconComponent = metadata.icon;
                const isCurrentTier = currentTierId === tier.id;
                
                return (
                  <Box 
                    key={tier.id} 
                    sx={{ 
                      flex: '0 1 auto',
                      minWidth: 280,
                      maxWidth: 350,
                      position: 'relative',
                      isolation: 'isolate',
                    }}
                  >
                    {metadata.popular && (
                      <Chip
                        label={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box 
                              component="span" 
                              sx={{ 
                                display: 'inline-block',
                                filter: 'grayscale(100%) brightness(0)',
                                WebkitFilter: 'grayscale(100%) brightness(0)',
                              }}
                            >
                              🔥
                            </Box>
                            <Box component="span">Most Popular</Box>
                          </Box>
                        }
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(212, 175, 55, 0.9) 100%)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          zIndex: 2,
                          border: '1px solid rgba(184, 134, 11, 0.5)',
                          boxShadow: '0 0 0 2px #fff, 0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    )}
                      <Card
                        sx={{
                          cursor: 'default',
                          border: isCurrentTier 
                            ? '3px solid #334155' 
                            : metadata.popular 
                              ? '3px solid rgba(184, 134, 11, 0.4)'
                              : '1px solid rgba(51, 65, 85, 0.15)',
                          boxShadow: isCurrentTier 
                            ? '0 8px 32px rgba(51, 65, 85, 0.25)' 
                            : '0 2px 8px rgba(51, 65, 85, 0.08)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          background: '#fff',
                          color: 'inherit',
                          height: '100%',
                          borderRadius: 3,
                          '&:hover': {
                            border: metadata.popular 
                              ? '5px solid rgba(184, 134, 11, 0.8)'
                              : isCurrentTier
                                ? '5px solid #334155'
                                : '3px solid rgba(51, 65, 85, 0.4)',
                            boxShadow: isCurrentTier 
                              ? '0 12px 48px rgba(51, 65, 85, 0.4)'
                              : metadata.popular
                                ? '0 12px 40px rgba(184, 134, 11, 0.35)'
                                : '0 12px 40px rgba(51, 65, 85, 0.25)',
                            transform: 'translateY(-4px)',
                          },
                        }}
                      >
                      <CardContent sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                          <IconComponent 
                            sx={{ 
                              fontSize: 48, 
                              color: '#334155',
                            }} 
                          />
                        </Box>
                        
                        <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
                          {tier.name}
                        </Typography>
                        {metadata.subtitle && (
                          <Typography variant="body2" sx={{ mb: 2, fontSize: '0.8rem', color: 'text.secondary' }}>
                            {metadata.subtitle}
                          </Typography>
                        )}
                        <Typography variant="h4" fontWeight={800} sx={{ color: '#334155', mb: 2 }}>
                          ${tier.price}
                          <Typography component="span" variant="body2" sx={{ opacity: 0.7, fontWeight: 400, color: 'text.secondary' }}>
                            /month
                          </Typography>
                        </Typography>

                        <Box sx={{ mb: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 2,
                              py: 0.75,
                              borderRadius: '20px',
                              backgroundColor: 'rgba(0, 0, 0, 0.05)',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            <Typography variant="body2" sx={{ color: metadata.popular ? 'rgba(184, 134, 11, 0.95)' : 'text.primary', fontWeight: 500 }}>
                              {tier.storage_display}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 2,
                              py: 0.75,
                              borderRadius: '20px',
                              backgroundColor: 'rgba(0, 0, 0, 0.05)',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            <Typography variant="body2" sx={{ color: metadata.popular ? 'rgba(184, 134, 11, 0.95)' : 'text.primary', fontWeight: 500, fontSize: '0.85rem' }}>
                              {(tier.fee_percentage * 100).toFixed(1)}% platform fee
                            </Typography>
                          </Box>
                        </Box>

                        {tier.description && (
                          <>
                            {tier.description.includes('/') ? (
                              <Box sx={{ mt: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {tier.description.split('/').map((part, index) => {
                                  const trimmedPart = part.trim();
                                  if (!trimmedPart) return null;
                                  return (
                                    <Box
                                      key={index}
                                      sx={{
                                        display: 'inline-block',
                                        px: 2,
                                        py: 0.75,
                                        borderRadius: '20px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                        border: '1px solid rgba(0, 0, 0, 0.1)',
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, textAlign: 'center' }}>
                                        {trimmedPart}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: 'inline-block',
                                  px: 2,
                                  py: 1,
                                  borderRadius: '20px',
                                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                  border: '1px solid rgba(0, 0, 0, 0.08)',
                                  mt: 1,
                                }}
                              >
                                <Typography variant="body2" sx={{ fontSize: '0.85rem', textAlign: 'center', color: 'text.secondary' }}>
                                  {tier.description}
                                </Typography>
                              </Box>
                            )}
                          </>
                        )}

                        {/* Action Button */}
                        {(() => {
                          const action = getTierAction(tier);
                          
                          if (action === 'hidden') {
                            return null; // Don't show button for same-level tiers
                          }
                          
                          if (action === 'current') {
                            return (
                              <Box sx={{ mt: 3, width: '100%' }}>
                                <Button
                                  variant="contained"
                                  fullWidth
                                  onClick={(e) => e.preventDefault()}
                                  sx={{
                                    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    cursor: 'default',
                                    opacity: 0.7,
                                    '&:hover': {
                                      opacity: 0.8,
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(122, 95, 255, 0.3)',
                                    },
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  Current Plan
                                </Button>
                              </Box>
                            );
                          }
                          
                          const buttonText = action === 'upgrade' ? 'Upgrade' : 'Downgrade';
                          const isUpgrade = action === 'upgrade';
                          
                          return (
                            <Box sx={{ mt: 3, width: '100%' }}>
                              <Button
                                variant="contained"
                                fullWidth
                                onClick={() => handleUpgradeClick(tier.id, tier.price)}
                                disabled={processingTierId === tier.id}
                                sx={{
                                  background: isUpgrade
                                    ? metadata.popular
                                      ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(212, 175, 55, 0.9) 100%)'
                                      : 'linear-gradient(135deg, #7A5FFF 0%, #9F7AEA 100%)'
                                    : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                  color: '#fff',
                                  fontWeight: 600,
                                  py: 1.5,
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  '&:hover': {
                                    background: isUpgrade
                                      ? metadata.popular
                                        ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(184, 134, 11, 0.95) 100%)'
                                        : 'linear-gradient(135deg, #9F7AEA 0%, #7A5FFF 100%)'
                                      : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: isUpgrade
                                      ? metadata.popular
                                        ? '0 4px 12px rgba(184, 134, 11, 0.4)'
                                        : '0 4px 12px rgba(122, 95, 255, 0.4)'
                                      : '0 4px 12px rgba(71, 85, 105, 0.4)',
                                  },
                                  '&:disabled': {
                                    opacity: 0.6,
                                    cursor: 'not-allowed',
                                  },
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                {processingTierId === tier.id ? 'Processing...' : buttonText}
                              </Button>
                            </Box>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

