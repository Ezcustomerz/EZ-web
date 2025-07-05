import { useState, type ReactNode } from 'react';
import { Box, CssBaseline, useMediaQuery } from '@mui/material';
import { SidebarProducer } from './SidebarProducer';
import { useTheme } from '@mui/material/styles';

interface LayoutProducerProps {
  children: ReactNode | ((props: { isSidebarOpen: boolean; isMobile: boolean }) => ReactNode);
  selectedNavItem?: string;
  onNavItemChange?: (item: string) => void;
}

export function LayoutProducer({ 
  children, 
  selectedNavItem = 'dashboard',
  onNavItemChange 
}: LayoutProducerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // iPad Air and smaller
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentNavItem, setCurrentNavItem] = useState(selectedNavItem);

  function handleSidebarToggle() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  function handleNavItemSelect(item: string) {
    setCurrentNavItem(item);
    if (onNavItemChange) {
      onNavItemChange(item);
    }
    // Close sidebar on mobile after selection
    if (isMobile) {
      setIsSidebarOpen(false);
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
        selectedItem={currentNavItem}
        onItemSelect={handleNavItemSelect}
        isMobile={isMobile}
      />

      {/* Mobile Menu Button */}
      {isMobile && (
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
          <Box
            onClick={handleSidebarToggle}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              width: 48,
              height: 48,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                transform: 'scale(1.05)',
              },
              '&:active': {
                transform: 'scale(0.95)',
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
              <Box sx={{ width: '100%', height: '2px', backgroundColor: 'white', borderRadius: '1px' }} />
              <Box sx={{ width: '100%', height: '2px', backgroundColor: 'white', borderRadius: '1px' }} />
              <Box sx={{ width: '100%', height: '2px', backgroundColor: 'white', borderRadius: '1px' }} />
            </Box>
          </Box>
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