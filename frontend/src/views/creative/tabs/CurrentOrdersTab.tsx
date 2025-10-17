import { Box } from '@mui/material';
import { RequestsTable } from '../../../components/tables/RequestsTable';
 
export function CurrentOrdersTab() {
  // Sample data with pending approval and awaiting payment orders
  const sampleOrders = [
    {
      id: '1',
      client: 'Acme Corp',
      service: { title: 'Logo Design' },
      amount: 500,
      status: 'Pending Approval',
      date: '2024-01-15',
      bookingDate: '2024-01-20T10:00:00Z'
    },
    {
      id: '2',
      client: 'TechStart Inc',
      service: { title: 'Website Development' },
      amount: 2500,
      status: 'Pending Approval',
      date: '2024-01-14',
      bookingDate: null
    },
    {
      id: '3',
      client: 'Design Studio LLC',
      service: { title: 'Brand Identity Package' },
      amount: 1200,
      status: 'Awaiting Payment',
      date: '2024-01-13',
      bookingDate: '2024-01-18T14:30:00Z'
    },
    {
      id: '4',
      client: 'Marketing Agency',
      service: { title: 'Social Media Graphics' },
      amount: 800,
      status: 'Awaiting Payment',
      date: '2024-01-12',
      bookingDate: null
    },
    {
      id: '5',
      client: 'Creative Studio',
      service: { title: 'Video Production' },
      amount: 1500,
      status: 'In Progress',
      date: '2024-01-11',
      bookingDate: '2024-01-16T09:00:00Z'
    },
    {
      id: '6',
      client: 'Tech Solutions',
      service: { title: 'Mobile App Design' },
      amount: 2200,
      status: 'In Progress',
      date: '2024-01-10',
      bookingDate: '2024-01-17T11:30:00Z'
    },
    {
      id: '7',
      client: 'Digital Agency',
      service: { title: 'Website Redesign' },
      amount: 1800,
      status: 'Complete',
      date: '2024-01-09',
      bookingDate: '2024-01-15T13:00:00Z'
    },
    {
      id: '8',
      client: 'Startup Co',
      service: { title: 'Brand Guidelines' },
      amount: 950,
      status: 'Complete',
      date: '2024-01-08',
      bookingDate: null
    },
    {
      id: '9',
      client: 'Local Business',
      service: { title: 'Print Design' },
      amount: 600,
      status: 'Canceled',
      date: '2024-01-07',
      bookingDate: null
    },
    {
      id: '10',
      client: 'E-commerce Store',
      service: { title: 'Product Photography' },
      amount: 1200,
      status: 'Canceled',
      date: '2024-01-06',
      bookingDate: '2024-01-12T16:00:00Z'
    }
  ];

  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 1,
      overflow: 'visible',
    }}>
      <RequestsTable requests={sampleOrders} context="orders" />
    </Box>
  );
} 