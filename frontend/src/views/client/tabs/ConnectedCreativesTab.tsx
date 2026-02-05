import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Skeleton, Card, Avatar } from '@mui/material';
import { People } from '@mui/icons-material';
import { CreativeCard } from '../../../components/cards/client/CreativeCard';
import { CreativeDetailPopover } from '../../../components/popovers/client/CreativeDetailPopover';
import { userService, type ClientCreative } from '../../../api/userService';
import { useAuth } from '../../../context/auth';
import { errorToast } from '../../../components/toast/toast';

export function ConnectedCreativesTab() {
  const { isAuthenticated } = useAuth();
  const [creatives, setCreatives] = useState<ClientCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreative, setSelectedCreative] = useState<ClientCreative | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  const fetchingRef = useRef(false);
  const lastAuthStateRef = useRef<boolean | null>(null);
  const cacheRef = useRef<{ data: ClientCreative[], timestamp: number } | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Fetch creatives when component mounts and user is authenticated
  useEffect(() => {
    const fetchCreatives = async () => {
      // Prevent duplicate calls if already fetching or auth state hasn't changed
      if (fetchingRef.current || lastAuthStateRef.current === isAuthenticated) {
        return;
      }

      fetchingRef.current = true;
      lastAuthStateRef.current = isAuthenticated;

      if (!isAuthenticated) {
        // In demo mode (not authenticated), use empty array
        setCreatives([]);
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      // Check cache first
      if (cacheRef.current && (Date.now() - cacheRef.current.timestamp) < CACHE_DURATION) {
        setCreatives(cacheRef.current.data);
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      try {
        setLoading(true);
        const response = await userService.getClientCreatives();
        
        // Cache the response
        cacheRef.current = {
          data: response.creatives,
          timestamp: Date.now()
        };
        
        setCreatives(response.creatives);
      } catch {
        errorToast('Failed to load creatives. Please try again.');
        setCreatives([]);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchCreatives();
  }, [isAuthenticated]);

  const handleCreativeClick = (producerId: string) => {
    // Find the creative by ID and open detail popover
    const creative = creatives.find(c => c.id === producerId);
    if (creative) {
      setSelectedCreative(creative);
      setDetailOpen(true);
    }
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setSelectedCreative(null);
  };

  if (loading) {
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
        <Box sx={{
          display: 'grid',
          gap: { xs: 1.5, sm: 2 },
          px: { xs: 1, sm: 2 },
          pt: 2,
          pb: 8,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(3, 1fr)',
          },
          alignItems: 'stretch',
          minHeight: 0,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Box
              key={`skeleton-${idx}`}
              sx={{
                animation: `fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1) ${idx * 0.1}s both`,
                '@keyframes fadeInCard': {
                  '0%': { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
                  '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
                },
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                overflow: 'visible',
                boxSizing: 'border-box',
              }}
            >
              <Card sx={{
                position: 'relative',
                height: '100%',
                minHeight: { xs: 200, sm: 220 },
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                boxShadow: 'none',
                p: 0,
                overflow: 'hidden',
                background: 'linear-gradient(145deg, #f5f6ff 0%, #eef0ff 100%)',
                border: '1px solid rgba(122, 95, 255, 0.08)',
              }}>
                <Box sx={{ height: 6, backgroundColor: 'rgba(122, 95, 255, 0.2)' }} />
                <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5 }}>
                    <Skeleton variant="circular" width={52} height={52} sx={{ mr: 2 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" height={28} sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" width="50%" height={20} />
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Skeleton variant="text" width="100%" height={16} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="90%" height={16} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Skeleton variant="circular" width={16} height={16} />
                    <Skeleton variant="text" width={60} height={18} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton variant="circular" width={16} height={16} />
                    <Skeleton variant="text" width={80} height={18} />
                  </Box>
                </Box>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

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
      {creatives.length === 0 ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          color: 'secondary.main',
        }}>
          <People sx={{ fontSize: 64, mb: 2, opacity: 0.4, color: 'secondary.main' }} />
          <Typography variant="h6" sx={{ mb: 1, color: 'secondary.main' }}>
            No Connected Creatives
          </Typography>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>
            Connect with music creatives to start booking services
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gap: { xs: 1.5, sm: 2 },
          px: { xs: 1, sm: 2 },
          pt: 2,
          pb: 8, // Increased bottom padding to accommodate hover effects (scale + translateY)
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(3, 1fr)',
          },
          alignItems: 'stretch',
          minHeight: 0,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {creatives.map((creative, index) => (
            <Box
              key={creative.id}
              sx={{
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                overflow: 'visible',
                boxSizing: 'border-box',
              }}
            >
              <CreativeCard
                creative={creative}
                index={index}
                onClick={handleCreativeClick}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Creative Detail Popover */}
      {selectedCreative && (
        <CreativeDetailPopover
          open={detailOpen}
          onClose={handleDetailClose}
          creative={selectedCreative}
        />
      )}
    </Box>
  );
}