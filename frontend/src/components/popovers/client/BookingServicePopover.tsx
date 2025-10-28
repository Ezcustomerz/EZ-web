import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { 
  Close, 
  BookOnline,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useState } from 'react';

export interface BookingServicePopoverProps {
  open: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    delivery_time: string;
    creative_name: string;
    creative_display_name?: string;
    creative_title?: string;
    creative_avatar_url?: string;
    color: string;
    payment_option?: 'upfront' | 'split' | 'later';
  } | null;
  onConfirmBooking?: (bookingData: BookingData) => void;
  onCreativeClick?: (creativeData: any) => void;
}

export interface BookingData {
  serviceId: string;
}


export function BookingServicePopover({ 
  open, 
  onClose, 
  service,
  onConfirmBooking,
  onCreativeClick
}: BookingServicePopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment option utility functions
  const getPaymentOptionLabel = (option: 'upfront' | 'split' | 'later', price: number) => {
    if (price === 0) {
      return 'Free Service';
    }
    switch (option) {
      case 'upfront':
        return 'Payment Upfront';
      case 'split':
        return 'Split Payment';
      case 'later':
        return 'Payment Later';
      default:
        return 'Payment Upfront';
    }
  };

  const getPaymentOptionDescription = (option: 'upfront' | 'split' | 'later', price: number) => {
    if (price === 0) {
      return 'This is a complimentary service';
    }
    switch (option) {
      case 'upfront':
        return 'Full payment required before service begins';
      case 'split':
        return '50% deposit required to secure booking, remaining 50% due after completion';
      case 'later':
        return 'Payment due after service completion';
      default:
        return 'Full payment required before service begins';
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate payment breakdown
  const paymentBreakdown = {
    isFree: service?.price === 0,
    totalAmount: service?.price || 0,
    amountPaid: 0, // For booking, no payment has been made yet
    amountRemaining: service?.price || 0,
  };


  const handleSubmit = async () => {
    if (!service) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const bookingData: BookingData = {
        serviceId: service.id
      };

      if (onConfirmBooking) {
        await onConfirmBooking(bookingData);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to submit booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!service) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        background: `linear-gradient(135deg, ${service.color}15 0%, ${service.color}08 100%)`,
        borderBottom: `2px solid ${service.color}30`,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOnline sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                Book Service
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {service.title}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleClose}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { 
                background: 'rgba(0,0,0,0.04)',
                color: 'text.primary'
              }
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2}}>

        {/* Payment Information */}
        <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mt: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
              Payment Information
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
              <AccountBalanceWallet sx={{ fontSize: 20, color: service.color, mt: 0.25 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.5 }}>
                  Payment Option
                </Typography>
                <Chip
                  label={getPaymentOptionLabel(service.payment_option || 'upfront', service.price)}
                  size="small"
                  sx={{
                    bgcolor: `${service.color}20`,
                    color: service.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    mb: 1,
                  }}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  {getPaymentOptionDescription(service.payment_option || 'upfront', service.price)}
                </Typography>
              </Box>
            </Box>

            {/* Payment Status - Colored sub-card */}
            {!paymentBreakdown.isFree && (
              <Box 
                sx={{ 
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? `${service.color}20` : `${service.color}10`,
                  border: `1px solid ${service.color}30`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AccountBalanceWallet sx={{ fontSize: 20, color: service.color }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Payment Status
                  </Typography>
                </Box>

                {service.payment_option === 'split' ? (
                  <>
                    {/* Deposit Required */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Deposit Required
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          50% deposit required to secure booking
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: service.color }}>
                        {formatCurrency(paymentBreakdown.totalAmount * 0.5)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Remaining Amount */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Remaining Balance
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Due after service completion
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {formatCurrency(paymentBreakdown.totalAmount * 0.5)}
                      </Typography>
                    </Box>
                  </>
                ) : service.payment_option === 'upfront' ? (
                  /* Payment Upfront */
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Full Payment Required
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Complete payment needed before service can begin
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: service.color }}>
                      {formatCurrency(paymentBreakdown.amountRemaining)}
                    </Typography>
                  </Box>
                ) : (
                  /* Payment Later */
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Payment Due After Completion
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Service can begin without upfront payment
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: service.color }}>
                      {formatCurrency(paymentBreakdown.amountRemaining)}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2, 
            fontWeight: 600,
            px: 3,
            py: 1,
            color: 'error.main',
            borderColor: 'error.main',
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'white',
              borderColor: 'error.main'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            px: 3,
            py: 1,
            background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
            boxShadow: `0 4px 12px ${service.color}30`,
            '&:hover': {
              background: `linear-gradient(135deg, ${service.color}CC 0%, ${service.color} 100%)`,
              boxShadow: `0 6px 16px ${service.color}40`,
            },
            '&:disabled': {
              background: 'rgba(0,0,0,0.12)',
              color: 'rgba(0,0,0,0.26)',
            }
          }}
        >
          {isSubmitting ? 'Booking...' : 'Confirm Booking'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}