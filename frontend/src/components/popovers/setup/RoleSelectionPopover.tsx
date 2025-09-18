import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  useMediaQuery,
  useTheme,
  Divider,
  Slide,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';
import { userService, type UserRoleProfiles } from '../../../api/userService';
import { errorToast, successToast } from '../../../components/toast/toast';
import { useAuth } from '../../../context/auth';

export interface RoleSelectionPopoverProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userRoles?: string[];
  roleProfiles?: UserRoleProfiles;
}

const ROLE_OPTIONS = [
  {
    value: 'creative',
    label: 'Creative',
    description: 'Offer your creative services to clients',
  },
  {
    value: 'client',
    label: 'Client',
    description: 'Book services and connect with creatives',
  },
  {
    value: 'advocate',
    label: 'Advocate',
    description: 'Connect with creatives and earn percentage-based commissions',
  },
] as const;

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function RoleSelectionPopover({ open, onClose, userName, userRoles, roleProfiles }: RoleSelectionPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Initialize state based on invite flow detection
  const getInitialState = () => {
    const invitePreSelectClient = localStorage.getItem('invitePreSelectClient') === 'true';
    const inviteNeedsClientRole = localStorage.getItem('inviteNeedsClientRole') === 'true';
    
    if (invitePreSelectClient || inviteNeedsClientRole) {
      return {
        selectedRoles: ['client'],
        isInviteFlow: true
      };
    }
    return {
      selectedRoles: ['creative'],
      isInviteFlow: false
    };
  };

  const initialState = getInitialState();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialState.selectedRoles);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviteFlow, setIsInviteFlow] = useState(initialState.isInviteFlow);
  const { startSequentialSetup, userProfile } = useAuth();

  // Helper function to check if a role actually exists (has a profile)
  const hasRoleProfile = (role: string): boolean => {
    if (!roleProfiles) return false;
    
    switch (role) {
      case 'creative':
        return !!roleProfiles.creative;
      case 'client':
        return !!roleProfiles.client;
      case 'advocate':
        return !!roleProfiles.advocate;
      default:
        return false;
    }
  };

  // Update selected roles when userRoles prop changes or when popover opens
  useEffect(() => {
    if (open) {
      // Re-check invite flow state when popover opens
      const invitePreSelectClient = localStorage.getItem('invitePreSelectClient') === 'true';
      const inviteNeedsClientRole = localStorage.getItem('inviteNeedsClientRole') === 'true';
      
      if (invitePreSelectClient || inviteNeedsClientRole) {
        // This is an invite flow - client role is mandatory
        setIsInviteFlow(true);
        
        if (userProfile?.first_login === true) {
          // New user - only client role
          setSelectedRoles(['client']);
        } else if (userRoles && userRoles.length > 0) {
          // Existing user - add client to existing roles
          const rolesWithClient = userRoles.includes('client') ? userRoles : [...userRoles, 'client'];
          setSelectedRoles(rolesWithClient);
        } else {
          // Fallback - just client role
          setSelectedRoles(['client']);
        }
      } else {
        // Normal flow
        setIsInviteFlow(false);
        
        if (userProfile?.first_login === true) {
          // New user - default to creative
          setSelectedRoles(['creative']);
        } else if (userRoles && userRoles.length > 0) {
          // Existing user - use their actual roles
          setSelectedRoles(userRoles);
        } else {
          // Fallback - default to creative
          setSelectedRoles(['creative']);
        }
      }
    }
  }, [userRoles, open, userProfile?.first_login]);

  const handleRoleChange = (role: string) => {
    // Prevent removing client role during invite flow
    if (isInviteFlow && role === 'client') {
      return; // Do nothing - client role is mandatory for invite flows
    }
    
    // Prevent changing existing roles (roles user already has a profile for)
    if (hasRoleProfile(role)) {
      return; // Do nothing - user already has this role profile
    }
    
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        // Remove role if already selected
        return prev.filter(r => r !== role);
      } else {
        // Add role if not selected
        return [...prev, role];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedRoles.length === 0) {
      errorToast('No Roles Selected', 'Please select at least one role to continue');
      return;
    }

    setIsLoading(true);
    try {
      const response = await userService.updateUserRoles(selectedRoles);
      
      if (response.success) {
        // Clear invite flags after successful role selection
        if (isInviteFlow) {
          localStorage.removeItem('invitePreSelectClient');
          localStorage.removeItem('inviteNeedsClientRole');
        }
        
        successToast('Welcome to EZ!', response.message);
        onClose();
        
        // Filter out roles that user already has profiles for
        const rolesNeedingSetup = selectedRoles.filter(role => !hasRoleProfile(role));
        
        // Only start setup process if there are roles that need setup
        if (rolesNeedingSetup.length > 0) {
          // Start sequential setup flow in order: creative -> client -> advocate
          startSequentialSetup(rolesNeedingSetup);
        } else {
          // All selected roles already have profiles, no setup needed
          console.log('[RoleSelectionPopover] All selected roles already have profiles, skipping setup');
        }
      } else {
        errorToast('Role Selection Failed', response.message);
      }
    } catch (err: any) {
      console.error('Unexpected role selection error:', err);
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred while setting your roles';
      errorToast('Role Selection Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={undefined}
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      maxWidth={isMobile ? false : 'sm'}
      fullWidth={!isMobile}
      disableEscapeKeyDown={true} // Disable escape key
      sx={{
        zIndex: isMobile ? 10000 : 1300, // Higher z-index on mobile to cover everything including mobile menu
        '& .MuiDialog-paper': {
          zIndex: isMobile ? 10000 : 1300, // Ensure paper is at correct level
        }
      }}
      PaperProps={{
        sx: {
          ...(isMobile ? {
            borderRadius: 0,
            p: 0,
            backgroundColor: '#fff',
            boxShadow: theme.shadows[8],
            height: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 10000,
          } : {
            width: { sm: 500 },
            maxWidth: 600,
            borderRadius: 3,
            boxShadow: '0 28px 60px rgba(0,0,0,0.22)',
            border: '1px solid rgba(122, 95, 255, 0.18)',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
            backdropFilter: 'blur(8px)',
            position: 'relative', // Ensure proper positioning
          })
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: isMobile ? 'rgba(0,0,0,0.32)' : 'rgba(10, 10, 20, 0.45)',
            backdropFilter: isMobile ? 'none' : 'blur(2px)',
            zIndex: isMobile ? 9999 : 1299, // Lower than dialog on desktop
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 900,
          color: 'secondary.main',
          fontSize: '1.5rem',
          pt: isMobile ? 5 : 4,
          mb: 1.25,
        }}
      >
        Welcome{userName ? `, ${userName}` : ''}! 🎉
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
            {(() => {
              const hasExistingProfiles = roleProfiles && (
                roleProfiles.creative || 
                roleProfiles.client || 
                roleProfiles.advocate
              );
              
              return hasExistingProfiles 
                ? 'Add additional roles to expand your capabilities on EZ'
                : 'Choose your role(s) to get started with EZ';
            })()}
          </Typography>
          
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
              {(() => {
                const existingRoles = [];
                if (roleProfiles?.creative) existingRoles.push('Creative');
                if (roleProfiles?.client) existingRoles.push('Client');
                if (roleProfiles?.advocate) existingRoles.push('Advocate');
                
                return existingRoles.length > 0 
                  ? `Select additional role(s) - you already have: ${existingRoles.join(', ')}`
                  : 'Select your role(s) - you can choose 1 to 3 roles:';
              })()}
            </FormLabel>
          <FormGroup>
            {ROLE_OPTIONS.map((role) => {
              const isExistingRole = hasRoleProfile(role.value);
              const isInviteRequired = isInviteFlow && role.value === 'client';
              const isDisabled = isLoading || isInviteRequired || isExistingRole;
              
              return (
                <Box key={role.value} sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedRoles.includes(role.value)}
                        onChange={() => handleRoleChange(role.value)}
                        disabled={isDisabled}
                        color="primary"
                        sx={{
                          ...(isInviteRequired && {
                            '& .MuiSvgIcon-root': {
                              color: theme.palette.primary.main,
                              opacity: 1,
                            }
                          }),
                          ...(isExistingRole && {
                            '& .MuiSvgIcon-root': {
                              color: theme.palette.success.main,
                              opacity: 0.8,
                            }
                          })
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight="medium"
                          sx={{
                            ...(isInviteRequired && {
                              color: theme.palette.primary.main,
                              fontWeight: 'bold',
                            }),
                            ...(isExistingRole && {
                              color: theme.palette.success.main,
                              fontWeight: 'bold',
                            })
                          }}
                        >
                          {role.label}
                          {isInviteRequired && (
                            <Typography component="span" sx={{ ml: 1, fontSize: '0.9rem', fontWeight: 'normal' }}>
                              (Required for invitation)
                            </Typography>
                          )}
                          {isExistingRole && (
                            <Typography component="span" sx={{ ml: 1, fontSize: '0.9rem', fontWeight: 'normal' }}>
                              ✓ (You already have this role)
                            </Typography>
                          )}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            ...(isInviteRequired && {
                              color: theme.palette.primary.dark,
                              fontWeight: 'medium',
                            }),
                            ...(isExistingRole && {
                              color: theme.palette.success.dark,
                              fontWeight: 'medium',
                            })
                          }}
                        >
                          {role.description}
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', m: 0 }}
                  />
                </Box>
              );
            })}
            </FormGroup>
          </FormControl>


        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ 
        px: 3, 
        py: isMobile ? 4 : 3, 
        justifyContent: 'center',
        pb: isMobile ? 10 : 3, 
        position: isMobile ? 'sticky' : 'relative',
        bottom: isMobile ? 0 : 'auto',
        backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.98)' : 'transparent',
        backdropFilter: isMobile ? 'blur(8px)' : 'none',
        borderTop: isMobile ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
        zIndex: isMobile ? 1000 : 'auto',
      }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="large"
          disabled={selectedRoles.length === 0 || isLoading}
          sx={{ 
            minWidth: 200,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          {isLoading 
            ? 'Setting Roles...' 
            : isInviteFlow 
              ? `Accept Invitation with ${selectedRoles.length} role${selectedRoles.length !== 1 ? 's' : ''}`
              : `Continue with ${selectedRoles.length} role${selectedRoles.length !== 1 ? 's' : ''}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}
