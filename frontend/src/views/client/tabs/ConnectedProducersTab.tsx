import { Box, Typography } from '@mui/material';
import { People } from '@mui/icons-material';
import { ProducerCard } from '../../../components/cards/client/ProducerCard';

interface Producer {
  id: string;
  name: string;
  avatar: string | null;
  specialty: string;
  email: string;
  rating: number;
  reviewCount: number;
  servicesCount: number;
  isOnline: boolean;
  color: string;
}

// Mock data for connected producers
const mockConnectedProducers: Producer[] = [
    {
        id: 'producer-1',
        name: 'Producer 1',
        avatar: null,
        specialty: 'Producer 1',
        email: 'producer1@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'producer-2',
        name: 'Producer 2',
        avatar: null,
        specialty: 'Producer 2',
        email: 'producer2@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'producer-3',
        name: 'Producer 3',
        avatar: null,
        specialty: 'Producer 3',
        email: 'producer3@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'producer-4',
        name: 'Producer 4',
        avatar: null,
        specialty: 'Producer 4',
        email: 'producer4@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'producer-5',
        name: 'Producer 5',
        avatar: null,
        specialty: 'Producer 5',
        email: 'producer5@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'producer-6',
        name: 'Producer 6',
        avatar: null,
        specialty: 'Producer 6',
        email: 'producer6@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'producer-7',
        name: 'Producer 7',
        avatar: null,
        specialty: 'Producer 7',
        email: 'producer7@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'producer-8',
        name: 'Producer 8',
        avatar: null,
        specialty: 'Producer 8',
        email: 'producer8@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'producer-9',
        name: 'Producer 9',
        avatar: null,
        specialty: 'Producer 9',
        email: 'producer9@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    

];

export function ConnectedProducersTab() {

  const handleProducerClick = (producerId: string) => {
    // Navigate to the producer's profile page
    // You can adjust the route structure as needed
    console.log(producerId);
  };

  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 2,
      overflowY: { xs: 'auto', sm: 'auto', md: 'auto' },
      minHeight: 0,
    }}>
      {mockConnectedProducers.length === 0 ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          color: 'secondary.main',
        }}>
          <People sx={{ fontSize: 64, mb: 2, opacity: 0.4, color: 'secondary.main' }} />
          <Typography variant="h6" sx={{ mb: 1, color: 'secondary.main' }}>
            No Connected Producers
          </Typography>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>
            Connect with music producers to start booking services
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gap: { xs: 1.5, sm: 2 },
          px: { xs: 1, sm: 2 },
          pt: 2,
          pb: 1,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(auto-fit, minmax(280px, 1fr))',
            md: 'repeat(auto-fit, minmax(300px, 1fr))',
            lg: 'repeat(auto-fit, minmax(320px, 1fr))',
          },
          alignItems: 'stretch',
          minHeight: 0,
          width: '100%',
          overflow: 'hidden',
        }}>
          {mockConnectedProducers.map((producer, index) => (
            <ProducerCard
              key={producer.id}
              producer={producer}
              index={index}
              onClick={handleProducerClick}
            />
          ))}
        </Box>
      )}
    </Box>
  );
} 