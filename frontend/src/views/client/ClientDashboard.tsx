import React from 'react';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { Box, Typography, Paper } from '@mui/material';

export function ClientDashboard() {
  return (
    <LayoutClient selectedNavItem="dashboard">
      <Box sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          Client Dashboard
        </Typography>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Welcome to your Client Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This is the client dashboard. You can access your files, services, and payments from the sidebar.
          </Typography>
        </Paper>
      </Box>
    </LayoutClient>
  );
} 