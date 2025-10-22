import { Box } from '@mui/material';
import { PastOrdersTable } from '../../../components/tables/PastOrdersTable';
 
export function PastOrdersTab() {
  // Sample data for past orders (completed and canceled)
  const pastOrders = [
    {
      id: 'past-1',
      client: 'Tech Startup',
      service: { title: 'Logo Design' },
      amount: 800,
      status: 'Complete',
      date: '2023-12-15'
    },
    {
      id: 'past-2',
      client: 'Restaurant Chain',
      service: { title: 'Menu Design' },
      amount: 1200,
      status: 'Complete',
      date: '2023-12-10'
    },
    {
      id: 'past-3',
      client: 'Fashion Brand',
      service: { title: 'Website Design' },
      amount: 2500,
      status: 'Complete',
      date: '2023-12-05'
    },
    {
      id: 'past-4',
      client: 'Local Gym',
      service: { title: 'Marketing Materials' },
      amount: 600,
      status: 'Canceled',
      date: '2023-11-28'
    },
    {
      id: 'past-5',
      client: 'E-commerce Store',
      service: { title: 'Product Photography' },
      amount: 1500,
      status: 'Complete',
      date: '2023-11-20'
    },
    {
      id: 'past-6',
      client: 'Consulting Firm',
      service: { title: 'Presentation Design' },
      amount: 900,
      status: 'Canceled',
      date: '2023-11-15'
    }
  ];

  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 1,
      overflow: 'visible',
    }}>
      <PastOrdersTable orders={pastOrders} />
    </Box>
  );
}
