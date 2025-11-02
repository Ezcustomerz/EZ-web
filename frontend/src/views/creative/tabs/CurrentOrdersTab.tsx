import { Box } from '@mui/material';
import { RequestsTable } from '../../../components/tables/RequestsTable';
 
export function CurrentOrdersTab() {
  // Order data - will be populated from API
  const orders: Array<any> = [];

  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 1,
      overflow: 'visible',
    }}>
      <RequestsTable requests={orders} context="orders" />
    </Box>
  );
}