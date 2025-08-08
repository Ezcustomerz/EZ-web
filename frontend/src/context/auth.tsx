import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  openAuth: () => void;
  closeAuth: () => void;
  authOpen: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    // Initial read
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const isAuthed = !!data.session;
      console.log('[Auth] initial state:', { isAuthenticated: isAuthed, userId: data.session?.user.id });
    });

    // Subscribe to changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const isAuthed = !!newSession;
      console.log('[Auth] state changed:', { isAuthenticated: isAuthed, userId: newSession?.user.id });
      // Close auth popover when user signs in
      if (newSession) {
        setAuthOpen(false);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('[Auth] User signed out successfully');
        // Show auth popover after sign out
        setAuthOpen(true);
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
    }
  };

  const openAuth = () => {
    setAuthOpen(true);
  };

  const closeAuth = () => {
    setAuthOpen(false);
  };

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    signOut,
    openAuth,
    closeAuth,
    authOpen,
  }), [session, authOpen]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
