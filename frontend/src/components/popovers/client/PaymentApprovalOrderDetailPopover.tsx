import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Slide,
  Divider,
  Chip,
  Avatar,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DateRange, AttachMoney, Payment, CalendarMonth, AccountBalanceWallet } from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';
import { ServicesDetailPopover, type ServiceDetail } from '../ServicesDetailPopover';
import { ServiceCardSimple } from '../../cards/creative/ServiceCard';
import { CreativeDetailPopover } from './CreativeDetailPopover';
import { StripePaymentDialog } from '../../dialogs/StripePaymentDialog';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export type PaymentApprovalOption = 'split_payment' | 'payment_upfront';

export interface PaymentApprovalOrderDetail {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  calendarDate: string | null;
  paymentOption: PaymentApprovalOption;
  // Split payment amounts
  depositAmount?: number;
  remainingAmount?: number;
  amountPaid?: number; // Track how much has been paid
  // Service details for nested popover
  serviceId?: string;
  serviceDescription?: string;
  serviceDeliveryTime?: string;
  serviceColor?: string;
  creativeAvatarUrl?: string;
  creativeDisplayName?: string;
  creativeTitle?: string;
  // Creative details for creative popover
  creativeId?: string;
  creativeEmail?: string;
  creativeRating?: number;
  creativeReviewCount?: number;
  creativeServicesCount?: number;
  creativeColor?: string;
}

export interface PaymentApprovalOrderDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  order: PaymentApprovalOrderDetail | null;
  onPay?: (orderId: string, amount: number) => void;
}

