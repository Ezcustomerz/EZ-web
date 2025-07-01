import React, { useState, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  styled,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRecordVinyl, faChevronDown, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { AnimatedButton } from '../../components/buttons';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,    
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  margin: 0,
  top: 0,
  left: 0,
  right: 0,
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: '#FFFFFF',
  textTransform: 'none',
  fontSize: 'clamp(14px, 2vw, 16px)',
  fontWeight: 500,
  padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 20px)',
  position: 'relative',
  minHeight: 'clamp(36px, 6vw, 44px)',
  whiteSpace: 'nowrap',
  [theme.breakpoints.down('sm')]: {
    fontSize: '14px',
    padding: '8px 12px',
    minHeight: '36px',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '0',
    height: '2px',
    bottom: 'clamp(6px, 1vw, 8px)',
    left: '50%',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.3s ease',
    transform: 'translateX(-50%)',
  },
  '&:hover::after': {
    width: '80%',
  },
  '&:hover': {
    backgroundColor: 'transparent',
  },
}));

const FeaturesNavButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isMenuOpen',
})<{ isMenuOpen?: boolean }>(({ isMenuOpen }) => ({
  color: '#FFFFFF',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 500,
  padding: '12px 20px',
  position: 'relative',
  minHeight: '44px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: isMenuOpen ? '80%' : '0',
    height: '2px',
    bottom: '8px',
    left: '50%',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.3s ease',
    transform: 'translateX(-50%)',
  },
  '&:hover::after': {
    width: '80%',
  },
  '&:hover': {
    backgroundColor: 'transparent',
  },
}));





const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    marginTop: '12px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    border: `1px solid ${theme.palette.divider}`,
    minWidth: '240px',
    padding: '12px 0',
    backgroundColor: theme.palette.background.paper,
  },
  '& .MuiMenuItem-root.Mui-selected': {
    backgroundColor: 'transparent',
  },
  '& .MuiMenuItem-root.Mui-focusVisible': {
    backgroundColor: 'transparent',
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 500,
  position: 'relative',
  margin: '2px 12px',
  borderRadius: '6px',
  color: theme.palette.text.primary,
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '0',
    height: '2px',
    bottom: '6px',
    left: '50%',
    backgroundColor: theme.palette.secondary.main,
    transition: 'all 0.3s ease',
    transform: 'translateX(-50%)',
  },
  '&:hover': {
    backgroundColor: 'transparent',
  },
  '&:hover::after': {
    width: '60%',
  },
}));

