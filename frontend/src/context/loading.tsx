import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface LoadingState {
  theme: boolean;
  userAuth: boolean; // For fetchUserProfile + setup status
  profile: boolean; // For creative profile
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setThemeLoading: (loading: boolean) => void;
  setUserAuthLoading: (loading: boolean) => void;
  setProfileLoading: (loading: boolean) => void;
  isAnyLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({
    theme: false, // Theme is now inline, no loading needed
    userAuth: false,
    profile: false,
  });

  const setThemeLoading = useCallback((loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, theme: loading }));
  }, []);

  const setUserAuthLoading = useCallback((loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, userAuth: loading }));
  }, []);

  const setProfileLoading = useCallback((loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, profile: loading }));
  }, []);

  const isAnyLoading = useMemo(() => 
    loadingStates.theme || loadingStates.userAuth || loadingStates.profile,
    [loadingStates.theme, loadingStates.userAuth, loadingStates.profile]
  );

  const contextValue = useMemo(() => ({
    loadingStates,
    setThemeLoading,
    setUserAuthLoading,
    setProfileLoading,
    isAnyLoading,
  }), [loadingStates, setThemeLoading, setUserAuthLoading, setProfileLoading, isAnyLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
