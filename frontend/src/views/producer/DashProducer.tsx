import { Box, Typography } from '@mui/material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';

export function DashProducer() {
  return (
    <LayoutProducer selectedNavItem="dashboard">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            mb: 2,
          }}
        >
          Hello World
        </Typography>
      </Box>
    </LayoutProducer>
  );
} 