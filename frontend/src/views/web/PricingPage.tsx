import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Container,
  Button,
} from '@mui/material';
import {
  Star,
  TrendingUp,
  Diamond,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userService, type SubscriptionTier } from '../../api/userService';
import { LayoutWeb } from '../../layout/web/LayoutWeb';
import { AnimatedButton } from '../../components/buttons/MusicButton';
import { useRoleRedirect } from '../../utils/roleRedirect';

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

export function PricingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const navigate = useNavigate();
  const { getRedirectUrl } = useRoleRedirect();
  
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription tiers when page loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingTiers(true);
        setError(null);
        // Fetch subscription tiers
        const tiers = await userService.getSubscriptionTiers();
        setSubscriptionTiers(tiers);
      } catch (err: any) {
        console.error('Failed to fetch subscription tiers:', err);
        setError('Unable to load pricing information. Please try again later.');
      } finally {
        setLoadingTiers(false);
      }
    };

    fetchData();
  }, []);

  return (
    <LayoutWeb>
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
        {/* Header Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 5, sm: 6, md: 8 },
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              mb: 3,
            }}
          >
            <Typography 
              variant="h2" 
              fontWeight={800} 
              sx={{ 
                background: 'linear-gradient(135deg, #334155 0%, #1e293b 50%, #7A5FFF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                lineHeight: 1.1,
                mb: 1,
                letterSpacing: '-0.02em',
              }}
            >
              Choose Your Plan
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: 4,
                background: 'linear-gradient(90deg, transparent 0%, #7A5FFF 50%, transparent 100%)',
                borderRadius: 2,
                opacity: 0.6,
              }}
            />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.secondary',
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              fontWeight: 400,
              maxWidth: '600px',
              mx: 'auto',
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            Simple, transparent pricing designed to grow with your creative business
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 3,
              py: 1,
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(122, 95, 255, 0.1) 0%, rgba(51, 65, 85, 0.1) 100%)',
              border: '1px solid rgba(122, 95, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(122, 95, 255, 0.1)',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.9rem', 
                color: '#7A5FFF', 
                fontWeight: 600,
              }}
            >
              ✨ No hidden fees
            </Typography>
          </Box>
        </Box>

        {/* Loading State */}
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
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>
        ) : error ? (
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
              {error}
            </Typography>
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
                
                return (
                  <Box key={tier.id} sx={{ mb: 2 }}>
                    <Box 
                      sx={{ 
                        position: 'relative',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                        },
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
                            zIndex: 3,
                            border: '1px solid rgba(184, 134, 11, 0.5)',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                          }}
                        />
                      )}
                      <Card
                        sx={{
                          cursor: 'default',
                          border: metadata.popular 
                            ? '2px solid rgba(184, 134, 11, 0.5)'
                            : '2px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: 4,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: metadata.popular
                            ? 'linear-gradient(135deg, #fff 0%, #fef9e7 100%)'
                            : 'linear-gradient(135deg, #fff 0%, #eff6ff 100%)',
                          position: 'relative',
                          boxShadow: metadata.popular
                            ? '0 8px 24px rgba(184, 134, 11, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)'
                            : '0 4px 16px rgba(59, 130, 246, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)',
                          overflow: 'hidden',
                          '&::before': metadata.popular ? {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, rgba(184, 134, 11, 0.8) 0%, rgba(212, 175, 55, 0.8) 100%)',
                            zIndex: 1,
                          } : {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.6) 0%, rgba(37, 99, 235, 0.6) 100%)',
                            zIndex: 1,
                          },
                          '&:hover': {
                            boxShadow: metadata.popular
                              ? '0 12px 32px rgba(184, 134, 11, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)'
                              : '0 8px 24px rgba(59, 130, 246, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)',
                            border: metadata.popular 
                              ? '2px solid rgba(184, 134, 11, 0.7)'
                              : '2px solid rgba(59, 130, 246, 0.4)',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                minWidth: 56,
                                height: 56,
                                borderRadius: 2,
                                background: metadata.popular
                                  ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%)'
                                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
                                border: `1px solid ${metadata.popular ? 'rgba(184, 134, 11, 0.2)' : 'rgba(59, 130, 246, 0.25)'}`,
                              }}
                            >
                              <IconComponent 
                                sx={{ 
                                  fontSize: 32, 
                                  color: metadata.popular ? 'rgba(184, 134, 11, 0.9)' : 'rgba(59, 130, 246, 0.9)',
                                }} 
                              />
                            </Box>
                            
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5, fontSize: '1.25rem' }}>
                                {tier.name}
                              </Typography>
                              {metadata.subtitle && (
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.8rem', color: 'text.secondary', fontWeight: 500 }}>
                                  {metadata.subtitle}
                                </Typography>
                              )}
                              <Typography 
                                variant="h5" 
                                fontWeight={800} 
                                sx={{ 
                                  color: metadata.popular ? 'rgba(184, 134, 11, 0.95)' : 'rgba(59, 130, 246, 0.95)',
                                  fontSize: '1.75rem',
                                }}
                              >
                                ${tier.price}
                                <Typography component="span" variant="body2" sx={{ opacity: 0.7, fontWeight: 400, color: 'text.secondary', ml: 0.5 }}>
                                  /month
                                </Typography>
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2, alignItems: 'flex-start', width: '100%' }}>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                px: 2.5,
                                py: 1,
                                borderRadius: '24px',
                                background: metadata.popular
                                  ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)'
                                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                                border: `1.5px solid ${metadata.popular ? 'rgba(184, 134, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                              }}
                            >
                              <Typography variant="body2" sx={{ color: metadata.popular ? 'rgba(184, 134, 11, 0.95)' : 'rgba(59, 130, 246, 0.95)', fontWeight: 600, fontSize: '0.9rem' }}>
                                {tier.storage_display}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                px: 2.5,
                                py: 1,
                                borderRadius: '24px',
                                background: metadata.popular
                                  ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)'
                                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                                border: `1.5px solid ${metadata.popular ? 'rgba(184, 134, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                              }}
                            >
                              <Typography variant="body2" sx={{ color: metadata.popular ? 'rgba(184, 134, 11, 0.95)' : 'rgba(59, 130, 246, 0.95)', fontWeight: 600, fontSize: '0.85rem' }}>
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
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          px: 2.5,
                                          py: 1,
                                          borderRadius: '24px',
                                          background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.08) 0%, rgba(30, 41, 59, 0.04) 100%)',
                                          border: '1.5px solid rgba(51, 65, 85, 0.15)',
                                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                                        }}
                                      >
                                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.9rem' }}>
                                          {trimmedPart}
                                        </Typography>
                                      </Box>
                                    );
                                  })
                                ) : (
                                  <Box
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      px: 2.5,
                                      py: 1.25,
                                      borderRadius: '24px',
                                      background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.06) 0%, rgba(30, 41, 59, 0.03) 100%)',
                                      border: '1px solid rgba(51, 65, 85, 0.12)',
                                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 400 }}>
                                      {tier.description}
                                    </Typography>
                                  </Box>
                                )}
                              </>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Desktop View - Centered Cards */}
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
                
                return (
                  <Box 
                    key={tier.id} 
                    sx={{ 
                      flex: '0 1 auto',
                      minWidth: 280,
                      maxWidth: 350,
                      position: 'relative',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-6px) scale(1.02)',
                      },
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
                          zIndex: 3,
                          border: '1px solid rgba(184, 134, 11, 0.5)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                        }}
                      />
                    )}
                    <Card
                      sx={{
                        cursor: 'default',
                        border: metadata.popular 
                          ? '3px solid rgba(184, 134, 11, 0.5)'
                          : '3px solid rgba(59, 130, 246, 0.3)',
                        boxShadow: metadata.popular
                          ? '0 8px 24px rgba(184, 134, 11, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)'
                          : '0 4px 16px rgba(59, 130, 246, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        background: metadata.popular
                          ? 'linear-gradient(135deg, #fff 0%, #fef9e7 100%)'
                          : 'linear-gradient(135deg, #fff 0%, #eff6ff 100%)',
                        color: 'inherit',
                        height: '100%',
                        borderRadius: 4,
                        overflow: 'hidden',
                        '&::before': metadata.popular ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, rgba(184, 134, 11, 0.8) 0%, rgba(212, 175, 55, 0.8) 100%)',
                          zIndex: 1,
                        } : {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.6) 0%, rgba(37, 99, 235, 0.6) 100%)',
                          zIndex: 1,
                        },
                        '&:hover': {
                          boxShadow: metadata.popular
                            ? '0 16px 40px rgba(184, 134, 11, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)'
                            : '0 12px 32px rgba(59, 130, 246, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)',
                          border: metadata.popular 
                            ? '3px solid rgba(184, 134, 11, 0.7)'
                            : '3px solid rgba(59, 130, 246, 0.4)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            mb: 3,
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            borderRadius: 3,
                            background: metadata.popular
                              ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%)'
                              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
                            border: `2px solid ${metadata.popular ? 'rgba(184, 134, 11, 0.2)' : 'rgba(59, 130, 246, 0.25)'}`,
                            boxShadow: metadata.popular
                              ? '0 4px 12px rgba(184, 134, 11, 0.1)'
                              : '0 4px 12px rgba(59, 130, 246, 0.1)',
                          }}
                        >
                          <IconComponent 
                            sx={{ 
                              fontSize: 48, 
                              color: metadata.popular ? 'rgba(184, 134, 11, 0.9)' : 'rgba(59, 130, 246, 0.9)',
                            }} 
                          />
                        </Box>
                        
                        <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5, fontSize: '1.5rem' }}>
                          {tier.name}
                        </Typography>
                        {metadata.subtitle && (
                          <Typography variant="body2" sx={{ mb: 2, fontSize: '0.85rem', color: 'text.secondary', fontWeight: 500 }}>
                            {metadata.subtitle}
                          </Typography>
                        )}
                        <Typography 
                          variant="h4" 
                          fontWeight={800} 
                          sx={{ 
                            color: metadata.popular ? 'rgba(184, 134, 11, 0.95)' : 'rgba(59, 130, 246, 0.95)', 
                            mb: 2,
                            fontSize: '2.25rem',
                          }}
                        >
                          ${tier.price}
                          <Typography component="span" variant="body2" sx={{ opacity: 0.7, fontWeight: 400, color: 'text.secondary', ml: 0.5 }}>
                            /month
                          </Typography>
                        </Typography>

                        <Box sx={{ mb: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 2.5,
                              py: 1,
                              borderRadius: '24px',
                              background: metadata.popular
                                ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)'
                                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                              border: `1.5px solid ${metadata.popular ? 'rgba(184, 134, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                            }}
                          >
                            <Typography variant="body2" sx={{ color: metadata.popular ? 'rgba(184, 134, 11, 0.95)' : 'rgba(59, 130, 246, 0.95)', fontWeight: 600, fontSize: '0.9rem' }}>
                              {tier.storage_display}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 2.5,
                              py: 1,
                              borderRadius: '24px',
                              background: metadata.popular
                                ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)'
                                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                              border: `1.5px solid ${metadata.popular ? 'rgba(184, 134, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                            }}
                          >
                            <Typography variant="body2" sx={{ color: metadata.popular ? 'rgba(184, 134, 11, 0.95)' : 'rgba(59, 130, 246, 0.95)', fontWeight: 600, fontSize: '0.85rem' }}>
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
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        px: 2.5,
                                        py: 1,
                                        borderRadius: '24px',
                                        background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.08) 0%, rgba(30, 41, 59, 0.04) 100%)',
                                        border: '1.5px solid rgba(51, 65, 85, 0.15)',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, textAlign: 'center', fontSize: '0.9rem' }}>
                                        {trimmedPart}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  px: 2.5,
                                  py: 1.25,
                                  borderRadius: '24px',
                                  background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.06) 0%, rgba(30, 41, 59, 0.03) 100%)',
                                  border: '1px solid rgba(51, 65, 85, 0.12)',
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                                  mt: 1,
                                }}
                              >
                                <Typography variant="body2" sx={{ fontSize: '0.85rem', textAlign: 'center', color: 'text.secondary', fontWeight: 400 }}>
                                  {tier.description}
                                </Typography>
                              </Box>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>

            {/* Join Now Button Section */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                mt: { xs: 4, sm: 6, md: 8 },
                mb: { xs: 2, sm: 3 },
                gap: 2,
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  fontWeight: 400,
                  textAlign: 'center',
                  mb: 1,
                }}
              >
                Ready to get started?
              </Typography>
              <AnimatedButton
                text="Join Now"
                buttonVariant="landing"
                size="large"
                onClick={() => navigate(`${getRedirectUrl()}?auth=1`)}
              />
            </Box>
          </Box>
        )}
      </Container>
    </LayoutWeb>
  );
}
