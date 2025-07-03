import React from 'react';
import { Box } from '@mui/material';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutWebProps {
  children: React.ReactNode;
}

export function LayoutWeb({ children }: LayoutWebProps) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box component="main" sx={{ 
        flex: 1, 
        paddingTop: { xs: '56px', sm: '64px', md: '88px', lg: '104px' }, 
        mb: { xs: 3, md: 4 } 
      }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}