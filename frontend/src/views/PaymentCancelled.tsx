import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Cancel } from '@mui/icons-material';

export function PaymentCancelled() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          gap: 3,
          textAlign: 'center'
        }}
      >
        <Cancel sx={{ fontSize: 80, color: 'error.main' }} />
        <Typography variant="h4" fontWeight={600}>
          Payment Cancelled
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your payment was cancelled. No charges were made to your account.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/client/orders')}
          sx={{ mt: 2 }}
        >
          Return to Orders
        </Button>
      </Box>
    </Container>
  );
}

