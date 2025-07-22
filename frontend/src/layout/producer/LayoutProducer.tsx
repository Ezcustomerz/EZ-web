import { useState, useEffect, type ReactNode } from 'react';
import { Box, CssBaseline, useMediaQuery, Tooltip } from '@mui/material';
import { SidebarProducer } from './SidebarProducer';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

interface LayoutProducerProps {
  children: ReactNode | ((props: { isSidebarOpen: boolean; isMobile: boolean }) => ReactNode);
  selectedNavItem?: string;
  hideMenuButton?: boolean;
}

export function LayoutProducer({ 
  children, 
  selectedNavItem,
  hideMenuButton
}: LayoutProducerProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // iPad Air and smaller
  
  // Initialize sidebar open state from localStorage or mobile detection
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(max-width: 960px)').matches) {
        // Mobile: always closed
        return false;
      }
        try {
          const saved = localStorage.getItem('producer-sidebar-open');
        return saved !== null ? JSON.parse(saved) : true;
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

  // Save sidebar state to localStorage for desktop (after initialization)
  useEffect(() => {
    if (!isMobile) {
      try {
        localStorage.setItem('producer-sidebar-open', JSON.stringify(isSidebarOpen));
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
        navigate('/producer');
        break;
      case 'clients':
        navigate('/producer/clients');
        break;
      case 'income':
        navigate('/producer/income');
        break;
      case 'public':
        navigate('/producer/public');
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
      <SidebarProducer
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
        selectedItem={selectedNavItem || 'dashboard'}
        onItemSelect={handleNavItemSelect}
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
              duration: 100, // Very fast animation to match sidebar (150ms)
            }),
          }}
        >
          <Tooltip title={`Open Menu (${keybindHint})`}>
            <Box
              onClick={handleSidebarToggle}
              sx={{
                backgroundColor: alpha(theme.palette.secondary.main, 0.13),
                backdropFilter: 'blur(2px)',
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
    </Box>
  );
} 