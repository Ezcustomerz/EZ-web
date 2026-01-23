import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Divider,
  Chip,
  Button,
  useTheme
} from '@mui/material';
import { DateRange, CalendarToday, Payment as PaymentIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { PaymentApprovalOrderDetailPopover, type PaymentApprovalOrderDetail, type PaymentApprovalOption } from '../../popovers/client/PaymentApprovalOrderDetailPopover';

interface PaymentApprovalOrderCardProps {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  calendarDate: string | null;
  paymentOption?: PaymentApprovalOption;
  depositAmount?: number;
  remainingAmount?: number;
  amountPaid?: number; // Track how much has been paid
  serviceId?: string;
  serviceDescription?: string;
  serviceDeliveryTime?: string;
  serviceColor?: string;
  creativeAvatarUrl?: string;
  creativeDisplayName?: string;
  creativeTitle?: string;
  creativeId?: string;
  creativeEmail?: string;
  creativeRating?: number;
  creativeReviewCount?: number;
  creativeServicesCount?: number;
  creativeColor?: string;
  defaultOpen?: boolean;
}

export function PaymentApprovalOrderCard({
  id,
  serviceName,
  creativeName,
  orderDate,
  description,
  price,
  calendarDate,
  paymentOption = 'payment_upfront',
  depositAmount,
  remainingAmount,
  amountPaid = 0,
  serviceId,
  serviceDescription,
  serviceDeliveryTime,
  serviceColor,
  creativeAvatarUrl,
  creativeDisplayName,
  creativeTitle,
  creativeId,
  creativeEmail,
  creativeRating,
  creativeReviewCount,
  creativeServicesCount,
  creativeColor,
  defaultOpen = false
}: PaymentApprovalOrderCardProps) {
  const theme = useTheme();
  const statusColor = '#000000';
  const [popoverOpen, setPopoverOpen] = useState(defaultOpen);

  // Update popover state when defaultOpen changes
  useEffect(() => {
    if (defaultOpen) {
      setPopoverOpen(true);
    }
  }, [defaultOpen]);

  // Calculate payment details based on payment option and amount paid
  const calculatePaymentDetails = () => {
    if (paymentOption === 'split_payment') {
      // Use depositAmount/remainingAmount if provided, otherwise require them to be passed
      const calculatedDeposit = depositAmount !== undefined && depositAmount !== null
        ? Math.round(depositAmount * 100) / 100
        : 0;
      const calculatedRemaining = remainingAmount !== undefined && remainingAmount !== null
        ? Math.round(remainingAmount * 100) / 100
        : (calculatedDeposit > 0 ? Math.round((price - calculatedDeposit) * 100) / 100 : price);
      
      // Debug log
      console.log('[PaymentApprovalOrderCard] Split payment calculation:', {
        id,
        serviceName,
        price,
        depositAmount,
        calculatedDeposit,
        remainingAmount,
        calculatedRemaining,
        amountPaid
      });
      
      // Ensure amountPaid is a number
      const paidAmount = typeof amountPaid === 'number' ? amountPaid : (parseFloat(String(amountPaid || 0)) || 0);
      
      // Check if first payment (deposit) has been paid
      // Use tolerance for floating point comparison
      const paymentTolerance = 0.01;
      const isFirstPayment = paidAmount < calculatedDeposit - paymentTolerance;
      
      if (isFirstPayment) {
        // First payment - show deposit amount
        return {
          amountDue: calculatedDeposit,
          paymentMessage: 'Payment due now',
          isSecondPayment: false,
          firstPaymentAmount: 0,
          remainingAmount: calculatedRemaining,
        };
      } else {
        // Second payment - show remaining amount
        return {
          amountDue: calculatedRemaining,
          paymentMessage: 'Final payment due',
          isSecondPayment: true,
          firstPaymentAmount: calculatedDeposit,
          remainingAmount: calculatedRemaining,
        };
      }
    } else {
      // Payment upfront - always show full price
      return {
        amountDue: price,
        paymentMessage: 'Payment required to begin',
        isSecondPayment: false,
        firstPaymentAmount: 0,
        remainingAmount: 0,
      };
    }
  };

  const paymentDetails = calculatePaymentDetails();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open popover if clicking the pay button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setPopoverOpen(false);
  };

  const handlePay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(true);
  };

  // Calculate deposit and remaining for order detail
  const calculatedDeposit = depositAmount !== undefined && depositAmount !== null
    ? Math.round(depositAmount * 100) / 100
    : (paymentOption === 'split_payment' ? 0 : price);
  const calculatedRemaining = remainingAmount !== undefined && remainingAmount !== null
    ? Math.round(remainingAmount * 100) / 100
    : (paymentOption === 'split_payment' ? (calculatedDeposit > 0 ? Math.round((price - calculatedDeposit) * 100) / 100 : price) : 0);
  
  const orderDetail: PaymentApprovalOrderDetail = {
    id,
    serviceName,
    creativeName,
    orderDate,
    description,
    price,
    calendarDate,
    paymentOption,
    depositAmount: calculatedDeposit,
    remainingAmount: calculatedRemaining,
    amountPaid: amountPaid,
    serviceId,
    serviceDescription,
    serviceDeliveryTime,
    serviceColor: serviceColor || statusColor,
    creativeAvatarUrl,
    creativeDisplayName,
    creativeTitle,
    creativeId,
    creativeEmail,
    creativeRating,
    creativeReviewCount,
    creativeServicesCount,
    creativeColor,
  };

  return (
    <>
      <Card 
        onClick={handleCardClick} 
        sx={{ 
          borderRadius: 2,
          transition: 'all 0.2s ease',
          border: '2px solid',
          borderColor: 'rgba(0, 0, 0, 0.3)',
          overflow: 'visible',
          minHeight: 'fit-content',
          height: 'auto',
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(0, 0, 0, 0.05)'
            : 'rgba(0, 0, 0, 0.02)',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.2)',
            borderColor: '#000000',
            transform: 'translateY(-2px)',
          }
        }}
      >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: theme.palette.primary.main,
              fontSize: '1.2rem',
              fontWeight: 600,
            }}
          >
            {creativeName.charAt(0)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {serviceName}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: statusColor,
                  fontStyle: 'italic',
                  fontSize: '0.7rem',
                }}
              >
                • {paymentDetails.paymentMessage}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              by {creativeName}
            </Typography>
          </Box>
          
          <Chip
            label="Payment Required"
            size="small"
            sx={{
              bgcolor: statusColor,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 24,
              alignSelf: 'flex-start',
            }}
          />
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Box sx={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 0.5,
          alignItems: 'flex-end',
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Ordered On
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DateRange sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {new Date(orderDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Typography>
            </Box>
          </Box>

          {calendarDate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Booking Set For
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(calendarDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })} at {new Date(calendarDate).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true
                  })}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Show payment breakdown for second payment of split payment */}
          {paymentOption === 'split_payment' && paymentDetails.isSecondPayment && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  First payment paid:
                </Typography>
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.7rem' }}>
                  ${paymentDetails.firstPaymentAmount.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  Final payment:
                </Typography>
                <Typography variant="caption" sx={{ color: statusColor, fontWeight: 600, fontSize: '0.7rem' }}>
                  ${paymentDetails.remainingAmount.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ position: 'relative' }}>
            <Button
              onClick={handlePay}
              variant="contained"
              startIcon={<PaymentIcon sx={{ fontSize: 18 }} />}
              size="small"
              sx={{
                backgroundColor: '#000000',
                color: 'white',
                borderRadius: 2,
                px: 3,
                height: '40px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                position: 'relative',
                overflow: 'visible',
                boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.39)',
                transition: 'all 0.2s ease-in-out',
                minWidth: 'auto',
                zIndex: 1,
                '@keyframes sparkle': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '50%': { transform: 'scale(1) rotate(180deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '@keyframes sparkle2': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '60%': { transform: 'scale(1) rotate(240deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '@keyframes sparkle3': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '40%': { transform: 'scale(1) rotate(120deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '@keyframes sparkle4': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '55%': { transform: 'scale(1) rotate(200deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '@keyframes sparkle5': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '45%': { transform: 'scale(1) rotate(160deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '15%',
                  left: '20%',
                  width: 5,
                  height: 5,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                  zIndex: 10,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '70%',
                  left: '75%',
                  width: 4,
                  height: 4,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                  zIndex: 10,
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.5)',
                  backgroundColor: '#000000',
                  '&::before': {
                    animation: 'sparkle 0.5s ease-in-out infinite',
                  },
                  '&::after': {
                    animation: 'sparkle2 0.5s ease-in-out infinite 0.1s',
                  },
                  '& .sparkle-3': {
                    animation: 'sparkle3 0.5s ease-in-out infinite 0.2s',
                  },
                  '& .sparkle-4': {
                    animation: 'sparkle4 0.5s ease-in-out infinite 0.15s',
                  },
                  '& .sparkle-5': {
                    animation: 'sparkle5 0.5s ease-in-out infinite 0.25s',
                  },
                },
              }}
            >
              <Box
                className="sparkle-3"
                sx={{
                  position: 'absolute',
                  top: '30%',
                  right: '25%',
                  width: 4,
                  height: 4,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              />
              <Box
                className="sparkle-4"
                sx={{
                  position: 'absolute',
                  top: '60%',
                  left: '35%',
                  width: 5,
                  height: 5,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              />
              <Box
                className="sparkle-5"
                sx={{
                  position: 'absolute',
                  top: '40%',
                  left: '80%',
                  width: 4,
                  height: 4,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              />
              Pay ${paymentDetails.amountDue.toFixed(2)}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>

    <PaymentApprovalOrderDetailPopover
      open={popoverOpen}
      onClose={handlePopoverClose}
      order={orderDetail}
      onPay={(orderId, amount) => {
        console.log('Processing payment:', orderId, amount);
        // TODO: Integrate with actual payment processing
        handlePopoverClose();
      }}
    />
  </>
  );
}

