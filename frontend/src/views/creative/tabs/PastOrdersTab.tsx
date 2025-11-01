import { Box } from '@mui/material';
import { PastOrdersTable } from '../../../components/tables/PastOrdersTable';
 
export function PastOrdersTab() {
  // Order data - will be populated from API
  const orders: Array<any> = [];

  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 1,
      overflow: 'visible',
    }}>
      <PastOrdersTable orders={orders} />
    </Box>
  );
}