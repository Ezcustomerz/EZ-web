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
  Chip,
  Avatar,
  Button,
  Stack,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { 
  AttachMoney, 
  CalendarMonth, 
  Person, 
  AccessTime,
  Send,
  Schedule,
  AccountBalanceWallet,
  CheckCircle,
  PendingActions
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect } from 'react';
import { ServiceCard } from '../../cards/creative/ServiceCard';
import { CalendarSessionDetailPopover } from './CalendarSessionDetailPopover';
import { ServiceFinalizationStep } from './ServiceFinalizationStep';

// Define Session interface locally since it's not exported
interface Session {
  id: string;
  date: string;
  time: string;
  endTime: string;
  client: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

// Define uploaded file interface
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
  uploadedAt: Date;
}

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface InProgressOrder {
  id: string;
  client: string;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    delivery_time: string;
    color: string;
    payment_option: 'upfront' | 'split' | 'later';
    photos?: Array<{ url: string; alt?: string }>;
  };
  amount: number;
  status: string;
  date: string;
  bookingDate: string | null;
  // Payment tracking
  amountPaid?: number;
  amountRemaining?: number;
  depositPaid?: boolean;
  // Additional order details
  description?: string;
  clientEmail?: string;
  clientPhone?: string;
  specialRequirements?: string;
  // Work deliverables
  deliverables?: string[];
  notes?: string;
}

export interface InProgressPopoverProps {
  open: boolean;
  onClose: () => void;
  order: InProgressOrder | null;
  onFinalizeService: (orderId: string, files: UploadedFile[]) => void;
  showFinalizationStep?: boolean;
}

