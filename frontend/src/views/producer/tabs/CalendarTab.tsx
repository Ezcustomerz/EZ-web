import { Box, Typography } from '@mui/material';

export function CalendarTab() {
  return (
    <Box sx={{ minHeight: 300, width: '100%', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, pb: 2 }}>
      <Typography variant="h5" color="primary" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
        Calendar
      </Typography>
    </Box>
  );
} 