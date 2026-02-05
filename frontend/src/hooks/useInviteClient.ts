import { useState } from 'react';
import { useAuth } from '../context/auth';

/**
 * Custom hook for managing invite client functionality with authentication
 * Returns state and handlers for opening the invite client popover
 */
export function useInviteClient() {
  const { session, userProfile, openAuth } = useAuth();
  const [inviteClientOpen, setInviteClientOpen] = useState(false);

  const handleInviteClient = () => {
    // Check if user is authenticated (has session and userProfile)
    if (session && userProfile) {
      setInviteClientOpen(true);
    } else {
      // Show authentication popover if not authenticated
      openAuth();
    }
  };

  const closeInviteClient = () => {
    setInviteClientOpen(false);
  };

  return {
    inviteClientOpen,
    handleInviteClient,
    closeInviteClient,
    isAuthenticated: !!(session && userProfile),
  };
}
