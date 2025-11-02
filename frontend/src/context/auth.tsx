import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { toast, errorToast, successToast } from '../components/toast/toast';
import { useLoading } from './loading';
import { userService, type UserProfile } from '../api/userService';
import { inviteService } from '../api/inviteService';
import { useNavigate } from 'react-router-dom';
import { syncTokensToCookies, clearAuthCookies } from '../api/cookieAuth';
type SetupData = {
  creative?: any;
  client?: any;
  advocate?: any;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  openAuth: () => void;
  closeAuth: () => void;
  authOpen: boolean;
  roleSelectionOpen: boolean;
  closeRoleSelection: () => void;
  userProfile: UserProfile | null;
  fetchUserProfile: (isFreshSignIn?: boolean) => Promise<void>;
  producerSetupOpen: boolean;
  openCreativeSetup: () => void;
  closeCreativeSetup: () => void;
  clientSetupOpen: boolean;
  openClientSetup: () => void;
  closeClientSetup: () => void;
  advocateSetupOpen: boolean;
  openAdvocateSetup: () => void;
  closeAdvocateSetup: () => void;
  backToRoleSelection: () => void;
  backToPreviousSetup: () => void;
  startSequentialSetup: (selectedRoles: string[]) => void;
  pendingSetups: string[];
  completedSetups: string[];
  isFirstSetup: boolean;
  tempSetupData: SetupData;
  saveSetupData: (role: string, data: any) => void;
  originalSelectedRoles: string[];
  isSetupInProgress: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUserAuthLoading } = useLoading();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [roleSelectionOpen, setRoleSelectionOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [producerSetupOpen, setCreativeSetupOpen] = useState(false);
  const [clientSetupOpen, setClientSetupOpen] = useState(false);
  const [advocateSetupOpen, setAdvocateSetupOpen] = useState(false);
  const [pendingSetups, setPendingSetups] = useState<string[]>([]);
  const [completedSetups, setCompletedSetups] = useState<string[]>([]);
  const [tempSetupData, setTempSetupData] = useState<SetupData>({});
  const [originalSelectedRoles, setOriginalSelectedRoles] = useState<string[]>([]);
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);
  
  // Track last synced tokens to prevent duplicate syncs
  const lastSyncedTokensRef = React.useRef<{ access: string; refresh: string } | null>(null);

  useEffect(() => {
    // Initial read (just set session state, don't sync tokens yet)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const isAuthed = !!data.session;
      console.log('[Auth] initial state:', { isAuthenticated: isAuthed, userId: data.session?.user.id });
      
      // Don't sync tokens here - let onAuthStateChange handle it
      // to avoid duplicate calls on initial load
    });

    // Subscribe to changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      const isAuthed = !!newSession;
      console.log('[Auth] state changed:', { event, isAuthenticated: isAuthed, userId: newSession?.user.id });
      
      // Sync tokens to HttpOnly cookies for XSS protection
      // This handles: INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, etc.
      if (newSession?.access_token && newSession?.refresh_token) {
        // Check if tokens have actually changed to avoid duplicate syncs
        const lastSynced = lastSyncedTokensRef.current;
        const tokensChanged = !lastSynced || 
          lastSynced.access !== newSession.access_token || 
          lastSynced.refresh !== newSession.refresh_token;
        
        if (tokensChanged) {
          // Update last synced tokens
          lastSyncedTokensRef.current = {
            access: newSession.access_token,
            refresh: newSession.refresh_token
          };
          
          // Sync tokens to backend HttpOnly cookies (non-blocking)
          syncTokensToCookies(newSession.access_token, newSession.refresh_token).catch(err => {
            console.warn('[Auth] Failed to sync tokens to cookies:', err);
          });
        } else {
          console.log('[Auth] Tokens unchanged, skipping sync');
        }
      } else {
        // Clear last synced tokens when session is null
        lastSyncedTokensRef.current = null;
      }
      
      // Reset user profile when session becomes null (logout, token expiry, etc.)
      if (!newSession) {
        setUserProfile(null);
        setUserAuthLoading(false);
      }
      
      // Track login only on actual sign in (not token refresh)
      if (newSession && event === 'SIGNED_IN') {
        const justSignedIn = localStorage.getItem('justSignedIn') === 'true';
        if (justSignedIn) {
          // Run login tracking in background without blocking state updates
          supabase.rpc('track_user_login').then(({ error }) => {
            if (error) {
              console.error('Failed to track user login:', error);
              errorToast('Login Tracking Failed', 'Unable to update login timestamp');
            }
          });
          
          // Fetch user profile to check first_login status
          fetchUserProfile(true); // true = fresh sign-in
          localStorage.removeItem('justSignedIn');
        }
      }
      
      // Close auth popover when user signs in
      if (newSession) {
        setAuthOpen(false);
      }
      
      // Show auth popover and toast when user signs out
      if (!newSession && event === 'SIGNED_OUT') {
        // Reset user profile when signing out
        setUserProfile(null);
        setUserAuthLoading(false);
        
        // Clear HttpOnly cookies via backend
        clearAuthCookies().catch(err => {
          console.warn('[Auth] Failed to clear cookies:', err);
        });
        
        // Don't show auth popover on landing page - just show the toast
        const isOnLandingPage = window.location.pathname === '/';
        if (!isOnLandingPage) {
          setAuthOpen(true);
        }
        
        // Show sign out toast (sign out is always a real user action)
        toast({
          title: 'Signed out',
          description: 'You have been successfully signed out.',
          variant: 'info',
          duration: 4000
        });
      }
      
      // Note: TOKEN_REFRESHED events are already handled by the sync above
      // No need to sync again here
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile when session exists but profile is null
  useEffect(() => {
    if (session && !userProfile && !isLoadingProfile) {
      fetchUserProfile(false); // false = not a fresh sign-in, just loading profile on page reload
    }
  }, [session]);

  const fetchUserProfile = async (isFreshSignIn: boolean = false) => {
    // Prevent multiple simultaneous calls
    if (isLoadingProfile) {
      return;
    }
    
    // Don't fetch user profile if we're on the InvitePage
    // InvitePage is a public page and doesn't need user profile data
    if (window.location.pathname.startsWith('/invite/')) {
      console.log('[Auth] Skipping profile fetch - on InvitePage');
      return;
    }
    
    setIsLoadingProfile(true);
    setUserAuthLoading(true);
    
    try {
      const profile = await userService.getUserProfile();
      setUserProfile(profile);

      // Check for pending invite flow
      const pendingInviteToken = localStorage.getItem('pendingInviteToken');
      const invitePreSelectClient = localStorage.getItem('invitePreSelectClient') === 'true';
      const inviteNeedsClientRole = localStorage.getItem('inviteNeedsClientRole') === 'true';
      
      // Check if this is first login
      if (profile?.first_login === true) {
        // Check if user came from invite link
        if (invitePreSelectClient && pendingInviteToken) {
          // DON'T clear the flags yet - keep them for RoleSelectionPopover
          // Keep pendingInviteToken for after role selection
          
          // Pre-select client role and show role selection
          setOriginalSelectedRoles(['client']);
          setRoleSelectionOpen(true);
        } else {
          // Show normal role selection
          setRoleSelectionOpen(true);
        }
      } else if (invitePreSelectClient && pendingInviteToken) {
        // User is authenticated and came from invite link - check if they have client role
        const currentRoles = profile.roles || [];
        if (currentRoles.includes('client')) {
          // User has client role - but don't automatically accept invite if setup is in progress
          if (!isSetupInProgress) {
            console.log('[Auth] User has client role, automatically accepting invite...');
            handleInviteAfterSetup();
          } else {
            console.log('[Auth] User has client role but setup is in progress, waiting for setup completion...');
          }
        } else {
          // User doesn't have client role - show role selection with client pre-selected
          console.log('[Auth] User needs client role for invite, showing role selection...');
          setOriginalSelectedRoles([...currentRoles, 'client']);
          setRoleSelectionOpen(true);
        }
      } else if (inviteNeedsClientRole && pendingInviteToken) {
        // User is authenticated but needs client role for invite
        // DON'T clear the flags yet - keep them for RoleSelectionPopover
        // Keep pendingInviteToken for after role selection
        
        // Show role selection with client pre-selected
        const currentRoles = profile.roles || [];
        if (!currentRoles.includes('client')) {
          setOriginalSelectedRoles([...currentRoles, 'client']);
          setRoleSelectionOpen(true);
        }
      } else {
        // Check for incomplete setups only if setup is not already in progress and role selection is not open
        if (!isSetupInProgress && !roleSelectionOpen) {
          try {
            const setupStatus = await userService.getIncompleteSetups();
            if (setupStatus.incomplete_setups.length > 0) {
              // For incomplete setups, store the user's current roles as original selection
              setOriginalSelectedRoles(profile.roles || []);
              // Resume incomplete setups
              startSequentialSetup(setupStatus.incomplete_setups);
            } else {
              // Only show welcome toast for fresh sign-ins, not page reloads
              if (isFreshSignIn) {
                toast({
                  title: 'Welcome back!',
                  description: 'You have successfully signed in.',
                  variant: 'success',
                  duration: 4000
                });
              }
            }
          } catch (setupErr) {
            console.error('Error checking setup status:', setupErr);
            // Only show fallback welcome toast for fresh sign-ins
            if (isFreshSignIn) {
              toast({
                title: 'Welcome back!',
                description: 'You have successfully signed in.',
                variant: 'success',
                duration: 4000
              });
            }
          }
        } else {
          // Setup is in progress or role selection is open, just show welcome toast for fresh sign-ins
          if (isFreshSignIn) {
            toast({
              title: 'Welcome back!',
              description: 'You have successfully signed in.',
              variant: 'success',
              duration: 4000
            });
          }
        }
      }

      // Note: Role-based redirection after login is now handled by AuthCallback component
      // This prevents race conditions and duplicate redirections
    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
      errorToast('Profile Error', 'Failed to load user profile');
    } finally {
      setIsLoadingProfile(false);
      setUserAuthLoading(false);
    }
  };

  const closeRoleSelection = () => {
    setRoleSelectionOpen(false);
    // No need to refresh user profile after role selection - the profile data hasn't changed
    // The roles are updated in the backend, but we don't need to refetch the entire profile
  };

  const signOut = async () => {
    try {
      // First, clear backend cookies (this always succeeds)
      // This ensures HttpOnly cookies are cleared even if Supabase signOut fails
      await clearAuthCookies().catch(err => {
        console.warn('[Auth] Error clearing backend cookies (non-critical):', err);
      });

      // Try to sign out from Supabase, but don't fail if session is already gone
      // This can fail if the session_id in the JWT doesn't exist in Supabase anymore
      const { error } = await supabase.auth.signOut();
      if (error) {
        // If signOut fails, log it but don't show error to user
        // This can happen when session is already expired/deleted
        // The important part (clearing cookies) already succeeded above
        console.warn('[Auth] Supabase signOut error (session may already be invalid):', error);
        
        // Force clear local session state even if Supabase signOut failed
        // This ensures the user is logged out on the frontend
        setSession(null);
        setUserProfile(null);
        setUserAuthLoading(false);
        
        // Show auth popover
        const isOnLandingPage = window.location.pathname === '/';
        if (!isOnLandingPage) {
          setAuthOpen(true);
        }
        
        // Show success toast - logout succeeded locally
        toast({
          title: 'Signed out',
          description: 'You have been successfully signed out.',
          variant: 'info',
          duration: 4000
        });
      } else {
        console.log('[Auth] User signed out successfully');
        // Auth popover will be shown by the auth state change handler
      }
    } catch (err) {
      // Even if everything fails, clear local state and cookies
      console.warn('[Auth] Unexpected sign out error, forcing local logout:', err);
      
      // Force clear local session state
      setSession(null);
      setUserProfile(null);
      setUserAuthLoading(false);
      
      // Clear backend cookies as fallback
      await clearAuthCookies().catch(() => {
        // Ignore errors here - we're already handling a failure case
      });
      
      // Show auth popover
      const isOnLandingPage = window.location.pathname === '/';
      if (!isOnLandingPage) {
        setAuthOpen(true);
      }
      
      // Show success toast - user is logged out locally
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
        variant: 'info',
        duration: 4000
      });
    }
  };

  const openAuth = () => {
    setAuthOpen(true);
    localStorage.setItem('justSignedIn', 'true'); // Set flag when user opens auth (persists across redirects)
  };

  const closeAuth = () => {
    setAuthOpen(false);
  };

  const startSequentialSetup = (selectedRoles: string[]) => {
    // Set up the sequence: creative -> client -> advocate
    const setupOrder = ['creative', 'client', 'advocate'];
    const orderedSetups = setupOrder.filter(role => selectedRoles.includes(role));
    setPendingSetups(orderedSetups);
    setCompletedSetups([]); // Reset completed setups
    setTempSetupData({}); // Reset temp setup data
    setOriginalSelectedRoles(selectedRoles); // Store original selection
    setIsSetupInProgress(true); // Mark setup as in progress
    
    // Start with the first setup
    if (orderedSetups.length > 0) {
      openNextSetup(orderedSetups);
    }
  };

  const redirectToAppropriateRole = () => {
    // Get the user's roles from the original selection or current profile
    const userRoles = originalSelectedRoles.length > 0 ? originalSelectedRoles : (userProfile?.roles || []);
    
    // Priority order for redirection: creative -> client -> advocate
    if (userRoles.includes('creative')) {
      navigate('/creative');
    } else if (userRoles.includes('client')) {
      navigate('/client');
    } else if (userRoles.includes('advocate')) {
      navigate('/advocate');
    } else {
      // Fallback to home if no roles found
      navigate('/');
    }
  };

  const handleInviteAfterSetup = async () => {
    const pendingInviteToken = localStorage.getItem('pendingInviteToken');
    if (pendingInviteToken) {
      try {
        const response = await inviteService.acceptInviteAfterRoleSetup(pendingInviteToken);
        
        if (response.success) {
          // Clear the invite token and flags
          localStorage.removeItem('pendingInviteToken');
          localStorage.removeItem('inviteCreativeUserId');
          localStorage.removeItem('invitePreSelectClient');
          localStorage.removeItem('inviteNeedsClientRole');
          
          if (response.relationship_exists) {
            successToast('Already Connected', response.message);
          } else {
            successToast('Success!', response.message);
          }
          
          // Redirect to client dashboard after a short delay
          setTimeout(() => {
            navigate('/client');
          }, 2000);
        } else {
          errorToast('Connection Failed', response.message);
        }
      } catch (err) {
        console.error('Error accepting invite after setup:', err);
        errorToast('Connection Failed', 'Unable to connect with creative. Please try again.');
      }
    } else {
      // No pending invite - refresh user profile to get updated data after setup completion
      // Also clear any invite flags that might still be present
      localStorage.removeItem('invitePreSelectClient');
      localStorage.removeItem('inviteNeedsClientRole');
      
      if (session?.user?.id) {
        try {
          await fetchUserProfile(false); // false = not a fresh sign-in, just refreshing after setup
          // After profile refresh, redirect to appropriate role page
          setTimeout(() => {
            redirectToAppropriateRole();
          }, 1000); // Small delay to ensure profile is updated
        } catch (err) {
          console.error('Error refreshing profile after setup:', err);
          // Even if profile refresh fails, try to redirect based on original roles
          redirectToAppropriateRole();
        }
      } else {
        // No session, redirect to appropriate role page
        redirectToAppropriateRole();
      }
    }
  };

  const openNextSetup = (setups: string[]) => {
    if (setups.length === 0) return;
    
    const nextSetup = setups[0];
    if (nextSetup === 'creative') {
      setCreativeSetupOpen(true);
    } else if (nextSetup === 'client') {
      setClientSetupOpen(true);
    } else if (nextSetup === 'advocate') {
      setAdvocateSetupOpen(true);
    }
  };

  const openCreativeSetup = () => {
    setCreativeSetupOpen(true);
  };

  const closeCreativeSetup = () => {
    setCreativeSetupOpen(false);
    // Mark creative as completed
    const currentSetup = pendingSetups[0];
    if (currentSetup === 'creative') {
      setCompletedSetups(prev => [...prev, 'creative']);
    }
    // Continue to next setup if there are pending ones
    const remainingSetups = pendingSetups.slice(1);
    setPendingSetups(remainingSetups);
    
    if (remainingSetups.length > 0) {
      openNextSetup(remainingSetups);
    } else {
      // All setups complete - clear setup in progress flag and check for pending invite
      setIsSetupInProgress(false);
      // Refresh user profile to get updated first_login status
      fetchUserProfile();
      handleInviteAfterSetup();
    }
  };

  const openClientSetup = () => {
    setClientSetupOpen(true);
  };

  const closeClientSetup = () => {
    setClientSetupOpen(false);
    // Mark client as completed
    const currentSetup = pendingSetups[0];
    if (currentSetup === 'client') {
      setCompletedSetups(prev => [...prev, 'client']);
    }
    // Continue to next setup if there are pending ones
    const remainingSetups = pendingSetups.slice(1);
    setPendingSetups(remainingSetups);
    
    if (remainingSetups.length > 0) {
      openNextSetup(remainingSetups);
    } else {
      // All setups complete - clear setup in progress flag and check for pending invite
      setIsSetupInProgress(false);
      // Refresh user profile to get updated first_login status
      fetchUserProfile();
      handleInviteAfterSetup();
    }
  };

  const openAdvocateSetup = () => {
    setAdvocateSetupOpen(true);
  };

  const closeAdvocateSetup = () => {
    setAdvocateSetupOpen(false);
    // Mark advocate as completed
    const currentSetup = pendingSetups[0];
    if (currentSetup === 'advocate') {
      setCompletedSetups(prev => [...prev, 'advocate']);
    }
    // Continue to next setup if there are pending ones
    const remainingSetups = pendingSetups.slice(1);
    setPendingSetups(remainingSetups);
    
    if (remainingSetups.length > 0) {
      openNextSetup(remainingSetups);
    } else {
      // All setups complete - clear setup in progress flag and check for pending invite
      setIsSetupInProgress(false);
      // Refresh user profile to get updated first_login status
      fetchUserProfile();
      handleInviteAfterSetup();
    }
  };

  const saveSetupData = (role: string, data: any) => {
    setTempSetupData(prev => ({ ...prev, [role]: data }));
  };

  const backToRoleSelection = () => {
    setCreativeSetupOpen(false);
    setClientSetupOpen(false);
    setAdvocateSetupOpen(false);
    setPendingSetups([]); // Clear pending setups when going back
    setCompletedSetups([]); // Clear completed setups when going back
    setTempSetupData({}); // Clear temp setup data when going back to roles
    setIsSetupInProgress(false); // Clear setup in progress flag
    setRoleSelectionOpen(true);
  };

  const backToPreviousSetup = () => {
    // Close current setup
    setCreativeSetupOpen(false);
    setClientSetupOpen(false);
    setAdvocateSetupOpen(false);
    
    // Get the previous setup from completed setups
    if (completedSetups.length > 0) {
      const previousSetup = completedSetups[completedSetups.length - 1];
      // Remove the last completed setup and add it back to pending
      setCompletedSetups(prev => prev.slice(0, -1));
      setPendingSetups(prev => [previousSetup, ...prev]);
      
      // Open the previous setup
      if (previousSetup === 'creative') {
        setCreativeSetupOpen(true);
      } else if (previousSetup === 'client') {
        setClientSetupOpen(true);
      } else if (previousSetup === 'advocate') {
        setAdvocateSetupOpen(true);
      }
    }
  };

  // Determine if this is the first setup (no completed setups yet)
  const isFirstSetup = completedSetups.length === 0;

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    signOut,
    openAuth,
    closeAuth,
    authOpen,
    roleSelectionOpen,
    closeRoleSelection,
    userProfile,
    fetchUserProfile,
    producerSetupOpen,
    openCreativeSetup,
    closeCreativeSetup,
    clientSetupOpen,
    openClientSetup,
    closeClientSetup,
    advocateSetupOpen,
    openAdvocateSetup,
    closeAdvocateSetup,
    backToRoleSelection,
    backToPreviousSetup,
    startSequentialSetup,
    pendingSetups,
    completedSetups,
    isFirstSetup,
    tempSetupData,
    saveSetupData,
    originalSelectedRoles,
    isSetupInProgress,
  }), [session, authOpen, roleSelectionOpen, userProfile, isLoadingProfile, producerSetupOpen, clientSetupOpen, advocateSetupOpen, pendingSetups, completedSetups, isFirstSetup, tempSetupData, originalSelectedRoles, isSetupInProgress]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
