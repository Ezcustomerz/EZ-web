import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/auth';

// Redirects users to role selection if they haven't completed setup (first_login is true)
export function SetupGate() {
  const { userProfile, roleSelectionOpen, isSetupInProgress } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only check if we have a user profile and we're on a role-specific route
    if (!userProfile) return;

    const isRoleSpecificRoute = location.pathname.startsWith('/creative') || 
                                location.pathname.startsWith('/client') || 
                                location.pathname.startsWith('/advocate');

    // If user hasn't completed setup and is on a role-specific route, redirect to home
    // But don't redirect if setup is in progress or role selection is open
    if (userProfile.first_login && isRoleSpecificRoute && !roleSelectionOpen && !isSetupInProgress) {
      console.log('[SetupGate] User has not completed setup, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [userProfile, location.pathname, roleSelectionOpen, isSetupInProgress, navigate]);

  return null; // This component doesn't render anything
}
