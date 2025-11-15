import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { userService } from '../../api/userService';
import { errorToast } from '../toast/toast';

interface StripePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  amount: number;
  onSuccess?: () => void;
}

export function StripePaymentDialog({
  open,
  onClose,
  bookingId,
  amount,
  onSuccess: _onSuccess,
}: StripePaymentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await userService.processPayment(bookingId, amount);
      
      // Redirect to Stripe Checkout
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Failed to create checkout session:', err);
      setError(err.response?.data?.detail || 'Failed to initialize payment');
      errorToast('Payment Error', err.response?.data?.detail || 'Failed to initialize payment');
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      sx={{
        zIndex: isMobile ? 10000 : 1300,
      }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxWidth: isMobile ? '100%' : '500px',
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Complete Payment
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Amount: ${amount.toFixed(2)}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button onClick={onClose} variant="outlined">
              Close
            </Button>
          </Box>
        ) : (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You will be redirected to Stripe's secure checkout page to complete your payment.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateCheckout}
          variant="contained"
          disabled={isLoading || !!error}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Loading...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
