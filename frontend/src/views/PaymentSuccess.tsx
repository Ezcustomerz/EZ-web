import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, CircularProgress } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { successToast, errorToast } from '../components/toast/toast';
import { userService } from '../api/userService';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !bookingId) {
        setVerificationError('Missing payment information');
        setIsVerifying(false);
        return;
      }

      try {
        setIsVerifying(true);
        const result = await userService.verifyPayment(sessionId, bookingId);
        
        if (result.success) {
          successToast('Payment Successful', 'Your payment has been processed successfully and your order has been updated.');
        } else {
          setVerificationError('Payment verification failed');
          errorToast('Verification Error', 'Unable to verify payment. Please contact support if the issue persists.');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setVerificationError(error.response?.data?.detail || 'Failed to verify payment');
        errorToast('Verification Error', error.response?.data?.detail || 'Failed to verify payment. Please contact support if the issue persists.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, bookingId]);

  if (isVerifying) {
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
          <CircularProgress size={60} />
          <Typography variant="h6" fontWeight={600}>
            Verifying Payment...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we confirm your payment.
          </Typography>
        </Box>
      </Container>
    );
  }

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
        {verificationError ? (
          <>
            <Typography variant="h4" fontWeight={600} color="error">
              Verification Issue
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {verificationError}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your payment may have been processed. Please check your orders or contact support.
            </Typography>
          </>
        ) : (
          <>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
            <Typography variant="h4" fontWeight={600}>
              Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your payment has been processed successfully. Your order status has been updated.
            </Typography>
          </>
        )}
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

