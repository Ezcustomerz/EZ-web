import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../context/auth';
import { useRoleRedirect } from '../../utils/roleRedirect';

interface RoleGuardProps {
  requiredRole: string;
  children: React.ReactNode;
}

/**
 * RoleGuard component that checks if the user has the required role
 * If not, redirects to appropriate dashboard or NoAccess page
 */
export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, isAuthenticated, isLoadingProfile } = useAuth();
  const { getRedirectUrl } = useRoleRedirect();

  useEffect(() => {
    // Don't check if still loading profile
    if (isLoadingProfile) {
      return;
    }

    // If not authenticated, allow demo mode browsing
    if (!isAuthenticated) {
      return;
    }

    // If no user profile yet, wait for it to load
    if (!userProfile) {
      return;
    }

    // Check if user has the required role
    const userRoles = userProfile.roles || [];
    const hasRequiredRole = userRoles.includes(requiredRole);

    if (!hasRequiredRole) {
      // Check if user has any roles at all
      if (userRoles.length === 0) {
        // No roles - redirect to home (should trigger role selection)
        navigate('/', { replace: true });
      } else {
        // User has other roles - redirect to their appropriate dashboard
        const redirectUrl = getRedirectUrl();
        navigate(redirectUrl, { replace: true });
      }
    }
  }, [userProfile, isAuthenticated, isLoadingProfile, requiredRole, navigate, location.pathname, getRedirectUrl]);

  // If still loading or profile not ready (e.g. after invite redirect), show loading so we don't get a white screen
  if (isLoadingProfile || (isAuthenticated && !userProfile)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // If not authenticated, allow demo mode browsing
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // If no user profile yet (shouldn't happen after loading state above), wait for it to load
  if (!userProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Check if user has the required role
  const userRoles = userProfile.roles || [];
  const hasRequiredRole = userRoles.includes(requiredRole);

  if (!hasRequiredRole) {
    // This should not happen due to the useEffect redirect, but just in case
    return null;
  }

  // User has the required role, render the protected content
  return <>{children}</>;
}