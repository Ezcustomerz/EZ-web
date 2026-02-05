import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Avatar,
  IconButton,
  useMediaQuery,
  useTheme,
  Button,
  Divider,
  Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
// Use the full-color Google "G" mark instead of monochrome icon
import { supabase } from '../../../config/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRecordVinyl, faEye } from '@fortawesome/free-solid-svg-icons';
import { errorToast } from '../../../components/toast/toast';

export interface AuthPopoverProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

function GoogleBrandIcon() {
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      sx={{ width: 18, height: 18, display: 'block' }}
      aria-hidden
      focusable={false}
    >
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.651 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.042l5.657-5.657C34.671 6.053 29.671 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.586 4.827C14.357 16.152 18.82 12 24 12c3.059 0 5.842 1.154 7.957 3.042l5.657-5.657C34.671 6.053 29.671 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.167 0 9.86-1.977 13.409-5.197l-6.197-5.238C29.127 35.927 26.702 37 24 37c-5.202 0-9.617-3.317-11.277-7.95l-6.54 5.037C8.5 39.556 15.674 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.793 2.236-2.219 4.166-4.091 5.565.001-.001 6.197 5.238 6.197 5.238l.004-.003C40.508 35.077 44 29.889 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </Box>
  );
}

function DemoIcon() {
  return (
    <Box
      sx={{
        width: 18,
        height: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
      }}
    >
      <FontAwesomeIcon icon={faEye} style={{ fontSize: '16px' }} />
    </Box>
  );
}

export function AuthPopover({ open, onClose, title, subtitle }: AuthPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogle() {
    setIsLoading(true);
    // Set flag to show toast after successful sign in
    localStorage.setItem('justSignedIn', 'true');
    // Set flag to indicate we need role-based redirection after login
    localStorage.setItem('needsRoleRedirect', 'true');
    // Clear any previous redirect flags
    sessionStorage.removeItem('authCallbackRedirected');
    
    try {
      // For OAuth, we can't determine the role before login, so we redirect to a generic handler
      // The auth context will handle the actual role-based redirection after login
      const redirectTo = `${window.location.origin}/auth-callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        errorToast('Sign In Failed', 'Unable to sign in with Google. Please try again.');
        localStorage.removeItem('justSignedIn'); // Clear flag on error
        localStorage.removeItem('needsRoleRedirect'); // Clear flag on error
        setIsLoading(false);
      }
    } catch {
      errorToast('Unexpected Error', 'An unexpected error occurred during sign in');
      localStorage.removeItem('justSignedIn'); // Clear flag on error
      localStorage.removeItem('needsRoleRedirect'); // Clear flag on error
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth={false}
      sx={{
        zIndex: isMobile ? 10000 : 1300, // Higher z-index on mobile to cover mobile menu
      }}
      PaperProps={{
        sx: {
          width: { xs: '92vw', sm: 420 },
          maxWidth: 480,
          borderRadius: 3,
          boxShadow: '0 28px 60px rgba(0,0,0,0.22)',
          border: '1px solid rgba(122, 95, 255, 0.18)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
          backdropFilter: 'blur(8px)'
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(10, 10, 20, 0.45)',
            backdropFilter: 'blur(2px)'
          }
        }
      }}
    >
      <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{ color: 'text.secondary', opacity: 0.6, '&:hover': { opacity: 1 } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

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
        {title ?? 'Join as a Creative'}
      </DialogTitle>

      <DialogContent sx={{ pb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.secondary.main,
              width: 48,
              height: 48,
              boxShadow: `0 10px 22px ${theme.palette.secondary.main}40`,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -6,
                borderRadius: '50%',
                background: `radial-gradient(${theme.palette.secondary.main}33, transparent 60%)`,
                zIndex: -1,
              },
            }}
          >
            <FontAwesomeIcon icon={faRecordVinyl} style={{ color: '#FFFFFF', fontSize: '24px' }} />
          </Avatar>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {subtitle ?? 'Sign in with Google to create an account'}
          </Typography>

          <Button
            onClick={handleGoogle}
            startIcon={<GoogleBrandIcon />}
            disabled={isLoading}
            fullWidth
            size="large"
            sx={{
              justifyContent: 'center',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              borderRadius: 1.25,
              py: 1.7,
              backgroundColor: 'rgba(122, 95, 255, 0.10)',
              color: 'text.primary',
              border: '1px solid rgba(122, 95, 255, 0.28)',
              '&:hover': {
                backgroundColor: 'rgba(122, 95, 255, 0.16)',
                borderColor: 'rgba(122, 95, 255, 0.36)',
              },
              '&:focus-visible': {
                outline: 'none',
                boxShadow: `0 0 0 3px ${theme.palette.secondary.main}33`,
              },
            }}
            aria-label="Continue with Google"
          >
            {isLoading ? 'Redirecting…' : 'Continue with Google'}
          </Button> 

          <Button
            onClick={onClose}
            startIcon={<DemoIcon />}
            variant="outlined"
            size="large"
            fullWidth
            sx={{
              justifyContent: 'center',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              borderRadius: 1.25,
              py: 1.7,
              backgroundColor: 'transparent',
              color: 'text.secondary',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderColor: 'rgba(0, 0, 0, 0.24)',
                color: 'text.primary',
                '& .MuiButton-startIcon': {
                  color: 'text.primary',
                },
              },
              '&:focus-visible': {
                outline: 'none',
                boxShadow: `0 0 0 3px ${theme.palette.secondary.main}33`,
              },
            }}
            aria-label="Explore with Demo"
          >
            Explore the Demo
          </Button>

          <Divider sx={{ width: '100%', mt: 1.5, mb: 0.5 }} />

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            By continuing you agree to our{' '}
            <Link
              href="/terms"
              underline="always"
              sx={{ fontWeight: 600, color: 'primary.main', ml: 0.25, mr: 0.25 }}
            >
              Terms
            </Link>
            and
            <Link
              href="/privacy"
              underline="always"
              sx={{ fontWeight: 600, color: 'primary.main', ml: 0.25 }}
            >
              Privacy Policy
            </Link>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

