import { Box, Typography } from '@mui/material';
import { LayoutAdvocate } from '../../layout/advocate/LayoutAdvocate';

export function DashAdvocate() {
  return (
    <LayoutAdvocate selectedNavItem="dashboard">
      <Box
        sx={{
          px: { xs: 2, sm: 2, md: 3 },
          pt: { xs: 2, sm: 2, md: 3 },
          pb: { xs: 1.5, sm: 1.5, md: 0.5 },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
            color: 'primary.main',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
            mb: 0.25,
          }}
        >
          Dashboard
        </Typography>
      </Box>
    </LayoutAdvocate>
  );
}


