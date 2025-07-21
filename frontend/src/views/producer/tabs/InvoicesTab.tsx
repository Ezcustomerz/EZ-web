import { Box } from '@mui/material';
import { InvoicesTable, mockInvoices } from '../../../components/tables/InvoicesTable';
 
export function InvoicesTab() {
  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 1,
      overflow: 'visible',
    }}>
      <InvoicesTable invoices={mockInvoices} />
    </Box>
  );
} 