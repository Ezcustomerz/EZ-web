import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';

export function IncomeProducer() {
  const navigate = useNavigate();

  function handleNavItemChange(item: string) {
    switch (item) {
      case 'dashboard':
        navigate('/producer');
        break;
      case 'clients':
        navigate('/producer/clients');
        break;
      case 'income':
        navigate('/producer/income');
        break;
      case 'public':
        navigate('/producer/public');
        break;
      default:
        break;
    }
  }

  return (
    <LayoutProducer selectedNavItem="income" onNavItemChange={handleNavItemChange}>
      <Box sx={{ 
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <Typography variant="h4" component="h1">
          Income
        </Typography>
      </Box>
    </LayoutProducer>
  );
} 