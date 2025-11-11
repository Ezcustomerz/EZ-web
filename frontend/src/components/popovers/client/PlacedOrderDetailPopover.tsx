import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { DateRange, AttachMoney, Payment, CalendarMonth, Cancel, Warning } from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';
import { ServicesDetailPopover, type ServiceDetail } from '../ServicesDetailPopover';
import { ServiceCardSimple } from '../../cards/creative/ServiceCard';
import { CreativeDetailPopover } from './CreativeDetailPopover';
import { bookingService } from '../../../api/bookingService';
import { successToast, errorToast } from '../../toast/toast';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export type PaymentOption = 'split_payment' | 'payment_upfront' | 'payment_later' | 'free';

export interface PlacedOrderDetail {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  calendarDate: string | null;
  paymentOption: PaymentOption;
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

export interface PlacedOrderDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  order: PlacedOrderDetail | null;
  onOrderCanceled?: () => void;
}

export function PlacedOrderDetailPopover({ 
  open, 
  onClose, 
  order,
  onOrderCanceled
}: PlacedOrderDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [creativeDetailOpen, setCreativeDetailOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  if (!order) return null;

  const statusColor = '#ff9800';

  const getPaymentOptionLabel = (option: PaymentOption) => {
    switch (option) {
      case 'split_payment':
        return 'Split Payment';
      case 'payment_upfront':
        return 'Payment Upfront';
      case 'payment_later':
        return 'Payment Later';
      case 'free':
        return 'N/A (Free Service)';
      default:
        return 'Unknown';
    }
  };

  const getPaymentOptionDescription = (option: PaymentOption) => {
    switch (option) {
      case 'split_payment':
        return 'Partial deposit paid upfront, remaining balance due after completion';
      case 'payment_upfront':
        return 'Full payment required before service begins';
      case 'payment_later':
        return 'Payment due after service completion';
      case 'free':
        return 'This is a complimentary service';
      default:
        return '';
    }
  };

  const getPaymentOptionColor = (option: PaymentOption) => {
    switch (option) {
      case 'split_payment':
        return theme.palette.info.main;
      case 'payment_upfront':
        return theme.palette.success.main;
      case 'payment_later':
        return theme.palette.warning.main;
      case 'free':
        return theme.palette.grey[500];
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

  const handleCancelClick = () => {
    setConfirmCancelOpen(true);
  };

  const handleConfirmCancelClose = () => {
    if (!isCanceling) {
      setConfirmCancelOpen(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!order) return;
    
    setIsCanceling(true);
    try {
      const response = await bookingService.cancelOrder(order.id);
      
      if (!response.success) {
        errorToast('Cancel Failed', response.message || 'Failed to cancel the service. Please try again.');
        setIsCanceling(false);
        return;
      }

      successToast('Service Canceled', 'Your service request has been canceled successfully.');
      
      // Close confirmation dialog
      setConfirmCancelOpen(false);
      
      // Notify parent component to refresh data
      if (onOrderCanceled) {
        onOrderCanceled();
      }
      
      // Close the popover
      onClose();
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred. Please try again.';
      errorToast('Cancel Failed', errorMessage);
    } finally {
      setIsCanceling(false);
    }
  };

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
                  label="Service Placed"
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

        <DialogContent sx={{ pt: 3, pb: 3, px: { xs: 2, sm: 3 } }}>
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

              {/* Price */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <AttachMoney sx={{ fontSize: 20, color: theme.palette.primary.main, mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
                    Price
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: '1.1rem' }}>
                    ${order.price.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment Option Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '1rem' }}>
              Payment Details
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
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
                  {getPaymentOptionDescription(order.paymentOption)}
                </Typography>
              </Box>
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
                Awaiting Creative Approval
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', ml: 2.5 }}>
              Your service request has been submitted and is waiting for the creative to review and approve. 
              You'll receive a notification once they accept your booking
              {order.calendarDate && ' and confirm the scheduled time'}.
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
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions sx={{ 
          p: { xs: 2, sm: 3 }, 
          pt: 1.5,
          borderTop: `1px solid ${theme.palette.divider}`,
          justifyContent: 'flex-end',
          gap: 1.5
        }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={handleCancelClick}
            sx={{
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main,
              '&:hover': {
                borderColor: theme.palette.error.dark,
                backgroundColor: `${theme.palette.error.main}08`,
              },
            }}
          >
            Cancel Service
          </Button>
        </DialogActions>
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

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={confirmCancelOpen}
        onClose={handleConfirmCancelClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: `${theme.palette.error.main}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Warning sx={{ fontSize: 28, color: theme.palette.error.main }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Cancel Service?
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                This action cannot be undone
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: 'text.primary' }}>
            Are you sure you want to cancel this service request? This will cancel the order for both you and the creative.
          </Typography>
          {order && (
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
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {order.serviceName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                by {order.creativeName}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
          <Button
            onClick={handleConfirmCancelClose}
            disabled={isCanceling}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            Keep Service
          </Button>
          <Button
            onClick={handleConfirmCancel}
            disabled={isCanceling}
            variant="contained"
            color="error"
            startIcon={isCanceling ? null : <Cancel />}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            {isCanceling ? 'Canceling...' : 'Yes, Cancel Service'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

