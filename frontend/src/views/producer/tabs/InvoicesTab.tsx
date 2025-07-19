import { Box } from '@mui/material';
import { InvoicesTable } from '../../../components/tables/InvoicesTable';
 
export function InvoicesTab() {
  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 1,
      overflow: 'visible',
    }}>
      <InvoicesTable />
    </Box>
  );
} 