import { useEffect, useState, useRef, type ReactNode } from 'react';
import { Box, CssBaseline, useMediaQuery, Tooltip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { SidebarAdvocate } from './SidebarAdvocate';
import { useLoading } from '../../context/loading';
import { RecordSpinner } from '../../components/loaders/RecordSpinner';
import { useAuth } from '../../context/auth';
import { userService, type AdvocateProfile } from '../../api/userService';
import { DemoSignInBar } from '../../components/dialogs/DemoSignInBar';
import { IntentAuthGate } from '../../components/popovers/auth/IntentAuthGate';

interface LayoutAdvocateProps {
  children: ReactNode | ((props: { isSidebarOpen: boolean; isMobile: boolean; advocateProfile: AdvocateProfile | null }) => ReactNode);
  selectedNavItem?: string;
  hideMenuButton?: boolean;
}

export function LayoutAdvocate({ children, selectedNavItem = 'dashboard', hideMenuButton }: LayoutAdvocateProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAnyLoading, setProfileLoading } = useLoading();
  const { userProfile, isSetupInProgress } = useAuth();
  const [advocateProfile, setAdvocateProfile] = useState<AdvocateProfile | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());
  
  // Helper function to check if we've already fetched profile for current user
  const hasFetchedProfileForUser = (userId: string) => {
    const cachedProfile = localStorage.getItem(`advocateProfile_${userId}`);
    return cachedProfile !== null;
  };
  
  // Helper function to get cached profile for current user
  const getCachedProfileForUser = (userId: string) => {
    const cachedProfile = localStorage.getItem(`advocateProfile_${userId}`);
    return cachedProfile ? JSON.parse(cachedProfile) : null;
  };
  
  // Helper function to cache profile for current user
  const cacheProfileForUser = (userId: string, profile: AdvocateProfile) => {
    localStorage.setItem(`advocateProfile_${userId}`, JSON.stringify(profile));
  };
  
  // Helper function to clear cached profiles (on logout)
  const clearCachedProfiles = () => {
    // Clear all advocate profile caches
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('advocateProfile_')) {
        localStorage.removeItem(key);
      }
    });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(max-width: 960px)').matches) return false;
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

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      try {
        localStorage.setItem('sidebar-open', JSON.stringify(isSidebarOpen));
      } catch {}
    }
  }, [isSidebarOpen, isMobile]);

  // Fetch advocate profile once at layout level and provide to children/sidebar
  useEffect(() => {
    const loadProfile = async () => {
      if (!userProfile) {
        setAdvocateProfile(null);
        setProfileLoading(false);
        clearCachedProfiles();
        return;
      }
      
      // Don't fetch role-specific profiles during setup or if first_login is true
      if (isSetupInProgress || userProfile.first_login) {
        setAdvocateProfile(null);
        setProfileLoading(false);
        return;
      }
      
      // If we already fetched the profile for this user, restore from cache
      if (hasFetchedProfileForUser(userProfile.user_id)) {
        const cachedProfile = getCachedProfileForUser(userProfile.user_id);
        if (cachedProfile) {
          setAdvocateProfile(cachedProfile);
        }
        setProfileLoading(false);
        return;
      }
      
      // If we're already fetching for this user, don't start another fetch
      if (fetchingRef.current.has(userProfile.user_id)) {
        return;
      }
      
      // Check if user has advocate role
      if (!userProfile.roles.includes('advocate')) {
        setAdvocateProfile(null);
        setProfileLoading(false);
        return;
      }
      
      fetchingRef.current.add(userProfile.user_id);
      setProfileLoading(true);
      try {
        const profile = await userService.getAdvocateProfile();
        setAdvocateProfile(profile);
        cacheProfileForUser(userProfile.user_id, profile);
      } catch (e) {
        console.error('[LayoutAdvocate] Failed to load advocate profile:', e);
        setAdvocateProfile(null);
      } finally {
        fetchingRef.current.delete(userProfile.user_id);
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [userProfile, isSetupInProgress]);

  // Add keyboard shortcut for sidebar toggle (Ctrl+B or Cmd+B)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setIsSidebarOpen((prev: boolean) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sidebarWidth = isMobile ? 280 : isSidebarOpen ? 280 : 64;
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const keybindHint = isMac ? 'Cmd+B' : 'Ctrl+B';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <CssBaseline />
      {/* Show auth popover only when entering with ?auth=1 */}
      <IntentAuthGate />

      <SidebarAdvocate
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev: boolean) => !prev)}
        selectedItem={selectedNavItem}
        onItemSelect={() => { /* single dashboard item for now */ }}
        isMobile={isMobile}
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
              duration: 100,
            }),
          }}
        >
          <Tooltip title={`Open Menu (${keybindHint})`}>
            <Box
              onClick={() => setIsSidebarOpen((prev: boolean) => !prev)}
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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: theme.palette.background.default,
          transition: theme.transitions.create(['margin-left'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
          marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: 0,
          // Add bottom padding in demo mode to prevent content from being hidden by sign-in bar
          // Remove padding only when sidebar is open on mobile
          paddingBottom: (!(isMobile && isSidebarOpen) && (!userProfile || advocateProfile?.profile_source === 'demo')) ? '100px' : 0,
        }}>
          {typeof children === 'function' ? children({ isSidebarOpen, isMobile, advocateProfile }) : children}
        </Box>
      </Box>

      {/* Toggle Tab - desktop only */}
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
              onClick={() => setIsSidebarOpen((prev: boolean) => !prev)}
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

      {/* Unified Loading Overlay */}
      {isAnyLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
          }}
        >
          <RecordSpinner 
            size={140} 
            speed="normal" 
            variant="scratch" 
            ariaLabel="Loading application" 
          />
        </Box>
      )}

      {/* Demo Sign-in Bar - Hidden only when sidebar is open on mobile */}
      {!(isMobile && isSidebarOpen) && (!userProfile || advocateProfile?.profile_source === 'demo') && (
        <DemoSignInBar 
          sidebarWidth={isSidebarOpen ? 280 : 64} 
          isSidebarOpen={isSidebarOpen} 
          isMobile={isMobile} 
        />
      )}
    </Box>
  );
}


