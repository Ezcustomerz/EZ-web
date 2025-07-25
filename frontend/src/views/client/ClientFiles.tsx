import React from 'react';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { Box, Typography } from '@mui/material';

export function ClientFiles() {
  return (
    <LayoutClient selectedNavItem="files">
      <Box sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          Files
        </Typography>
      </Box>
    </LayoutClient>
  );
} 