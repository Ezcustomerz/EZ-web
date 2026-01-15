import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, Container } from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { subscriptionService } from '../api/subscriptionService';
import { successToast, errorToast } from '../components/toast/toast';

export function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySubscription = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setError('Missing session ID');
        setVerifying(false);
        return;
      }

      try {
        const result = await subscriptionService.verifySubscription(sessionId);
        
        if (result.success) {
          setSuccess(true);
          successToast('Success', 'Your subscription has been activated!');
          // Signal that profile needs to be refreshed
          localStorage.setItem('profile_refresh_needed', 'true');
        } else {
          setError(result.message || 'Failed to verify subscription');
          errorToast('Error', result.message || 'Failed to verify subscription');
        }
      } catch (err: any) {
        console.error('Error verifying subscription:', err);
        const errorMessage = err.response?.data?.detail || 'Failed to verify subscription';
        setError(errorMessage);
        errorToast('Error', errorMessage);
      } finally {
        setVerifying(false);
      }
    };

    verifySubscription();
  }, [searchParams]);

  const handleContinue = () => {
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
        {verifying ? (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Verifying your subscription...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please wait while we confirm your payment.
            </Typography>
          </>
        ) : success ? (
          <>
            <CheckCircle
              sx={{
                fontSize: 80,
                color: 'success.main',
                mb: 3,
              }}
            />
            <Typography variant="h4" gutterBottom fontWeight={700}>
              Subscription Activated!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
              Your subscription has been successfully activated. You can now enjoy all the benefits of your new plan.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
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
              Continue to Dashboard
            </Button>
          </>
        ) : (
          <>
            <ErrorIcon
              sx={{
                fontSize: 80,
                color: 'error.main',
                mb: 3,
              }}
            />
            <Typography variant="h4" gutterBottom fontWeight={700}>
              Verification Failed
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
              {error || 'We could not verify your subscription. Please contact support if you believe this is an error.'}
            </Typography>
            <Button
              variant="outlined"
              size="large"
              onClick={handleContinue}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'rgba(122, 95, 255, 0.04)',
                },
              }}
            >
              Return to Dashboard
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
}
