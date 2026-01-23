import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
  import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Menu,
    MenuItem,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    styled,
    useTheme,
    useMediaQuery,
  } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRecordVinyl, faChevronDown, faBars, faTimes, faMusic, faUsers, faHandshake } from '@fortawesome/free-solid-svg-icons';
import { AnimatedButton } from '../../components/buttons/MusicButton';
import { useRoleRedirect } from '../../utils/roleRedirect';

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
  fontSize: 'clamp(14px, 1.8vw, 16px)',
  fontWeight: 500,
  padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 20px)',
  position: 'relative',
  minHeight: 'clamp(36px, 5vw, 44px)',
  whiteSpace: 'nowrap',
  transition: 'all 0.3s ease',
  willChange: 'transform',
  [theme.breakpoints.down('lg')]: {
    fontSize: '15px',
    padding: '9px 16px',
    minHeight: '40px',
  },
  [theme.breakpoints.down('md')]: {
    fontSize: '14px',
    padding: '8px 14px',
    minHeight: '38px',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '13px',
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
    transform: 'translateY(-1px)',
  },
}));

const FeaturesNavButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isMenuOpen',
})<{ isMenuOpen?: boolean }>(({ isMenuOpen, theme }) => ({
  color: '#FFFFFF',
  textTransform: 'none',
  fontSize: 'clamp(14px, 1.8vw, 16px)',
  fontWeight: 500,
  padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 20px)',
  position: 'relative',
  minHeight: 'clamp(36px, 5vw, 44px)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  whiteSpace: 'nowrap',
  transition: 'all 0.3s ease',
  willChange: 'transform',
  [theme.breakpoints.down('lg')]: {
    fontSize: '15px',
    padding: '9px 16px',
    minHeight: '40px',
  },
  [theme.breakpoints.down('md')]: {
    fontSize: '14px',
    padding: '8px 14px',
    minHeight: '38px',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '13px',
    padding: '8px 12px',
    minHeight: '36px',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: isMenuOpen ? '80%' : '0',
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
    transform: 'translateY(-1px)',
  },
}));





const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    marginTop: 'clamp(8px, 1.5vw, 12px)',
    [theme.breakpoints.up('md')]: {
      marginTop: 0,
    },
    borderRadius: 'clamp(10px, 1.5vw, 12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    border: `1px solid ${theme.palette.divider}`,
    minWidth: 'clamp(220px, 25vw, 240px)',
    padding: 'clamp(10px, 1.5vw, 12px) 0',
    backgroundColor: theme.palette.background.paper,
    backdropFilter: 'blur(10px)',
    [theme.breakpoints.down('lg')]: {
      minWidth: '220px',
      padding: '10px 0',
    },
    [theme.breakpoints.down('md')]: {
      minWidth: '200px',
      padding: '8px 0',
    },
  },
  '& .MuiMenuItem-root.Mui-selected': {
    backgroundColor: 'transparent',
  },
  '& .MuiMenuItem-root.Mui-focusVisible': {
    backgroundColor: 'transparent',
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: 'clamp(10px, 1.5vw, 12px) clamp(20px, 3vw, 24px)',
  fontSize: 'clamp(14px, 1.8vw, 16px)',
  fontWeight: 500,
  position: 'relative',
  margin: '2px clamp(8px, 1.5vw, 12px)',
  borderRadius: 'clamp(4px, 0.8vw, 6px)',
  color: theme.palette.text.primary,
  transition: 'all 0.3s ease',
  willChange: 'transform',
  minHeight: 'clamp(40px, 5vw, 44px)',
  [theme.breakpoints.down('lg')]: {
    padding: '10px 20px',
    fontSize: '15px',
    minHeight: '42px',
  },
  [theme.breakpoints.down('md')]: {
    padding: '9px 18px',
    fontSize: '14px',
    minHeight: '40px',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '0',
    height: '2px',
    bottom: 'clamp(4px, 0.8vw, 6px)',
    left: '50%',
    backgroundColor: theme.palette.secondary.main,
    transition: 'all 0.3s ease',
    transform: 'translateX(-50%)',
  },
  '&:hover': {
    backgroundColor: 'transparent',
    transform: 'translateY(-1px)',
  },
  '&:hover::after': {
    width: '60%',
  },
}));