export function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [featuresAnchorEl, setFeaturesAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const featuresOpen = Boolean(featuresAnchorEl);
  const timeoutRef = useRef<number | null>(null);

  const handleFeaturesMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    // Clear any pending close timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFeaturesAnchorEl(event.currentTarget);
  };

  const handleFeaturesMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
    // Check if we're moving to the dropdown menu
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest('#features-menu')) {
      // Moving to menu, don't close
      return;
    }
    
    // Use a small timeout to prevent flickering when moving between elements
    timeoutRef.current = window.setTimeout(() => {
      setFeaturesAnchorEl(null);
    }, 100);
  };

  const handleMenuMouseEnter = () => {
    // Clear any pending timeout when entering menu
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMenuMouseLeave = () => {
    // Close menu when leaving
    setFeaturesAnchorEl(null);
  };

  const handleCloseMenu = () => {
    // Clear any pending timeout and close immediately
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFeaturesAnchorEl(null);
  };

  const handleMenuItemClick = (item: string) => {
    alert(`Clicked: ${item}`);
    setFeaturesAnchorEl(null);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <StyledAppBar position="fixed" elevation={0} sx={{ zIndex: 1100 }}>
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        py: { xs: 0.5, sm: 1, md: 2 },
        px: { xs: 2, sm: 3, md: 4 },
        pr: { xs: 1, sm: 2, md: 3 }, // Reduced right padding to give button more space
        minHeight: { xs: '56px', sm: '60px', md: '70px' },
        overflow: 'visible' // Ensure hover effects aren't clipped
      }}>
        {/* Left side - Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
          <FontAwesomeIcon 
            icon={faRecordVinyl} 
            style={{ 
              color: '#FFFFFF',
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)'
            }}
          />
          <Typography 
            variant="h1"
            color="#FFFFFF"
            sx={{
              fontWeight: 500,
              fontSize: { xs: '20px', md: '24px' }
            }}
          >
            EZ
          </Typography>
        </Box>

        {/* Right side - Navigation Menu + Dashboard Button */}
        {isMobile ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnimatedButton 
              text="Dashboard"
              buttonVariant="header"
              onClick={() => alert('Dashboard clicked')}
              sx={{ fontSize: '14px', padding: '6px 16px' }}
            />
            <IconButton
              onClick={toggleMobileMenu}
              sx={{ color: '#FFFFFF', p: 1 }}
            >
              <FontAwesomeIcon 
                icon={mobileMenuOpen ? faTimes : faBars} 
                style={{ fontSize: '1.2rem' }}
              />
            </IconButton>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5, md: 2 }
            }}
          >
            <NavButton 
              onClick={() => console.log('Contact clicked')}
              onMouseEnter={() => {
                if (featuresOpen) {
                  handleCloseMenu();
                }
              }}
            >
              Contact
            </NavButton>
            
            <NavButton 
              onClick={() => console.log('Pricing clicked')}
              onMouseEnter={() => {
                if (featuresOpen) {
                  handleCloseMenu();
                }
              }}
            >
              Pricing
            </NavButton>
            
            <Box
              sx={{ position: 'relative' }}
            >
              <FeaturesNavButton
                isMenuOpen={featuresOpen}
                aria-controls={featuresOpen ? 'features-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={featuresOpen ? 'true' : undefined}
                onMouseEnter={handleFeaturesMouseEnter}
                onMouseLeave={handleFeaturesMouseLeave}
              >
                Features
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  size="sm"
                  style={{ 
                    marginLeft: '4px',
                    color: '#FFFFFF'
                  }}
                />
              </FeaturesNavButton>
              
              <StyledMenu
                id="features-menu"
                anchorEl={featuresAnchorEl}
                open={featuresOpen}
                onClose={() => setFeaturesAnchorEl(null)}
                disableAutoFocusItem
                slotProps={{
                  paper: {
                    onMouseEnter: handleMenuMouseEnter,
                    onMouseLeave: handleMenuMouseLeave,
                  }
                }}
                transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
              >
                <StyledMenuItem 
                  onClick={() => handleMenuItemClick('Producer Features')}
                >
                  Producer Features
                </StyledMenuItem>
                <StyledMenuItem 
                  onClick={() => handleMenuItemClick('Client Features')}
                >
                  Client Features
                </StyledMenuItem>
                <StyledMenuItem 
                  onClick={() => handleMenuItemClick('Advocate Details')}
                >
                  Advocate Details
                </StyledMenuItem>
              </StyledMenu>
            </Box>

            <Box sx={{ ml: 1, mr: 1, mt: 0.5, mb: 0.5 }}>
              <AnimatedButton 
                text="Dashboard"
                buttonVariant="header"
                onClick={() => alert('Dashboard clicked')}
                onMouseEnter={() => {
                  if (featuresOpen) {
                    handleCloseMenu();
                  }
                }}
              />
            </Box>
          </Box>
        )}
      </Toolbar>
      
      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: theme.palette.secondary.main,
            color: '#FFFFFF',
            pt: 2,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#FFFFFF', textAlign: 'center' }}>
            Navigation
          </Typography>
          <List>
            <ListItemButton 
              onClick={() => {
                console.log('Contact clicked');
                closeMobileMenu();
              }}
              sx={{ 
                mb: 1, 
                borderRadius: 2,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ListItemText 
                primary="Contact" 
                sx={{ '& .MuiListItemText-primary': { color: '#FFFFFF', fontWeight: 500 } }}
              />
            </ListItemButton>
            <ListItemButton 
              onClick={() => {
                console.log('Pricing clicked');
                closeMobileMenu();
              }}
              sx={{ 
                mb: 1, 
                borderRadius: 2,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ListItemText 
                primary="Pricing" 
                sx={{ '& .MuiListItemText-primary': { color: '#FFFFFF', fontWeight: 500 } }}
              />
            </ListItemButton>
            <ListItemButton 
              onClick={() => {
                handleMenuItemClick('Producer Features');
                closeMobileMenu();
              }}
              sx={{ 
                mb: 1, 
                borderRadius: 2,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ListItemText 
                primary="Producer Features" 
                sx={{ '& .MuiListItemText-primary': { color: '#FFFFFF', fontWeight: 500 } }}
              />
            </ListItemButton>
            <ListItemButton 
              onClick={() => {
                handleMenuItemClick('Client Features');
                closeMobileMenu();
              }}
              sx={{ 
                mb: 1, 
                borderRadius: 2,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ListItemText 
                primary="Client Features" 
                sx={{ '& .MuiListItemText-primary': { color: '#FFFFFF', fontWeight: 500 } }}
              />
            </ListItemButton>
            <ListItemButton 
              onClick={() => {
                handleMenuItemClick('Advocate Details');
                closeMobileMenu();
              }}
              sx={{ 
                mb: 1, 
                borderRadius: 2,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ListItemText 
                primary="Advocate Details" 
                sx={{ '& .MuiListItemText-primary': { color: '#FFFFFF', fontWeight: 500 } }}
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </StyledAppBar>
  );
}
