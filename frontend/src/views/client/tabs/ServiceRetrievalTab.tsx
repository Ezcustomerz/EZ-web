import { Box, Typography } from '@mui/material';

export function CompletedServicesTab() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
        Service Retrieval
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Your completed service orders will appear here.
      </Typography>
    </Box>
  );
} 