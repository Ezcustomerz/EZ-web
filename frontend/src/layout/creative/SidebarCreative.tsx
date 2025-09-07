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
  Button,
  Tooltip,
  useMediaQuery,
  Snackbar,
} from '@mui/material';
import {
  DashboardOutlined,
  PeopleOutlined,
  AttachMoneyOutlined,
  PublicOutlined,
  Close,
  PersonOutlined,
  StarOutline,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRecordVinyl
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@mui/material/styles';
import { InviteClientButton } from '../../components/buttons/CassetteButton';
import { UserDropdownMenu } from '../../components/dialogs/UserMiniMenu';
import { useAuth } from '../../context/auth';
import { type CreativeProfile } from '../../api/userService';
import React from 'react';

import demoCreativeData from '../../../demoData/creativeUserData.json';

interface SidebarCreativeProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedItem: string;
  onItemSelect: (item: string) => void;
  isMobile?: boolean;
  providedProfile?: CreativeProfile | null;
}

export function SidebarCreative({ isOpen, onToggle, selectedItem, onItemSelect, isMobile = false, providedProfile }: SidebarCreativeProps) {
  const theme = useTheme();
  const { userProfile, session } = useAuth();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [isUserPanelHovered, setIsUserPanelHovered] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  // Use provided profile from LayoutCreative
  const creativeProfile = providedProfile ?? (demoCreativeData as unknown as CreativeProfile);
  const [forceDemoMode] = useState(false);
  const demoPillRef = React.useRef<HTMLDivElement | null>(null);

  // Helper function to format storage
  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  // Helper function to calculate storage percentage
  const getStoragePercentage = () => {
    if (!creativeProfile || creativeProfile.storage_limit_bytes === 0) return 0;
    return (creativeProfile.storage_used_bytes / creativeProfile.storage_limit_bytes) * 100;
  };

  // Helper function to detect demo mode
  const isDemoMode = () => {
    return forceDemoMode || 
      (userProfile && (
        userProfile.avatar_source === 'demo' || 
        userProfile.roles.includes('demo') || 
        userProfile.email?.includes('demo') ||
        userProfile.name?.toLowerCase().includes('demo')
      ));
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardOutlined },
    { id: 'clients', label: 'Clients', icon: PeopleOutlined },
    { id: 'activity', label: 'Activity', icon: AttachMoneyOutlined },
    { id: 'public', label: 'Public', icon: PublicOutlined },
  ];

  // Mobile: Always 280px, use transform for hide/show
  // Desktop: 64 when closed, 280 when open
  const sidebarWidth = isMobile 
    ? 280
    : (isOpen ? 280 : 64);

  function handleInviteClient() {
    console.log('Invite client clicked');
    // Add your invite client logic here
  }

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

      {/* Invite Client Button */}
      {(isOpen || !isMobile) && (
        <InviteClientButton onClick={handleInviteClient} isOpen={isOpen} />
      )}

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
            <Box sx={{ px: 1, pb: { xs: 7, md: 2 } }}>
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
                 }}
                   src={userProfile?.profile_picture_url || session?.user?.user_metadata?.avatar_url || undefined}
                   alt={creativeProfile?.display_name || userProfile?.name || 'User'}
                 >
                   <PersonOutlined sx={{ color: 'white', fontSize: '18px' }} />
                 </Avatar>
                {/* Role Sash */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: isDemoMode() ? '#FF9800' : '#FFCD38',
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
                  {isDemoMode() ? 'Demo' : 'Creative'}
                </Box>
              </Box>
            </Box>
          ) : (
            // Expanded user panel
            <Box sx={{ px: 2, pb: { xs: 7, md: 2 } }}>
              <Box
                onClick={handleUserPanelClick}
                onMouseEnter={() => setIsUserPanelHovered(true)}
                onMouseLeave={() => setIsUserPanelHovered(false)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 3,
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                {/* User Profile Section */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ position: 'relative', mr: 1.5 }}>
                                         <Avatar sx={{ 
                       width: 48, 
                       height: 48, 
                       backgroundColor: 'rgba(255, 255, 255, 0.2)',
                       border: '2px solid rgba(255, 255, 255, 0.3)',
                       boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                     }}
                       src={userProfile?.profile_picture_url || session?.user?.user_metadata?.avatar_url || undefined}
                       alt={creativeProfile?.display_name || userProfile?.name || 'User'}
                     >
                       <PersonOutlined sx={{ color: 'white', fontSize: '24px' }} />
                     </Avatar>
                    {/* Role Sash */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: isDemoMode() ? '#FF9800' : '#FFCD38',
                        color: '#241E1A',
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        fontVariant: 'small-caps',
                        px: 1,
                        py: 0.25,
                        borderRadius: '14px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                        zIndex: 2,
                      }}
                    >
                      {isDemoMode() ? 'Demo' : 'Creative'}
                    </Box>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'white',
                      letterSpacing: '0.01em',
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}>
                      {creativeProfile?.display_name || userProfile?.name || 'Loading...'}
                    </Typography>
                                         <Typography sx={{
                       fontSize: '0.75rem',
                       color: 'rgba(255, 255, 255, 0.8)',
                       fontWeight: 300,
                       lineHeight: 1.1,
                       mb: 0.75,
                     }}>
                       {creativeProfile?.title || 'Loading...'}
                     </Typography>
                                         <Box
                       ref={demoPillRef}
                       sx={{
                       backgroundColor: isDemoMode() ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                       color: 'rgba(255, 255, 255, 0.9)',
                       fontSize: '0.6rem',
                       fontWeight: 600,
                       px: 1,
                       py: 0.25,
                       borderRadius: '12px',
                       letterSpacing: '0.02em',
                       border: isDemoMode() ? '1px solid rgba(255, 193, 7, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                       display: 'flex',
                       alignItems: 'center',
                       gap: 0.5,
                       width: 'fit-content',
                         cursor: isMobileView ? 'pointer' : 'default',
                       }}
                       onClick={(e) => {
                         e.stopPropagation();
                         if (isMobileView) {
                           setSnackbarOpen(true);
                         }
                       }}
                     >
                      {isMobileView ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarOutline sx={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }} />
                          {creativeProfile?.subscription_tier || 'Loading...'}
                        </Box>
                      ) : (
                        <Tooltip
                          title={`Current plan: ${creativeProfile?.subscription_tier || 'Loading...'}`}
                          arrow
                          placement="top"
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarOutline sx={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }} />
                            {creativeProfile?.subscription_tier || 'Loading...'}
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>
                
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

                {/* Storage Section */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      letterSpacing: '0.01em'
                    }}>
                      Storage
                    </Typography>
                                                               <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            px: 1,
                            py: 0.25,
                            minWidth: 'auto',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: 1.5,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.3)',
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          Upgrade
                        </Button>
                      </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    mb: 1,
                    fontSize: '0.75rem',
                    fontWeight: 400
                  }}>
                    {`${formatStorage(creativeProfile?.storage_used_bytes || 0)} of ${formatStorage(creativeProfile?.storage_limit_bytes || 0)} used`}
                  </Typography>
                  
                  <Box sx={{
                    width: '100%',
                    height: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 0.5,
                    position: 'relative',
                  }}>
                    {/* Storage progress bar */}
                    <Box sx={{
                      width: `${getStoragePercentage()}%`,
                      height: '100%',
                      backgroundColor: getStoragePercentage() > 80 ? theme.palette.error.main : theme.palette.success.main,
                      borderRadius: 2,
                      transition: 'width 0.3s ease-in-out',
                    }} />
                  </Box>
                  
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '0.65rem',
                    fontWeight: 300
                  }}>
                    {`${formatStorage((creativeProfile?.storage_limit_bytes || 0) - (creativeProfile?.storage_used_bytes || 0))} remaining`}
                  </Typography>
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
         <Snackbar
       open={snackbarOpen}
       autoHideDuration={2500}
       onClose={() => setSnackbarOpen(false)}
       message={isDemoMode() ? "Demo mode is active - using demo data instead of API calls" : "Demo mode does not allow real transactions, so no percentage fee is taken from the user."}
       anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
     />
    </>
  );
} 