export function PaymentApprovalOrderDetailPopover({ 
  open, 
  onClose, 
  order,
  onPay
}: PaymentApprovalOrderDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [creativeDetailOpen, setCreativeDetailOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  if (!order) return null;

  const statusColor = '#2196f3'; // Blue for payment approval

  const getPaymentOptionLabel = (option: PaymentApprovalOption) => {
    switch (option) {
      case 'split_payment':
        return 'Split Payment';
      case 'payment_upfront':
        return 'Payment Upfront';
      default:
        return 'Unknown';
    }
  };

  const getPaymentOptionDescription = (option: PaymentApprovalOption, isSecondPayment: boolean = false) => {
    switch (option) {
      case 'split_payment':
        if (isSecondPayment) {
          return 'Deposit has been paid. Complete your payment with the remaining balance.';
        }
        return 'Pay a deposit now to start, then pay the remaining balance after completion';
      case 'payment_upfront':
        return 'Full payment is required before the service begins';
      default:
        return '';
    }
  };

  const getPaymentOptionColor = (option: PaymentApprovalOption) => {
    switch (option) {
      case 'split_payment':
        return theme.palette.info.main;
      case 'payment_upfront':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const handleViewService = () => {
    setServiceDetailOpen(true);
  };

  const handleServiceDetailClose = () => {
    setServiceDetailOpen(false);
  };

  const handleViewCreative = () => {
    setCreativeDetailOpen(true);
  };

  const handleCreativeDetailClose = () => {
    setCreativeDetailOpen(false);
  };

  const handlePay = () => {
    // Open payment dialog instead of calling onPay directly
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    if (onPay) {
      onPay(order.id, amountDueNow);
    }
    onClose();
  };

  // Calculate payment amounts - use same rounding as card component
  const depositAmount = order.depositAmount || Math.round(order.price * 0.5 * 100) / 100;
  const remainingAmount = order.remainingAmount || Math.round((order.price - depositAmount) * 100) / 100;
  const amountPaid = typeof order.amountPaid === 'number' ? order.amountPaid : (parseFloat(String(order.amountPaid || 0)) || 0);
  
  // Debug log
  console.log('[PaymentApprovalOrderDetailPopover] Split payment calculation:', {
    id: order.id,
    serviceName: order.serviceName,
    price: order.price,
    'order.depositAmount': order.depositAmount,
    depositAmount,
    'order.remainingAmount': order.remainingAmount,
    remainingAmount,
    amountPaid,
    paymentOption: order.paymentOption
  });
  
  // Determine if this is the first or second payment for split payments
  // If amountPaid >= depositAmount (with tolerance), it's the second payment
  const paymentTolerance = 0.01;
  const isFirstPayment = order.paymentOption === 'split_payment' 
    ? (amountPaid < depositAmount - paymentTolerance)
    : false;
  const isSecondPayment = order.paymentOption === 'split_payment' && amountPaid >= depositAmount - paymentTolerance;
  const amountDueNow = order.paymentOption === 'split_payment' 
    ? (isFirstPayment ? depositAmount : remainingAmount)
    : order.price;
  
  // Debug logging (can be removed in production)
  if (order.paymentOption === 'split_payment') {
    console.log('[PaymentApproval] Split payment check:', {
      amountPaid,
      depositAmount,
      remainingAmount,
      isFirstPayment,
      isSecondPayment,
      amountDueNow
    });
  }

  // Create service detail object for the nested popover
  const serviceDetail: ServiceDetail = {
    id: order.serviceId || order.id,
    title: order.serviceName,
    description: order.serviceDescription || 'Service description not available',
    price: order.price,
    delivery_time: order.serviceDeliveryTime || '3-5 days',
    creative_name: order.creativeName,
    color: order.serviceColor || statusColor,
    creative_display_name: order.creativeDisplayName || order.creativeName,
    creative_title: order.creativeTitle,
    creative_avatar_url: order.creativeAvatarUrl,
  };

  // Create creative detail object for the creative popover
  const creativeDetail = {
    id: order.creativeId || 'creative-' + order.id,
    name: order.creativeDisplayName || order.creativeName,
    avatar: order.creativeAvatarUrl || null,
    specialty: order.creativeTitle || 'Music Professional',
    email: order.creativeEmail || 'contact@creative.com',
    rating: order.creativeRating || 4.8,
    reviewCount: order.creativeReviewCount || 12,
    servicesCount: order.creativeServicesCount || 8,
    isOnline: true,
    color: order.creativeColor || order.serviceColor || theme.palette.primary.main,
    status: 'active',
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? '100vh' : '90vh',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: `linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}08 100%)`,
          borderBottom: `2px solid ${statusColor}20`,
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 6 }}>
            <Avatar 
              onClick={handleViewCreative}
              sx={{ 
                width: 48, 
                height: 48,
                bgcolor: theme.palette.primary.main,
                fontSize: '1.2rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.08)',
                  boxShadow: `0 0 0 3px ${theme.palette.primary.main}30`,
                }
              }}
              src={order.creativeAvatarUrl}
            >
              {order.creativeName.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  {order.serviceName}
                </Typography>
                <Chip
                  label="Payment Required"
                  size="small"
                  sx={{
                    bgcolor: statusColor,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                  }}
                />
              </Box>
              <Typography 
                onClick={handleViewCreative}
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: 'fit-content',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                  }
                }}
              >
                by {order.creativeName}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'grey.500',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 0, px: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Scrollable Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', pb: 2, px: { xs: 2, sm: 3 } }}>
          {/* Order Information Section */}
          <Box sx={{ mb: 2, mt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '1rem' }}>
              Order Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Order Date */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <DateRange sx={{ fontSize: 20, color: theme.palette.primary.main, mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
                    Ordered On
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(order.orderDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Typography>
                </Box>
              </Box>

              {/* Calendar Date */}
              {order.calendarDate && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CalendarMonth sx={{ fontSize: 20, color: theme.palette.primary.main, mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
                      Booking Set For
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {new Date(order.calendarDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })} at {new Date(order.calendarDate).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Total Price */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <AttachMoney sx={{ fontSize: 20, color: theme.palette.primary.main, mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
                    Total Price
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: '1.1rem' }}>
                    ${order.price.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment Details Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '1rem' }}>
              Payment Details
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
              <Payment sx={{ fontSize: 20, color: getPaymentOptionColor(order.paymentOption), mt: 0.25 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.5 }}>
                  Payment Option
                </Typography>
                <Chip
                  label={getPaymentOptionLabel(order.paymentOption)}
                  size="small"
                  sx={{
                    bgcolor: `${getPaymentOptionColor(order.paymentOption)}20`,
                    color: getPaymentOptionColor(order.paymentOption),
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    mb: 1,
                  }}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  {getPaymentOptionDescription(order.paymentOption, isSecondPayment)}
                </Typography>
              </Box>
            </Box>

            {/* Payment Breakdown */}
            <Box 
              sx={{ 
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
                border: `1px solid ${statusColor}30`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccountBalanceWallet sx={{ fontSize: 20, color: statusColor }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Payment Breakdown
                </Typography>
              </Box>

              {order.paymentOption === 'split_payment' ? (
                <>
                  {isFirstPayment ? (
                    <>
                      {/* First Payment - Deposit */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Deposit Due Now
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Required to start service
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: statusColor }}>
                          ${amountDueNow.toFixed(2)}
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
                            Due after completion
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          ${remainingAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      {/* Second Payment - Show what was paid and what's due */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            First Payment Paid
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Deposit received
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                          ${depositAmount.toFixed(2)}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      {/* Final Payment Due */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Final Payment Due Now
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Complete your payment
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: statusColor }}>
                          ${amountDueNow.toFixed(2)}
                        </Typography>
                      </Box>
                    </>
                  )}
                </>
              ) : (
                /* Payment Upfront */
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Amount Due Now
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Full payment required
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: statusColor }}>
                    ${amountDueNow.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Service Section */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
              Service
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Click the service card below to view full details
            </Typography>
            <Box sx={{ px: 1, mx: -1 }}>
              <ServiceCardSimple
                title={order.serviceName}
                description={order.serviceDescription || 'Service description not available'}
                price={order.price}
                delivery={order.serviceDeliveryTime || '3-5 days'}
                color={order.serviceColor || statusColor}
                creative={order.creativeDisplayName || order.creativeName}
                onBook={handleViewService}
              />
            </Box>
          </Box>

          {/* Status Message */}
          <Box 
            sx={{ 
              mt: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: `${statusColor}10`,
              border: `1px solid ${statusColor}30`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
              <Box 
                sx={{ 
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: statusColor,
                  mt: 0.75,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Payment Required
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', ml: 2.5 }}>
              The creative has approved your booking. Please complete the payment to proceed with your service.
            </Typography>
          </Box>

          {/* Additional Notes Section - Only show if notes exist */}
          {order.description && order.description.trim() && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, fontSize: '1rem' }}>
                  Additional Notes
                </Typography>
                <Box 
                  sx={{ 
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                    {order.description}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
          </Box>

          {/* Sticky Pay Button */}
          <Box 
            sx={{ 
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              px: { xs: 2, sm: 3 },
              py: 2,
              pt: 1.5,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(to top, #1a1a1a 0%, #1a1a1a 85%, transparent 100%)'
                : 'linear-gradient(to top, #ffffff 0%, #ffffff 85%, transparent 100%)',
              borderTop: `1px solid ${theme.palette.divider}`,
              zIndex: 10,
            }}
          >
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handlePay}
              sx={{
                py: 1.5,
                bgcolor: statusColor,
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: `0 4px 14px ${statusColor}40`,
                '&:hover': {
                  bgcolor: statusColor,
                  filter: 'brightness(1.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 20px ${statusColor}50`,
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Payment sx={{ mr: 1, fontSize: 20 }} />
              Pay ${amountDueNow.toFixed(2)} Now
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Nested Service Detail Popover */}
      <ServicesDetailPopover
        open={serviceDetailOpen}
        onClose={handleServiceDetailClose}
        service={serviceDetail}
        context="client-connected"
      />

      {/* Creative Detail Popover */}
      <CreativeDetailPopover
        open={creativeDetailOpen}
        onClose={handleCreativeDetailClose}
        creative={creativeDetail}
      />

      {/* Stripe Payment Dialog */}
      <StripePaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        bookingId={order.id}
        amount={amountDueNow}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}

