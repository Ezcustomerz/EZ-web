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
  CircularProgress,
  LinearProgress,
  Skeleton,
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
  PendingActions,
  Download,
  PictureAsPdf,
  Visibility
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect } from 'react';
import { ServiceCard } from '../../cards/creative/ServiceCard';
import { CalendarSessionDetailPopover } from './CalendarSessionDetailPopover';
import { ServiceFinalizationStep } from './ServiceFinalizationStep';
import { ClamAVScanDialog } from '../../dialogs/ClamAVScanDialog';
import { fileScanningService } from '../../../api/fileScanningService';
import type { FileScanResponse } from '../../../api/fileScanningService';
import { userService, type CreativeProfile } from '../../../api/userService';
import { bookingService } from '../../../api/bookingService';
import { supabase } from '../../../config/supabase';
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
  split_deposit_amount?: number;
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
  onFinalizeService: (orderId: string, files: UploadedFile[]) => Promise<void>;
  showFinalizationStep?: boolean;
  onUploadProgress?: (progress: string) => void;
  uploadProgressPercent?: number;
  onCancelUpload?: () => void;
  isCancelling?: boolean;
  onManageStorage?: () => void;
}

export function InProgressPopover({ 
  open, 
  onClose, 
  order,
  onFinalizeService,
  showFinalizationStep: initialShowFinalizationStep = false,
  onUploadProgress,
  uploadProgressPercent = 0,
  onCancelUpload,
  isCancelling = false,
  onManageStorage
}: InProgressPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showFinalizationStep, setShowFinalizationStep] = useState(initialShowFinalizationStep);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResponse, setScanResponse] = useState<FileScanResponse | null>(null);
  const [creativeProfile, setCreativeProfile] = useState<CreativeProfile | null>(null);
  const [_loadingProfile, setLoadingProfile] = useState(false);
  const [actualStorageUsed, setActualStorageUsed] = useState<number>(0);
  const [storageExceeded, setStorageExceeded] = useState(false);
  const [invoices, setInvoices] = useState<Array<{ type: string; name: string; download_url: string; session_id?: string }>>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // Update state when prop changes
  useEffect(() => {
    setShowFinalizationStep(initialShowFinalizationStep);
  }, [initialShowFinalizationStep]);

  // Fetch creative profile and calculate actual storage when popover opens
  useEffect(() => {
    if (open && showFinalizationStep) {
      fetchCreativeProfileAndStorage();
    }
  }, [open, showFinalizationStep]);

  // Fetch invoices when popover opens (only if payment has been made)
  useEffect(() => {
    if (open && order && order.id) {
      // Only fetch invoices if payment has been made (upfront or split deposit)
      const shouldFetchInvoices = 
        order.service.payment_option === 'upfront' || 
        (order.service.payment_option === 'split' && order.depositPaid);
      
      if (shouldFetchInvoices) {
        setIsLoadingInvoices(true);
        bookingService.getInvoices(order.id)
          .then((result: { invoices?: Array<{ type: string; name: string; download_url: string; session_id?: string }> }) => {
            setInvoices(result.invoices || []);
            setIsLoadingInvoices(false);
          })
          .catch(() => {
            setInvoices([]);
            setIsLoadingInvoices(false);
          });
      } else {
        setInvoices([]);
      }
    } else {
      setInvoices([]);
    }
  }, [open, order?.id, order?.service.payment_option, order?.depositPaid]);

  const fetchCreativeProfileAndStorage = async () => {
    try {
      setLoadingProfile(true);
      const profile = await userService.getCreativeProfile();
      setCreativeProfile(profile);

      // Calculate actual storage used from deliverables (same logic as CreativeSettingsPopover)
      if (profile?.user_id) {
        await calculateActualStorageUsed(profile.user_id);
      }
    } catch {
      // Silently continue - storage check will handle it gracefully
    } finally {
      setLoadingProfile(false);
    }
  };

  const calculateActualStorageUsed = async (userId: string) => {
    try {
      // Get all bookings for this creative
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('creative_user_id', userId);

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) {
        setActualStorageUsed(0);
        return;
      }

      // Get all deliverables for these bookings
      const bookingIds = bookings.map(b => b.id);
      let deliverablesData: any[] = [];
      
      if (bookingIds.length > 0) {
        const { data, error: deliverablesError } = await supabase
          .from('booking_deliverables')
          .select('file_size_bytes, file_url')
          .in('booking_id', bookingIds);

        if (deliverablesError) throw deliverablesError;
        deliverablesData = data || [];
      }

      // Deduplicate by file_url (same as CreativeSettingsPopover)
      const seenFileUrls = new Set<string>();
      const uniqueDeliverables = (deliverablesData || []).filter(deliverable => {
        if (seenFileUrls.has(deliverable.file_url)) {
          return false;
        }
        seenFileUrls.add(deliverable.file_url);
        return true;
      });

      // Calculate actual storage used
      const actualStorage = uniqueDeliverables.reduce((sum, deliverable) => {
        const size = deliverable.file_size_bytes;
        return sum + (typeof size === 'number' && !isNaN(size) ? size : 0);
      }, 0);

      setActualStorageUsed(actualStorage);
    } catch {
      // Fall back to profile value on error - use current creativeProfile state
      const currentProfile = creativeProfile;
      setActualStorageUsed(currentProfile?.storage_used_bytes || 0);
    }
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
    } catch {
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
    } catch {
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
    } catch {
      alert('Failed to open Stripe receipt. Please try again.');
    }
  };

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
        return 'Client pays a deposit upfront to secure the booking, then pays the remaining amount after service completion.';
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
  const getPaymentBreakdown = (option: 'upfront' | 'split' | 'later', price: number, amountPaid: number = 0, splitDepositAmount?: number) => {
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
        // Use split_deposit_amount if provided, otherwise default to 50%
        const depositAmount = splitDepositAmount !== undefined && splitDepositAmount !== null
          ? Math.round(splitDepositAmount * 100) / 100
          : Math.round(price * 0.5 * 100) / 100;
        const remainingAmount = price - depositAmount;
        // For display: if deposit has been paid (amountPaid >= depositAmount), show depositAmount
        // Otherwise show the actual amountPaid (which would be 0 or partial)
        const displayDepositPaid = amountPaid >= depositAmount ? depositAmount : amountPaid;
        // Calculate remaining: For split payments, if deposit is paid, remaining is the second half
        // If deposit is not paid, remaining is the full price
        // If full amount is paid (amountPaid >= price), remaining is 0
        let actualAmountRemaining: number;
        if (amountPaid >= price) {
          // Fully paid
          actualAmountRemaining = 0;
        } else if (amountPaid >= depositAmount) {
          // Deposit paid, show remaining balance (second half)
          actualAmountRemaining = remainingAmount;
        } else {
          // Deposit not paid, show full price as remaining
          actualAmountRemaining = price;
        }
        return {
          depositAmount,
          remainingAmount,
          amountDueNow: depositAmount,
          isFree: false,
          amountPaid: displayDepositPaid, // Show deposit amount if deposit was paid, otherwise show actual amountPaid
          amountRemaining: actualAmountRemaining // Use calculated remaining amount
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
    // If there are files, scan them first
    if (uploadedFiles.length > 0) {
      setScanDialogOpen(true);
      setIsScanning(true);
      setScanResponse(null);
      
      try {
        // Convert UploadedFile to File objects for scanning
        const filesToScan: File[] = [];
        for (const uploadedFile of uploadedFiles) {
          try {
            // Fetch the file from the blob URL
            const response = await fetch(uploadedFile.url);
            const blob = await response.blob();
            const file = new File([blob], uploadedFile.name, { type: uploadedFile.type });
            filesToScan.push(file);
          } catch {
            // Silently skip files that fail to convert
          }
        }
        
        if (filesToScan.length > 0) {
          const response = await fileScanningService.scanFiles(filesToScan);
          setScanResponse(response);
          
          // If there are unsafe files, don't proceed - user will see the dialog
          if (response.unsafe_files > 0) {
            setIsScanning(false);
            return; // Stop here, user can see the dialog and decide what to do
          }
        }
      } catch {
        // Create error response
        setScanResponse({
          results: uploadedFiles.map(f => ({
            filename: f.name,
            is_safe: false,
            error_message: 'Failed to scan file',
          })),
          total_files: uploadedFiles.length,
          safe_files: 0,
          unsafe_files: uploadedFiles.length,
          scanner_available: false,
        });
        setIsScanning(false);
        return;
      } finally {
        setIsScanning(false);
      }
    }
    
    // If no files or all files are safe, proceed with finalization immediately
    // (No files to scan, so no need to wait for user confirmation)
    if (uploadedFiles.length === 0) {
      setIsFinalizing(true);
      try {
        await onFinalizeService(order.id, uploadedFiles);
        setScanDialogOpen(false);
        onClose();
      } catch {
        // Silently continue - finalization state is shown in UI
      } finally {
        setIsFinalizing(false);
      }
    }
    // If files were scanned and are safe, the scan dialog will be shown
    // and user will click "Continue" to proceed with upload and finalization
  };

  const handleScanDialogContinue = async () => {
    // This is called when user clicks "Continue" after scan is complete
    // Now upload files to Supabase and finalize
    setScanDialogOpen(false);
    setIsUploading(true);
    setIsFinalizing(true);
    setUploadProgress('Preparing files for upload...');
    if (onUploadProgress) onUploadProgress('Preparing files for upload...');
    
    try {
      // Don't close popover during upload - let the persistent card handle visibility
      await onFinalizeService(order.id, uploadedFiles);
      // Upload state is managed in parent component, so we can close now
      onClose();
    } catch {
      setIsUploading(false);
      setUploadProgress('');
      if (onUploadProgress) onUploadProgress('');
    } finally {
      setIsFinalizing(false);
      setIsUploading(false);
      setUploadProgress('');
      if (onUploadProgress) onUploadProgress('');
    }
  };

  const handleScanDialogCancel = () => {
    setScanDialogOpen(false);
    setScanResponse(null);
  };

  const handleBackToMain = () => {
    setShowFinalizationStep(false);
  };

  // Calculate payment breakdown
  const paymentBreakdown = getPaymentBreakdown(
    order.service.payment_option, 
    order.service.price, 
    order.amountPaid || 0,
    order.split_deposit_amount
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
        position: 'relative'
      }}>
        {/* Upload Progress Indicator */}
        {isUploading && (
          <Box sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            p: 2,
            borderRadius: 2,
            mb: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
              : '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <CircularProgress size={24} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {isCancelling
                    ? 'Cancelling upload...'
                    : uploadProgress || 'Uploading files to server...'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {isCancelling ? 'Please wait while we cancel your upload.' : 'Uploading to storage...'}
                  </Typography>
                  {!isCancelling && (
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {uploadProgressPercent}%
                    </Typography>
                  )}
                </Box>
              </Box>
              {onCancelUpload && (
                <IconButton
                  size="small"
                  onClick={onCancelUpload}
                  disabled={isCancelling}
                  sx={{
                    color: theme.palette.error.main,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(211, 47, 47, 0.1)' 
                        : 'rgba(211, 47, 47, 0.08)',
                    },
                    '&:disabled': {
                      opacity: 0.5,
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgressPercent} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                mb: 1,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)',
              }} 
            />
            {onCancelUpload && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                fullWidth
                onClick={onCancelUpload}
                disabled={isCancelling}
                startIcon={<CloseIcon />}
                sx={{ mt: 1 }}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Upload'}
              </Button>
            )}
          </Box>
        )}
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

          {/* Notes from Client - Only show if notes exist */}
          {(order.description || order.specialRequirements || order.notes) && (
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
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
                    {order.description || order.specialRequirements || order.notes || ''}
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
                            {paymentBreakdown.amountPaid > 0 
                              ? 'Due after service completion' 
                              : `${formatCurrency(paymentBreakdown.depositAmount)} deposit required to start`}
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

          {/* Invoices & Receipts Section - Show while loading or if invoices exist */}
          {(isLoadingInvoices || invoices.length > 0) && (
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Invoices & Receipts
                </Typography>
                {isLoadingInvoices ? (
                  <Stack spacing={1.5}>
                    {[1, 2].map((i) => (
                      <Box
                        key={i}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Skeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: 1 }} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
                            <Skeleton variant="text" width="40%" height={16} />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Skeleton variant="circular" width={32} height={32} />
                          <Skeleton variant="circular" width={32} height={32} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
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
                )}
              </CardContent>
            </Card>
          )}

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
              />
            </CardContent>
          </Card>

          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ServiceFinalizationStep
              uploadedFiles={uploadedFiles}
              onFilesChange={setUploadedFiles}
              onFinalize={handleFinalizeService}
              isFinalizing={isFinalizing}
              storageUsedBytes={actualStorageUsed > 0 ? actualStorageUsed : (creativeProfile?.storage_used_bytes || 0)}
              storageLimitBytes={creativeProfile?.storage_limit_bytes || 0}
              onStorageExceededChange={setStorageExceeded}
              onManageStorage={onManageStorage}
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
            startIcon={isFinalizing || isUploading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Send />}
            onClick={handleFinalizeService}
            disabled={isFinalizing || isUploading || storageExceeded}
            sx={{
              backgroundColor: storageExceeded ? '#ef4444' : '#10b981',
              '&:hover': {
                backgroundColor: storageExceeded ? '#dc2626' : '#059669',
              },
              '&:disabled': {
                backgroundColor: '#d1d5db',
                color: '#9ca3af',
              }
            }}
          >
            {isUploading ? uploadProgress || 'Uploading files...' : isFinalizing ? 'Finalizing...' : storageExceeded ? 'Storage Limit Exceeded' : 'Complete Finalization'}
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

      {/* ClamAV Scan Dialog */}
      <ClamAVScanDialog
        open={scanDialogOpen}
        onClose={handleScanDialogCancel}
        scanResponse={scanResponse}
        isScanning={isScanning}
        onContinue={handleScanDialogContinue}
        onCancel={handleScanDialogCancel}
      />
    </Dialog>
  );
}
