import { Box, Typography } from '@mui/material';

export function ReadyTab() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
        Ready
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Your completed service orders ready for download will appear here.
      </Typography>
    </Box>
  );
}
