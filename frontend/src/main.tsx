import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {LandingPage} from './views/web/LandingPage.tsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createAppTheme } from './config/theme'
import type { ColorConfig } from './config/color'

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
        <LandingPage />
      </ThemeProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
