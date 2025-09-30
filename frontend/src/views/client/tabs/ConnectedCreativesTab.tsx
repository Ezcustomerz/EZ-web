import { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { People } from '@mui/icons-material';
import { CreativeCard } from '../../../components/cards/client/CreativeCard';
import { CreativeDetailPopover } from '../../../components/popovers/client/CreativeDetailPopover';
import { userService, type ClientCreative } from '../../../api/userService';
import { useAuth } from '../../../context/auth';

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
        console.log('Using cached connected creatives data');
        setCreatives(cacheRef.current.data);
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      try {
        setLoading(true);
        const response = await userService.getClientCreatives();
        console.log('Connected creatives data:', response.creatives);
        
        // Cache the response
        cacheRef.current = {
          data: response.creatives,
          timestamp: Date.now()
        };
        
        setCreatives(response.creatives);
      } catch (error) {
        console.error('Failed to fetch creatives:', error);
        // Fallback to empty array
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
      width: '100%',
      flexGrow: 1,
      py: 2,
      overflowY: { xs: 'auto', sm: 'auto', md: 'auto' },
      minHeight: 0,
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
          overflow: 'hidden',
        }}>
          {creatives.map((creative, index) => (
            <CreativeCard
              key={creative.id}
              creative={creative}
              index={index}
              onClick={handleCreativeClick}
            />
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