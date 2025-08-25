import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { toast, errorToast } from '../components/toast/toast';
import { userService, type UserProfile } from '../api/userService';


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
  fetchUserProfile: () => Promise<void>;
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
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
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


  useEffect(() => {
    // Initial read
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const isAuthed = !!data.session;
      console.log('[Auth] initial state:', { isAuthenticated: isAuthed, userId: data.session?.user.id });
    });

    // Subscribe to changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      const isAuthed = !!newSession;
      console.log('[Auth] state changed:', { event, isAuthenticated: isAuthed, userId: newSession?.user.id });
      
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
          fetchUserProfile();
          localStorage.removeItem('justSignedIn');
        }
      }
      
      // Close auth popover when user signs in
      if (newSession) {
        setAuthOpen(false);
      }
      
      // Show auth popover and toast when user signs out
      if (!newSession && event === 'SIGNED_OUT') {
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
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile when session exists but profile is null
  useEffect(() => {
    if (session && !userProfile && !isLoadingProfile) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingProfile) {
      return;
    }
    
    setIsLoadingProfile(true);
    
    try {
      const profile = await userService.getUserProfile();
      setUserProfile(profile);

      // Check if this is first login
      if (profile?.first_login === true) {
        // Show role selection instead of welcome toast
        setRoleSelectionOpen(true);
      } else {
        // Check for incomplete setups
        try {
          const setupStatus = await userService.getIncompleteSetups();
          if (setupStatus.incomplete_setups.length > 0) {
            // For incomplete setups, store the user's current roles as original selection
            setOriginalSelectedRoles(profile.roles || []);
            // Resume incomplete setups
            startSequentialSetup(setupStatus.incomplete_setups);
          } else {
            // Show regular welcome toast for returning users with complete setups
            toast({
              title: 'Welcome back!',
              description: 'You have successfully signed in.',
              variant: 'success',
              duration: 4000
            });
          }
        } catch (setupErr) {
          console.error('Error checking setup status:', setupErr);
          // Fallback to welcome toast if setup check fails
          toast({
            title: 'Welcome back!',
            description: 'You have successfully signed in.',
            variant: 'success',
            duration: 4000
          });
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
      errorToast('Profile Error', 'Failed to load user profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const closeRoleSelection = () => {
    setRoleSelectionOpen(false);
    // Refresh user profile after role selection
    if (session?.user?.id) {
      fetchUserProfile();
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        errorToast('Sign Out Failed', 'Unable to sign out. Please try again.');
      } else {
        console.log('[Auth] User signed out successfully');
        // Auth popover will be shown by the auth state change handler
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
      errorToast('Unexpected Error', 'An unexpected error occurred during sign out');
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
    
    // Start with the first setup
    if (orderedSetups.length > 0) {
      openNextSetup(orderedSetups);
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
  }), [session, authOpen, roleSelectionOpen, userProfile, isLoadingProfile, producerSetupOpen, clientSetupOpen, advocateSetupOpen, pendingSetups, completedSetups, isFirstSetup, tempSetupData, originalSelectedRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
