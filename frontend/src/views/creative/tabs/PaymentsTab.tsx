import { Box } from '@mui/material';
import { RequestsTable, mockRequests } from '../../../components/tables/RequestsTable';
 
export function PaymentsTab() {
  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 1,
      overflow: 'visible',
    }}>
      <RequestsTable requests={mockRequests} context="payments" />
    </Box>
  );
}
