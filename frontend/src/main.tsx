import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import {LandingPage} from './views/web/LandingPage.tsx'
import { DashProducer } from './views/producer/DashProducer.tsx'
import { ClientProducer } from './views/producer/ClientProducer.tsx'
import { ActivityProducer } from './views/producer/ActivityProducer.tsx'
import { PublicProducer } from './views/producer/PublicProducer.tsx'
import { ClientDashboard } from './views/client/ClientDashboard.tsx'
import { ClientFiles } from './views/client/ClientFiles.tsx'
import { ClientServices } from './views/client/ClientServices.tsx'
import { ClientPayments } from './views/client/ClientPayments.tsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createAppTheme } from './config/theme'
import type { ColorConfig } from './config/color'
// Import Supabase configuration to trigger connection test
import './config/supabase'
import { ScrollToTop } from './utils/ScrollToTop.tsx'

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
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/producer" element={<DashProducer />} />
            <Route path="/producer/clients" element={<ClientProducer />} />
            <Route path="/producer/activity" element={<ActivityProducer />} />
            <Route path="/producer/public" element={<PublicProducer />} />
            <Route path="/client" element={<ClientDashboard />} />
            <Route path="/client/files" element={<ClientFiles />} />
            <Route path="/client/services" element={<ClientServices />} />
            <Route path="/client/payments" element={<ClientPayments />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StrictMode>
  );
}
//test
createRoot(document.getElementById('root')!).render(<Root />);
