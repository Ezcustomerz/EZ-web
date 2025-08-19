import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { toast, errorToast } from '../components/toast/toast';
import { userService, type UserProfile } from '../api/userService';

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
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [roleSelectionOpen, setRoleSelectionOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [producerSetupOpen, setCreativeSetupOpen] = useState(false);
  const [clientSetupOpen, setClientSetupOpen] = useState(false);
  const [advocateSetupOpen, setAdvocateSetupOpen] = useState(false);

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
        setAuthOpen(true);
        
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

  const fetchUserProfile = async () => {
    try {
      const profile = await userService.getUserProfile();
      setUserProfile(profile);

      // Check if this is first login
      if (profile?.first_login === true) {
        // Show role selection instead of welcome toast
        setRoleSelectionOpen(true);
      } else {
        // Show regular welcome toast for returning users
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
          variant: 'success',
          duration: 4000
        });
      }
    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
      errorToast('Profile Error', 'Failed to load user profile');
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

  const openCreativeSetup = () => {
    setCreativeSetupOpen(true);
  };

  const closeCreativeSetup = () => {
    setCreativeSetupOpen(false);
  };

  const openClientSetup = () => {
    setClientSetupOpen(true);
  };

  const closeClientSetup = () => {
    setClientSetupOpen(false);
  };

  const openAdvocateSetup = () => {
    setAdvocateSetupOpen(true);
  };

  const closeAdvocateSetup = () => {
    setAdvocateSetupOpen(false);
  };

  const backToRoleSelection = () => {
    setCreativeSetupOpen(false);
    setClientSetupOpen(false);
    setAdvocateSetupOpen(false);
    setRoleSelectionOpen(true);
  };

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
  }), [session, authOpen, roleSelectionOpen, userProfile, producerSetupOpen, clientSetupOpen, advocateSetupOpen]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
