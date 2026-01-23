import {
  Dialog,
  DialogTitle,
  DialogContent,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Business,
  Support,
  Check,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth';
import { userService, type UserRoleProfiles } from '../../api/userService';
import { CreativeSetupPopover } from './setup/CreativeSetupPopover';
import { ClientSetupPopover } from './setup/ClientSetupPopover';
import { AdvocateSetupPopover } from './setup/AdvocateSetupPopover';
import { errorToast } from '../toast/toast';

interface RoleData {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  exists: boolean;
  type?: string;
  tier?: string;
  commission?: string;
}

interface RoleSwitcherPopoverProps {
  open: boolean;
  onClose: () => void;
}

export function RoleSwitcherPopover({ open, onClose }: RoleSwitcherPopoverProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { userProfile, fetchUserProfile, roleSelectionOpen, isAuthenticated } = useAuth();
  const [roleProfiles, setRoleProfiles] = useState<UserRoleProfiles | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Setup popover states
  const [creativeSetupOpen, setCreativeSetupOpen] = useState(false);
  const [clientSetupOpen, setClientSetupOpen] = useState(false);
  const [advocateSetupOpen, setAdvocateSetupOpen] = useState(false);

  // Fetch role profiles when popover opens (only for authenticated users and not during setup)
  useEffect(() => {
    if (open && userProfile && isAuthenticated && !roleSelectionOpen) {
      fetchRoleProfiles();
    } else if (!isAuthenticated) {
      // Clear role profiles when user is not authenticated (demo mode)
      setRoleProfiles(null);
    }
  }, [open, userProfile, isAuthenticated, roleSelectionOpen]);

  const fetchRoleProfiles = async () => {
    // Don't fetch role profiles for unauthenticated users (demo mode)
    if (!userProfile || !isAuthenticated) return;
    
    setLoading(true);
    try {
      const profiles = await userService.getUserRoleProfiles();
      setRoleProfiles(profiles);
    } catch (error) {
      console.error('Failed to fetch role profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate roles data based on user's actual roles and profiles
  const getRolesData = (): RoleData[] => {
    // If user is not authenticated, show all roles in demo mode as active
    if (!isAuthenticated) {
      return [
        {
          id: 'creative',
          title: 'Creative',
          subtitle: 'Music Creative',
          icon: Business,
          exists: true,
          type: 'Music Creative'
        },
        {
          id: 'client',
          title: 'Client',
          subtitle: 'Client',
          icon: Person,
          exists: true,
          type: 'Client'
        },
        {
          id: 'advocate',
          title: 'Advocate',
          subtitle: 'Silver Tier (18% commission)',
          icon: Support,
          exists: true,
          tier: 'Silver',
          commission: '18%'
        }
      ];
    }

    // For authenticated users, show all roles but mark some as not existing
    const roles: RoleData[] = [];
    
    // Add creative role
    const creativeProfile = roleProfiles?.creative;
    const hasCreativeRole = userProfile?.roles.includes('creative') || false;
    roles.push({
      id: 'creative',
      title: 'Creative',
      subtitle: creativeProfile ? creativeProfile.title : (hasCreativeRole ? 'Not set up yet' : 'Click to add Creative role'),
      icon: Business,
      exists: hasCreativeRole && !!creativeProfile,
      type: creativeProfile?.title
    });
    
    // Add client role
    const clientProfile = roleProfiles?.client;
    const hasClientRole = userProfile?.roles.includes('client') || false;
    roles.push({
      id: 'client',
      title: 'Client',
      subtitle: clientProfile ? 'Client' : (hasClientRole ? 'Not set up yet' : 'Click to add Client role'),
      icon: Person,
      exists: hasClientRole && !!clientProfile,
      type: 'Client'
    });
    
    // Add advocate role
    const advocateProfile = roleProfiles?.advocate;
    const hasAdvocateRole = userProfile?.roles.includes('advocate') || false;
    const commissionRates = {
      'silver': '18%',
      'gold': '20%',
      'platinum': '22%'
    };
    const commission = advocateProfile ? commissionRates[advocateProfile.tier as keyof typeof commissionRates] || '18%' : '18%';
    
    roles.push({
      id: 'advocate',
      title: 'Advocate',
      subtitle: advocateProfile ? `${advocateProfile.tier.charAt(0).toUpperCase() + advocateProfile.tier.slice(1)} Tier (${commission} commission)` : (hasAdvocateRole ? 'Not set up yet' : 'Click to add Advocate role'),
      icon: Support,
      exists: hasAdvocateRole && !!advocateProfile,
      tier: advocateProfile?.tier,
      commission
    });
    
    return roles;
  };

  const roles = getRolesData();

  const handleSwitchRole = (roleId: string) => {
    
    // Clear all profile caches to ensure fresh data is fetched
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('creativeProfile_') || 
          key.startsWith('clientProfile_') || 
          key.startsWith('advocateProfile_')) {
        localStorage.removeItem(key);
      }
    });
    
    onClose();
    
    // Navigate to appropriate layout based on role
    switch (roleId) {
      case 'creative':
        navigate('/creative');
        break;
      case 'client':
        navigate('/client');
        break;
      case 'advocate':
        navigate('/advocate');
        break;
      default:
        break;
    }
  };

  const handleRoleClick = (roleId: string, isActive: boolean) => {
    if (isActive) {
      // If clicking the current active role, just close the popover
      onClose();
      return;
    }
    
    // If user is not logged in (demo mode), always switch roles
    if (!userProfile) {
      handleSwitchRole(roleId);
      return;
    }
    
    // Otherwise switch to the new role
    handleSwitchRole(roleId);
  };

  const handleAddRole = (roleId: string) => {
    
    // If user is not logged in (demo mode), just navigate to the role
    if (!userProfile) {
      handleSwitchRole(roleId);
      return;
    }
    
    // Show setup popover for any role that doesn't exist (whether user has the role or not)
    switch (roleId) {
      case 'creative':
        setCreativeSetupOpen(true);
        break;
      case 'client':
        setClientSetupOpen(true);
        break;
      case 'advocate':
        setAdvocateSetupOpen(true);
        break;
      default:
        break;
    }
  };

  const handleSetupComplete = async () => {
    // Close the setup popover
    setCreativeSetupOpen(false);
    setClientSetupOpen(false);
    setAdvocateSetupOpen(false);
    
    // Only refresh data if this is not part of the initial setup flow
    // During initial setup, the auth context will handle the final refresh
    if (userProfile && !roleSelectionOpen) {
      try {
        // Refresh role profiles
        await fetchRoleProfiles();
        
        // Refresh user profile to update roles array
        await fetchUserProfile(false); // false = not a fresh sign-in, just refreshing after setup
        
        // Don't navigate away - keep the role switcher popover open
        // The user can manually switch to the new role if they want
      } catch (error) {
        console.error('Failed to refresh data after setup:', error);
        // Show error toast instead of reloading
        errorToast('Refresh Error', 'Failed to refresh data after setup. Please try again.');
      }
    }
  };

  const handleSetupCancel = () => {
    // Close all setup popovers
    setCreativeSetupOpen(false);
    setClientSetupOpen(false);
    setAdvocateSetupOpen(false);
  };

  const handleSetupBack = () => {
    // If this is part of the initial sign-up flow (roleSelectionOpen is true), 
    // we should go back to role selection instead of just closing
    if (roleSelectionOpen) {
      // Close setup popovers and go back to role selection
      setCreativeSetupOpen(false);
      setClientSetupOpen(false);
      setAdvocateSetupOpen(false);
      // The role selection popover should already be open from the auth context
    } else {
      // For individual role setup, just close the popovers
      handleSetupCancel();
    }
  };

  const getAdvocateSubtitle = (role: RoleData) => {
    if (!role.exists) return 'Not set up yet';
    return `${role.tier} Tier (${role.commission} commission)`;
  };

  const getRoleSubtitle = (role: RoleData) => {
    if (role.id === 'advocate') {
      return getAdvocateSubtitle(role);
    }
    return role.exists ? role.type : 'Not set up yet';
  };

  // Determine current active role based on current path
  const getCurrentRole = () => {
    const path = window.location.pathname;
    if (path.startsWith('/creative')) return 'creative';
    if (path.startsWith('/client')) return 'client';
    if (path.startsWith('/advocate')) return 'advocate';
    return 'creative'; // default
  };

  const currentRole = getCurrentRole();

  // Show loading state or no roles message
  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        disableAutoFocus
        disableEnforceFocus
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
              height: '100dvh',
            }),
          }
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
            fontWeight: 700,
            color: 'primary.main',
            py: isMobile ? 3 : 2,
            px: isMobile ? 2 : 3,
          }}
        >
          Switch Role
        </DialogTitle>
        <DialogContent sx={{ 
          px: isMobile ? 2 : 3, 
          pb: isMobile ? 4 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
        }}>
          <Typography variant="body1" color="text.secondary">
            Loading roles...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  // Show message if no roles are set up (only for logged-in users)
  if (userProfile && roles.length === 0) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        disableAutoFocus
        disableEnforceFocus
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
              height: '100dvh',
            }),
          }
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
            fontWeight: 700,
            color: 'primary.main',
            py: isMobile ? 3 : 2,
            px: isMobile ? 2 : 3,
          }}
        >
          Switch Role
        </DialogTitle>
        <DialogContent sx={{ 
          px: isMobile ? 2 : 3, 
          pb: isMobile ? 4 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
        }}>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            No roles have been set up yet.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        disableAutoFocus
        disableEnforceFocus
        sx={{
          zIndex: isMobile ? 10000 : 1300, // Higher z-index on mobile to cover mobile menu
        }}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
              height: '100dvh',
            }),
          }
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
            fontWeight: 700,
            color: 'primary.main',
            py: isMobile ? 3 : 2,
            px: isMobile ? 2 : 3,
          }}
        >
          Switch Role
          {!userProfile && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                fontSize: '0.75rem',
                fontWeight: 400,
                mt: 0.5,
              }}
            >
              Demo Mode
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ 
          px: isMobile ? 2 : 3, 
          pb: isMobile ? 4 : 3,
          ...(isMobile && {
            flex: '1 1 auto',
            overflowY: 'auto',
            minHeight: 0,
            maxHeight: 'none',
          })
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 2 : 3 }}>
            {roles.map((role, index) => {
              const IconComponent = role.icon;
              const subtitle = getRoleSubtitle(role);
              const isActive = role.id === currentRole; // In real app, check against current role
              
              return (
                <Card
                  key={role.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    // In demo mode (no userProfile), always switch roles
                    if (!userProfile) {
                      handleRoleClick(role.id, isActive);
                    } else {
                      // For logged-in users, check if role exists or if they have the role
                      if (role.exists) {
                        handleRoleClick(role.id, isActive);
                      } else {
                        handleAddRole(role.id);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      // In demo mode (no userProfile), always switch roles
                      if (!userProfile) {
                        handleRoleClick(role.id, isActive);
                      } else {
                        // For logged-in users, check if role exists or if they have the role
                        if (role.exists) {
                          handleRoleClick(role.id, isActive);
                        } else {
                          handleAddRole(role.id);
                        }
                      }
                    }
                  }}
                  sx={{
                    borderRadius: isMobile ? 2 : 3,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: role.exists || !userProfile ? 'pointer' : 'pointer',
                    backgroundColor: isActive ? 'rgba(122, 95, 255, 0.05)' : (role.exists || !userProfile ? 'rgba(255, 255, 255, 0.8)' : 'rgba(122, 95, 255, 0.02)'),
                    animation: `cardSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.1}s both`,
                    mt: index === 0 ? (isMobile ? 1 : 2) : 0, // Add top margin for first card
                    '@keyframes cardSlideIn': {
                      '0%': {
                        transform: 'translateY(20px)',
                        opacity: 0,
                      },
                      '100%': {
                        transform: 'translateY(0)',
                        opacity: 1,
                      },
                    },
                    '&:hover': {
                      transform: isActive ? 'none' : (isMobile ? 'none' : 'translateY(-2px)'),
                      boxShadow: isActive ? '0 0 0 3px rgba(122, 95, 255, 0.2), 0 8px 24px rgba(0, 0, 0, 0.12)' : '0 0 0 3px rgba(122, 95, 255, 0.2), 0 8px 24px rgba(0, 0, 0, 0.12)',
                      backgroundColor: isActive ? 'rgba(122, 95, 255, 0.08)' : (role.exists || !userProfile ? 'rgba(255, 255, 255, 0.95)' : 'rgba(122, 95, 255, 0.05)'),
                    },
                    '&:focus': {
                      outline: 'none',
                      boxShadow: isActive ? '0 0 0 3px rgba(122, 95, 255, 0.2), 0 8px 24px rgba(0, 0, 0, 0.12)' : '0 0 0 3px rgba(122, 95, 255, 0.2), 0 8px 24px rgba(0, 0, 0, 0.12)',
                      backgroundColor: isActive ? 'rgba(122, 95, 255, 0.08)' : (role.exists || !userProfile ? 'rgba(255, 255, 255, 0.95)' : 'rgba(122, 95, 255, 0.05)'),
                    },
                  }}
                >
                  <CardContent sx={{ p: isMobile ? 2.5 : 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 3 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          sx={{
                            width: isMobile ? 44 : 48,
                            height: isMobile ? 44 : 48,
                            backgroundColor: role.exists || !userProfile ? '#7A5FFF' : '#F3F4F6',
                            color: role.exists || !userProfile ? 'white' : '#9CA3AF',
                            border: isActive ? '2px solid #7A5FFF' : (role.exists || !userProfile ? 'none' : '2px dashed #D1D5DB'),
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <IconComponent sx={{ fontSize: isMobile ? '22px' : '24px' }} />
                        </Avatar>
                        {isActive && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              width: 20,
                              height: 20,
                              backgroundColor: '#7A5FFF',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid white',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                backgroundColor: 'white',
                                borderRadius: '50%',
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#241E1A',
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            lineHeight: 1.2,
                            mb: 0.5,
                          }}
                        >
                          {role.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: role.exists || !userProfile ? '#6B7280' : '#9CA3AF',
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            fontWeight: 400,
                            fontStyle: role.exists || !userProfile ? 'normal' : 'italic',
                            lineHeight: 1.3,
                          }}
                        >
                          {!userProfile ? subtitle : (role.exists ? subtitle : `Click to add ${role.title} role`)}
                        </Typography>
                      </Box>
                      {isActive && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: isMobile ? 32 : 36,
                            height: isMobile ? 32 : 36,
                            color: 'success.main',
                          }}
                        >
                          <Check sx={{ fontSize: isMobile ? 18 : 20 }} />
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Setup Popovers */}
      <CreativeSetupPopover
        open={creativeSetupOpen}
        onClose={() => setCreativeSetupOpen(false)}
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        onBack={handleSetupBack}
        isFirstSetup={false}
        onComplete={() => handleSetupComplete()}
      />
      
      <ClientSetupPopover
        open={clientSetupOpen}
        onClose={() => setClientSetupOpen(false)}
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        onBack={handleSetupBack}
        isFirstSetup={false}
        onComplete={() => handleSetupComplete()}
      />
      
      <AdvocateSetupPopover
        open={advocateSetupOpen}
        onClose={() => setAdvocateSetupOpen(false)}
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        onBack={handleSetupBack}
        isFirstSetup={false}
        onComplete={() => handleSetupComplete()}
      />
    </>
  );
} 