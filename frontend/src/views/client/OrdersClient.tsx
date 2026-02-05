import { Box, Paper, Tab, Tabs, Typography, useTheme, useMediaQuery, Menu, MenuItem, ListItemIcon, ListItemText, Grow, Tooltip, IconButton, Button, Badge } from '@mui/material';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { TaskAlt, HourglassEmpty, History, CheckCircle, InfoOutlined, Payment } from '@mui/icons-material';
import { paymentRequestsService } from '../../api/paymentRequestsService';
import { useAuth } from '../../context/auth';
import { AllServicesTab } from './tabs/AllOrdersTab';
import { ActiveTab } from './tabs/ActiveTab';
import { ActionNeededTab } from './tabs/ActionNeededTab';
import { HistoryTab } from './tabs/HistoryTab';

// Module-level cache to prevent duplicate fetches across remounts (React StrictMode)
let paymentCountCache: {
  promise: Promise<number> | null;
  data: number | null;
  timestamp: number;
  resolved: boolean;
} = {
  promise: null,
  data: null,
  timestamp: 0,
  resolved: false,
};

const CACHE_DURATION = 10000; // Cache for 10 seconds

const tabLabels = [
  { 
    label: 'All Orders', 
    icon: <TaskAlt sx={{ fontSize: 18, mr: 1 }} />,
    description: 'View all your orders across all statuses'
  },
  { 
    label: 'Active', 
    icon: <HourglassEmpty sx={{ fontSize: 18, mr: 1 }} />,
    description: 'Orders currently in progress or being worked on'
  },
  { 
    label: 'Action Needed', 
    icon: <CheckCircle sx={{ fontSize: 18, mr: 1 }} />,
    description: 'Orders requiring your attention or payment'
  },
  { 
    label: 'History', 
    icon: <History sx={{ fontSize: 18, mr: 1 }} />,
    description: 'Completed and past orders'
  },
];

