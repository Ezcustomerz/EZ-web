import { useMemo, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  Tooltip,
  Button,
  TextField,
  InputAdornment,
  Stack,
  IconButton,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { ArrowDropUp, ArrowDropDown, SwapVert, Search as SearchIcon, Payment as PaymentIcon, ReceiptLong, FilterList as FilterIcon, Check, Close, Done as DoneIcon } from '@mui/icons-material';
import Card from '@mui/material/Card';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import { 
  PendingApprovalRow, 
  AwaitingPaymentRow, 
  InProgressRow, 
  CompleteRow, 
  CanceledRow 
} from './rows';
import { getUserTimezone } from '../../utils/timezoneUtils';
import { PendingApprovalPopover, type PendingApprovalOrder } from '../popovers/creative/PendingApprovalPopover';
import { AwaitingPaymentPopover, type AwaitingPaymentOrder } from '../popovers/creative/AwaitingPaymentPopover';
import { InProgressPopover, type InProgressOrder } from '../popovers/creative/InProgressPopover';
import { CompletePopover, type CompleteOrder } from '../popovers/creative/CompletePopover';
import { CancelledPopover, type CancelledOrder } from '../popovers/creative/CancelledPopover';
import { bookingService } from '../../api/bookingService';
import { ConfirmActionDialog, type ActionType } from '../dialogs/ConfirmActionDialog';
import { StripeAccountRequiredDialog } from '../dialogs/StripeAccountRequiredDialog';
import { CreativeSettingsPopover } from '../popovers/creative/CreativeSettingsPopover';
import { userService } from '../../api/userService';
import { successToast, errorToast } from '../toast/toast';


type SortField = 'client' | 'service' | 'amount' | 'date' | 'bookingDate' | undefined;
type SortDirection = 'asc' | 'desc' | undefined;

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatBookingDate(bookingDateStr: string | null) {
  if (!bookingDateStr) return 'Not scheduled';
  
  try {
    const date = new Date(bookingDateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid booking date string:', bookingDateStr);
      return 'Not scheduled';
    }
    
    // Use user's timezone for display
    const userTimezone = getUserTimezone();
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone
    });
  } catch (error) {
    console.warn('Error formatting booking date:', bookingDateStr, error);
    return 'Not scheduled';
  }
}

