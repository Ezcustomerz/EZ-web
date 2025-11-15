import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LandingPage } from '../views/web/LandingPage';

/**
 * Handles root route and checks if it's an auth callback
 * If URL has auth callback parameters, redirects to /auth-callback
 * Otherwise shows the landing page
 */
export function AuthCallbackHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Check if this is an OAuth callback by looking for Supabase auth parameters
    const hasAuthParams = searchParams.has('code') || 
                         searchParams.has('access_token') || 
                         searchParams.has('error') ||
                         searchParams.has('error_description');
    
    if (hasAuthParams) {
      // This is an auth callback - redirect to the auth-callback route
      // Preserve all query parameters
      const queryString = window.location.search;
      navigate(`/auth-callback${queryString}`, { replace: true });
    }
  }, [searchParams, navigate]);
  
  // If no auth params, show landing page
  // If auth params exist, the redirect will happen and this won't render
  return <LandingPage />;
}

