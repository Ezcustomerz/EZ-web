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

// Example: Replace with real data fetching logic later
const mockConnectedCreatives: Creative[] = [];

export default function ConnectedCreativesTab() {
  const handleCreativeClick = (producerId: string) => {
    console.log(producerId);
  };

  return (
    <Box
      sx={{
        width: '100%',
        flexGrow: 1,
        py: 2,
        overflowY: { xs: 'auto', sm: 'auto', md: 'auto' },
        minHeight: 0,
      }}
    >
      {mockConnectedCreatives.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            color: 'secondary.main',
          }}
        >
          <People sx={{ fontSize: 64, mb: 2, opacity: 0.4, color: 'secondary.main' }} />
          <Typography variant="h6" sx={{ mb: 1, color: 'secondary.main' }}>
            No Connected Creatives
          </Typography>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>
            Connect with music creatives to start booking services
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
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
          }}
        >
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