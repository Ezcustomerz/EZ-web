import { StrictMode, useEffect, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import {LandingPage} from './views/web/LandingPage.tsx'
import { DashCreative } from './views/creative/DashCreative.tsx'
import { ClientCreative } from './views/creative/ClientCreative.tsx'
import { ActivityCreative } from './views/creative/ActivityCreative.tsx'
import { PublicCreative } from './views/creative/PublicCreative.tsx'
import { ClientDashboard } from './views/client/DashClient.tsx'
import { ClientBook } from './views/client/BookClient.tsx'
import { ClientOrders } from './views/client/OrdersClient.tsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createAppTheme } from './config/theme'
import type { ColorConfig } from './config/color'

// Inline theme configuration to avoid network request
const defaultThemeConfig: ColorConfig = {
  primary: "#7A5FFF",
  secondary: "#339BFF",
  accent: "#FFCD38",
  text: "#241E1A",
  textSecondary: "#6B7280",
  background: "#FFFFFF",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6"
};
// Import Supabase configuration to trigger connection test
import './config/supabase'
import { ScrollToTop } from './utils/ScrollToTop.tsx'
import { AuthProvider, useAuth } from './context/auth'
import { AuthPopover } from './components/popovers/AuthPopover'
import { RoleSelectionPopover } from './components/popovers/RoleSelectionPopover'
import { CreativeSetupPopover } from './components/popovers/CreativeSetupPopover'
import { ClientSetupPopover } from './components/popovers/ClientSetupPopover'
import { AdvocateSetupPopover } from './components/popovers/AdvocateSetupPopover'
import { DashAdvocate } from './views/advocate/DashAdvocate'
import { ToastProvider } from './components/toast/toast'
import { LoadingProvider } from './context/loading'

function AppContent() {
  const { 
    authOpen, 
    closeAuth, 
    roleSelectionOpen, 
    closeRoleSelection, 
    userProfile,
    producerSetupOpen,
    closeCreativeSetup,
    clientSetupOpen,
    closeClientSetup,
    advocateSetupOpen,
    closeAdvocateSetup,
    openAdvocateSetup,
    backToRoleSelection,
    isFirstSetup,
    originalSelectedRoles
  } = useAuth();

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/creative" element={<DashCreative />} />
        <Route path="/creative/clients" element={<ClientCreative />} />
        <Route path="/creative/activity" element={<ActivityCreative />} />
        <Route path="/creative/public" element={<PublicCreative />} />
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/client/book" element={<ClientBook />} />
        <Route path="/client/orders" element={<ClientOrders />} />
        <Route path="/advocate" element={<DashAdvocate />} />
      </Routes>
      <AuthPopover 
        open={authOpen} 
        onClose={closeAuth} 
        title="Sign Up / Sign In"
        subtitle="Sign in with Google to create an account"
      />
      <RoleSelectionPopover 
        open={roleSelectionOpen} 
        onClose={closeRoleSelection}
        userName={userProfile?.name}
        userRoles={originalSelectedRoles.length > 0 ? originalSelectedRoles : undefined}
      />
            <CreativeSetupPopover 
        open={producerSetupOpen} 
        onClose={closeCreativeSetup}
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        onBack={backToRoleSelection}
        isFirstSetup={isFirstSetup}
      />
      <ClientSetupPopover 
        open={clientSetupOpen} 
        onClose={closeClientSetup}
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        onBack={backToRoleSelection}
        isFirstSetup={isFirstSetup}
      />
      <AdvocateSetupPopover 
        open={advocateSetupOpen}
        onClose={closeAdvocateSetup}
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        onBack={backToRoleSelection}
        isFirstSetup={isFirstSetup}
      />
    </>
  );
}

function ThemeLoader({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(() => createAppTheme(defaultThemeConfig));

  useEffect(() => {
    // Set CSS variables immediately with default theme
    Object.entries(defaultThemeConfig).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });

    // Try to load custom theme in background (non-blocking)
    // Use requestIdleCallback for better performance
    const loadCustomTheme = () => {
      fetch('/appTheme.json')
        .then(res => res.json())
        .then((data: ColorConfig) => {
          setTheme(createAppTheme(data));
          // Update CSS variables with custom theme
          Object.entries(data).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--${key}`, value);
          });
        })
        .catch(error => {
          console.warn('Failed to load custom theme, using default:', error);
          // Keep using default theme
        });
    };

    // Load custom theme when browser is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadCustomTheme);
    } else {
      setTimeout(loadCustomTheme, 100);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

function Root() {
  return (
    <StrictMode>
      <LoadingProvider>
        <ThemeLoader>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <ToastProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </ToastProvider>
          </BrowserRouter>
        </ThemeLoader>
      </LoadingProvider>
    </StrictMode>
  );
}
//test
createRoot(document.getElementById('root')!).render(<Root />);
