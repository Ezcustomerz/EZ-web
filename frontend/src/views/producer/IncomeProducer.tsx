import { Box, Typography } from '@mui/material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';

export function IncomeProducer() {
  return (
    <LayoutProducer selectedNavItem="income">
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" component="h1">
          Income
        </Typography>
      </Box>
    </LayoutProducer>
  );
} 