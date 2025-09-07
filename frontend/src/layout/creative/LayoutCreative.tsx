import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Box, CssBaseline, useMediaQuery, Tooltip } from '@mui/material';
import { SidebarCreative } from './SidebarCreative';
import { useAuth } from '../../context/auth';
import { userService, type CreativeProfile } from '../../api/userService';
import demoCreativeData from '../../../demoData/creativeUserData.json';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { IntentAuthGate } from '../../components/popovers/IntentAuthGate';
import { useLoading } from '../../context/loading';
import { RecordSpinner } from '../../components/loaders/RecordSpinner';

interface LayoutCreativeProps {
  children: ReactNode | ((props: { isSidebarOpen: boolean; isMobile: boolean }) => ReactNode);
  selectedNavItem?: string;
  hideMenuButton?: boolean;
}

export function LayoutCreative({ 
  children, 
  selectedNavItem,
  hideMenuButton
}: LayoutCreativeProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // iPad Air and smaller
  const { userProfile } = useAuth();
  const { setProfileLoading, isAnyLoading } = useLoading();
  const [creativeProfile, setCreativeProfile] = useState<CreativeProfile | null>(null);
  
  // Helper function to check if we've already fetched profile for current user
  const hasFetchedProfileForUser = (userId: string) => {
    const fetchedUsers = JSON.parse(localStorage.getItem('creativeProfileFetchedUsers') || '[]');
    return fetchedUsers.includes(userId);
  };
  
  // Helper function to mark profile as fetched for current user
  const markProfileAsFetched = (userId: string) => {
    const fetchedUsers = JSON.parse(localStorage.getItem('creativeProfileFetchedUsers') || '[]');
    if (!fetchedUsers.includes(userId)) {
      fetchedUsers.push(userId);
      localStorage.setItem('creativeProfileFetchedUsers', JSON.stringify(fetchedUsers));
    }
  };
  
  // Helper function to clear fetched users (on logout)
  const clearFetchedUsers = () => {
    localStorage.removeItem('creativeProfileFetchedUsers');
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
    if (!creativeProfile) {
      setCreativeProfile(demoCreativeData as unknown as CreativeProfile);
    }
  }, []);

  // Fetch creative profile once at layout level and provide to children/sidebar
  useEffect(() => {
    const loadProfile = async () => {
      if (!userProfile) {
        setCreativeProfile(demoCreativeData as unknown as CreativeProfile);
        setProfileLoading(false);
        clearFetchedUsers();
        return;
      }
      
      // If we already fetched the profile for this user, don't fetch again
      if (hasFetchedProfileForUser(userProfile.user_id)) {
        // If we don't have profile data but we've fetched before, it means we need to restore from cache
        // For now, we'll skip the loading state since we should have the data
        setProfileLoading(false);
        return;
      }
      
      setProfileLoading(true);
      try {
        const profile = await userService.getCreativeProfile();
        setCreativeProfile(profile);
        markProfileAsFetched(userProfile.user_id);
      } catch (e) {
        setCreativeProfile(demoCreativeData as unknown as CreativeProfile);
      } finally {
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

  // Navigation logic moved from individual pages
  function handleNavItemChange(item: string) {
    switch (item) {
      case 'dashboard':
        navigate('/creative');
        break;
      case 'clients':
        navigate('/creative/clients');
        break;
      case 'activity':
        navigate('/creative/activity');
        break;
      case 'public':
        navigate('/creative/public');
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
      {/* Show auth popover only when entering with ?auth=1 */}
      <IntentAuthGate />
      
      {/* Sidebar */}
      <SidebarCreative
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
        selectedItem={selectedNavItem || 'dashboard'}
        onItemSelect={handleNavItemSelect}
        isMobile={isMobile}
        providedProfile={creativeProfile}

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
          {typeof children === 'function' 
            ? children({ isSidebarOpen, isMobile })
            : children
          }
        </Box>
      </Box>

      {/* Unified Loading Overlay */}
      {useMemo(() => 
        isAnyLoading ? (
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
              key="unified-loader" 
              size={140} 
              speed="normal" 
              variant="scratch" 
              ariaLabel="Loading application" 
            />
          </Box>
        ) : null
      , [isAnyLoading])}
    </Box>
  );
} 