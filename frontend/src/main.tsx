import { StrictMode, useEffect, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import {LandingPage} from './views/web/LandingPage.tsx'
import { ContactUs } from './views/web/ContactUs.tsx'
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
import { userService, type UserRoleProfiles } from './api/userService'
import { AuthPopover } from './components/popovers/auth/AuthPopover'
import { RoleSelectionPopover } from './components/popovers/setup/RoleSelectionPopover'
import { CreativeSetupPopover } from './components/popovers/setup/CreativeSetupPopover'
import { ClientSetupPopover } from './components/popovers/setup/ClientSetupPopover'
import { AdvocateSetupPopover } from './components/popovers/setup/AdvocateSetupPopover'
import { SetupGate } from './components/popovers/auth/SetupGate'
import { RoleGuard } from './components/guards/RoleGuard'
import { DashAdvocate } from './views/advocate/DashAdvocate'
import { InvitePage } from './views/InvitePage'
import { AuthCallback } from './views/AuthCallback'
import { NoAccess } from './views/NoAccess'
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
    backToRoleSelection,
    isFirstSetup,
    originalSelectedRoles
  } = useAuth();
  
  const [roleProfiles, setRoleProfiles] = useState<UserRoleProfiles | undefined>(undefined);

  // Fetch role profiles when role selection popover opens
  useEffect(() => {
    const fetchRoleProfiles = async () => {
      if (roleSelectionOpen && userProfile) {
        try {
          const profiles = await userService.getUserRoleProfiles();
          setRoleProfiles(profiles);
        } catch (error) {
          console.error('Failed to fetch role profiles for role selection:', error);
          setRoleProfiles(undefined);
        }
      } else {
        setRoleProfiles(undefined);
      }
    };

    fetchRoleProfiles();
  }, [roleSelectionOpen, userProfile]);

  return (
    <>
      <ScrollToTop />
      <SetupGate />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/creative" element={
          <RoleGuard requiredRole="creative">
            <DashCreative />
          </RoleGuard>
        } />
        <Route path="/creative/clients" element={
          <RoleGuard requiredRole="creative">
            <ClientCreative />
          </RoleGuard>
        } />
        <Route path="/creative/activity" element={
          <RoleGuard requiredRole="creative">
            <ActivityCreative />
          </RoleGuard>
        } />
        <Route path="/creative/public" element={
          <RoleGuard requiredRole="creative">
            <PublicCreative />
          </RoleGuard>
        } />
        <Route path="/client" element={
          <RoleGuard requiredRole="client">
            <ClientDashboard />
          </RoleGuard>
        } />
        <Route path="/client/book" element={
          <RoleGuard requiredRole="client">
            <ClientBook />
          </RoleGuard>
        } />
        <Route path="/client/orders" element={
          <RoleGuard requiredRole="client">
            <ClientOrders />
          </RoleGuard>
        } />
        <Route path="/advocate" element={
          <RoleGuard requiredRole="advocate">
            <DashAdvocate />
          </RoleGuard>
        } />
        <Route path="/invite/:inviteToken" element={<InvitePage />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/no-access" element={<NoAccess />} />
        <Route path="/contact" element={<ContactUs />} />
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
        roleProfiles={roleProfiles}
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
