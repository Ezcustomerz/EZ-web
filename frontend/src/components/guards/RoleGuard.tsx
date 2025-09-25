import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
      console.log('[RoleGuard] User not authenticated, allowing demo mode');
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
      console.log(`[RoleGuard] User does not have ${requiredRole} role. User roles:`, userRoles);
      console.log(`[RoleGuard] Current path:`, location.pathname);
      
      // Check if user has any roles at all
      if (userRoles.length === 0) {
        // No roles - redirect to home (should trigger role selection)
        console.log('[RoleGuard] User has no roles, redirecting to home');
        navigate('/', { replace: true });
      } else {
        // User has other roles - redirect to their appropriate dashboard
        const redirectUrl = getRedirectUrl();
        console.log(`[RoleGuard] Redirecting to user's dashboard: ${redirectUrl}`);
        navigate(redirectUrl, { replace: true });
      }
    }
  }, [userProfile, isAuthenticated, isLoadingProfile, requiredRole, navigate, location.pathname, getRedirectUrl]);

  // If still loading, show nothing (or a loading spinner)
  if (isLoadingProfile) {
    return null;
  }

  // If not authenticated, allow demo mode browsing
  if (!isAuthenticated) {
    console.log('[RoleGuard] Rendering demo mode for non-authenticated user');
    return <>{children}</>;
  }

  // If no user profile yet, wait for it to load
  if (!userProfile) {
    return null;
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