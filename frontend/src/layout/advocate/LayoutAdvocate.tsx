import { useEffect, useState, type ReactNode } from 'react';
import { Box, CssBaseline, useMediaQuery, Tooltip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { SidebarAdvocate } from './SidebarAdvocate';
import { useLoading } from '../../context/loading';
import { RecordSpinner } from '../../components/loaders/RecordSpinner';

interface LayoutAdvocateProps {
  children: ReactNode | ((props: { isSidebarOpen: boolean; isMobile: boolean }) => ReactNode);
  selectedNavItem?: string;
}

export function LayoutAdvocate({ children, selectedNavItem = 'dashboard' }: LayoutAdvocateProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAnyLoading } = useLoading();

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

      <SidebarAdvocate
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev: boolean) => !prev)}
        selectedItem={selectedNavItem}
        onItemSelect={() => { /* single dashboard item for now */ }}
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
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
            typeof children === 'function' ? children({ isSidebarOpen, isMobile }) : children
          )}
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
    </Box>
  );
}


