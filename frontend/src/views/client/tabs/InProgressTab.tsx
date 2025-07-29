import { Box, Typography } from '@mui/material';

export function InProgressTab() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
        In Progress
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Your ongoing service orders will appear here.
      </Typography>
    </Box>
  );
} 