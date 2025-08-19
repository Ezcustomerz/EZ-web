import { Box, Typography } from '@mui/material';
import { People } from '@mui/icons-material';
import { CreativeCard } from '../../../components/cards/client/CreativeCard';

interface Creative {
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

// Mock data for connected creatives
const mockConnectedCreatives: Creative[] = [
    {
        id: 'creative-1',
        name: 'Creative 1',
        avatar: null,
        specialty: 'Creative 1',
        email: 'producer1@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'creative-2',
        name: 'Creative 2',
        avatar: null,
        specialty: 'Creative 2',
        email: 'producer2@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'creative-3',
        name: 'Creative 3',
        avatar: null,
        specialty: 'Creative 3',
        email: 'producer3@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'creative-4',
        name: 'Creative 4',
        avatar: null,
        specialty: 'Creative 4',
        email: 'producer4@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'creative-5',
        name: 'Creative 5',
        avatar: null,
        specialty: 'Creative 5',
        email: 'producer5@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'creative-6',
        name: 'Creative 6',
        avatar: null,
        specialty: 'Creative 6',
        email: 'producer6@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'creative-7',
        name: 'Creative 7',
        avatar: null,
        specialty: 'Creative 7',
        email: 'producer7@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'creative-8',
        name: 'Creative 8',
        avatar: null,
        specialty: 'Creative 8',
        email: 'producer8@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    {
        id: 'creative-9',
        name: 'Creative 9',
        avatar: null,
        specialty: 'Creative 9',
        email: 'producer9@example.com',
        rating: 4.5,
        reviewCount: 100,
        servicesCount: 10,
        isOnline: true,
        color: '#E0E7FF'
    },
    

];

export function ConnectedCreativesTab() {

  const handleCreativeClick = (producerId: string) => {
    // Navigate to the creative's profile page
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
      {mockConnectedCreatives.length === 0 ? (
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
            No Connected Creatives
          </Typography>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>
            Connect with music creatives to start booking services
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
          {mockConnectedCreatives.map((creative, index) => (
            <CreativeCard
              key={creative.id}
              creative={creative}
              index={index}
              onClick={handleCreativeClick}
            />
          ))}
        </Box>
      )}
    </Box>
  );
} 