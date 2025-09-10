import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Box, CssBaseline, useMediaQuery, Tooltip } from '@mui/material';
import { SidebarClient } from './SidebarClient';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../context/auth';
import { userService, type ClientProfile } from '../../api/userService';
import { useLoading } from '../../context/loading';
import { RecordSpinner } from '../../components/loaders/RecordSpinner';
import demoClientData from '../../../demoData/clientUserData.json';

interface LayoutClientProps {
  children: ReactNode | ((props: { isSidebarOpen: boolean; isMobile: boolean }) => ReactNode);
  selectedNavItem?: string;
  hideMenuButton?: boolean;
}

export function LayoutClient({ 
  children, 
  selectedNavItem,
  hideMenuButton
}: LayoutClientProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // iPad Air and smaller
  const { userProfile } = useAuth();
  const { setProfileLoading, isAnyLoading } = useLoading();
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());
  
  // Helper function to check if we've already fetched profile for current user
  const hasFetchedProfileForUser = (userId: string) => {
    const cachedProfile = localStorage.getItem(`clientProfile_${userId}`);
    return cachedProfile !== null;
  };
  
  // Helper function to get cached profile for current user
  const getCachedProfileForUser = (userId: string) => {
    const cachedProfile = localStorage.getItem(`clientProfile_${userId}`);
    return cachedProfile ? JSON.parse(cachedProfile) : null;
  };
  
  // Helper function to cache profile for current user
  const cacheProfileForUser = (userId: string, profile: ClientProfile) => {
    localStorage.setItem(`clientProfile_${userId}`, JSON.stringify(profile));
  };
  
  // Helper function to clear cached profiles (on logout)
  const clearCachedProfiles = () => {
    // Clear all client profile caches
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('clientProfile_')) {
        localStorage.removeItem(key);
      }
    });
  };
  
  // Initialize sidebar open state from localStorage or mobile detection
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(max-width: 960px)').matches) {
        // Mobile: always closed
        return false;
      }
        try {
          // Unified key across roles
          const unified = localStorage.getItem('sidebar-open');
          if (unified !== null) return JSON.parse(unified);
          // Migrate from legacy keys if present
          const legacyKeys = ['client-sidebar-open', 'creative-sidebar-open', 'advocate-sidebar-open'];
          for (const key of legacyKeys) {
            const val = localStorage.getItem(key);
            if (val !== null) {
              try { localStorage.setItem('sidebar-open', val); } catch {}
              return JSON.parse(val);
            }
          }
        return true;
        } catch {
        return true;
      }
    }
    return true;
  });

  // Close sidebar when switching to mobile (after initialization)
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // Initialize with demo data on component mount
  useEffect(() => {
    if (!clientProfile) {
      setClientProfile(demoClientData as unknown as ClientProfile);
    }
  }, []);

  // Fetch client profile once at layout level and provide to sidebar
  useEffect(() => {
    console.log('[LayoutClient] useEffect triggered', { 
      userProfile: userProfile?.user_id, 
      hasProfile: !!clientProfile,
      hasFetched: userProfile ? hasFetchedProfileForUser(userProfile.user_id) : false,
      isFetching: userProfile ? fetchingRef.current.has(userProfile.user_id) : false
    });
    
    const loadProfile = async () => {
      if (!userProfile) {
        console.log('[LayoutClient] No userProfile, setting demo data');
        setClientProfile(demoClientData as unknown as ClientProfile);
        setProfileLoading(false);
        clearCachedProfiles();
        return;
      }
      
      // If we already fetched the profile for this user, restore from cache
      if (hasFetchedProfileForUser(userProfile.user_id)) {
        console.log('[LayoutClient] Profile already fetched for user, restoring from cache');
        const cachedProfile = getCachedProfileForUser(userProfile.user_id);
        if (cachedProfile) {
          setClientProfile(cachedProfile);
        }
        setProfileLoading(false);
        return;
      }
      
      // If we're already fetching for this user, don't start another fetch
      if (fetchingRef.current.has(userProfile.user_id)) {
        console.log('[LayoutClient] Already fetching for user, skipping duplicate call');
        return;
      }
      
      console.log('[LayoutClient] Fetching client profile for user:', userProfile.user_id);
      console.log('[LayoutClient] User roles:', userProfile.roles);
      
      // Check if user has client role
      if (!userProfile.roles.includes('client')) {
        console.log('[LayoutClient] User does not have client role, using demo data');
        setClientProfile(demoClientData as unknown as ClientProfile);
        setProfileLoading(false);
        return;
      }
      
      fetchingRef.current.add(userProfile.user_id);
      setProfileLoading(true);
      try {
        const profile = await userService.getClientProfile();
        console.log('[LayoutClient] Client profile fetched successfully:', profile);
        setClientProfile(profile);
        cacheProfileForUser(userProfile.user_id, profile);
      } catch (e) {
        console.error('[LayoutClient] Failed to load client profile:', e);
        setClientProfile(demoClientData as unknown as ClientProfile);
      } finally {
        fetchingRef.current.delete(userProfile.user_id);
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [userProfile]);

  // Save sidebar state to localStorage for desktop (after initialization)
  useEffect(() => {
    if (!isMobile) {
      try {
        localStorage.setItem('sidebar-open', JSON.stringify(isSidebarOpen));
      } catch {
        // Handle localStorage errors gracefully
      }
    }
  }, [isSidebarOpen, isMobile]);

  // Add keyboard shortcut for sidebar toggle (Ctrl+B or Cmd+B)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+B (Windows/Linux) or Cmd+B (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        // Use functional update to avoid closure issues
        setIsSidebarOpen((prev: boolean) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSidebarToggle() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  // Navigation logic for client
  function handleNavItemChange(item: string) {
    switch (item) {
      case 'dashboard':
        navigate('/client');
        break;
      case 'book':
        navigate('/client/book');
        break;
      case 'orders':
        navigate('/client/orders');
        break;
      default:
        break;
    }
  }

  // Detect platform for keybind hint
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const keybindHint = isMac ? 'Cmd+B' : 'Ctrl+B';

  function handleNavItemSelect(item: string) {
    // Close sidebar on mobile first, then navigate after animation
    if (isMobile) {
      setIsSidebarOpen(false);
      // Delay navigation to allow closing animation to play
      setTimeout(() => {
        handleNavItemChange(item);
      }, 150); // Match the sidebar animation duration
    } else {
      // On desktop, navigate immediately
      handleNavItemChange(item);
    }
  }

  // On mobile, sidebar uses transform (no layout impact), on desktop use width
  // On desktop, keep current behavior
  const sidebarWidth = isMobile 
    ? 0  // No layout impact on mobile, sidebar uses transform
    : (isSidebarOpen ? 280 : 64);

  return (
    <Box sx={{ 
      display: 'flex', 
      // Remove fixed height constraint to allow scrolling
      minHeight: '100vh', 
      position: 'relative', 
      overflow: 'hidden' 
    }}>
      <CssBaseline />
      
      {/* Sidebar */}
      <SidebarClient
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
        selectedItem={selectedNavItem || 'dashboard'}
        onItemSelect={handleNavItemSelect}
        isMobile={isMobile}
        providedProfile={clientProfile}
      />

      {/* Mobile Menu Button */}
      {isMobile && !hideMenuButton && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1400,
            opacity: isSidebarOpen ? 0 : 1,
            visibility: isSidebarOpen ? 'hidden' : 'visible',
            transition: theme.transitions.create(['opacity', 'visibility'], {
              easing: theme.transitions.easing.easeInOut,
              duration: 100, // Very fast animation to match sidebar (150ms)
            }),
          }}
        >
          <Tooltip title={`Open Menu (${keybindHint})`}>
            <Box
              onClick={handleSidebarToggle}
              sx={{
                backgroundColor: alpha(theme.palette.secondary.main, 0.13),
                color: theme.palette.text.primary,
                width: 40,
                height: 40,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.19),
                  transform: 'scale(1.05)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  backgroundColor: alpha(theme.palette.secondary.main, 0.16),
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '3px',
                width: '18px',
                height: '18px',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Box sx={{ width: '100%', height: '2px', backgroundColor: theme.palette.text.primary, borderRadius: '1px' }} />
                <Box sx={{ width: '100%', height: '2px', backgroundColor: theme.palette.text.primary, borderRadius: '1px' }} />
                <Box sx={{ width: '100%', height: '2px', backgroundColor: theme.palette.text.primary, borderRadius: '1px' }} />
              </Box>
            </Box>
          </Tooltip>
        </Box>
      )}

      {/* Toggle Tab - positioned outside drawer (hidden on mobile) */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            left: sidebarWidth - 2,
            top: '40%',
            transform: 'translateY(-50%)',
            zIndex: 1300,
            transition: theme.transitions.create('left', {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          <Tooltip title={`Toggle Sidebar (${keybindHint})`}>
            <Box
              onClick={handleSidebarToggle}
              sx={{
                backgroundColor: theme.palette.secondary.main,
                color: 'white',
                width: 20,
                height: 32,
                borderRadius: '0 8px 8px 0',
                border: `1px solid ${theme.palette.divider}`,
                borderLeft: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'normal',
                lineHeight: 1,
                fontFamily: 'monospace',
                boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: theme.palette.secondary.dark,
                  transform: 'translateX(2px)',
                },
                transition: 'all 0.2s ease',
                // Force perfect centering
                position: 'relative',
                '& > span': {
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }
              }}
            >
              <span>{isSidebarOpen ? '‹' : '›'}</span>
            </Box>
          </Tooltip>
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: theme.palette.background.default,
          transition: theme.transitions.create(['margin-left'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
          // On mobile, no margin since sidebar is overlay
          marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
          // Remove fixed height to allow natural scrolling
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          // Enable scrolling
          overflowY: 'auto',
          // Improve mobile scrolling
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Content Container */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            transition: theme.transitions.create(['padding'], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
            // Allow content to flow naturally
            minHeight: 0,
          }}
        >
          {isAnyLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexGrow: 1,
                minHeight: '50vh',
              }}
            >
              <RecordSpinner />
            </Box>
          ) : (
            typeof children === 'function' 
              ? children({ isSidebarOpen, isMobile })
              : children
          )}
        </Box>
      </Box>
    </Box>
  );
} 