export function Header() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { getRedirectUrl } = useRoleRedirect();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [featuresAnchorEl, setFeaturesAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(false);
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

  const handleMenuItemClick = (event: React.MouseEvent, item: string) => {
    event.stopPropagation();
    
    // Only execute if features menu is actually open and we're not in mobile mode
    if (!featuresOpen || isMobile) {
      console.log('Menu item click blocked - menu not open or in mobile mode');
      return;
    }
    
    console.log('Menu item clicked:', item);
    setFeaturesAnchorEl(null);
    
    if (item === 'Creative Features') {
      navigate('/features/creative');
    } else if (item === 'Your Clients') {
      navigate('/client-features');
    } else {
      alert(`Clicked: ${item}`);
    }
  };

  const toggleMobileMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Hamburger menu clicked');
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileSubmenuOpen(false); // Also close submenu when closing main menu
  };

  const toggleMobileSubmenu = () => {
    setMobileSubmenuOpen(!mobileSubmenuOpen);
  };

  return (
    <StyledAppBar position="fixed" elevation={0} sx={{ zIndex: 1200 }}>
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        py: { xs: 0.75, sm: 1.25, md: 2, lg: 2.5 },
        px: { xs: 1.5, sm: 2.5, md: 3.5, lg: 4.5, xl: 6 },
        pr: { xs: 1, sm: 1.5, md: 2.5, lg: 3 }, 
        minHeight: { xs: '56px', sm: '64px', md: '72px', lg: '80px' },
        overflow: 'visible',
        maxWidth: '100vw'
      }}>
        {/* Left side - Logo */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 0.75, sm: 1, md: 1.5, lg: 2 },
          minWidth: 'max-content',
          cursor: 'pointer'
        }}
          onClick={() => navigate('/')}
          role="button"
          aria-label="Go to home"
        >
          <FontAwesomeIcon 
            icon={faRecordVinyl} 
            style={{ 
              color: '#FFFFFF',
              fontSize: isSmallMobile ? '1.25rem' : 'clamp(1.4rem, 2.2vw, 2.2rem)'
            }}
          />
          <Typography 
            variant="h1"
            color="#FFFFFF"
            sx={{
              fontWeight: 500,
              fontSize: { xs: '18px', sm: '20px', md: '22px', lg: '24px', xl: '26px' },
              letterSpacing: '0.05em'
            }}
          >
            EZ
          </Typography>
        </Box>

        {/* Right side - Navigation Menu + Dashboard Button */}
        {isMobile ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 },
            minWidth: 'max-content'
          }}>
              <AnimatedButton 
              text="Dashboard"
              buttonVariant="header"
              onClick={() => navigate(`${getRedirectUrl()}?auth=1`)}
              sx={{ 
                fontSize: { xs: '13px', sm: '14px' }, 
                padding: { xs: '5px 12px', sm: '6px 16px' },
                minHeight: { xs: '32px', sm: '36px' }
              }}
            />
            <IconButton
              onClick={toggleMobileMenu}
              sx={{ 
                color: '#FFFFFF', 
                p: { xs: 0.75, sm: 1 },
                minWidth: { xs: '40px', sm: '44px' },
                minHeight: { xs: '40px', sm: '44px' }
              }}
            >
              <FontAwesomeIcon 
                icon={mobileMenuOpen ? faTimes : faBars} 
                style={{ fontSize: isSmallMobile ? '1.1rem' : '1.2rem' }}
              />
            </IconButton>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5, md: 2, lg: 2.5 },
              minWidth: 'max-content'
            }}
          >
            <NavButton 
              onClick={() => navigate('/contact')}
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
            
            {!isMobile && (
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
                
                {featuresOpen && (
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
                    transformOrigin={
                      theme.breakpoints.up('md')
                        ? { horizontal: 'center', vertical: 'top' }
                        : { horizontal: 'center', vertical: 'top' }
                    }
                    anchorOrigin={
                      theme.breakpoints.up('md')
                        ? { horizontal: 'center', vertical: 'bottom' }
                        : { horizontal: 'center', vertical: 'bottom' }
                    }
                  >
                  <StyledMenuItem 
                    onClick={(event) => handleMenuItemClick(event, 'Creative Features')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FontAwesomeIcon 
                        icon={faMusic} 
                        style={{ 
                          color: '#6C4DFF',
                          fontSize: '1rem'
                        }}
                      />
                      <Typography sx={{ fontWeight: 500 }}>Creative Features</Typography>
                    </Box>
                  </StyledMenuItem>
                  <StyledMenuItem 
                    onClick={(event) => handleMenuItemClick(event, 'Your Clients')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FontAwesomeIcon 
                        icon={faUsers} 
                        style={{ 
                          color: '#1A8FFF',
                          fontSize: '1rem'
                        }}
                      />
                      <Typography sx={{ fontWeight: 500 }}>Your Clients</Typography>
                    </Box>
                  </StyledMenuItem>
                  <StyledMenuItem 
                    onClick={(event) => handleMenuItemClick(event, 'Advocate Details')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FontAwesomeIcon 
                        icon={faHandshake} 
                        style={{ 
                          color: '#4CAF50',
                          fontSize: '1rem'
                        }}
                      />
                      <Typography sx={{ fontWeight: 500 }}>Advocate Details</Typography>
                    </Box>
                  </StyledMenuItem>
                </StyledMenu>
                )}
              </Box>
            )}

            <Box sx={{ 
              ml: { xs: 0.5, sm: 1, md: 1.5 }, 
              mr: { xs: 0.5, sm: 1, md: 1.5 },
              mt: { xs: 0.5, md: 0.5 }, 
              mb: { xs: 0.5, md: 0.5 }
            }}>
              <AnimatedButton 
                text="Dashboard"
                buttonVariant="header"
                onClick={() => navigate(`${getRedirectUrl()}?auth=1`)}
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
      
      {/* Mobile Dropdown Menu */}
      {isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'rgba(26, 143, 255, 0.95)',
            borderRadius: { xs: '0 0 12px 12px', sm: '0 0 16px 16px' },
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
            opacity: mobileMenuOpen ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: 999,
            overflow: 'hidden',
            pointerEvents: mobileMenuOpen ? 'auto' : 'none',
            willChange: 'transform, opacity',
          }}
        >
          <Box sx={{ 
            py: { xs: 1.5, sm: 2 }, 
            px: { xs: 1.5, sm: 2 },
            maxHeight: { xs: '75vh', sm: '70vh' },
            overflowY: 'auto'
          }}>
            <List sx={{ py: 0 }}>
              <ListItemButton 
                onClick={() => {
                  navigate('/contact');
                  closeMobileMenu();
                }}
                sx={{ 
                  mb: 1, 
                  borderRadius: 2,
                  py: { xs: 1, sm: 1.25 },
                  minHeight: { xs: '44px', sm: '48px' },
                  justifyContent: 'center',
                  backgroundColor: 'transparent !important',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15) !important' },
                  '&:focus': { backgroundColor: 'transparent !important' },
                  '&:active': { backgroundColor: 'rgba(255,255,255,0.15) !important' },
                  '&.Mui-selected': { backgroundColor: 'transparent !important' },
                  '&.Mui-focusVisible': { backgroundColor: 'transparent !important' },
                  '&.Mui-touched': { backgroundColor: 'transparent !important' }
                }}
                disableRipple
                disableTouchRipple
              >
                <ListItemText 
                  primary="Contact" 
                  sx={{ 
                    textAlign: 'center',
                    '& .MuiListItemText-primary': { 
                      color: '#FFFFFF', 
                      fontWeight: 500,
                      fontSize: { xs: '1rem', sm: '1.1rem' }
                    } 
                  }}
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
                  py: { xs: 1, sm: 1.25 },
                  minHeight: { xs: '44px', sm: '48px' },
                  justifyContent: 'center',
                  backgroundColor: 'transparent !important',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15) !important' },
                  '&:focus': { backgroundColor: 'transparent !important' },
                  '&:active': { backgroundColor: 'rgba(255,255,255,0.15) !important' },
                  '&.Mui-selected': { backgroundColor: 'transparent !important' },
                  '&.Mui-focusVisible': { backgroundColor: 'transparent !important' },
                  '&.Mui-touched': { backgroundColor: 'transparent !important' }
                }}
                disableRipple
                disableTouchRipple
              >
                <ListItemText 
                  primary="Pricing" 
                  sx={{ 
                    textAlign: 'center',
                    '& .MuiListItemText-primary': { 
                      color: '#FFFFFF', 
                      fontWeight: 500,
                      fontSize: { xs: '1rem', sm: '1.1rem' }
                    } 
                  }}
                />
              </ListItemButton>
              
              {/* Features with Submenu */}
              <Box sx={{ mb: 1 }}>
                <ListItemButton 
                  onClick={toggleMobileSubmenu}
                  sx={{ 
                    borderRadius: 2,
                    py: { xs: 1, sm: 1.25 },
                    minHeight: { xs: '44px', sm: '48px' },
                    justifyContent: 'center',
                    backgroundColor: 'transparent !important',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.15) !important' },
                    '&:focus': { backgroundColor: 'transparent !important' },
                    '&:active': { backgroundColor: 'rgba(255,255,255,0.15) !important' },
                    '&.Mui-selected': { backgroundColor: 'transparent !important' },
                    '&.Mui-focusVisible': { backgroundColor: 'transparent !important' },
                    '&.Mui-touched': { backgroundColor: 'transparent !important' }
                  }}
                  disableRipple
                  disableTouchRipple
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      sx={{ 
                        color: '#FFFFFF', 
                        fontWeight: 500,
                        fontSize: { xs: '1rem', sm: '1.1rem' }
                      }}
                    >
                      Features
                    </Typography>
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      style={{ 
                        color: '#FFFFFF',
                        fontSize: isSmallMobile ? '0.75rem' : '0.8rem',
                        transform: mobileSubmenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  </Box>
                </ListItemButton>
                
                {/* Submenu - Card Design */}
                <Box
                  sx={{
                    maxHeight: mobileSubmenuOpen ? { xs: '200px', sm: '220px' } : '0px',
                    opacity: mobileSubmenuOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: { xs: '10px', sm: '12px' },
                    mt: mobileSubmenuOpen ? { xs: 1, sm: 1.5 } : 0,
                    mx: { xs: 0.5, sm: 1 },
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                    willChange: 'max-height, opacity',
                  }}
                >
                  <List sx={{ py: { xs: 1, sm: 1.5 } }}>
                    <ListItemButton 
                      onClick={() => {
                        console.log('Creative Features clicked');
                        closeMobileMenu();
                      }}
                      sx={{ 
                        mb: 0.5, 
                        borderRadius: 2,
                        py: { xs: 0.75, sm: 1 },
                        mx: { xs: 0.5, sm: 1 },
                        minHeight: { xs: '40px', sm: '44px' },
                        justifyContent: 'flex-start',
                        backgroundColor: 'transparent !important',
                        '&:hover': { backgroundColor: 'rgba(26, 143, 255, 0.1) !important' },
                        '&:focus': { backgroundColor: 'transparent !important' },
                        '&:active': { backgroundColor: 'rgba(26, 143, 255, 0.1) !important' },
                        '&.Mui-selected': { backgroundColor: 'transparent !important' },
                        '&.Mui-focusVisible': { backgroundColor: 'transparent !important' },
                        '&.Mui-touched': { backgroundColor: 'transparent !important' }
                      }}
                      disableRipple
                      disableTouchRipple
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'center' }}>
                        <FontAwesomeIcon 
                          icon={faMusic} 
                          style={{ 
                            color: '#6C4DFF',
                            fontSize: isSmallMobile ? '0.9rem' : '1rem'
                          }}
                        />
                        <Typography 
                          sx={{ 
                            color: '#333333', 
                            fontWeight: 500,
                            fontSize: { xs: '0.9rem', sm: '0.95rem' }
                          }}
                        >
                          Creative Features
                        </Typography>
                      </Box>
                    </ListItemButton>
                    <ListItemButton 
                      onClick={() => {
                        console.log('Client Portal clicked');
                        closeMobileMenu();
                        navigate('/client-features');
                      }}
                      sx={{ 
                        mb: 0.5, 
                        borderRadius: 2,
                        py: { xs: 0.75, sm: 1 },
                        mx: { xs: 0.5, sm: 1 },
                        minHeight: { xs: '40px', sm: '44px' },
                        justifyContent: 'flex-start',
                        backgroundColor: 'transparent !important',
                        '&:hover': { backgroundColor: 'rgba(26, 143, 255, 0.1) !important' },
                        '&:focus': { backgroundColor: 'transparent !important' },
                        '&:active': { backgroundColor: 'rgba(26, 143, 255, 0.1) !important' },
                        '&.Mui-selected': { backgroundColor: 'transparent !important' },
                        '&.Mui-focusVisible': { backgroundColor: 'transparent !important' },
                        '&.Mui-touched': { backgroundColor: 'transparent !important' }
                      }}
                      disableRipple
                      disableTouchRipple
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'center' }}>
                        <FontAwesomeIcon 
                          icon={faUsers} 
                          style={{ 
                            color: '#1A8FFF',
                            fontSize: isSmallMobile ? '0.9rem' : '1rem'
                          }}
                        />
                        <Typography 
                          sx={{ 
                            color: '#333333', 
                            fontWeight: 500,
                            fontSize: { xs: '0.9rem', sm: '0.95rem' }
                          }}
                        >
                          Your Clients
                        </Typography>
                      </Box>
                    </ListItemButton>
                    <Box
                      onClick={() => {
                        console.log('Advocate Details clicked');
                        closeMobileMenu();
                      }}
                      sx={{ 
                        mb: 0,
                        borderRadius: 2,
                        py: { xs: 0.75, sm: 1 },
                        mx: { xs: 0.5, sm: 1 },
                        minHeight: { xs: '40px', sm: '44px' },
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        '&:hover': { backgroundColor: 'rgba(26, 143, 255, 0.1)' },
                        '&:focus': { outline: 'none' },
                        '&:active': { backgroundColor: 'rgba(26, 143, 255, 0.1)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FontAwesomeIcon 
                          icon={faHandshake} 
                          style={{ 
                            color: '#4CAF50',
                            fontSize: isSmallMobile ? '0.9rem' : '1rem'
                          }}
                        />
                        <Typography 
                          sx={{ 
                            color: '#333333', 
                            fontWeight: 500,
                            fontSize: { xs: '0.9rem', sm: '0.95rem' }
                          }}
                        >
                          Advocate Details
                        </Typography>
                      </Box>
                    </Box>
                  </List>
                </Box>
              </Box>
            </List>
          </Box>
        </Box>
      )}
      
      {/* Mobile Menu Backdrop */}
      {isMobile && (
        <Box
          onClick={closeMobileMenu}
          sx={{
            position: 'fixed',
            top: { xs: '56px', sm: '64px', md: '72px' },
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: mobileMenuOpen ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0)',
            opacity: mobileMenuOpen ? 1 : 0,
            visibility: mobileMenuOpen ? 'visible' : 'hidden',
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: 998,
            backdropFilter: mobileMenuOpen ? 'blur(2px)' : 'blur(0px)',
            pointerEvents: mobileMenuOpen ? 'auto' : 'none',
            willChange: 'opacity, backdrop-filter',
          }}
        />
      )}
    </StyledAppBar>
  );
}
