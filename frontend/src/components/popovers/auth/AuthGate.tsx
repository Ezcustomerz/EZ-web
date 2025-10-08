import { useEffect, useState } from 'react';
import { supabase } from '../../../config/supabase';
import { AuthPopover } from './AuthPopover';
import type { Session } from '@supabase/supabase-js';

interface AuthGateProps {
  enabled?: boolean;
}

// Renders a popover if there is no active session
export function AuthGate({ enabled = true }: AuthGateProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Initial session check
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const hasSession = !!data.session;
      setIsOpen(!hasSession);
    });

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setIsOpen(!session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [enabled]);

  return (
    <AuthPopover
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title="Sign Up / Sign In"
      subtitle="Sign in with Google to create an account"
    />
  );
}

