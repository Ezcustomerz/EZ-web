import { useAuth } from '../context/auth';

/**
 * Hook to get the appropriate redirect URL based on user's roles
 * Returns the URL to redirect to based on role priority: creative -> client -> advocate
 */
export function useRoleRedirect() {
  const { userProfile, originalSelectedRoles } = useAuth();
  
  const getRedirectUrl = (): string => {
    // Get user's roles from original selection or current profile
    const userRoles = originalSelectedRoles.length > 0 ? originalSelectedRoles : (userProfile?.roles || []);
    
    // Priority order for redirection: creative -> client -> advocate
    if (userRoles.includes('creative')) {
      return '/creative';
    } else if (userRoles.includes('client')) {
      return '/client';
    } else if (userRoles.includes('advocate')) {
      return '/advocate';
    } else {
      // Fallback to creative if no roles found (for new users)
      return '/creative';
    }
  };

  return { getRedirectUrl };
}

/**
 * Utility function to get redirect URL without hook (for use outside components)
 */
export function getRoleRedirectUrl(userRoles: string[] = []): string {
  // Priority order for redirection: creative -> client -> advocate
  if (userRoles.includes('creative')) {
    return '/creative';
  } else if (userRoles.includes('client')) {
    return '/client';
  } else if (userRoles.includes('advocate')) {
    return '/advocate';
  } else {
    // Fallback to creative if no roles found (for new users)
    return '/creative';
  }
}
