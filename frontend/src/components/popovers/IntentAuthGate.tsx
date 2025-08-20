import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthPopover } from './AuthPopover';

// Shows AuthPopover only if URL contains ?auth=1 and user has no session.
// Immediately strips the query param to avoid re-opening on subsequent navigations.
export function IntentAuthGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const shouldPrompt = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('auth') === '1';
  }, [location.search]);

  useEffect(() => {
    if (!shouldPrompt) return;

    // Strip the auth param right away so it won't re-trigger
    navigate(location.pathname, { replace: true });

    supabase.auth.getSession().then(({ data }) => {
      const hasSession = !!data.session;
      if (!hasSession) setOpen(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setOpen(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [shouldPrompt, navigate, location.pathname]);

  if (!open) return null;

  return (
    <AuthPopover
      open={open}
      onClose={() => setOpen(false)}
      title="Sign Up / Sign In"
      subtitle="Sign in with Google to use creative tools"
    />
  );
}