export function InProgressPopover({ 
  open, 
  onClose, 
  order,
  onFinalizeService,
  showFinalizationStep: initialShowFinalizationStep = false
}: InProgressPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showFinalizationStep, setShowFinalizationStep] = useState(initialShowFinalizationStep);

  // Update state when prop changes
  useEffect(() => {
    setShowFinalizationStep(initialShowFinalizationStep);
  }, [initialShowFinalizationStep]);

  if (!order) return null;

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
        return 'Unknown';
    }
  };

  const getPaymentOptionDescription = (option: 'upfront' | 'split' | 'later', price: number) => {
    if (price === 0) {
      return 'This is a complimentary service';
    }
    switch (option) {
      case 'upfront':
        return 'Full payment required before service begins. Client must complete payment to start the project.';
      case 'split':
        return 'Client pays 50% deposit upfront to secure the booking, then pays the remaining 50% after service completion.';
      case 'later':
        return 'Payment is due after the service is completed. No upfront payment required to start the project.';
      default:
        return '';
    }
  };

  const getPaymentOptionColor = (option: 'upfront' | 'split' | 'later', price: number) => {
    if (price === 0) {
      return theme.palette.grey[500];
    }
    switch (option) {
      case 'upfront':
        return theme.palette.success.main;
      case 'split':
        return theme.palette.info.main;
      case 'later':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Payment breakdown calculations
  const getPaymentBreakdown = (option: 'upfront' | 'split' | 'later', price: number, amountPaid: number = 0) => {
    if (price === 0) {
      return {
        depositAmount: 0,
        remainingAmount: 0,
        amountDueNow: 0,
        isFree: true,
        amountPaid: 0,
        amountRemaining: 0
      };
    }

    switch (option) {
      case 'upfront':
        return {
          depositAmount: price,
          remainingAmount: 0,
          amountDueNow: price,
          isFree: false,
          amountPaid: amountPaid,
          amountRemaining: price - amountPaid
        };
      case 'split':
        const depositAmount = Math.round(price * 0.5 * 100) / 100; // 50% deposit
        const remainingAmount = price - depositAmount;
        return {
          depositAmount,
          remainingAmount,
          amountDueNow: depositAmount,
          isFree: false,
          amountPaid: amountPaid,
          amountRemaining: price - amountPaid
        };
      case 'later':
        return {
          depositAmount: 0,
          remainingAmount: price,
          amountDueNow: 0,
          isFree: false,
          amountPaid: amountPaid,
          amountRemaining: price - amountPaid
        };
      default:
        return {
          depositAmount: 0,
          remainingAmount: price,
          amountDueNow: 0,
          isFree: false,
          amountPaid: amountPaid,
          amountRemaining: price - amountPaid
        };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatBookingDate = (bookingDateStr: string | null) => {
    if (!bookingDateStr) return 'Not scheduled';
    
    const date = new Date(bookingDateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };



  const handleViewBooking = () => {
    setBookingDetailOpen(true);
  };

  const handleBookingDetailClose = () => {
    setBookingDetailOpen(false);
  };



  const handleStartFinalization = () => {
    setShowFinalizationStep(true);
  };

  const handleFinalizeService = async () => {
    setIsFinalizing(true);
    try {
      await onFinalizeService(order.id, uploadedFiles);
      onClose();
    } catch (error) {
      console.error('Error finalizing service:', error);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleBackToMain = () => {
    setShowFinalizationStep(false);
  };

  // Calculate payment breakdown
  const paymentBreakdown = getPaymentBreakdown(
    order.service.payment_option, 
    order.service.price, 
    order.amountPaid || 0
  );

  const statusColor = getPaymentOptionColor(order.service.payment_option, order.service.price);

  // Create booking session data for the popover
  const bookingSession: Session = {
    id: order.id,
    date: order.bookingDate || order.date,
    time: order.bookingDate ? new Date(order.bookingDate).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }) : 'Not scheduled',
    endTime: order.bookingDate ? new Date(new Date(order.bookingDate).getTime() + 60 * 60 * 1000).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }) : 'Not scheduled',
    client: order.client,
    type: order.service.title,
    status: 'confirmed',
    notes: order.description || order.specialRequirements
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      sx={{
        zIndex: isMobile ? 10000 : 1300,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            p: 0,
            backgroundColor: '#fff',
            boxShadow: theme.shadows[8],
            height: isMobile ? '100dvh' : 'auto',
            maxHeight: isMobile ? '100dvh' : '90vh',
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
            }),
          },
        },
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.32)' } }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 2,
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {showFinalizationStep && (
            <IconButton 
              onClick={handleBackToMain} 
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {order.service.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {showFinalizationStep ? 'Finalize Service' : 'Service in progress'}
            </Typography>
          </Box>
          <Chip
            label={showFinalizationStep ? "Finalizing" : "In Progress"}
            size="small"
            sx={{
              backgroundColor: showFinalizationStep ? '#10b981' : '#3b82f6',
              color: '#fff',
              fontWeight: 500,
            }}
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{
        p: { xs: 2, sm: 3 },
        flex: '1 1 auto',
        overflowY: 'auto',
        minHeight: 0,
      }}>
        {!showFinalizationStep ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Order Overview */}
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Order Overview
              </Typography>
              
              <Stack spacing={2}>
                {/* Client Information */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ backgroundColor: '#3b82f6', width: 40, height: 40 }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {order.client}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Client
                    </Typography>
                  </Box>
                </Box>

                {/* Order Details */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AttachMoney sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {formatCurrency(order.amount)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CalendarMonth sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Order Date
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDate(order.date)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Payment Information
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <AccountBalanceWallet sx={{ fontSize: 20, color: statusColor, mt: 0.25 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.5 }}>
                    Payment Option
                  </Typography>
                  <Chip
                    label={getPaymentOptionLabel(order.service.payment_option, order.service.price)}
                    size="small"
                    sx={{
                      bgcolor: `${statusColor}20`,
                      color: statusColor,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      mb: 1,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {getPaymentOptionDescription(order.service.payment_option, order.service.price)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Status & Breakdown */}
          {!paymentBreakdown.isFree && (
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AccountBalanceWallet sx={{ fontSize: 20, color: statusColor }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Payment Status
                  </Typography>
                </Box>

                <Box 
                  sx={{ 
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? `${statusColor}20` : `${statusColor}10`,
                    border: `1px solid ${statusColor}30`,
                  }}
                >
                  {order.service.payment_option === 'split' ? (
                    <>
                      {/* Amount Paid */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Deposit Paid
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {paymentBreakdown.amountPaid > 0 ? 'Deposit received - service can begin' : 'No deposit received yet'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                            {formatCurrency(paymentBreakdown.amountPaid)}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      {/* Remaining Amount */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Remaining Balance
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {paymentBreakdown.amountPaid > 0 ? 'Due after service completion' : '50% deposit required to start'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PendingActions sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                            {formatCurrency(paymentBreakdown.amountRemaining)}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  ) : order.service.payment_option === 'upfront' ? (
                    /* Payment Upfront - Awaiting Full Payment */
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Full Payment Required
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Complete payment needed before service can begin
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                          {formatCurrency(paymentBreakdown.amountRemaining)}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    /* Payment Later - Awaiting Full Payment */
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Payment Due After Completion
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Service can begin without upfront payment
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                          {formatCurrency(paymentBreakdown.amountRemaining)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Service Card */}
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Service Details
              </Typography>
              <ServiceCard
                title={order.service.title}
                description={order.service.description}
                price={order.service.price}
                delivery={order.service.delivery_time}
                status="Public"
                creative="Service Provider"
                color={order.service.color}
                showMenu={false}
              />
            </CardContent>
          </Card>

          {/* Booking Date Card */}
          {order.bookingDate && (
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Booking Details
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AccessTime sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Scheduled Session
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatBookingDate(order.bookingDate)}
                    </Typography>
                  </Box>
                  <Box
                    component="button"
                    onClick={handleViewBooking}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 2,
                      py: 1,
                      backgroundColor: 'transparent',
                      border: '1px solid #3b82f6',
                      borderRadius: 1.5,
                      color: '#3b82f6',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textDecoration: 'none',
                      '&:hover': {
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      }
                    }}
                  >
                    View Details
                    <Typography component="span" sx={{ fontSize: '0.75rem', ml: 0.5 }}>
                      →
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}


          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ServiceFinalizationStep
              uploadedFiles={uploadedFiles}
              onFilesChange={setUploadedFiles}
              onFinalize={handleFinalizeService}
              isFinalizing={isFinalizing}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{
        p: { xs: 2, sm: 3 },
        pt: 1,
        flexShrink: 0,
        justifyContent: 'flex-end',
        gap: 2
      }}>
        {!showFinalizationStep ? (
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleStartFinalization}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': {
                backgroundColor: '#059669',
              },
            }}
          >
            Finalize Service
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleFinalizeService}
            disabled={isFinalizing}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': {
                backgroundColor: '#059669',
              },
              '&:disabled': {
                backgroundColor: '#d1d5db',
                color: '#9ca3af',
              }
            }}
          >
            {isFinalizing ? 'Finalizing...' : 'Complete Finalization'}
          </Button>
        )}
      </DialogActions>


      {/* Booking Detail Popover */}
      <CalendarSessionDetailPopover
        open={bookingDetailOpen}
        onClose={handleBookingDetailClose}
        session={bookingSession}
        onBack={handleBookingDetailClose}
      />
    </Dialog>
  );
}
