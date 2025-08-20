import { useState } from 'react';
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
import { userService } from '../../api/userService';
import { errorToast, successToast } from '../toast/toast';

export interface RoleSelectionPopoverProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  onCreativeSetup?: () => void;
  onClientSetup?: () => void;
  onAdvocateSetup?: () => void;
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

export function RoleSelectionPopover({ open, onClose, userName, onCreativeSetup, onClientSetup, onAdvocateSetup }: RoleSelectionPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['creative']); // Default to creative
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (role: string) => {
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
        if (selectedRoles.includes('creative')) {
          successToast('Welcome to EZ!', response.message);
          onCreativeSetup?.();
          onClose();
        } else if (selectedRoles.includes('client')) {
          successToast('Welcome to EZ!', response.message);
          onClientSetup?.();
          onClose();
        } else if (selectedRoles.includes('advocate')) {
          successToast('Welcome to EZ!', response.message);
          onAdvocateSetup?.();
          onClose();
        } else {
          successToast('Welcome to EZ!', response.message);
          onClose();
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
        zIndex: isMobile ? 9999 : 1300, // Higher z-index on mobile to cover everything
        '& .MuiDialog-paper': {
          zIndex: isMobile ? 9999 : 1300, // Ensure paper is at correct level
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
            zIndex: 9999,
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
            zIndex: isMobile ? 9998 : 1299, // Lower than dialog on desktop
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
            Choose your role(s) to get started with EZ
          </Typography>
          
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
              Select your role(s) - you can choose 1 to 3 roles:
            </FormLabel>
          <FormGroup>
            {ROLE_OPTIONS.map((role) => (
              <Box key={role.value} sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedRoles.includes(role.value)}
                      onChange={() => handleRoleChange(role.value)}
                      disabled={isLoading}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {role.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {role.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', m: 0 }}
                />
              </Box>
            ))}
            </FormGroup>
          </FormControl>

          <Box sx={{ mt: 1, p: 2, backgroundColor: 'custom.amber', borderRadius: 1, width: '100%' }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              <strong>Note:</strong> You can add roles later in your profile settings.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 3, justifyContent: 'center' }}>
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
          {isLoading ? 'Setting Roles...' : `Continue with ${selectedRoles.length} role${selectedRoles.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
