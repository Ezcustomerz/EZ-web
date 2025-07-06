import { Box, Typography } from '@mui/material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';

export function PublicProducer() {
  return (
    <LayoutProducer selectedNavItem="public">
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" component="h1">
          Public
        </Typography>
      </Box>
    </LayoutProducer>
  );
} 