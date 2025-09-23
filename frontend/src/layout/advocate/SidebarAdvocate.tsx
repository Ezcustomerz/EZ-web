import { useState, useEffect, useRef } from 'react';
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
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  DashboardOutlined,
  Close,
  PersonOutlined,
  EmojiEventsOutlined,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRecordVinyl } from '@fortawesome/free-solid-svg-icons';
import { UserDropdownMenu } from '../../components/dialogs/UserMiniMenu';
import { useAuth } from '../../context/auth';
import { useLoading } from '../../context/loading';
import { userService, type AdvocateProfile } from '../../api/userService';
import advocateUserData from '../../../demoData/advocateUserData.json';

interface SidebarAdvocateProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedItem: string;
  onItemSelect: (item: string) => void;
  isMobile?: boolean;
}

export function SidebarAdvocate({ isOpen, onToggle, selectedItem, onItemSelect, isMobile = false }: SidebarAdvocateProps) {
  const theme = useTheme();
  const { userProfile, isSetupInProgress } = useAuth();
  const { setProfileLoading } = useLoading();
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [isUserPanelHovered, setIsUserPanelHovered] = useState(false);
  const [advocateProfile, setAdvocateProfile] = useState<AdvocateProfile | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());
  
  // Helper function to check if we've already fetched profile for current user
  const hasFetchedProfileForUser = (userId: string) => {
    const cachedProfile = localStorage.getItem(`advocateProfile_${userId}`);
    return cachedProfile !== null;
  };
  
  // Helper function to get cached profile for current user
  const getCachedProfileForUser = (userId: string) => {
    const cachedProfile = localStorage.getItem(`advocateProfile_${userId}`);
    return cachedProfile ? JSON.parse(cachedProfile) : null;
  };
  
  // Helper function to cache profile for current user
  const cacheProfileForUser = (userId: string, profile: AdvocateProfile) => {
    localStorage.setItem(`advocateProfile_${userId}`, JSON.stringify(profile));
  };
  
  // Helper function to clear cached profiles (on logout)
  const clearCachedProfiles = () => {
    // Clear all advocate profile caches
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('advocateProfile_')) {
        localStorage.removeItem(key);
      }
    });
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardOutlined },
  ];

  const sidebarWidth = isMobile ? 280 : (isOpen ? 280 : 64);


  // Initialize with demo data on component mount
  useEffect(() => {
    if (!advocateProfile) {
      setAdvocateProfile(advocateUserData as unknown as AdvocateProfile);
    }
  }, []);

  // Fetch advocate profile when userProfile changes
  useEffect(() => {
    console.log('[SidebarAdvocate] useEffect triggered', { 
      userProfile: userProfile?.user_id, 
      hasProfile: !!advocateProfile,
      hasFetched: userProfile ? hasFetchedProfileForUser(userProfile.user_id) : false,
      isFetching: userProfile ? fetchingRef.current.has(userProfile.user_id) : false
    });
    
    const loadProfile = async () => {
      if (!userProfile) {
        console.log('[SidebarAdvocate] No userProfile, setting demo data');
        setAdvocateProfile(advocateUserData as unknown as AdvocateProfile);
        setProfileLoading(false);
        clearCachedProfiles();
        return;
      }
      
      // Don't fetch role-specific profiles during setup or if first_login is true
      if (isSetupInProgress || userProfile.first_login) {
        console.log('[SidebarAdvocate] Setup in progress or first login, skipping profile fetch', { 
          isSetupInProgress, 
          first_login: userProfile.first_login 
        });
        setAdvocateProfile(advocateUserData as unknown as AdvocateProfile);
        setProfileLoading(false);
        return;
      }
      
      // If we already fetched the profile for this user, restore from cache
      if (hasFetchedProfileForUser(userProfile.user_id)) {
        console.log('[SidebarAdvocate] Profile already fetched for user, restoring from cache');
        const cachedProfile = getCachedProfileForUser(userProfile.user_id);
        if (cachedProfile) {
          setAdvocateProfile(cachedProfile);
        }
        setProfileLoading(false);
        return;
      }
      
      // If we're already fetching for this user, don't start another fetch
      if (fetchingRef.current.has(userProfile.user_id)) {
        console.log('[SidebarAdvocate] Already fetching for user, skipping duplicate call');
        return;
      }
      
      console.log('[SidebarAdvocate] Fetching advocate profile for user:', userProfile.user_id);
      console.log('[SidebarAdvocate] User roles:', userProfile.roles);
      
      // Check if user has advocate role
      if (!userProfile.roles.includes('advocate')) {
        console.log('[SidebarAdvocate] User does not have advocate role, using demo data');
        setAdvocateProfile(advocateUserData as unknown as AdvocateProfile);
        setProfileLoading(false);
        return;
      }
      
      fetchingRef.current.add(userProfile.user_id);
      setProfileLoading(true);
      try {
        const profile = await userService.getAdvocateProfile();
        console.log('[SidebarAdvocate] Advocate profile fetched successfully:', profile);
        setAdvocateProfile(profile);
        cacheProfileForUser(userProfile.user_id, profile);
      } catch (e) {
        console.error('[SidebarAdvocate] Failed to load advocate profile:', e);
        setAdvocateProfile(advocateUserData as unknown as AdvocateProfile);
      } finally {
        fetchingRef.current.delete(userProfile.user_id);
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [userProfile, isSetupInProgress]);

  function handleUserPanelClick(event: React.MouseEvent<HTMLElement>) {
    setUserMenuAnchor(event.currentTarget);
  }

  function handleLogoClick() {
    window.location.href = '/';
  }

  return (
    <>
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
              duration: 100,
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
                duration: 150,
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
              sx={{ display: 'flex', alignItems: 'start', gap: 1, cursor: 'pointer' }}
            >
              <FontAwesomeIcon icon={faRecordVinyl} style={{ color: 'white', fontSize: '28px' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                EZcustomers
              </Typography>
            </Box>
          )}
          {!isOpen && !isMobile && (
            <Box onClick={handleLogoClick} sx={{ cursor: 'pointer' }}>
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
                '&:hover': { backgroundColor: 'transparent' },
              }}
            >
              <Close sx={{ color: theme.palette.error.main, fontSize: '20px' }} />
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
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
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
                  <ListItemIcon sx={{ minWidth: 0, mr: isOpen ? 2 : 'auto', justifyContent: 'center', color: 'white' }}>
                    <IconComponent sx={{ color: 'white', fontSize: '20px' }} />
                  </ListItemIcon>
                  {isOpen && (
                    <ListItemText
                      primary={item.label}
                      sx={{ '& .MuiListItemText-primary': { fontSize: '0.95rem', fontWeight: isSelected ? 600 : 300, color: 'inherit', letterSpacing: '0.02em' } }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 1 }} />

        {/* User Panel Section (copied from Client with Advocate tweaks) */}
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
                    '&:hover': { transform: 'translateY(-1px)' },
                  }}
                >
                  <Avatar 
                    src={advocateProfile?.profile_banner_url || userProfile?.profile_picture_url || undefined}
                    sx={{
                      width: 36,
                      height: 36,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease-in-out',
                      transform: isUserPanelHovered ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    {!(advocateProfile?.profile_banner_url || userProfile?.profile_picture_url) && (
                      <PersonOutlined sx={{ color: 'white', fontSize: '18px' }} />
                    )}
                  </Avatar>
                  {/* Role Sash */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -10, // drop slightly lower in collapsed too
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#FFCD38',
                      color: '#241E1A',
                      fontSize: '0.45rem',
                      fontWeight: 700,
                      fontVariant: 'small-caps',
                      px: 0.8,
                      py: 0.22,
                      borderRadius: '12px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                      zIndex: 2,
                    }}
                  >
                    Advocate
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
                      <Avatar 
                        src={advocateProfile?.profile_banner_url || userProfile?.profile_picture_url || undefined}
                        sx={{
                          width: 52,
                          height: 52,
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        {!(advocateProfile?.profile_banner_url || userProfile?.profile_picture_url) && (
                          <PersonOutlined sx={{ color: 'white', fontSize: '26px' }} />
                        )}
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
                          py: 0.34, // tiny more height for breathing room
                          borderRadius: '16px',
                          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.2)',
                          zIndex: 2,
                          letterSpacing: '0.02em',
                        }}
                      >
                        Advocate
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
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}>
                        {advocateProfile?.display_name || 'Demo User'}
                      </Typography>
                      <Chip
                        icon={<EmojiEventsOutlined sx={{ fontSize: 16, color: '#C0C0C0' }} />}
                        label={`${advocateProfile?.tier || 'Silver'} • ${advocateProfile?.active_referrals || 0} refs`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(192, 192, 192, 0.2)',
                          color: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid rgba(192, 192, 192, 0.35)',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          height: 26,
                          px: 0.5,
                          '& .MuiChip-icon': {
                            color: '#C0C0C0',
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      <UserDropdownMenu 
        anchorEl={userMenuAnchor} 
        open={Boolean(userMenuAnchor)} 
        onClose={() => setUserMenuAnchor(null)} 
        isOpen={isOpen}
      />
    </>
  );
}