export function ClientOrders() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [activeTab, setActiveTab] = useState(() => {
    // Check if tab is specified in URL params
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const tabNum = Number(tabParam);
      if (!isNaN(tabNum) && tabNum >= 0 && tabNum <= 3) {
        return tabNum;
      }
    }
    // Otherwise use stored value
    const stored = localStorage.getItem('orders-active-tab');
    return stored !== null ? Number(stored) : 0;
  });

  const location = useLocation();
  const mountedRef = useRef(true);
  
  // Check localStorage when component mounts or location changes (e.g., navigating from notifications)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const tabNum = Number(tabParam);
      if (!isNaN(tabNum) && tabNum >= 0 && tabNum <= 3) {
        setActiveTab(tabNum);
        localStorage.setItem('orders-active-tab', String(tabNum));
        return;
      }
    }
    const stored = localStorage.getItem('orders-active-tab');
    if (stored !== null) {
      const tabValue = Number(stored);
      if (tabValue !== activeTab && tabValue >= 0 && tabValue <= 3) {
        setActiveTab(tabValue);
      }
    }
  }, [location.pathname, searchParams]); // Check when route changes

  // Fetch pending payment requests count
  useEffect(() => {
    mountedRef.current = true;
    
    if (!isAuthenticated) {
      if (mountedRef.current) {
        setPendingPaymentCount(0);
      }
      return;
    }
    
    const now = Date.now();
    const cacheAge = now - paymentCountCache.timestamp;
    
    // Check if cached data is still valid
    if (paymentCountCache.resolved && paymentCountCache.data !== null && cacheAge < CACHE_DURATION) {
      if (mountedRef.current) {
        setPendingPaymentCount(paymentCountCache.data);
      }
      return;
    }
    
    // Check if a promise already exists - reuse it immediately
    if (paymentCountCache.promise) {
      paymentCountCache.promise
        .then(count => {
          if (mountedRef.current) {
            setPendingPaymentCount(count);
          }
        })
        .catch(() => {
          if (mountedRef.current) {
            setPendingPaymentCount(0);
          }
        });
      return;
    }
    
    // No promise exists - create one
    if (cacheAge >= CACHE_DURATION) {
      paymentCountCache.data = null;
      paymentCountCache.resolved = false;
    }
    
    paymentCountCache.timestamp = now;
    paymentCountCache.resolved = false;
    
    // Create promise synchronously - assign immediately
    const fetchPromise = paymentRequestsService.getPendingPaymentRequestsCount();
    paymentCountCache.promise = fetchPromise;
    
    fetchPromise
      .then(count => {
        paymentCountCache.data = count;
        paymentCountCache.resolved = true;
        paymentCountCache.promise = null;
        
        if (mountedRef.current) {
          setPendingPaymentCount(count);
        }
      })
      .catch(() => {
        paymentCountCache.data = 0;
        paymentCountCache.resolved = true;
        paymentCountCache.promise = null;
        
        if (mountedRef.current) {
          setPendingPaymentCount(0);
        }
      });
    
    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated]); // Only fetch when authentication status changes
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
    localStorage.setItem('orders-active-tab', String(newValue));
  };

  return (
    <LayoutClient selectedNavItem="orders">
      <Box sx={{
        px: { xs: 2, sm: 2, md: 3 },
        pb: { xs: 2, sm: 2, md: 3 },
        pt: { md: 2 },
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: '100dvh', md: '100vh', lg: '100vh' },
        height: { xs: '100dvh', md: '100vh', lg: '100vh' },
        maxHeight: { xs: '100dvh', md: '100vh', lg: '100vh' },
        overflow: { xs: 'hidden', md: 'auto', lg: 'auto' },
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
      }}>
        {/* Header Section */}
        <Box
          sx={{
            mb: 2,
            pt: { xs: 2, sm: 2, md: 1 },
            textAlign: { xs: 'center', md: 'left' },
            px: { xs: 2, md: 0 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'flex-start' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            '@media (max-height: 784px)': {
              my: 1,
            },
          }}
        >
          <Box>
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
              Orders
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
              Manage your orders
            </Typography>
          </Box>
          <Badge badgeContent={pendingPaymentCount} color="error" overlap="rectangular">
            <Button
              variant="outlined"
              startIcon={<Payment />}
              onClick={() => navigate('/client/orders/payment-requests')}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                py: 1,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: theme.palette.primary.main + '08',
                },
              }}
            >
              Payment Requests
            </Button>
          </Badge>
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
                aria-controls="mobile-orders-tab-menu"
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
                <Tooltip title={tabLabels[activeTab].description} arrow placement="top">
                  <IconButton
                    size="small"
                    sx={{ 
                      p: 0.25,
                      color: theme.palette.primary.main,
                      '&:hover': { color: theme.palette.primary.dark }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <InfoOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <History sx={{ fontSize: 18, transform: 'rotate(-25deg)', ml: 0.5, color: '#7A5FFF', transition: 'transform 0.2s', }} />
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
                id="mobile-orders-tab-menu"
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
                  <MenuItem
                    key={tab.label}
                    selected={activeTab === idx}
                    aria-label={tab.label}
                    aria-selected={activeTab === idx}
                    onClick={() => {
                      setActiveTab(idx);
                      localStorage.setItem('orders-active-tab', String(idx));
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
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {tab.label}
                          <Tooltip title={tab.description} arrow placement="top">
                            <IconButton
                              size="small"
                              sx={{ 
                                p: 0.25,
                                color: 'text.secondary',
                                '&:hover': { color: theme.palette.primary.main }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <InfoOutlined sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      } 
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '1.01rem' }} 
                    />
                    <History sx={{ fontSize: 16, color: '#b7aaff', ml: 1, opacity: activeTab === idx ? 1 : 0.5, transform: 'rotate(-25deg)' }} />
                  </MenuItem>
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
                      <Tooltip title={tab.description} arrow placement="top">
                        <Box
                          component="span"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ 
                            p: 0.25,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            color: activeTab === idx ? theme.palette.primary.main : 'text.secondary',
                            '&:hover': { 
                              color: theme.palette.primary.main,
                              backgroundColor: theme.palette.action.hover
                            }
                          }}
                        >
                          <InfoOutlined sx={{ fontSize: 14 }} />
                        </Box>
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
              <AllServicesTab />
            ) : activeTab === 1 ? (
              <ActiveTab />
            ) : activeTab === 2 ? (
              <ActionNeededTab />
            ) : (
              <HistoryTab />
            )}
          </Box>
        </Paper>
      </Box>
    </LayoutClient>
  );
} 