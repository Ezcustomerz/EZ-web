import {
  Dialog,
  DialogTitle,
  DialogContent,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Business,
  Support,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
  
  // Dummy data for roles - in real app this would come from backend
  const roles: RoleData[] = [
    {
      id: 'producer',
      title: 'Producer',
      subtitle: 'Music Producer',
      icon: Business,
      exists: true,
      type: 'Music Producer'
    },
    {
      id: 'client',
      title: 'Client',
      subtitle: 'Country Artist',
      icon: Person,
      exists: true,
      type: 'Country Artist'
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

  const handleSwitchRole = (roleId: string) => {
    console.log(`Switching to role: ${roleId}`);
    onClose();
    
    // Navigate to appropriate layout based on role
    switch (roleId) {
      case 'producer':
        navigate('/producer');
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

  const handleAddRole = (roleId: string) => {
    console.log(`Adding role: ${roleId}`);
    onClose();
    // Here you would redirect to role setup flow
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
    if (path.startsWith('/producer')) return 'producer';
    if (path.startsWith('/client')) return 'client';
    if (path.startsWith('/advocate')) return 'advocate';
    return 'producer'; // default
  };

  const currentRole = getCurrentRole();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    role.exists ? handleSwitchRole(role.id) : handleAddRole(role.id);
                  }
                }}
                sx={{
                  borderRadius: isMobile ? 2 : 3,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  animation: `cardSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.1}s both`,
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
                    transform: isMobile ? 'none' : 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  },
                  '&:focus': {
                    outline: 'none',
                    boxShadow: '0 0 0 3px rgba(122, 95, 255, 0.2), 0 8px 24px rgba(0, 0, 0, 0.12)',
                  },
                }}
              >
                <CardContent sx={{ p: isMobile ? 2.5 : 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 3, flex: 1 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          sx={{
                            width: isMobile ? 44 : 48,
                            height: isMobile ? 44 : 48,
                            backgroundColor: role.exists ? '#7A5FFF' : '#F3F4F6',
                            color: role.exists ? 'white' : '#9CA3AF',
                            border: isActive ? '2px solid #7A5FFF' : 'none',
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
                            color: role.exists ? '#6B7280' : '#9CA3AF',
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            fontWeight: 400,
                            fontStyle: role.exists ? 'normal' : 'italic',
                            lineHeight: 1.3,
                          }}
                        >
                          {role.exists ? subtitle : `This account has no ${role.title} role`}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant={role.exists ? 'contained' : 'outlined'}
                      startIcon={role.exists ? undefined : <Box component="span" sx={{ fontSize: '16px' }}>+</Box>}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isActive) {
                          role.exists ? handleSwitchRole(role.id) : handleAddRole(role.id);
                        }
                      }}
                      disabled={isActive}
                      sx={{
                        backgroundColor: isActive ? '#E5E7EB' : (role.exists ? '#7A5FFF' : 'transparent'),
                        color: isActive ? '#6B7280' : (role.exists ? 'white' : '#7A5FFF'),
                        borderColor: isActive ? 'transparent' : (role.exists ? 'transparent' : '#7A5FFF'),
                        px: isMobile ? 2.5 : 3,
                        py: isMobile ? 1.2 : 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: isMobile ? '0.85rem' : '0.9rem',
                        minWidth: isMobile ? 80 : 100,
                        height: isMobile ? 36 : 40,
                        transition: 'all 0.2s ease-in-out',
                        cursor: isActive ? 'default' : 'pointer',
                        '&:hover': {
                          backgroundColor: isActive ? '#E5E7EB' : (role.exists ? '#6B46C1' : 'rgba(122, 95, 255, 0.1)'),
                          transform: isActive ? 'none' : 'translateY(-1px)',
                          boxShadow: isActive ? 'none' : (role.exists ? '0 4px 12px rgba(122, 95, 255, 0.3)' : '0 2px 8px rgba(122, 95, 255, 0.2)'),
                        },
                        '&:active': {
                          transform: isActive ? 'none' : 'translateY(0)',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: '#E5E7EB',
                          color: '#6B7280',
                        },
                      }}
                    >
                      {isActive ? 'Current' : (role.exists ? 'Switch' : `Add ${role.title}`)}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
} 