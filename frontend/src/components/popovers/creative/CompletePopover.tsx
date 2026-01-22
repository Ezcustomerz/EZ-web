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
import { 
  AttachMoney, 
  CalendarMonth, 
  Person, 
  AccessTime,
  AccountBalanceWallet,
  CheckCircle,
  Download,
  PictureAsPdf,
  Assignment,
  Star,
  Visibility
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect } from 'react';
import { ServiceCard } from '../../cards/creative/ServiceCard';
import { ServicesDetailPopover, type ServiceDetail } from '../ServicesDetailPopover';
import { CalendarSessionDetailPopover } from './CalendarSessionDetailPopover';
import { CircularProgress } from '@mui/material';
import { bookingService } from '../../../api/bookingService';
import { BookingPaymentRequests } from '../../shared/BookingPaymentRequests';

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

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface CompleteOrder {
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
  completedDate: string;
  bookingDate: string | null;
  // Payment tracking
  amountPaid?: number;
  amountRemaining?: number;
  depositPaid?: boolean;
  split_deposit_amount?: number;
  // Completion details
  rating?: number;
  review?: string;
  deliverables?: string[];
  completionNotes?: string;
  // Files with download status
  files?: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    downloaded_at?: string | null;
  }>;
  // PDF documents
  receiptPdf?: string;
  serviceSummaryPdf?: string;
  // Additional order details
  description?: string;
  clientEmail?: string;
  clientPhone?: string;
  specialRequirements?: string;
  notes?: string;
}

export interface CompletePopoverProps {
  open: boolean;
  onClose: () => void;
  order: CompleteOrder | null;
  onDownloadReceipt?: (orderId: string) => void;
  onDownloadSummary?: (orderId: string) => void;
}