export function RequestsTable({ 
  requests = [], 
  context = 'requests',
  onRefresh
}: { 
  requests?: any[];
  context?: 'orders' | 'payments' | 'requests';
  onRefresh?: () => Promise<void> | void;
}) {
  const theme = useTheme();
  
  // Helper function to get context-appropriate text
  const getContextText = (type: 'search' | 'count' | 'empty') => {
    const textMap = {
      orders: {
        search: 'Search Orders...',
        count: 'Order',
        empty: 'No orders Found'
      },
      payments: {
        search: 'Search Payments...',
        count: 'Payment',
        empty: 'No payments Found'
      },
      requests: {
        search: 'Search Requests...',
        count: 'Request',
        empty: 'No requests Found'
      }
    };
    return textMap[context][type];
  };
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hoveredSort, setHoveredSort] = useState<SortField | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Popover state
  const [pendingApprovalPopoverOpen, setPendingApprovalPopoverOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingApprovalOrder | null>(null);
  const [awaitingPaymentPopoverOpen, setAwaitingPaymentPopoverOpen] = useState(false);
  const [selectedAwaitingPaymentOrder, setSelectedAwaitingPaymentOrder] = useState<AwaitingPaymentOrder | null>(null);
  const [inProgressPopoverOpen, setInProgressPopoverOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const [uploadingOrderTitle, setUploadingOrderTitle] = useState<string>('');
  const [selectedInProgressOrder, setSelectedInProgressOrder] = useState<InProgressOrder | null>(null);
  const [completePopoverOpen, setCompletePopoverOpen] = useState(false);
  const [selectedCompleteOrder, setSelectedCompleteOrder] = useState<CompleteOrder | null>(null);
  const [cancelledPopoverOpen, setCancelledPopoverOpen] = useState(false);
  const [selectedCancelledOrder, setSelectedCancelledOrder] = useState<CancelledOrder | null>(null);
  const [showFinalizationStep, setShowFinalizationStep] = useState(false);
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ActionType>('approve');
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeAccountRequiredOpen, setStripeAccountRequiredOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingApprovalOrderId, setPendingApprovalOrderId] = useState<string | null>(null);
  const [pendingApprovalOrderAmount, setPendingApprovalOrderAmount] = useState<number | undefined>(undefined);
  const [isCheckingBankAccount, setIsCheckingBankAccount] = useState(false);
  const [checkingBankAccountOrderId, setCheckingBankAccountOrderId] = useState<string | null>(null);

  // Popover handlers
  const handleOpenPendingApprovalPopover = (order: any) => {
    const pendingOrder: PendingApprovalOrder = {
      id: order.id,
      client: order.client,
      service: {
        id: order.service.id || 'service-1',
        title: order.service.title,
        description: order.service.description || 'Service description not available',
        price: order.amount,
        delivery_time: order.service.delivery_time || '3-5 days',
        color: order.service.color || '#667eea',
        payment_option: order.service.payment_option || 'later',
        photos: order.service.photos || []
      },
      amount: order.amount,
      status: order.status,
      date: order.date,
      bookingDate: order.bookingDate,
      description: order.description,
      clientEmail: order.clientEmail,
      clientPhone: order.clientPhone,
      specialRequirements: order.specialRequirements
    };
    setSelectedOrder(pendingOrder);
    setPendingApprovalPopoverOpen(true);
  };

  const handleClosePendingApprovalPopover = () => {
    setPendingApprovalPopoverOpen(false);
    setSelectedOrder(null);
  };

  const handleOpenAwaitingPaymentPopover = (order: any) => {
    const awaitingPaymentOrder: AwaitingPaymentOrder = {
      id: order.id,
      client: order.client,
      service: {
        id: order.service.id || 'service-1',
        title: order.service.title,
        description: order.service.description || 'Service description not available',
        price: order.amount,
        delivery_time: order.service.delivery_time || '3-5 days',
        color: order.service.color || '#667eea',
        payment_option: order.service.payment_option || 'later',
        photos: order.service.photos || []
      },
      amount: order.amount,
      status: order.status,
      date: order.date,
      bookingDate: order.bookingDate,
      amountPaid: order.amountPaid || 0,
      amountRemaining: order.amountRemaining || order.amount,
      depositPaid: order.depositPaid || false,
      description: order.description,
      clientEmail: order.clientEmail,
      clientPhone: order.clientPhone,
      specialRequirements: order.specialRequirements
    };
    setSelectedAwaitingPaymentOrder(awaitingPaymentOrder);
    setAwaitingPaymentPopoverOpen(true);
  };

  const handleCloseAwaitingPaymentPopover = () => {
    setAwaitingPaymentPopoverOpen(false);
    setSelectedAwaitingPaymentOrder(null);
  };

  const handleOpenInProgressPopover = (order: any) => {
    const inProgressOrder: InProgressOrder = {
      id: order.id,
      client: order.client,
      service: {
        id: order.service.id || 'service-1',
        title: order.service.title,
        description: order.service.description || 'Service description not available',
        price: order.amount,
        delivery_time: order.service.delivery_time || '3-5 days',
        color: order.service.color || '#667eea',
        payment_option: order.service.payment_option || 'later',
        photos: order.service.photos || []
      },
      amount: order.amount,
      status: order.status,
      date: order.date,
      bookingDate: order.bookingDate,
      description: order.description,
      clientEmail: order.clientEmail,
      clientPhone: order.clientPhone,
      specialRequirements: order.specialRequirements,
      deliverables: order.deliverables,
      notes: order.notes
    };
    setSelectedInProgressOrder(inProgressOrder);
    setInProgressPopoverOpen(true);
  };

  const handleCloseInProgressPopover = () => {
    setInProgressPopoverOpen(false);
    setSelectedInProgressOrder(null);
    setShowFinalizationStep(false);
  };

  const handleOpenCompletePopover = (order: any) => {
    const completeOrder: CompleteOrder = {
      id: order.id,
      client: order.client,
      service: {
        id: order.service.id || 'service-1',
        title: order.service.title,
        description: order.service.description,
        price: order.service.price,
        delivery_time: order.service.delivery_time,
        color: order.service.color,
        payment_option: order.service.payment_option || 'upfront',
        photos: order.service.photos || []
      },
      amount: order.amount,
      status: order.status,
      date: order.date,
      completedDate: order.completedDate || order.date,
      bookingDate: order.bookingDate,
      amountPaid: order.amountPaid,
      amountRemaining: order.amountRemaining,
      depositPaid: order.depositPaid,
      rating: order.rating,
      review: order.review,
      deliverables: order.deliverables,
      completionNotes: order.completionNotes,
      receiptPdf: order.receiptPdf,
      serviceSummaryPdf: order.serviceSummaryPdf,
      description: order.description,
      clientEmail: order.clientEmail,
      clientPhone: order.clientPhone,
      specialRequirements: order.specialRequirements,
      notes: order.notes
    };
    setSelectedCompleteOrder(completeOrder);
    setCompletePopoverOpen(true);
  };

  const handleCloseCompletePopover = () => {
    setCompletePopoverOpen(false);
    setSelectedCompleteOrder(null);
  };

  const handleOpenCancelledPopover = (order: any) => {
    const cancelledOrder: CancelledOrder = {
      id: order.id,
      client: order.client,
      service: {
        id: order.service.id || 'service-1',
        title: order.service.title,
        description: order.service.description || 'Service description not available',
        price: order.amount,
        delivery_time: order.service.delivery_time || '3-5 days',
        color: order.service.color || '#667eea',
        payment_option: order.service.payment_option || 'later',
        photos: order.service.photos || []
      },
      amount: order.amount,
      status: order.status,
      date: order.date,
      bookingDate: order.bookingDate,
      cancelledDate: order.cancelledDate || order.date,
      cancelledBy: order.cancelledBy || 'system',
      cancellationReason: order.cancellationReason,
      description: order.description,
      clientEmail: order.clientEmail,
      clientPhone: order.clientPhone,
      specialRequirements: order.specialRequirements
    };
    setSelectedCancelledOrder(cancelledOrder);
    setCancelledPopoverOpen(true);
  };

  const handleCloseCancelledPopover = () => {
    setCancelledPopoverOpen(false);
    setSelectedCancelledOrder(null);
  };

  // Approval handlers - check Stripe account first, then open confirmation dialog
  const handleApprove = async (orderId: string) => {
    // Find the order to check if payment is required
    const order = requests.find(req => req.id === orderId);
    if (!order) {
      errorToast('Order not found', 'Unable to find the order. Please try again.');
      return;
    }

    const price = order.amount || 0;
    
    // Check if payment is required - any paid service (price > 0) requires Stripe account
    // Payment option only determines WHEN payment happens, not IF payment is required
    const requiresPayment = price > 0;
    
    if (requiresPayment) {
      // Show loading state while checking bank account
      setIsCheckingBankAccount(true);
      setCheckingBankAccountOrderId(orderId);
      
      // Check if Stripe account is connected
      try {
        const stripeStatus = await userService.getStripeAccountStatus();
        
        // Clear loading state
        setIsCheckingBankAccount(false);
        setCheckingBankAccountOrderId(null);
        
        if (!stripeStatus.connected || !stripeStatus.payouts_enabled) {
          // Account not connected or payouts not enabled - show dialog
          setPendingApprovalOrderId(orderId);
          setPendingApprovalOrderAmount(price);
          setStripeAccountRequiredOpen(true);
          return;
        }
      } catch (error) {
        console.error('Failed to check Stripe account status:', error);
        // Clear loading state
        setIsCheckingBankAccount(false);
        setCheckingBankAccountOrderId(null);
        // If check fails, still show the requirement dialog to be safe
        setPendingApprovalOrderId(orderId);
        setPendingApprovalOrderAmount(price);
        setStripeAccountRequiredOpen(true);
        return;
      }
    }
    
    // If no payment required or account is connected, proceed with normal approval
    setConfirmActionType('approve');
    setConfirmOrderId(orderId);
    setConfirmDialogOpen(true);
  };

  const handleReject = (orderId: string) => {
    setConfirmActionType('reject');
    setConfirmOrderId(orderId);
    setConfirmDialogOpen(true);
  };

  // Confirmation dialog handlers
  const handleCloseConfirmDialog = () => {
    if (!isProcessing) {
      setConfirmDialogOpen(false);
      setConfirmOrderId(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmOrderId) return;

    setIsProcessing(true);
    try {
      if (confirmActionType === 'approve') {
        console.log('Approving order:', confirmOrderId);
        const response = await bookingService.approveOrder(confirmOrderId);
        
        // Close the popover
        handleClosePendingApprovalPopover();
        
        // Show success toast
        successToast('Order approved', response.message || 'The order has been approved successfully.');
        
        // Refresh orders data instead of reloading the page
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        // Reject action
        console.log('Rejecting order:', confirmOrderId);
        const response = await bookingService.rejectOrder(confirmOrderId);
        
        // Close the popover
        handleClosePendingApprovalPopover();
        
        // Show success toast
        successToast('Order rejected', response.message || 'The order has been rejected successfully.');
        
        // Refresh orders data instead of reloading the page
        if (onRefresh) {
          await onRefresh();
        }
      }
      
      // Close confirmation dialog
      setConfirmDialogOpen(false);
      setConfirmOrderId(null);
    } catch (error: any) {
      console.error(`Failed to ${confirmActionType} order:`, error);
      const errorMessage = error.response?.data?.detail || error.message || `Failed to ${confirmActionType} order. Please try again.`;
      errorToast(`Failed to ${confirmActionType} order`, errorMessage);
      handleClosePendingApprovalPopover();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = (orderId: string) => {
    console.log('Completing order:', orderId);
    // Find the order data
    const order = requests.find(req => req.id === orderId);
    if (order) {
      const inProgressOrder: InProgressOrder = {
        id: order.id,
        client: order.client,
        service: {
          id: order.service.id || 'service-1',
          title: order.service.title,
          description: order.service.description,
          price: order.service.price,
          delivery_time: order.service.delivery_time,
          color: order.service.color,
          payment_option: order.service.payment_option || 'upfront',
          photos: order.service.photos || []
        },
        amount: order.amount,
        status: order.status,
        date: order.date,
        bookingDate: order.bookingDate,
        amountPaid: order.amountPaid,
        amountRemaining: order.amountRemaining,
        depositPaid: order.depositPaid,
        description: order.description,
        clientEmail: order.clientEmail,
        clientPhone: order.clientPhone,
        specialRequirements: order.specialRequirements,
        deliverables: order.deliverables,
        notes: order.notes
      };
      setSelectedInProgressOrder(inProgressOrder);
      setShowFinalizationStep(true);
      setInProgressPopoverOpen(true);
    }
  };

  // Awaiting payment handlers
  const handleSendReminder = (orderId: string) => {
    console.log('Sending payment reminder for order:', orderId);
    // TODO: Implement reminder logic - send email/SMS to client
    handleCloseAwaitingPaymentPopover();
  };

  // In Progress handlers
  const handleFinalizeService = async (orderId: string, files: any[]): Promise<void> => {
    try {
      // Set upload state - persist even if popover is closed
      setIsUploading(true);
      setUploadingOrderId(orderId);
      const order = selectedInProgressOrder;
      setUploadingOrderTitle(order?.service?.title || 'Service');
      setUploadProgress('Preparing files for upload...');
      
      // Convert blob URLs to File objects and batch upload
      const fileObjects: File[] = [];
      for (const file of files) {
        try {
          // Convert blob URL to File object
          const response = await fetch(file.url);
          const blob = await response.blob();
          const fileObj = new File([blob], file.name, { type: file.type });
          fileObjects.push(fileObj);
        } catch (error) {
          console.error(`Error converting file ${file.name}:`, error);
          throw new Error(`Failed to prepare ${file.name} for upload. Please try again.`);
        }
      }
      
      // Batch upload all files at once
      let uploadedFiles: any[] = [];
      if (fileObjects.length > 0) {
        setUploadProgress(`Uploading ${fileObjects.length} file${fileObjects.length > 1 ? 's' : ''}...`);
        const uploadResult = await bookingService.uploadDeliverables(orderId, fileObjects);
        uploadedFiles = uploadResult.files.map(f => ({
          url: f.file_url, // This is the storage path
          name: f.file_name,
          size: f.file_size,
          type: f.file_type
        }));
      }
      
      // Now finalize with uploaded file metadata
      setUploadProgress('Finalizing service...');
      await bookingService.finalizeService(orderId, uploadedFiles);
      
      // Refresh the requests list
      if (onRefresh) {
        await onRefresh();
      }
      
      // Clear upload state
      setIsUploading(false);
      setUploadProgress('');
      setUploadingOrderId(null);
      setUploadingOrderTitle('');
      
      handleCloseInProgressPopover();
    } catch (error) {
      console.error('Error finalizing service:', error);
      setIsUploading(false);
      setUploadProgress('');
      setUploadingOrderId(null);
      setUploadingOrderTitle('');
      // TODO: Show error notification to user
      throw error;
    }
  };

  const handleUploadProgress = (progress: string) => {
    setUploadProgress(progress);
  };

  // Complete handlers
  const handleDownloadReceipt = (orderId: string) => {
    console.log('Downloading receipt for order:', orderId);
    // TODO: Implement receipt download logic
  };

  const handleDownloadSummary = (orderId: string) => {
    console.log('Downloading service summary for order:', orderId);
    // TODO: Implement service summary download logic
  };



  const filteredrequests = useMemo(() => {
    let data = filter === 'All' ? requests : requests.filter((inv) => inv.status === filter);
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(inv =>
        inv.client.toLowerCase().includes(lower) ||
        inv.service.title.toLowerCase().includes(lower)
      );
    }
    if (!sortField || !sortDirection) return data;
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      switch (sortField) {
        case 'client':
          aValue = a.client.toLowerCase();
          bValue = b.client.toLowerCase();
          break;
        case 'service':
          aValue = a.service.title.toLowerCase();
          bValue = b.service.title.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'bookingDate':
          aValue = a.bookingDate ? new Date(a.bookingDate).getTime() : 0;
          bValue = b.bookingDate ? new Date(b.bookingDate).getTime() : 0;
          break;
        default:
          return 0;
      }
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filter, sortField, sortDirection, searchTerm, requests]);

  // Table is now fully scrollable, no pagination

  function handleSort(field: Exclude<SortField, undefined>) {
    if (sortField === field) {
      // Cycle: asc -> desc -> undefined
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(undefined);
        setSortDirection(undefined);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function getSortTooltip(field: SortField) {
    if (sortField !== field) {
      return 'Click to sort ascending';
    } else if (sortDirection === 'asc') {
      return 'Click to sort descending';
    } else {
      return 'Click to clear sorting';
    }
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) {
      return (
        <SwapVert sx={{ fontSize: 18, ml: 0.5, color: 'text.disabled', opacity: 0.4, transition: 'all 0.2s ease' }} />
      );
    } else if (sortDirection === 'asc') {
      return (
        <ArrowDropUp sx={{ fontSize: 20, ml: 0.5, color: 'primary.main', transition: 'all 0.2s ease' }} />
      );
    } else {
      return (
        <ArrowDropDown sx={{ fontSize: 20, ml: 0.5, color: 'primary.main', transition: 'all 0.2s ease' }} />
      );
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { md: '100%' },
        minHeight: { md: 0 },
      }}
    >
      {/* --- MOBILE ONLY --- */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {/* Sticky Controls */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: '#fff',
            boxShadow: 0,
            pb: 1,
          }}
        >
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                placeholder={getContextText('search')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', ml: 1, minWidth: 80 }}>
                {filteredrequests.length} {getContextText('count')}{filteredrequests.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <FormControl
                size="small"
                sx={{
                  minWidth: 110,
                  width: 'auto',
                  flex: 1,
                }}
              >
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  label="Status Filter"
                  startAdornment={<FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 1,
                        mt: 1,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        '& .MuiMenuItem-root': {
                          py: 1,
                          px: 2,
                          borderRadius: 0,
                          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            transform: 'translateX(4px)',
                            fontWeight: 600,
                            color: 'primary.main',
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'transparent',
                            fontWeight: 600,
                            color: 'text.primary',
                          },
                          '&.Mui-selected:hover': {
                            backgroundColor: 'transparent',
                            color: 'primary.main',
                          },
                          '&.Mui-focusVisible': {
                            backgroundColor: 'transparent',
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="All" disableRipple>All</MenuItem>
                  <MenuItem value="Pending Approval" disableRipple>Pending Approval</MenuItem>
                  <MenuItem value="Awaiting Payment" disableRipple>Awaiting Payment</MenuItem>
                  <MenuItem value="In Progress" disableRipple>In Progress</MenuItem>
                  {context !== 'orders' && (
                    <>
                      <MenuItem value="Complete" disableRipple>Complete</MenuItem>
                      <MenuItem value="Canceled" disableRipple>Canceled</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<PaymentIcon sx={{ fontSize: 18 }} />}
                size="small"
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  borderRadius: 2,
                  px: 3,
                  height: '40px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                  transition: 'all 0.2s ease-in-out',
                  minWidth: 'auto',
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
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '20%',
                    left: '15%',
                    width: 4,
                    height: 4,
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '70%',
                    right: '20%',
                    width: 3,
                    height: 3,
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.5)',
                    '&::before': {
                      animation: 'sparkle 0.8s ease-in-out',
                    },
                    '&::after': {
                      animation: 'sparkle2 0.8s ease-in-out 0.1s',
                    },
                    '& .spark-element': {
                      '&:nth-of-type(1)': {
                        animation: 'sparkle3 0.8s ease-in-out 0.2s',
                      },
                      '&:nth-of-type(2)': {
                        animation: 'sparkle 0.8s ease-in-out 0.3s',
                      },
                    },
                  },
                }}
              >
                <Box
                  className="spark-element"
                  sx={{
                    position: 'absolute',
                    top: '10%',
                    right: '10%',
                    width: 2,
                    height: 2,
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  }}
                />
                <Box
                  className="spark-element"
                  sx={{
                    position: 'absolute',
                    bottom: '15%',
                    left: '25%',
                    width: 2,
                    height: 2,
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  }}
                />
                Payment
              </Button>
            </Box>
          </Stack>
        </Box>
        {/* Card List */}
        <Box sx={{ pt: 2 }}>
          {filteredrequests.length === 0 ? (
            <Box
              sx={{
                width: '100%',
                maxWidth: 600,
                mx: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 6, md: 8 },
                textAlign: 'center',
                minHeight: { xs: '350px', md: '400px' },
                position: 'relative',
                background: `radial-gradient(circle at center, ${theme.palette.info.main}08 0%, ${theme.palette.primary.main}05 40%, transparent 70%)`,
                borderRadius: 2,
                animation: 'fadeIn 0.6s ease-out 0.5s both',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(20px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `radial-gradient(ellipse at center, ${theme.palette.info.main}03 0%, transparent 50%)`,
                  borderRadius: 2,
                  pointerEvents: 'none',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: `radial-gradient(ellipse at center, ${theme.palette.primary.main}02 0%, transparent 60%)`,
                  borderRadius: 2,
                  zIndex: -1,
                  pointerEvents: 'none',
                },
                mt: { xs: 2, md: 4 },
              }}
            >
              <ReceiptLong
                sx={{
                  fontSize: { xs: 44, md: 52 },
                  color: theme.palette.info.main,
                  mb: { xs: 2, md: 3 },
                  opacity: 0.9,
                  position: 'relative',
                  zIndex: 1,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  fontWeight: 600,
                  color: theme.palette.info.main,
                  mb: 1.5,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {getContextText('empty')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.8rem', md: '0.875rem' },
                  color: theme.palette.info.main,
                  maxWidth: { xs: '280px', md: '320px' },
                  lineHeight: 1.6,
                  opacity: 0.8,
                  mb: 3,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Try adjusting your filters or request a payment.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PaymentIcon />}
                sx={{
                  borderColor: theme.palette.info.main,
                  color: theme.palette.info.main,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  px: 2.5,
                  height: '40px',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease-in-out',
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
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '20%',
                    left: '15%',
                    width: 4,
                    height: 4,
                    background: theme.palette.info.main,
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '70%',
                    right: '20%',
                    width: 3,
                    height: 3,
                    background: theme.palette.info.main,
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&:hover': {
                    borderColor: theme.palette.info.main,
                    backgroundColor: `${theme.palette.info.main}08`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${theme.palette.info.main}20`,
                    '&::before': {
                      animation: 'sparkle 0.8s ease-in-out',
                    },
                    '&::after': {
                      animation: 'sparkle2 0.8s ease-in-out 0.1s',
                    },
                    '& .spark-element': {
                      '&:nth-of-type(1)': {
                        animation: 'sparkle3 0.8s ease-in-out 0.2s',
                      },
                      '&:nth-of-type(2)': {
                        animation: 'sparkle 0.8s ease-in-out 0.3s',
                      },
                    },
                  },
                }}
                onClick={() => {/* TODO: handle request payment */ }}
              >
                <Box
                  className="spark-element"
                  sx={{
                    position: 'absolute',
                    top: '10%',
                    right: '10%',
                    width: 2,
                    height: 2,
                    background: theme.palette.info.main,
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  }}
                />
                <Box
                  className="spark-element"
                  sx={{
                    position: 'absolute',
                    bottom: '15%',
                    left: '25%',
                    width: 2,
                    height: 2,
                    background: theme.palette.info.main,
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  }}
                />
                Request Payment
              </Button>
            </Box>
          ) : (
            filteredrequests.map((inv) => (
              <Card
                key={inv.id}
                elevation={1}
                tabIndex={0}
                aria-label={`Request for ${inv.client}, ${inv.status}, ${formatCurrency(inv.amount)}, ${formatDate(inv.date)}`}
                onClick={inv.status === 'Pending Approval' ? (e) => {
                  // Don't open popover if clicking a button, icon button, or action buttons
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || 
                      target.closest('[role="button"]') ||
                      target.closest('[data-action-button]') ||
                      target.tagName === 'BUTTON' ||
                      target.closest('svg')?.closest('button')) {
                    return;
                  }
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenPendingApprovalPopover(inv);
                } : inv.status === 'Awaiting Payment' ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenAwaitingPaymentPopover(inv);
                } : inv.status === 'In Progress' ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenInProgressPopover(inv);
                } : inv.status === 'Complete' ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenCompletePopover(inv);
                } : inv.status === 'Canceled' ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenCancelledPopover(inv);
                } : undefined}
                sx={{
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  cursor: (inv.status === 'Pending Approval' || inv.status === 'Awaiting Payment' || inv.status === 'In Progress' || inv.status === 'Complete' || inv.status === 'Canceled') ? 'pointer' : 'default',
                  position: 'relative',
                  transition: 'box-shadow 0.2s, border 0.2s',
                  '&:hover, &:focus': {
                    boxShadow: (inv.status === 'Pending Approval' || inv.status === 'Awaiting Payment' || inv.status === 'In Progress' || inv.status === 'Complete' || inv.status === 'Canceled') ? 4 : 1,
                    border: (inv.status === 'Pending Approval' || inv.status === 'Awaiting Payment' || inv.status === 'In Progress' || inv.status === 'Complete' || inv.status === 'Canceled') ? '1.5px solid' : 'none',
                    borderColor: inv.status === 'Pending Approval' ? 'primary.main' : inv.status === 'Awaiting Payment' ? '#3b82f6' : inv.status === 'In Progress' ? '#8b5cf6' : inv.status === 'Complete' ? '#10b981' : inv.status === 'Canceled' ? '#ef4444' : 'transparent',
                    backgroundColor: inv.status === 'Pending Approval' ? 'rgba(245, 158, 11, 0.04)' : inv.status === 'Awaiting Payment' ? 'rgba(59, 130, 246, 0.04)' : inv.status === 'In Progress' ? 'rgba(139, 92, 246, 0.04)' : inv.status === 'Complete' ? 'rgba(16, 185, 129, 0.04)' : inv.status === 'Canceled' ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                    outline: 'none',
                  },
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={600}>{inv.client}</Typography>
                    {inv.status === 'Pending Approval' && (
                      <Box onClick={(e) => e.stopPropagation()}>
                        <PendingApprovalRow 
                          status={inv.status} 
                          onApprove={handleApprove} 
                          onReject={handleReject} 
                          orderId={inv.id} 
                          isMobile={true}
                          showActions={true}
                        />
                      </Box>
                    )}
                    {inv.status === 'Awaiting Payment' && (
                      <AwaitingPaymentRow 
                        status={inv.status} 
                        isMobile={true} 
                      />
                    )}
                    {inv.status === 'In Progress' && (
                      <InProgressRow 
                        status={inv.status} 
                        onComplete={handleComplete} 
                        orderId={inv.id} 
                        isMobile={true} 
                      />
                    )}
                    {inv.status === 'Complete' && (
                      <CompleteRow 
                        status={inv.status} 
                        isMobile={true} 
                      />
                    )}
                    {inv.status === 'Canceled' && (
                      <CanceledRow 
                        status={inv.status} 
                        isMobile={true} 
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95em', mb: 0.5 }}>{inv.service.title}</Typography>
                  {inv.bookingDate && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <EventIcon fontSize="small" color="primary" />
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                        {formatBookingDate(inv.bookingDate)}
                      </Typography>
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AttachMoneyIcon fontSize="small" color="action" />
                    <Typography variant="body2"><strong>{formatCurrency(inv.amount)}</strong></Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EventIcon fontSize="small" color="action" />
                    <Typography variant="body2">{formatDate(inv.date)}</Typography>
                  </Stack>
                </Stack>
              </Card>
            ))
          )}
        </Box>
      </Box>
      {/* --- DESKTOP ONLY --- */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', height: '100%' }}>
        {/* Controls: Search, Filter, Request Payment */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0,
            pb: 1,
            flexDirection: 'row',
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              placeholder={getContextText('search')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 280,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                },
              }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', ml: 1, minWidth: 80 }}>
              {filteredrequests.length} {getContextText('count')}{filteredrequests.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: 'auto' }}>
            <FormControl
              size="small"
              sx={{
                minWidth: 120,
                width: 'auto',
                flex: 'none',
              }}
            >
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label="Status Filter"
                startAdornment={<FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                sx={{
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: 1,
                      mt: 1,
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      '& .MuiMenuItem-root': {
                        py: 1,
                        px: 2,
                        borderRadius: 0,
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          transform: 'translateX(4px)',
                          fontWeight: 600,
                          color: 'primary.main',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'transparent',
                          fontWeight: 600,
                          color: 'text.primary',
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: 'transparent',
                          color: 'primary.main',
                        },
                        '&.Mui-focusVisible': {
                          backgroundColor: 'transparent',
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="All" disableRipple>All</MenuItem>
                <MenuItem value="Pending Approval" disableRipple>Pending Approval</MenuItem>
                <MenuItem value="Awaiting Payment" disableRipple>Awaiting Payment</MenuItem>
                <MenuItem value="In Progress" disableRipple>In Progress</MenuItem>
                {context !== 'orders' && (
                  <>
                    <MenuItem value="Complete" disableRipple>Complete</MenuItem>
                    <MenuItem value="Canceled" disableRipple>Canceled</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<PaymentIcon sx={{ fontSize: 18 }} />}
              size="small"
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: 2,
                px: 3,
                height: '40px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                transition: 'all 0.2s ease-in-out',
                minWidth: 'auto',
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
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '20%',
                  left: '15%',
                  width: 4,
                  height: 4,
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '70%',
                  right: '20%',
                  width: 3,
                  height: 3,
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                },
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.5)',
                  '&::before': {
                    animation: 'sparkle 0.8s ease-in-out',
                  },
                  '&::after': {
                    animation: 'sparkle2 0.8s ease-in-out 0.1s',
                  },
                  '& .spark-element': {
                    '&:nth-of-type(1)': {
                      animation: 'sparkle3 0.8s ease-in-out 0.2s',
                    },
                    '&:nth-of-type(2)': {
                      animation: 'sparkle 0.8s ease-in-out 0.3s',
                    },
                  },
                },
              }}
            >
              <Box
                className="spark-element"
                sx={{
                  position: 'absolute',
                  top: '10%',
                  right: '10%',
                  width: 2,
                  height: 2,
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                }}
              />
              <Box
                className="spark-element"
                sx={{
                  position: 'absolute',
                  bottom: '15%',
                  left: '25%',
                  width: 2,
                  height: 2,
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                }}
              />
              Payment
            </Button>
          </Box>
        </Box>
        {/* Table and rest of desktop content... */}
        <TableContainer
          sx={{
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            width: '100%',
            p: 0,
            overflow: filteredrequests.length > 0 ? 'auto' : 'visible',
            flex: '1 1 0',
            minHeight: 0,
          }}
        >
          {/* Desktop Table */}
          <Table
            sx={{
              minWidth: 0,
              width: '100%',
              tableLayout: 'fixed',
              display: { xs: 'none', md: 'table' },
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e6f3fa' }}>
                <TableCell
                  onClick={() => handleSort('client')}
                  onMouseEnter={() => setHoveredSort('client')}
                  onMouseLeave={() => setHoveredSort(null)}
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortField === 'client' ? 'primary.main' : 'text.primary',
                    fontWeight: sortField === 'client' ? 700 : 600,
                    transition: 'all 0.2s ease',
                    minWidth: { xs: 160, sm: 'auto' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                      '& .MuiSvgIcon-root': {
                        opacity: 1,
                        color: 'primary.main',
                        transform: 'scale(1.15)',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Client
                    <Tooltip title={getSortTooltip('client')} arrow placement="top" open={hoveredSort === 'client'}>
                      <span>{getSortIcon('client')}</span>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    minWidth: { xs: 140, sm: 'auto' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                  }}
                >
                  Service
                </TableCell>
                <TableCell
                  onClick={() => handleSort('amount')}
                  onMouseEnter={() => setHoveredSort('amount')}
                  onMouseLeave={() => setHoveredSort(null)}
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortField === 'amount' ? 'primary.main' : 'text.primary',
                    fontWeight: sortField === 'amount' ? 700 : 600,
                    transition: 'all 0.2s ease',
                    minWidth: { xs: 120, sm: 'auto' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                      '& .MuiSvgIcon-root': {
                        opacity: 1,
                        color: 'primary.main',
                        transform: 'scale(1.15)',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Amount
                    <Tooltip title={getSortTooltip('amount')} arrow placement="top" open={hoveredSort === 'amount'}>
                      <span>{getSortIcon('amount')}</span>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    minWidth: { xs: 100, sm: 'auto' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    minWidth: { xs: 120, sm: 'auto' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                    textAlign: 'center',
                  }}
                >
                  Actions
                </TableCell>
                <TableCell
                  onClick={() => handleSort('bookingDate')}
                  onMouseEnter={() => setHoveredSort('bookingDate')}
                  onMouseLeave={() => setHoveredSort(null)}
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortField === 'bookingDate' ? 'primary.main' : 'text.primary',
                    fontWeight: sortField === 'bookingDate' ? 700 : 600,
                    transition: 'all 0.2s ease',
                    minWidth: { xs: 140, sm: 'auto' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                      '& .MuiSvgIcon-root': {
                        opacity: 1,
                        color: 'primary.main',
                        transform: 'scale(1.15)',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Booking Date
                    <Tooltip title={getSortTooltip('bookingDate')} arrow placement="top" open={hoveredSort === 'bookingDate'}>
                      <span>{getSortIcon('bookingDate')}</span>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell
                  onClick={() => handleSort('date')}
                  onMouseEnter={() => setHoveredSort('date')}
                  onMouseLeave={() => setHoveredSort(null)}
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortField === 'date' ? 'primary.main' : 'text.primary',
                    fontWeight: sortField === 'date' ? 700 : 600,
                    transition: 'all 0.2s ease',
                    minWidth: { xs: 120, sm: 'auto' },
                    textAlign: 'right',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                      '& .MuiSvgIcon-root': {
                        opacity: 1,
                        color: 'primary.main',
                        transform: 'scale(1.15)',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    Date
                    <Tooltip title={getSortTooltip('date')} arrow placement="top" open={hoveredSort === 'date'}>
                      <span>{getSortIcon('date')}</span>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredrequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ border: 0, p: 0, height: '100%', verticalAlign: 'middle' }}>
                    <Box
                      sx={{
                        width: '100%',
                        maxWidth: 600,
                        mx: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: { xs: 6, md: 8 },
                        textAlign: 'center',
                        minHeight: { xs: '350px', md: '400px' },
                        position: 'relative',
                        background: `radial-gradient(circle at center, \
                          ${theme.palette.info.main}08 0%, \
                          ${theme.palette.primary.main}05 40%, \
                          transparent 70%)`,
                        borderRadius: 2,
                        animation: 'fadeIn 0.6s ease-out 0.5s both',
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateY(20px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `radial-gradient(ellipse at center, \
                            ${theme.palette.info.main}03 0%, \
                            transparent 50%)`,
                          borderRadius: 2,
                          pointerEvents: 'none',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          right: -2,
                          bottom: -2,
                          background: `radial-gradient(ellipse at center, \
                            ${theme.palette.primary.main}02 0%, \
                            transparent 60%)`,
                          borderRadius: 2,
                          zIndex: -1,
                          pointerEvents: 'none',
                        },
                        mt: { xs: 2, md: 4 },
                      }}
                    >
                      <ReceiptLong
                        sx={{
                          fontSize: { xs: 44, md: 52 },
                          color: theme.palette.info.main,
                          mb: { xs: 2, md: 3 },
                          opacity: 0.9,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: '1rem', md: '1.125rem' },
                          fontWeight: 600,
                          color: theme.palette.info.main,
                          mb: 1.5,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        {getContextText('empty')}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          color: theme.palette.info.main,
                          maxWidth: { xs: '280px', md: '320px' },
                          lineHeight: 1.6,
                          opacity: 0.8,
                          mb: 3,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        Try adjusting your filters or request a payment.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PaymentIcon />}
                        sx={{
                          borderColor: theme.palette.info.main,
                          color: theme.palette.info.main,
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          px: 2.5,
                          height: '40px',
                          borderRadius: 1.5,
                          textTransform: 'none',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease-in-out',
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
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '20%',
                            left: '15%',
                            width: 4,
                            height: 4,
                            background: theme.palette.info.main,
                            borderRadius: '50%',
                            transform: 'scale(0)',
                            opacity: 0,
                            transition: 'all 0.2s ease-in-out',
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: '70%',
                            right: '20%',
                            width: 3,
                            height: 3,
                            background: theme.palette.info.main,
                            borderRadius: '50%',
                            transform: 'scale(0)',
                            opacity: 0,
                            transition: 'all 0.2s ease-in-out',
                          },
                          '&:hover': {
                            borderColor: theme.palette.info.main,
                            backgroundColor: `${theme.palette.info.main}08`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${theme.palette.info.main}20`,
                            '&::before': {
                              animation: 'sparkle 0.8s ease-in-out',
                            },
                            '&::after': {
                              animation: 'sparkle2 0.8s ease-in-out 0.1s',
                            },
                            '& .spark-element': {
                              '&:nth-of-type(1)': {
                                animation: 'sparkle3 0.8s ease-in-out 0.2s',
                              },
                              '&:nth-of-type(2)': {
                                animation: 'sparkle 0.8s ease-in-out 0.3s',
                              },
                            },
                          },
                        }}
                        onClick={() => {/* TODO: handle request payment */ }}
                      >
                        <Box
                          className="spark-element"
                          sx={{
                            position: 'absolute',
                            top: '10%',
                            right: '10%',
                            width: 2,
                            height: 2,
                            background: theme.palette.info.main,
                            borderRadius: '50%',
                            transform: 'scale(0)',
                            opacity: 0,
                            transition: 'all 0.2s ease-in-out',
                          }}
                        />
                        <Box
                          className="spark-element"
                          sx={{
                            position: 'absolute',
                            bottom: '15%',
                            left: '25%',
                            width: 2,
                            height: 2,
                            background: theme.palette.info.main,
                            borderRadius: '50%',
                            transform: 'scale(0)',
                            opacity: 0,
                            transition: 'all 0.2s ease-in-out',
                          }}
                        />
                        Request Payment
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredrequests.map((inv: any) => (
                  <TableRow
                    key={inv.id}
                    hover
                    onClick={inv.status === 'Pending Approval' ? (e) => {
                      // Don't open popover if clicking a button, icon button, or action buttons
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || 
                          target.closest('[role="button"]') ||
                          target.closest('[data-action-button]') ||
                          target.tagName === 'BUTTON' ||
                          target.closest('svg')?.closest('button')) {
                        return;
                      }
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenPendingApprovalPopover(inv);
                    } : inv.status === 'Awaiting Payment' ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenAwaitingPaymentPopover(inv);
                    } : inv.status === 'In Progress' ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenInProgressPopover(inv);
                    } : inv.status === 'Complete' ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenCompletePopover(inv);
                    } : inv.status === 'Canceled' ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenCancelledPopover(inv);
                    } : undefined}
                    sx={{
                      transition: 'background 0.18s',
                      cursor: (inv.status === 'Pending Approval' || inv.status === 'Awaiting Payment' || inv.status === 'In Progress' || inv.status === 'Complete' || inv.status === 'Canceled') ? 'pointer' : 'default',
                      '&:hover': {
                        backgroundColor: inv.status === 'Pending Approval' ? 'rgba(245, 158, 11, 0.08)' : inv.status === 'Awaiting Payment' ? 'rgba(59, 130, 246, 0.08)' : inv.status === 'In Progress' ? 'rgba(139, 92, 246, 0.08)' : inv.status === 'Complete' ? 'rgba(16, 185, 129, 0.08)' : inv.status === 'Canceled' ? 'rgba(239, 68, 68, 0.08)' : 'grey.50',
                      },
                    }}
                  >
                    {/* Client */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{inv.client}</Typography>
                    </TableCell>
                    {/* Service */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{inv.service.title}</Typography>
                    </TableCell>
                    {/* Amount */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{formatCurrency(inv.amount)}</Typography>
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                      {inv.status === 'Pending Approval' && (
                        <Box onClick={(e) => e.stopPropagation()}>
                          <PendingApprovalRow 
                            status={inv.status} 
                            onApprove={handleApprove} 
                            onReject={handleReject} 
                            orderId={inv.id} 
                            isMobile={false}
                            showActions={false}
                          />
                        </Box>
                      )}
                      {inv.status === 'Awaiting Payment' && (
                        <AwaitingPaymentRow 
                          status={inv.status} 
                          isMobile={false} 
                        />
                      )}
                      {inv.status === 'In Progress' && (
                        <InProgressRow 
                          status={inv.status} 
                          onComplete={handleComplete} 
                          orderId={inv.id} 
                          isMobile={false} 
                        />
                      )}
                      {inv.status === 'Complete' && (
                        <CompleteRow 
                          status={inv.status} 
                          isMobile={false} 
                        />
                      )}
                      {inv.status === 'Canceled' && (
                        <CanceledRow 
                          status={inv.status} 
                          isMobile={false} 
                        />
                      )}
                    </TableCell>
                    {/* Actions */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      {inv.status === 'Pending Approval' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                          <Tooltip title="Accept Order" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleApprove(inv.id)}
                              sx={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                width: 36,
                                height: 36,
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: '-100%',
                                  width: '100%',
                                  height: '100%',
                                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                  transition: 'left 0.5s',
                                },
                                '&:hover': {
                                  backgroundColor: '#059669',
                                  transform: 'scale(1.1) translateY(-2px)',
                                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                                  '&::before': {
                                    left: '100%',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    transform: 'rotate(360deg) scale(1.2)',
                                    transition: 'transform 0.3s ease',
                                  }
                                },
                                '&:active': {
                                  transform: 'scale(0.95) translateY(0)',
                                  transition: 'transform 0.1s ease',
                                }
                              }}
                            >
                              <Check sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Order" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleReject(inv.id)}
                              sx={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                width: 36,
                                height: 36,
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: '-100%',
                                  width: '100%',
                                  height: '100%',
                                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                  transition: 'left 0.5s',
                                },
                                '&:hover': {
                                  backgroundColor: '#dc2626',
                                  transform: 'scale(1.1) translateY(-2px)',
                                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
                                  '&::before': {
                                    left: '100%',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    transform: 'rotate(180deg) scale(1.2)',
                                    transition: 'transform 0.3s ease',
                                  }
                                },
                                '&:active': {
                                  transform: 'scale(0.95) translateY(0)',
                                  transition: 'transform 0.1s ease',
                                }
                              }}
                            >
                              <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : inv.status === 'In Progress' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                          <Tooltip title="Complete Order" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleComplete(inv.id)}
                              sx={{
                                backgroundColor: '#8b5cf6',
                                color: 'white',
                                width: 90,
                                height: 36,
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                                borderRadius: '8px',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: '-100%',
                                  width: '100%',
                                  height: '100%',
                                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                  transition: 'left 0.5s',
                                },
                                '&:hover': {
                                  backgroundColor: '#7c3aed',
                                  transform: 'scale(1.05) translateY(-1px)',
                                  boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
                                  '&::before': {
                                    left: '100%',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    transform: 'scale(1.1)',
                                    transition: 'transform 0.3s ease',
                                  }
                                },
                                '&:active': {
                                  transform: 'scale(0.98) translateY(0)',
                                  transition: 'transform 0.1s ease',
                                }
                              }}
                            >
                              <DoneIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          No actions
                        </Typography>
                      )}
                    </TableCell>
                    {/* Booking Date */}
                    <TableCell>
                      <Typography sx={{ 
                        fontWeight: 500, 
                        color: inv.bookingDate ? 'text.primary' : 'text.secondary', 
                        fontSize: { xs: '0.85rem', md: '1rem' },
                        fontStyle: inv.bookingDate ? 'normal' : 'italic'
                      }}>
                        {formatBookingDate(inv.bookingDate)}
                      </Typography>
                    </TableCell>
                    {/* Date */}
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{formatDate(inv.date)}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* Pending Approval Popover */}
      <PendingApprovalPopover
        open={pendingApprovalPopoverOpen}
        onClose={handleClosePendingApprovalPopover}
        order={selectedOrder}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Awaiting Payment Popover */}
      <AwaitingPaymentPopover
        open={awaitingPaymentPopoverOpen}
        onClose={handleCloseAwaitingPaymentPopover}
        order={selectedAwaitingPaymentOrder}
        onSendReminder={handleSendReminder}
      />

      {/* In Progress Popover */}
      <InProgressPopover
        open={inProgressPopoverOpen}
        onClose={handleCloseInProgressPopover}
        order={selectedInProgressOrder}
        onFinalizeService={handleFinalizeService}
        showFinalizationStep={showFinalizationStep}
        onUploadProgress={handleUploadProgress}
      />

      {/* Bank Account Checking Loading Card */}
      {isCheckingBankAccount && checkingBankAccountOrderId && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1400,
            minWidth: 320,
            maxWidth: 400,
            boxShadow: theme.shadows[8],
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(59, 130, 246, 0.1)' 
                : 'rgba(59, 130, 246, 0.05)',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <CircularProgress size={24} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Checking Bank Account
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Verifying payment setup...
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, color: 'text.primary', fontWeight: 500 }}>
              Verifying your Stripe account connection
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Please wait while we check your payment account status. This usually takes just a moment.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Persistent Upload Progress Card */}
      {isUploading && uploadingOrderId && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1400,
            minWidth: 320,
            maxWidth: 400,
            boxShadow: theme.shadows[8],
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(59, 130, 246, 0.1)' 
                : 'rgba(59, 130, 246, 0.05)',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <CircularProgress size={24} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Uploading Deliverables
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {uploadingOrderTitle}
                </Typography>
              </Box>
            </Box>
            <LinearProgress sx={{ mt: 1 }} />
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, color: 'text.primary', fontWeight: 500 }}>
              {uploadProgress || 'Uploading files to server...'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Please wait while your files are being uploaded. You can continue working while this completes.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Complete Popover */}
      <CompletePopover
        open={completePopoverOpen}
        onClose={handleCloseCompletePopover}
        order={selectedCompleteOrder}
        onDownloadReceipt={handleDownloadReceipt}
        onDownloadSummary={handleDownloadSummary}
      />

      {/* Cancelled Popover */}
      <CancelledPopover
        open={cancelledPopoverOpen}
        onClose={handleCloseCancelledPopover}
        order={selectedCancelledOrder}
      />

      {/* Confirm Action Dialog */}
      <ConfirmActionDialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmAction}
        actionType={confirmActionType}
        isProcessing={isProcessing}
      />

      {/* Stripe Account Required Dialog */}
      <StripeAccountRequiredDialog
        open={stripeAccountRequiredOpen}
        onClose={() => {
          setStripeAccountRequiredOpen(false);
          setPendingApprovalOrderId(null);
          setPendingApprovalOrderAmount(undefined);
        }}
        onOpenSettings={() => {
          setSettingsOpen(true);
        }}
        orderAmount={pendingApprovalOrderAmount}
      />

      {/* Creative Settings Popover - opened from Stripe account required dialog */}
      <CreativeSettingsPopover
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          // After closing settings, check if account is now connected and retry approval
          if (pendingApprovalOrderId) {
            // Small delay to allow settings to close
            setTimeout(async () => {
              try {
                const stripeStatus = await userService.getStripeAccountStatus();
                if (stripeStatus.connected && stripeStatus.payouts_enabled) {
                  // Account is now connected, proceed with approval
                  setConfirmActionType('approve');
                  setConfirmOrderId(pendingApprovalOrderId);
                  setConfirmDialogOpen(true);
                  setPendingApprovalOrderId(null);
                  setPendingApprovalOrderAmount(undefined);
                }
              } catch (error) {
                console.error('Failed to check Stripe account status after settings close:', error);
              }
            }, 500);
          }
        }}
        initialSection="billing"
      />
    </Box>
  );
} 