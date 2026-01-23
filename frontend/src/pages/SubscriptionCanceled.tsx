import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Cancel } from '@mui/icons-material';

export function SubscriptionCanceled() {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/creative');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Cancel
          sx={{
            fontSize: 80,
            color: 'warning.main',
            mb: 3,
          }}
        />
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Subscription Canceled
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
          Your subscription payment was canceled. No charges have been made to your account.
          You can try again whenever you're ready.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleRetry}
          sx={{
            background: 'linear-gradient(135deg, #7A5FFF 0%, #9F7AEA 100%)',
            color: '#fff',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #9F7AEA 0%, #7A5FFF 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(122, 95, 255, 0.4)',
            },
          }}
        >
          Return to Dashboard
        </Button>
      </Box>
    </Container>
  );
}
