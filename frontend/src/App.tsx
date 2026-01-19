import { StrictMode, useEffect, useState, lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material'
import { createAppTheme } from './config/theme'
import type { ColorConfig } from './config/color'

// Keep lightweight pages as regular imports (needed immediately)
import {LandingPage} from './views/web/LandingPage.tsx'
import { CreativeFeaturesPage } from './views/web/CreativeFeaturesPage.tsx'
import { ContactUs } from './views/web/ContactUs.tsx'
import { PrivacyPolicy } from './views/web/PrivacyPolicy.tsx'
import { TermsOfService } from './views/web/TermsOfService.tsx'
import { AuthCallback } from './views/AuthCallback'
import { NoAccess } from './views/NoAccess'
import { InvitePage } from './views/InvitePage'
import { PaymentSuccess } from './views/PaymentSuccess'
import { PaymentCancelled } from './views/PaymentCancelled'
import { SubscriptionSuccess } from './pages/SubscriptionSuccess'
import { SubscriptionCanceled } from './pages/SubscriptionCanceled'
import { NotFound } from './views/NotFound'

// Lazy load heavy route components for code splitting
const DashCreative = lazy(() => import('./views/creative/DashCreative').then(module => ({ default: module.DashCreative })))
const ClientCreative = lazy(() => import('./views/creative/ClientCreative').then(module => ({ default: module.ClientCreative })))
const ActivityCreative = lazy(() => import('./views/creative/ActivityCreative').then(module => ({ default: module.ActivityCreative })))
const PublicCreative = lazy(() => import('./views/creative/PublicCreative').then(module => ({ default: module.PublicCreative })))
const NotificationsCreative = lazy(() => import('./views/creative/NotificationsCreative').then(module => ({ default: module.NotificationsCreative })))
const ClientDashboard = lazy(() => import('./views/client/DashClient').then(module => ({ default: module.ClientDashboard })))
const ClientBook = lazy(() => import('./views/client/BookClient').then(module => ({ default: module.ClientBook })))
const ClientOrders = lazy(() => import('./views/client/OrdersClient').then(module => ({ default: module.ClientOrders })))
const PaymentRequestsClient = lazy(() => import('./views/client/PaymentRequestsClient').then(module => ({ default: module.PaymentRequestsClient })))
const NotificationsClient = lazy(() => import('./views/client/NotificationsClient').then(module => ({ default: module.NotificationsClient })))
const DashAdvocate = lazy(() => import('./views/advocate/DashAdvocate').then(module => ({ default: module.DashAdvocate })))

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
import { ToastProvider } from './components/toast/toast'
import { LoadingProvider } from './context/loading'

// Loading fallback component for Suspense
function RouteLoadingFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <CircularProgress size={60} />
    </Box>
  );
}

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
        <Route path="/features/creative" element={<CreativeFeaturesPage />} />
        <Route path="/creative" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="creative">
              <DashCreative />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/creative/clients" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="creative">
              <ClientCreative />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/creative/activity" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="creative">
              <ActivityCreative />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/creative/public" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="creative">
              <PublicCreative />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/creative/notifications" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="creative">
              <NotificationsCreative />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/client" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="client">
              <ClientDashboard />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/client/book" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="client">
              <ClientBook />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/client/orders" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="client">
              <ClientOrders />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/client/orders/payment-requests" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="client">
              <PaymentRequestsClient />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/client/notifications" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="client">
              <NotificationsClient />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/advocate" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RoleGuard requiredRole="advocate">
              <DashAdvocate />
            </RoleGuard>
          </Suspense>
        } />
        <Route path="/invite/:inviteToken" element={<InvitePage />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/no-access" element={<NoAccess />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancelled" element={<PaymentCancelled />} />
        <Route path="/subscription-success" element={<SubscriptionSuccess />} />
        <Route path="/subscription-canceled" element={<SubscriptionCanceled />} />
        <Route path="*" element={<NotFound />} />
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
      {/* ClientSetupPopover is kept for compatibility but no longer shown - client profiles are auto-created */}
      <ClientSetupPopover 
        open={false} // Never opened - client profiles are auto-created
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

function App() {
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

export default App;
