import React from 'react';
import { Box } from '@mui/material';
import { Header } from './Header';

interface LayoutWebProps {
  children: React.ReactNode;
}

function LayoutWeb({ children }: LayoutWebProps) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
}

export default LayoutWeb; 