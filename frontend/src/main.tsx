import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import {LandingPage} from './views/web/LandingPage.tsx'
import { DashProducer } from './views/producer/DashProducer.tsx'
import { ClientProducer } from './views/producer/ClientProducer.tsx'
import { ActivityProducer } from './views/producer/ActivityProducer.tsx'
import { PublicProducer } from './views/producer/PublicProducer.tsx'
import { ClientDashboard } from './views/client/DashClient.tsx'
import { ClientBook } from './views/client/BookClient.tsx'
import { ClientOrders } from './views/client/OrdersClient.tsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createAppTheme } from './config/theme'
import type { ColorConfig } from './config/color'
// Import Supabase configuration to trigger connection test
import './config/supabase'
import { ScrollToTop } from './utils/ScrollToTop.tsx'
import { AuthProvider, useAuth } from './context/auth'
import { AuthPopover } from './components/popovers/AuthPopover'

function AppContent() {
  const { authOpen, closeAuth } = useAuth();

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/producer" element={<DashProducer />} />
        <Route path="/producer/clients" element={<ClientProducer />} />
        <Route path="/producer/activity" element={<ActivityProducer />} />
        <Route path="/producer/public" element={<PublicProducer />} />
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/client/book" element={<ClientBook />} />
        <Route path="/client/orders" element={<ClientOrders />} />
      </Routes>
      <AuthPopover open={authOpen} onClose={closeAuth} />
    </>
  );
}

function Root() {
  const [theme, setTheme] = useState<any>(null);

  useEffect(() => {
    fetch('/appTheme.json')
      .then(res => res.json())
      .then((data: ColorConfig) => {
        setTheme(createAppTheme(data));
        // Set CSS variables for any non-MUI styling
        Object.entries(data).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--${key}`, value);
        });
      })
      .catch(error => {
        console.error('Failed to load theme:', error);
        // Fallback to default theme if loading fails
        const defaultColors: ColorConfig = {
          primary: "#1A8FFF",
          secondary: "#2E9C69",
          accent: "#FF6B6B",
          text: "#241E1A",
          textSecondary: "#6F665F",
          background: "#FFFFFF",
          success: "#10B981",
          error: "#EF4444",
          warning: "#F59E0B",
          info: "#3B82F6"
        };
        setTheme(createAppTheme(defaultColors));
      });
  }, []);

  if (!theme) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </StrictMode>
  );
}
//test
createRoot(document.getElementById('root')!).render(<Root />);
