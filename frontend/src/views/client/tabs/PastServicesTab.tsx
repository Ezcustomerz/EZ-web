import { Box, Typography } from '@mui/material';

export function PastServicesTab() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
        Past Services
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Your past service orders will appear here.
      </Typography>
    </Box>
  );
} 