export function CompletePopover({ 
  open, 
  onClose, 
  order,
  onDownloadReceipt,
  onDownloadSummary
}: CompletePopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [preservedFiles, setPreservedFiles] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    downloaded_at?: string | null;
  }>>(() => {
    return order?.files && Array.isArray(order.files) && order.files.length > 0 ? order.files : [];
  });
  const [invoices, setInvoices] = useState<Array<{ type: string; name: string; download_url: string; session_id?: string }>>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // Fetch files when popover opens if they're not already present
  useEffect(() => {
    if (open && order && order.id && preservedFiles.length === 0 && (!order.files || order.files.length === 0)) {
      setIsLoadingFiles(true);
      const fetchFiles = async () => {
        try {
          const response = await bookingService.downloadDeliverablesBatch(order.id);
          
          if (response.files && response.files.length > 0) {
            const fetchedFiles = response.files.map(f => ({
              id: f.deliverable_id,
              name: f.file_name,
              type: 'file',
              size: 'N/A',
              downloaded_at: null
            }));
            setPreservedFiles(fetchedFiles);
          } else if (response.unavailable_files && response.unavailable_files.length > 0) {
            const unavailableFiles = response.unavailable_files.map(f => ({
              id: f.deliverable_id,
              name: f.file_name,
              type: 'file',
              size: 'N/A',
              downloaded_at: null
            }));
            setPreservedFiles(unavailableFiles);
          }
        } catch (error) {
          console.error('[CompletePopover] Failed to fetch files:', error);
        } finally {
          setIsLoadingFiles(false);
        }
      };
      fetchFiles();
    } else if (open && (preservedFiles.length > 0 || (order?.files && order.files.length > 0))) {
      setIsLoadingFiles(false);
    }
  }, [open, order?.id, preservedFiles.length, order?.files]);

  // Update preserved files when order changes, but only if order has files
  useEffect(() => {
    if (order && order.files && Array.isArray(order.files) && order.files.length > 0) {
      setPreservedFiles(order.files);
    }
  }, [order]);

  // Fetch invoices when popover opens
  useEffect(() => {
    if (open && order && order.id) {
      setIsLoadingInvoices(true);
      bookingService.getInvoices(order.id)
        .then(result => {
          setInvoices(result.invoices || []);
          setIsLoadingInvoices(false);
        })
        .catch(err => {
          console.error('Error fetching invoices:', err);
          setInvoices([]);
          setIsLoadingInvoices(false);
        });
    } else {
      setInvoices([]);
    }
  }, [open, order?.id]);

  // Use preserved files if available, otherwise fall back to order files
  const displayFiles = preservedFiles.length > 0 ? preservedFiles : (order?.files || []);

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

  const getPaymentOptionDescription = (option: 'upfront' | 'split' | 'later', price: number, splitDepositAmount?: number) => {
    if (price === 0) {
      return 'This was a complimentary service';
    }
    switch (option) {
      case 'upfront':
        return 'Full payment was required before service began. Payment was completed successfully.';
      case 'split':
        const depositAmount = splitDepositAmount !== undefined && splitDepositAmount !== null
          ? splitDepositAmount
          : (order.split_deposit_amount !== undefined && order.split_deposit_amount !== null
              ? order.split_deposit_amount
              : 0);
        const remainingAmount = depositAmount > 0 ? price - depositAmount : price;
        return depositAmount > 0
          ? `Client paid ${formatCurrency(depositAmount)} deposit upfront to secure the booking, then paid the remaining ${formatCurrency(remainingAmount)} after service completion.`
          : `Client paid split payments for this service.`;
      case 'later':
        return 'Payment was due after the service was completed. Payment has been received.';
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

  const handleViewService = () => {
    setServiceDetailOpen(true);
  };

  const handleViewEzInvoice = async () => {
    if (!order) return;
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
    if (!order) return;
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
    if (!order) return;
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

  const handleServiceDetailClose = () => {
    setServiceDetailOpen(false);
  };

  const handleViewBooking = () => {
    setBookingDetailOpen(true);
  };

  const handleBookingDetailClose = () => {
    setBookingDetailOpen(false);
  };

  const handleDownloadReceipt = () => {
    if (onDownloadReceipt) {
      onDownloadReceipt(order.id);
    }
  };

  const handleDownloadSummary = () => {
    if (onDownloadSummary) {
      onDownloadSummary(order.id);
    }
  };

  // Create service detail data for the popover
  const serviceDetail: ServiceDetail = {
    id: order.service.id,
    title: order.service.title,
    description: order.service.description,
    price: order.service.price || 0,
    delivery_time: order.service.delivery_time,
    color: order.service.color,
    status: 'Public',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    photos: (order.service.photos || []).map((photo, index) => ({
      photo_url: photo.url,
      photo_filename: photo.alt || `photo-${index}`,
      is_primary: index === 0,
      display_order: index
    }))
  };

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

  const statusColor = getPaymentOptionColor(order.service.payment_option, order.service.price);

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
            border: `2px solid ${order.service.color}30`,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
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
        pb: 1,
        pt: 2,
        background: `linear-gradient(135deg, ${order.service.color}15 0%, ${order.service.color}08 100%)`,
        borderBottom: `2px solid ${order.service.color}20`,
        position: 'relative',
        flexShrink: 0,
        mb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 6 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {order.service.title}
              </Typography>
              <Chip
                label="Completed"
                size="small"
                sx={{
                  bgcolor: order.service.color,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Service completed successfully
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

      <DialogContent sx={{
        p: { xs: 2, sm: 3 },
        pt: { xs: 4, sm: 5 },
        flex: '1 1 auto',
        overflowY: 'auto',
        minHeight: 0,
        position: 'relative'
      }}>
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
                  <Avatar sx={{ backgroundColor: order.service.color, width: 40, height: 40 }}>
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
                        Completed Date
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDate(order.completedDate)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Notes from Client - Only show if notes exist */}
          {(order.description || order.specialRequirements) && (
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Notes from Client
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
                    {order.description || order.specialRequirements || ''}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Booking Date Card */}
          {order.bookingDate && (
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Session Details
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AccessTime sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Completed Session
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
                        backgroundColor: order.service.color,
                        color: '#fff',
                        transform: 'translateY(-1px)',
                        boxShadow: `0 2px 8px ${order.service.color}50`,
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
                    {getPaymentOptionDescription(order.service.payment_option, order.service.price, order.split_deposit_amount)}
                  </Typography>
                </Box>
              </Box>

              {/* Payment Status */}
              <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: '#f0f9ff', border: '1px solid #0ea5e9' }}>
                {order.service.payment_option === 'split' ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CheckCircle sx={{ fontSize: 20, color: '#10b981' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Split Payment Completed
                      </Typography>
                    </Box>
                    
                    {/* Deposit Payment */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Deposit Payment
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Initial deposit
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                          {formatCurrency(
                            order.split_deposit_amount !== undefined && order.split_deposit_amount !== null
                              ? Math.round(order.split_deposit_amount * 100) / 100
                              : Math.round(order.amount * 0.5 * 100) / 100
                          )}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Final Payment */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Final Payment
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Remaining after completion
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                          {formatCurrency(
                            order.split_deposit_amount !== undefined && order.split_deposit_amount !== null
                              ? Math.round((order.amount - order.split_deposit_amount) * 100) / 100
                              : Math.round(order.amount * 0.5 * 100) / 100
                          )}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Total Payment */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Total Payment
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Both payments received
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                          {formatCurrency(order.amount)}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckCircle sx={{ fontSize: 20, color: '#10b981' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Payment Completed
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Full payment of {formatCurrency(order.amount)} has been received
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Invoices & Receipts Section */}
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Invoices & Receipts
              </Typography>
              {isLoadingInvoices ? (
                <Typography variant="body2" color="text.secondary">
                  Loading invoices...
                </Typography>
              ) : invoices.length > 0 ? (
                <Stack spacing={1.5}>
                  {invoices.map((invoice, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#fafafa',
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
                          <>
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
                          </>
                        )}
                        {invoice.type === 'stripe_receipt' && invoice.session_id && (
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
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No invoices available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Payment Requests Section */}
          <BookingPaymentRequests bookingId={order.id} isClient={false} />

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
                onClick={handleViewService}
              />
            </CardContent>
          </Card>

          {/* Completion Details */}
          {order.deliverables && order.deliverables.length > 0 && (
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Deliverables
                </Typography>
                <Stack spacing={1}>
                  {order.deliverables.map((deliverable, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {deliverable}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Files Download Status - Only show when files were actually returned */}
          {(displayFiles.length > 0 || isLoadingFiles) && (
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Client File Download Status
                </Typography>
                {isLoadingFiles ? (
                  <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Loading files...
                    </Typography>
                  </Box>
                ) : displayFiles.length > 0 ? (
                  <Stack spacing={1.5}>
                    {displayFiles.map((file) => {
                    const isDownloaded = file.downloaded_at !== null && file.downloaded_at !== undefined;
                    const downloadDate = file.downloaded_at ? new Date(file.downloaded_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : null;
                    
                    return (
                      <Box 
                        key={file.id} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 1.5,
                          backgroundColor: isDownloaded ? '#f0fdf4' : '#fefefe',
                          border: `1px solid ${isDownloaded ? '#86efac' : '#e2e8f0'}`
                        }}
                      >
                        {isDownloaded ? (
                          <CheckCircle sx={{ fontSize: 20, color: '#10b981' }} />
                        ) : (
                          <Download sx={{ fontSize: 20, color: '#6b7280' }} />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {file.size} • {file.type}
                          </Typography>
                          {isDownloaded && downloadDate && (
                            <Typography variant="caption" sx={{ color: '#10b981', display: 'block', mt: 0.5 }}>
                              Downloaded on {downloadDate}
                            </Typography>
                          )}
                        </Box>
                        {isDownloaded ? (
                          <Chip
                            label="Downloaded"
                            size="small"
                            sx={{
                              backgroundColor: '#10b981',
                              color: '#fff',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                            }}
                          />
                        ) : (
                          <Chip
                            label="Not Downloaded"
                            size="small"
                            sx={{
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                  </Stack>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No files available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rating & Review */}
          {order.rating && (
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Client Feedback
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Rating:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        sx={{
                          fontSize: 20,
                          color: index < order.rating! ? '#fbbf24' : '#d1d5db'
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    ({order.rating}/5)
                  </Typography>
                </Box>
                {order.review && (
                  <Typography variant="body2" sx={{ color: 'text.primary', fontStyle: 'italic' }}>
                    "{order.review}"
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{
        p: { xs: 2, sm: 3 },
        pt: 1,
        flexShrink: 0,
        justifyContent: 'flex-end',
        gap: 2
      }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdf />}
          onClick={handleDownloadReceipt}
          sx={{
            borderColor: '#6b7280',
            color: '#6b7280',
            '&:hover': {
              borderColor: '#4b5563',
              backgroundColor: '#f9fafb',
            },
          }}
        >
          Download Receipt
        </Button>
        <Button
          variant="contained"
          startIcon={<Assignment />}
          onClick={handleDownloadSummary}
          sx={{
            backgroundColor: order.service.color,
            '&:hover': {
              backgroundColor: order.service.color,
              filter: 'brightness(0.9)',
            },
          }}
        >
          Download Summary
        </Button>
      </DialogActions>

      {/* Service Detail Popover */}
      <ServicesDetailPopover
        open={serviceDetailOpen}
        onClose={handleServiceDetailClose}
        service={serviceDetail}
        context="creative-view"
      />

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
