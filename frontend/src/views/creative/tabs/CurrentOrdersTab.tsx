import { Box } from '@mui/material';
import { RequestsTable } from '../../../components/tables/RequestsTable';
 
export function CurrentOrdersTab() {
  // Sample data with pending approval and awaiting payment orders
  const sampleOrders = [
    {
      id: '1',
      client: 'Acme Corp',
      service: { 
        title: 'Logo Design',
        description: 'Professional logo design with 3 concepts',
        delivery_time: '3-5 days',
        color: '#667eea',
        payment_option: 'upfront'
      },
      amount: 500,
      status: 'Pending Approval',
      date: '2024-01-15',
      bookingDate: '2024-01-20T10:00:00Z',
      description: 'Need a modern logo for our tech startup',
      clientEmail: 'contact@acmecorp.com',
      clientPhone: '+1-555-0123'
    },
    {
      id: '2',
      client: 'TechStart Inc',
      service: { 
        title: 'Website Development',
        description: 'Full-stack web application development',
        delivery_time: '2-3 weeks',
        color: '#f093fb',
        payment_option: 'split'
      },
      amount: 2500,
      status: 'Pending Approval',
      date: '2024-01-14',
      bookingDate: null,
      description: 'Building a SaaS platform for project management',
      clientEmail: 'hello@techstart.com',
      clientPhone: '+1-555-0456'
    },
    {
      id: '3',
      client: 'Design Studio LLC',
      service: { 
        title: 'Brand Identity Package',
        description: 'Complete brand identity including logo, colors, and guidelines',
        delivery_time: '1-2 weeks',
        color: '#4ecdc4',
        payment_option: 'later'
      },
      amount: 1200,
      status: 'Pending Approval',
      date: '2024-01-13',
      bookingDate: '2024-01-18T14:30:00Z',
      description: 'Rebranding our design agency',
      clientEmail: 'info@designstudio.com',
      clientPhone: '+1-555-0789'
    },
    {
      id: '4',
      client: 'Local Nonprofit',
      service: { 
        title: 'Free Consultation Call',
        description: '30-minute strategy session to discuss your project needs',
        delivery_time: '1 day',
        color: '#96ceb4',
        payment_option: 'later'
      },
      amount: 0,
      status: 'Pending Approval',
      date: '2024-01-12',
      bookingDate: '2024-01-15T16:00:00Z',
      description: 'Looking for guidance on our upcoming campaign',
      clientEmail: 'director@localnonprofit.org',
      clientPhone: '+1-555-0321'
    },
    {
      id: '5',
      client: 'Marketing Agency',
      service: { 
        title: 'Social Media Graphics',
        description: 'Custom social media graphics for campaigns',
        delivery_time: '1 week',
        color: '#feca57',
        payment_option: 'upfront'
      },
      amount: 800,
      status: 'Awaiting Payment',
      date: '2024-01-11',
      bookingDate: null,
      description: 'Need graphics for our Q1 campaign',
      clientEmail: 'marketing@agency.com',
      clientPhone: '+1-555-0654',
      amountPaid: 0,
      amountRemaining: 800,
      depositPaid: false
    },
    {
      id: '5b',
      client: 'Tech Startup',
      service: { 
        title: 'App Development',
        description: 'Full-stack mobile application development',
        delivery_time: '4-6 weeks',
        color: '#667eea',
        payment_option: 'split'
      },
      amount: 5000,
      status: 'Awaiting Payment',
      date: '2024-01-10',
      bookingDate: '2024-01-20T09:00:00Z',
      description: 'Building a productivity app for remote teams',
      clientEmail: 'founder@techstartup.com',
      clientPhone: '+1-555-0987',
      amountPaid: 2500,
      amountRemaining: 2500,
      depositPaid: true
    },
    {
      id: '5c',
      client: 'Music Producer',
      service: { 
        title: 'Album Mixing & Mastering',
        description: 'Professional mixing and mastering for 12-track album',
        delivery_time: '2-3 weeks',
        color: '#4ecdc4',
        payment_option: 'later'
      },
      amount: 2000,
      status: 'Awaiting Payment',
      date: '2024-01-09',
      bookingDate: null,
      description: 'Need professional mixing for my debut album',
      clientEmail: 'producer@music.com',
      clientPhone: '+1-555-0123',
      amountPaid: 0,
      amountRemaining: 2000,
      depositPaid: false
    },
    {
      id: '6',
      client: 'Creative Studio',
      service: { 
        title: 'Video Production',
        description: 'Professional video editing and post-production',
        delivery_time: '2 weeks',
        color: '#ff6b6b',
        payment_option: 'split'
      },
      amount: 1500,
      status: 'In Progress',
      date: '2024-01-10',
      bookingDate: '2024-01-16T09:00:00Z',
      description: 'Corporate video for our company',
      clientEmail: 'studio@creative.com',
      clientPhone: '+1-555-0987'
    },
    {
      id: '7',
      client: 'Tech Solutions',
      service: { 
        title: 'Mobile App Design',
        description: 'UI/UX design for mobile application',
        delivery_time: '3 weeks',
        color: '#a55eea',
        payment_option: 'later'
      },
      amount: 2200,
      status: 'In Progress',
      date: '2024-01-09',
      bookingDate: '2024-01-17T11:30:00Z',
      description: 'Designing a fitness tracking app',
      clientEmail: 'dev@techsolutions.com',
      clientPhone: '+1-555-0123'
    },
    {
      id: '8',
      client: 'Digital Agency',
      service: { 
        title: 'Website Redesign',
        description: 'Complete website redesign and development',
        delivery_time: '4 weeks',
        color: '#6c5ce7',
        payment_option: 'upfront'
      },
      amount: 1800,
      status: 'Complete',
      date: '2024-01-08',
      bookingDate: '2024-01-15T13:00:00Z',
      description: 'Modernizing our agency website',
      clientEmail: 'contact@digitalagency.com',
      clientPhone: '+1-555-0456'
    },
    {
      id: '9',
      client: 'Startup Co',
      service: { 
        title: 'Brand Guidelines',
        description: 'Comprehensive brand guidelines document',
        delivery_time: '1 week',
        color: '#fd79a8',
        payment_option: 'split'
      },
      amount: 950,
      status: 'Complete',
      date: '2024-01-07',
      bookingDate: null,
      description: 'Creating brand guidelines for our startup',
      clientEmail: 'founder@startupco.com',
      clientPhone: '+1-555-0789'
    },
    {
      id: '10',
      client: 'Local Business',
      service: { 
        title: 'Print Design',
        description: 'Business cards and flyer design',
        delivery_time: '3 days',
        color: '#00b894',
        payment_option: 'later'
      },
      amount: 600,
      status: 'Canceled',
      date: '2024-01-06',
      bookingDate: null,
      description: 'Need marketing materials for grand opening',
      clientEmail: 'owner@localbusiness.com',
      clientPhone: '+1-555-0321'
    },
    {
      id: '11',
      client: 'E-commerce Store',
      service: { 
        title: 'Product Photography',
        description: 'Professional product photography session',
        delivery_time: '1 week',
        color: '#0984e3',
        payment_option: 'upfront'
      },
      amount: 1200,
      status: 'Canceled',
      date: '2024-01-05',
      bookingDate: '2024-01-12T16:00:00Z',
      cancelledDate: '2024-01-08T10:30:00Z',
      cancelledBy: 'client',
      description: 'Photography for our new product line',
      clientEmail: 'store@ecommerce.com',
      clientPhone: '+1-555-0654'
    },
    {
      id: '12',
      client: 'Marketing Agency',
      service: { 
        title: 'Social Media Management',
        description: 'Complete social media strategy and content creation',
        delivery_time: '2 weeks',
        color: '#e17055',
        payment_option: 'split'
      },
      amount: 1800,
      status: 'Canceled',
      date: '2024-01-10',
      bookingDate: null,
      cancelledDate: '2024-01-12T14:15:00Z',
      cancelledBy: 'creative',
      description: 'Need comprehensive social media strategy for Q1 campaign',
      clientEmail: 'contact@marketingagency.com',
      clientPhone: '+1-555-0987'
    },
    {
      id: '13',
      client: 'Restaurant Chain',
      service: { 
        title: 'Menu Design',
        description: 'Complete menu redesign with photography',
        delivery_time: '1-2 weeks',
        color: '#00b894',
        payment_option: 'later'
      },
      amount: 800,
      status: 'Canceled',
      date: '2024-01-08',
      bookingDate: '2024-01-15T11:00:00Z',
      cancelledDate: '2024-01-09T09:45:00Z',
      cancelledBy: 'system',
      description: 'Redesign menu for our new seasonal items',
      clientEmail: 'info@restaurantchain.com',
      clientPhone: '+1-555-0123'
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