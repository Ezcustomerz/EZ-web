import { Box, Paper, Tab, Tabs, Typography, useTheme, useMediaQuery, Menu, MenuItem, ListItemIcon, ListItemText, Grow, Tooltip } from '@mui/material';
import { LayoutCreative } from '../../layout/creative/LayoutCreative';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ReceiptLong, BarChart, MusicNote, Payment, InfoOutlined } from '@mui/icons-material';
import { CurrentOrdersTab } from './tabs/CurrentOrdersTab';
import { PastOrdersTab } from './tabs/PastOrdersTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';

const tabLabels = [
  { 
    label: 'Current Orders', 
    icon: <ReceiptLong sx={{ fontSize: 18, mr: 1 }} />,
    description: 'View and manage all your active orders currently in progress'
  },
  { 
    label: 'Past Orders', 
    icon: <Payment sx={{ fontSize: 18, mr: 1 }} />,
    description: 'Review completed orders and payment history'
  },
  { 
    label: 'Analytics', 
    icon: <BarChart sx={{ fontSize: 18, mr: 1 }} />,
    description: 'Track your earnings, performance metrics, and service breakdown'
  },
];

export function ActivityCreative() {
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('activity-active-tab');
    return stored !== null ? Number(stored) : 0;
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    localStorage.setItem('activity-active-tab', String(newValue));
  };

  // Check for order popover to open from notification
  const [orderIdToOpen, setOrderIdToOpen] = useState<string | null>(() => {
    const stored = localStorage.getItem('open-order-popover');
    if (stored) {
      localStorage.removeItem('open-order-popover');
      return stored;
    }
    return null;
  });

  // When orderIdToOpen is set, also check and apply the correct tab from localStorage
  useEffect(() => {
    if (orderIdToOpen) {
      const storedTab = localStorage.getItem('activity-active-tab');
      if (storedTab !== null) {
        const tabToUse = Number(storedTab);
        if (activeTab !== tabToUse) {
          setActiveTab(tabToUse);
        }
      }
    }
  }, [orderIdToOpen]); // Only depend on orderIdToOpen, not activeTab to avoid loops

  // Also check on mount in case we're navigating to this page with a pending order
  useEffect(() => {
    const pendingOrder = localStorage.getItem('open-order-popover');
    if (pendingOrder && !orderIdToOpen) {
      const storedTab = localStorage.getItem('activity-active-tab');
      if (storedTab !== null) {
        const tabToUse = Number(storedTab);
        if (activeTab !== tabToUse) {
          setActiveTab(tabToUse);
        }
      }
    }
  }, []); // Only run on mount

  // Fallback: if order not found in the selected tab, try the other tab
  const hasTriedOtherTabRef = useRef<string | null>(null);
  const handleOrderNotFound = useCallback(() => {
    if (orderIdToOpen && hasTriedOtherTabRef.current !== orderIdToOpen) {
      hasTriedOtherTabRef.current = orderIdToOpen;
      // Switch to the other tab
      const otherTab = activeTab === 0 ? 1 : 0;
      setActiveTab(otherTab);
      localStorage.setItem('activity-active-tab', String(otherTab));
      // Clear the ref when orderIdToOpen changes so we can search again
      if (orderIdToOpen) {
        // Reset the ref after a short delay to allow the new tab to load
        setTimeout(() => {
          hasTriedOtherTabRef.current = null;
        }, 100);
      }
    }
  }, [orderIdToOpen, activeTab]);

  return (
    <LayoutCreative selectedNavItem="activity">
      <Box
        sx={{
        px: { xs: 2, sm: 2, md: 3 },
        pb: { xs: 2, sm: 2, md: 3 },
        pt: { md: 2 },
        minHeight: { xs: '100dvh', md: '100vh' },
        height: { xs: '100dvh', md: '100vh' },
        maxHeight: { xs: '100dvh', md: '100vh' },
        overflow: { xs: 'hidden', md: 'auto' },
        display: 'flex',
        flexDirection: 'column',
        animation: 'pageSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        '@keyframes pageSlideIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        '@media (max-height: 784px)': {
          p: { xs: 1, sm: 1.5, md: 2 },
          pt: { md: 1 },
        },
        }}
      >
        {/* Page Header */}
        <Box
          sx={{
            mb: 2,
            pt: { xs: 2, sm: 2, md: 1 },
            textAlign: { xs: 'center', md: 'left' },
            px: { xs: 2, md: 0 },
            '@media (max-height: 784px)': {
              my: 1,
            },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
              color: 'primary.main',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              mb: 0.25,
            }}
          >
            Activity
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{
              fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
              fontWeight: 400,
              color: 'text.secondary',
              letterSpacing: '0.01em',
            }}
          >
            Track your earnings and manage requests
          </Typography>
        </Box>

        {/* Tabs + content */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 0',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {isMobile ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Box
                component="button"
                aria-label={`Current tab: ${tabLabels[activeTab].label}`}
                aria-haspopup="menu"
                aria-controls="mobile-activity-tab-menu"
                onClick={handleMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2.2,
                  py: 1.1,
                  borderRadius: '12px',
                  background: '#f7f7fb',
                  boxShadow: theme.shadows[1],
                  border: '1.5px solid #e0e0f7',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: theme.palette.primary.main,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 0,
                  transition: 'box-shadow 0.18s, border 0.18s, background 0.18s',
                  '&:hover, &:focus': {
                    background: '#edeaff',
                    boxShadow: theme.shadows[4],
                    borderColor: '#b7aaff',
                  },
                  position: 'relative',
                }}
              >
                {tabLabels[activeTab].icon}
                <span style={{ fontWeight: 700, fontSize: '1.05rem', marginRight: 6 }}>{tabLabels[activeTab].label}</span>
                <MusicNote sx={{ fontSize: 18, transform: 'rotate(-25deg)', ml: 0.5, color: '#7A5FFF', transition: 'transform 0.2s', }} />
                {/* Down arrow for dropdown indication */}
                <Box component="span" sx={{ ml: 1, display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: Boolean(anchorEl) ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10l5 5 5-5" stroke="#7A5FFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
                {/* Animated underline for selected */}
                <Box sx={{
                  position: 'absolute',
                  left: 18,
                  right: 18,
                  bottom: 5,
                  height: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #b7aaff 0%, #7A5FFF 100%)',
                  opacity: 0.7,
                  transform: 'scaleX(0.7)',
                  transition: 'opacity 0.2s',
                  animation: 'waveUnderline 1.2s infinite alternate',
                  '@keyframes waveUnderline': {
                    '0%': { opacity: 0.7, transform: 'scaleX(0.7)' },
                    '100%': { opacity: 1, transform: 'scaleX(1)' },
                  },
                }} />
              </Box>
              <Menu
                id="mobile-activity-tab-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                TransitionComponent={Grow}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: '12px',
                    boxShadow: theme.shadows[4],
                    minWidth: 180,
                    p: 0.5,
                  },
                }}
                MenuListProps={{
                  'aria-label': 'Select view',
                  sx: { p: 0 },
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
              >
                {tabLabels.map((tab, idx) => (
                  <Tooltip 
                    key={tab.label}
                    title={tab.description}
                    arrow
                    placement="right"
                    enterDelay={500}
                  >
                    <MenuItem
                      selected={activeTab === idx}
                      aria-label={tab.label}
                      aria-selected={activeTab === idx}
                      onClick={() => {
                        setActiveTab(idx);
                        localStorage.setItem('activity-active-tab', String(idx));
                        handleMenuClose();
                      }}
                      sx={{
                        borderRadius: '8px',
                        my: 0.5,
                        px: 2,
                        py: 1.2,
                        background: activeTab === idx ? 'linear-gradient(90deg, #edeaff 0%, #f7f7fb 100%)' : 'none',
                        color: activeTab === idx ? theme.palette.primary.main : theme.palette.text.primary,
                        fontWeight: activeTab === idx ? 700 : 500,
                        transition: 'background 0.18s, color 0.18s',
                        '&:hover, &:focus': {
                          background: 'linear-gradient(90deg, #edeaff 0%, #f7f7fb 100%)',
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, mr: 1.2, color: theme.palette.primary.main }}>
                        {tab.icon}
                      </ListItemIcon>
                      <ListItemText primary={tab.label} primaryTypographyProps={{ fontWeight: 700, fontSize: '1.01rem' }} />
                      <InfoOutlined sx={{ fontSize: 16, color: '#b7aaff', ml: 0.5, opacity: 0.6 }} />
                      <MusicNote sx={{ fontSize: 16, color: '#b7aaff', ml: 0.5, opacity: activeTab === idx ? 1 : 0.5, transform: 'rotate(-25deg)' }} />
                    </MenuItem>
                  </Tooltip>
                ))}
              </Menu>
            </Box>
          ) : (
            <Tabs
              value={activeTab}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                borderBottom: `2px solid ${theme.palette.divider}`,
              }}
            >
              {tabLabels.map((tab, idx) => (
                <Tab
                  key={tab.label}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {tab.icon}
                      <Typography
                        sx={{
                          fontWeight: activeTab === idx ? 600 : 500,
                          fontSize: { xs: '0.85rem', sm: '0.95rem' },
                          color:
                            activeTab === idx
                              ? theme.palette.primary.main
                              : theme.palette.text.primary,
                          textTransform: 'none',
                        }}
                      >
                        {tab.label}
                      </Typography>
                      <Tooltip 
                        title={tab.description}
                        arrow
                        placement="top"
                        enterDelay={300}
                        sx={{
                          '& .MuiTooltip-tooltip': {
                            fontSize: '0.85rem',
                            maxWidth: 250,
                          },
                        }}
                      >
                        <InfoOutlined 
                          sx={{ 
                            fontSize: 16, 
                            ml: 0.5,
                            color: activeTab === idx ? theme.palette.primary.main : 'text.secondary',
                            opacity: 0.7,
                            transition: 'opacity 0.2s, color 0.2s',
                            '&:hover': {
                              opacity: 1,
                              color: theme.palette.primary.main,
                            },
                          }} 
                        />
                      </Tooltip>
                    </Box>
                  }
                  disableRipple
                  sx={{
                    px: 4,
                    minHeight: 48,
                    borderBottom:
                      activeTab === idx
                        ? `2px solid ${theme.palette.primary.main}`
                        : '2px solid transparent',
                  }}
                />
              ))}
            </Tabs>
          )}

          {/* Animated tab content placeholder */}
          <Box
            key={activeTab}
            sx={{
              minHeight: 0,
              width: '100%',
              flex: '1 1 0',
              display: 'flex',
              flexDirection: 'column',
              px: 2,
              pb: 2,
              position: 'relative',
              overflow: 'auto',
              animation: 'fadeSlideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              '@keyframes fadeSlideIn': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(24px) scale(0.98)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0) scale(1)',
                },
              },
            }}
          >
            {activeTab === 0 ? (
              <CurrentOrdersTab 
                orderIdToOpen={orderIdToOpen} 
                onOrderOpened={() => {
                  setOrderIdToOpen(null);
                  hasTriedOtherTabRef.current = null;
                }}
                onOrderNotFound={handleOrderNotFound}
              />
            ) : activeTab === 1 ? (
              <PastOrdersTab 
                orderIdToOpen={orderIdToOpen} 
                onOrderOpened={() => {
                  setOrderIdToOpen(null);
                  hasTriedOtherTabRef.current = null;
                }}
              />
            ) : (
              <AnalyticsTab />
            )}
          </Box>
        </Paper>
        </Box>
    </LayoutCreative>
  );
} 
