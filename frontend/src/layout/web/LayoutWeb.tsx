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
      <Box component="main" sx={{ 
        flex: 1, 
        paddingTop: { xs: '56px', sm: '60px', md: '84px' }, 
        mb: { xs: 3, md: 4 } 
      }}>
        {children}
      </Box>
    </Box>
  );
}

export default LayoutWeb; 