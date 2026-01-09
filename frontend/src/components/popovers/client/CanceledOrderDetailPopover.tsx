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
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { 
  DateRange, 
  AttachMoney, 
  Payment, 
  Cancel as CancelIcon,
  Replay,
  Description,
  Download,
  PictureAsPdf,
  Visibility,
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect } from 'react';
import { ServicesDetailPopover, type ServiceDetail } from '../ServicesDetailPopover';
import { ServiceCardSimple } from '../../cards/creative/ServiceCard';
import { CreativeDetailPopover } from './CreativeDetailPopover';
import { BookingServicePopover } from './BookingServicePopover';
import { bookingService, type CalendarSettings } from '../../../api/bookingService';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export type CanceledPaymentOption = 'split_payment' | 'payment_upfront' | 'payment_later' | 'free';

export interface CanceledOrderDetail {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  canceledDate?: string;
  paymentOption?: CanceledPaymentOption;
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
  invoices?: Array<{ type: string; name: string; download_url: string; session_id?: string }>;
}

export interface CanceledOrderDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  order: CanceledOrderDetail | null;
}

export function CanceledOrderDetailPopover({ 
  open, 
  onClose, 
  order 
}: CanceledOrderDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [creativeDetailOpen, setCreativeDetailOpen] = useState(false);
  const [bookingPopoverOpen, setBookingPopoverOpen] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);

  if (!order) return null;

  const statusColor = '#f44336'; // Red for canceled
  const invoices = order.invoices || [];

  const handleViewEzInvoice = async () => {
    try {
      const blob = await bookingService.downloadEzInvoice(order.id);
      const url = window.URL.createObjectURL(blob);
      // Open PDF in new tab for viewing
      window.open(url, '_blank');
      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Failed to view EZ invoice:', error);
      alert('Failed to view invoice. Please try again.');
    }
  };

  const handleDownloadEzInvoice = async () => {
    try {
      const blob = await bookingService.downloadEzInvoice(order.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EZ_Invoice_${order.id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Failed to download EZ invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleViewStripeReceipt = async (sessionId: string) => {
    try {
      const response = await bookingService.getStripeReceipt(order.id, sessionId);
      if (response.success && response.receipt_url) {
        // Open Stripe receipt in new tab
        window.open(response.receipt_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to get Stripe receipt:', error);
      alert('Failed to open Stripe receipt. Please try again.');
    }
  };

  const getPaymentOptionLabel = (option: CanceledPaymentOption) => {
    switch (option) {
      case 'split_payment':
        return 'Split Payment';
      case 'payment_upfront':
        return 'Payment Upfront';
      case 'payment_later':
        return 'Payment Later';
      case 'free':
        return 'Free Service';
      default:
        return 'Unknown';
    }
  };

  const getPaymentOptionColor = (option: CanceledPaymentOption) => {
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

  const handleBookAgain = async () => {
    // Close the order detail popover first
    onClose();
    // Fetch calendar settings and open booking popover directly
    const serviceIdToUse = order.serviceId || order.id;
    if (serviceIdToUse) {
      try {
        const response = await bookingService.getCalendarSettings(serviceIdToUse);
        setCalendarSettings(response);
        setBookingPopoverOpen(true);
      } catch (error: any) {
        // 404 is expected for services without scheduling - don't treat as error
        if (error?.status !== 404 && error?.response?.status !== 404) {
          console.error('Error fetching calendar settings:', error);
        }
        // Open booking popover without calendar settings
        setCalendarSettings(null);
        setBookingPopoverOpen(true);
      }
    }
  };

  const handleViewComplianceSheet = async () => {
    try {
      const blob = await bookingService.downloadComplianceSheet(order.id);
      const url = window.URL.createObjectURL(blob);
      // Open PDF in new tab for viewing
      window.open(url, '_blank');
      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Failed to view compliance sheet:', error);
      alert('Failed to view compliance sheet. Please try again.');
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
        sx={{ zIndex: 1500 }}
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
                  label="Canceled"
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

        <DialogContent sx={{ pt: 0, pb: 0, px: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Scrollable Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 } }}>
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

              {/* Canceled Date */}
              {order.canceledDate && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CancelIcon sx={{ fontSize: 20, color: statusColor, mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
                      Canceled On
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {new Date(order.canceledDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
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

              {/* Payment Option */}
              {order.paymentOption && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Payment sx={{ fontSize: 20, color: getPaymentOptionColor(order.paymentOption), mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
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
                        mt: 0.5,
                      }}
                    />
                  </Box>
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
              mb: 3,
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
                Service canceled
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', ml: 2.5 }}>
              This service order has been canceled. If you'd like to work with this creative again, you can rebook the service below. Any applicable refunds have been processed according to the cancellation policy.
            </Typography>
          </Box>

          {/* Invoices Section */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '1rem' }}>
              Invoices & Receipts
            </Typography>
            {invoices.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {invoices.map((invoice, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <PictureAsPdf sx={{ fontSize: 32, color: invoice.type === 'stripe_receipt' ? '#635bff' : '#f44336' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {invoice.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {invoice.type === 'stripe_receipt' ? 'Stripe payment receipt' : 'EZ platform invoice'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {invoice.type === 'ez_invoice' && (
                        <IconButton
                          size="small"
                          onClick={handleViewEzInvoice}
                          sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                              bgcolor: theme.palette.primary.main + '10',
                            },
                          }}
                          title="View invoice"
                        >
                          <Visibility />
                        </IconButton>
                      )}
                      {invoice.type === 'stripe_receipt' && invoice.session_id ? (
                        <IconButton
                          size="small"
                          onClick={() => handleViewStripeReceipt(invoice.session_id!)}
                          sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                              bgcolor: theme.palette.primary.main + '10',
                            },
                          }}
                          title="View receipt"
                        >
                          <Visibility />
                        </IconButton>
                      ) : invoice.type === 'ez_invoice' ? (
                        <IconButton
                          size="small"
                          onClick={handleDownloadEzInvoice}
                          sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                              bgcolor: theme.palette.primary.main + '10',
                            },
                          }}
                          title="Download invoice"
                        >
                          <Download />
                        </IconButton>
                      ) : null}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box 
                sx={{ 
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  textAlign: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No invoices available
                </Typography>
              </Box>
            )}
          </Box>

          {/* Additional Notes Section - Only show if notes exist */}
          {order.description && order.description.trim() && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 3 }}>
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
        {/* End of scrollable content */}

        {/* Sticky Action Buttons */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            px: { xs: 2, sm: 3 },
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(18, 18, 18, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            gap: 2,
            zIndex: 1,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Button
            variant="outlined"
            size="large"
            startIcon={<Description />}
            onClick={handleViewComplianceSheet}
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              borderRadius: 2,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              flex: { xs: 1, sm: '0 0 auto' },
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                color: theme.palette.primary.dark,
                bgcolor: theme.palette.primary.main + '10',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Compliance Sheet
          </Button>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<Replay />}
            onClick={handleBookAgain}
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              bgcolor: theme.palette.primary.main,
              borderRadius: 2,
              boxShadow: `0 4px 14px ${theme.palette.primary.main}40`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme.palette.primary.main,
                filter: 'brightness(1.1)',
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${theme.palette.primary.main}50`,
              },
            }}
          >
            Rebook This Service
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

      {/* Booking Service Popover */}
      {(order.serviceId || order.id) && (
        <BookingServicePopover
          open={bookingPopoverOpen}
          onClose={() => setBookingPopoverOpen(false)}
          service={{
            id: order.serviceId || order.id,
            title: order.serviceName,
            description: order.serviceDescription || 'Service description not available',
            price: order.price,
            delivery_time: order.serviceDeliveryTime || '3-5 days',
            creative_name: order.creativeName,
            creative_display_name: order.creativeDisplayName || order.creativeName,
            creative_title: order.creativeTitle,
            creative_avatar_url: order.creativeAvatarUrl,
            color: order.serviceColor || statusColor,
            payment_option: order.paymentOption === 'payment_upfront' ? 'upfront' : 
                            order.paymentOption === 'split_payment' ? 'split' : 
                            order.paymentOption === 'payment_later' ? 'later' : 'upfront',
            split_deposit_amount: undefined,
            requires_booking: calendarSettings?.is_scheduling_enabled || false,
          }}
          calendarSettings={calendarSettings}
        />
      )}
    </>
  );
}

