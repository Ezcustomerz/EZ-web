import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Custom storage implementation using sessionStorage for better security
// sessionStorage clears when browser session ends, reducing XSS attack surface
const customStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
