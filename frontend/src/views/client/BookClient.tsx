import { Box, Paper, Tab, Tabs, Typography, useTheme, useMediaQuery, Menu, MenuItem, ListItemIcon, ListItemText, Grow } from '@mui/material';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { useState } from 'react';
import { People, MusicNote } from '@mui/icons-material';
import { ConnectedProducersTab } from './tabs/ConnectedProducersTab';
import { ConnectedServicesTab } from './tabs/ConnectedServicesTab';

const tabLabels = [
  { label: 'Connected Producers', icon: <People sx={{ fontSize: 18, mr: 1 }} /> },
  { label: 'Connected Services', icon: <MusicNote sx={{ fontSize: 18, mr: 1 }} /> },
];

export function ClientBook() {
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('book-active-tab');
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
    localStorage.setItem('book-active-tab', String(newValue));
  };

  return (
    <LayoutClient selectedNavItem="book">
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
            Book
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
            Connect with producers and browse services
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
                aria-controls="mobile-book-tab-menu"
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
                id="mobile-book-tab-menu"
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
                      localStorage.setItem('book-active-tab', String(idx));
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
                    <MusicNote sx={{ fontSize: 16, color: '#b7aaff', ml: 1, opacity: activeTab === idx ? 1 : 0.5, transform: 'rotate(-25deg)' }} />
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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
              <ConnectedProducersTab />
            ) : (
              <ConnectedServicesTab />
            )}
          </Box>
        </Paper>
      </Box>
    </LayoutClient>
  );
}



 