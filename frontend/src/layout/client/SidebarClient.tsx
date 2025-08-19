import { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import {
  DashboardOutlined,
  CalendarTodayOutlined,
  ShoppingBagOutlined,
  Close,
  PersonOutlined,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRecordVinyl
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@mui/material/styles';
import { UserDropdownMenu } from '../../components/dialogs/UserMiniMenu';
import React from 'react';

interface SidebarClientProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedItem: string;
  onItemSelect: (item: string) => void;
  isMobile?: boolean;
}

export function SidebarClient({ isOpen, onToggle, selectedItem, onItemSelect, isMobile = false }: SidebarClientProps) {
  const theme = useTheme();
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [isUserPanelHovered, setIsUserPanelHovered] = useState(false);
  
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardOutlined },
    { id: 'book', label: 'Book', icon: CalendarTodayOutlined },
    { id: 'orders', label: 'My Orders', icon: ShoppingBagOutlined },
  ];

  // Mobile: Always 280px, use transform for hide/show
  // Desktop: 64 when closed, 280 when open
  const sidebarWidth = isMobile 
    ? 280
    : (isOpen ? 280 : 64);

  function handleUserPanelClick(event: React.MouseEvent<HTMLElement>) {
    setUserMenuAnchor(event.currentTarget);
  }

  function handleLogoClick() {
    window.location.href = '/';
  }

  return (
    <>
    {/* Mobile Overlay */}
    {isMobile && (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1100,
          backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: theme.transitions.create(['opacity', 'visibility'], {
            easing: theme.transitions.easing.easeInOut,
            duration: 100, // Very fast animation (150ms)
          }),
        }}
        onClick={onToggle}
      />
    )}

    <Box
      sx={{
        width: sidebarWidth,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
        background: `linear-gradient(180deg, #4CA6FF 0%, #3B82F6 100%)`,
        borderRight: `1px solid rgba(255, 255, 255, 0.1)`,
        transition: isMobile 
          ? theme.transitions.create(['transform'], {
              easing: theme.transitions.easing.easeInOut,
              duration: 150, // Very fast for mobile (150ms)
            })
          : theme.transitions.create('width', {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
        overflowX: 'hidden',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)',
        boxShadow: isMobile ? '0 0 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        // Mobile: slide in from left with fast animation, Desktop: keep current behavior
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        // Add padding bottom on mobile to ensure profile icon is visible
        pb: isMobile ? 6 : 0,
      }}
    >
      {/* Header with Logo */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isOpen ? 'space-between' : 'center',
        p: 3,
        minHeight: 72,
        borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
        mb: 1,
        transition: theme.transitions.create(['justify-content', 'padding'], {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.standard,
        }),
      }}>
        {isOpen && (
          <Box 
            onClick={handleLogoClick}
            sx={{ 
              display: 'flex', 
              alignItems: 'start', 
              gap: 1,
              cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faRecordVinyl} style={{ color: 'white', fontSize: '28px' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
              EZcustomers
            </Typography>
          </Box>
        )}
        {!isOpen && !isMobile && (
          <Box
            onClick={handleLogoClick}
            sx={{
              cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faRecordVinyl} style={{ color: 'white', fontSize: '28px' }} />
          </Box>
        )}
        
        {/* Close Button - Mobile Only */}
        {isMobile && isOpen && (
          <Box
            onClick={onToggle}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 1,
              transition: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            <Close 
              sx={{ 
                color: theme.palette.error.main,
                fontSize: '20px',
              }} 
            />
          </Box>
        )}
      </Box>

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, px: 2, py: 1 }}>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isSelected = selectedItem === item.id;
          
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => onItemSelect(item.id)}
                selected={isSelected}
                sx={{
                  borderRadius: 3,
                  minHeight: 52,
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  px: isOpen ? 2.5 : 1.5,
                  color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  position: 'relative',
                  transition: 'all 0.3s ease-in-out',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: 24,
                      backgroundColor: 'white',
                      borderRadius: 2,
                    },
                  },
                  '&:hover': {
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                    transform: isMobile ? 'none' : 'translateX(4px)',
                    color: 'white',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isOpen ? 2 : 'auto',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <IconComponent sx={{ color: 'white', fontSize: '20px' }} />
                </ListItemIcon>
                {isOpen && (
                  <ListItemText 
                    primary={item.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '0.95rem',
                        fontWeight: isSelected ? 600 : 300,
                        color: 'inherit',
                        letterSpacing: '0.02em',
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 1 }} />

      {/* User Panel Section */}
      {(isOpen || !isMobile) && (
        <>
          {!isOpen ? (
            // Collapsed user panel
            <Box sx={{ px: 1, pb: isMobile ? 6 : 2 }}>
              <Box
                onClick={handleUserPanelClick}
                onMouseEnter={() => setIsUserPanelHovered(true)}
                onMouseLeave={() => setIsUserPanelHovered(false)}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Avatar sx={{ 
                  width: 36, 
                  height: 36, 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease-in-out',
                  transform: isUserPanelHovered ? 'scale(1.05)' : 'scale(1)',
                }}>
                  <PersonOutlined sx={{ color: 'white', fontSize: '18px' }} />
                </Avatar>
                {/* Role Sash */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#FFCD38',
                    color: '#241E1A',
                    fontSize: '0.45rem',
                    fontWeight: 700,
                    fontVariant: 'small-caps',
                    px: 0.75,
                    py: 0.2,
                    borderRadius: '12px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                    zIndex: 2,
                  }}
                >
                  Client
                </Box>
              </Box>
            </Box>
          ) : (
            // Expanded user panel
            <Box sx={{ px: 2, pb: isMobile ? 6 : 2 }}>
                <Box
                onClick={handleUserPanelClick}
                onMouseEnter={() => setIsUserPanelHovered(true)}
                onMouseLeave={() => setIsUserPanelHovered(false)}
                sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3,
                    pt: 2,
                    pr: 2,
                    pl: 2,
                    pb: 3.25, // extra bottom padding so sash doesn’t collide with card border
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    },
                  }}
              >
                {/* User Profile Section */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ position: 'relative', mr: 2 }}>
                    <Avatar sx={{ 
                      width: 52, 
                      height: 52, 
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                      transition: 'all 0.2s ease-in-out',
                    }}>
                      <PersonOutlined sx={{ color: 'white', fontSize: '26px' }} />
                    </Avatar>
                    {/* Role Sash */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -14, // drop slightly lower to avoid border collision
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#FFCD38',
                        color: '#241E1A',
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        fontVariant: 'small-caps',
                        px: 1.2,
                        py: 0.34,
                        borderRadius: '16px',
                        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.2)',
                        zIndex: 2,
                        letterSpacing: '0.02em',
                      }}
                    >
                      Client
                    </Box>
                  </Box>
                  <Box sx={{ flexGrow: 1, pt: 0.5 }}>
                    <Typography sx={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'white',
                      letterSpacing: '0.01em',
                      lineHeight: 1.2,
                      mb: 0.5,
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    }}>
                      Demo User
                    </Typography>
                    <Typography sx={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: 400,
                      lineHeight: 1.2,
                      mb: 0.5,
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    }}>
                      Country Artist
                    </Typography>
                    {/* Status indicator removed per design request */}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>

    {/* User Dropdown Menu */}
    <UserDropdownMenu 
      anchorEl={userMenuAnchor} 
      open={Boolean(userMenuAnchor)} 
      onClose={() => setUserMenuAnchor(null)} 
      isOpen={isOpen}
    />
    </>
  );
} 