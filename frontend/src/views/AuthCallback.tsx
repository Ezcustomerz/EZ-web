import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Handles OAuth callback and redirects users to their appropriate role-based dashboard
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { userProfile, isAuthenticated, fetchUserProfile } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }

    // Ensure we have the latest user profile
    if (isAuthenticated && !userProfile) {
      fetchUserProfile(true);
      return;
    }

    const handleRedirect = () => {
      // Check if we need role-based redirection
      const needsRoleRedirect = localStorage.getItem('needsRoleRedirect');

      // Only proceed if we have the redirect flag AND user profile AND authentication
      if (needsRoleRedirect && userProfile && isAuthenticated) {
        // Mark that we're redirecting to prevent multiple redirects
        hasRedirected.current = true;
        sessionStorage.setItem('authCallbackRedirected', 'true');
        
        // Determine redirect URL based on user roles
        const userRoles = userProfile.roles || [];

        if (userRoles.includes('creative')) {
          localStorage.removeItem('needsRoleRedirect');
          navigate('/creative', { replace: true });
        } else if (userRoles.includes('client')) {
          localStorage.removeItem('needsRoleRedirect');
          navigate('/client', { replace: true });
        } else if (userRoles.includes('advocate')) {
          localStorage.removeItem('needsRoleRedirect');
          navigate('/advocate', { replace: true });
        } else {
          // New user or no roles - redirect to creative (default)
          localStorage.removeItem('needsRoleRedirect');
          navigate('/creative', { replace: true });
        }
      } else if (needsRoleRedirect && (!userProfile || !isAuthenticated)) {
        // User profile not loaded yet or not authenticated, wait a bit and try again
        setTimeout(handleRedirect, 1000);
      } else if (!needsRoleRedirect) {
        // No role redirect needed - let the app handle it naturally
      }
    };

    // Only run the redirect logic if we have the necessary conditions
    if (localStorage.getItem('needsRoleRedirect') || userProfile) {
      // Small delay to ensure auth state is properly set
      const timer = setTimeout(handleRedirect, 100);
      return () => clearTimeout(timer);
    }
  }, [navigate, userProfile, isAuthenticated, fetchUserProfile]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body1" color="text.secondary">
        Redirecting to your dashboard...
      </Typography>
    </Box>
  );
}
