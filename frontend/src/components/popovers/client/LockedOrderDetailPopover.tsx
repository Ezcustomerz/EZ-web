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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { 
  DateRange, 
  AttachMoney, 
  Payment, 
  CalendarMonth, 
  CheckCircle, 
  Lock,
  LockOpen,
  Description,
  InsertDriveFile,
  VideoFile,
  AudioFile,
  Image,
  PictureAsPdf,
  AccountBalanceWallet,
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect, useMemo } from 'react';
import { ServicesDetailPopover, type ServiceDetail } from '../ServicesDetailPopover';
import { ServiceCardSimple } from '../../cards/creative/ServiceCard';
import { CreativeDetailPopover } from './CreativeDetailPopover';
import { StripePaymentDialog } from '../../dialogs/StripePaymentDialog';
import { CircularProgress } from '@mui/material';
import { bookingService } from '../../../api/bookingService';
import { BookingPaymentRequests } from '../../shared/BookingPaymentRequests';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export type LockedPaymentOption = 'split_payment' | 'payment_upfront' | 'payment_later' | 'free';

export interface LockedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  // No url - files are locked and not downloadable
}

export interface LockedOrderDetail {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  calendarDate: string | null;
  approvedDate: string | null;
  completedDate: string | null;
  paymentOption: LockedPaymentOption;
  fileCount: number | null;
  fileSize: string | null;
  files?: LockedFile[]; // Locked files (names only, not downloadable)
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

export interface LockedOrderDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  order: LockedOrderDetail | null;
}

export function LockedOrderDetailPopover({ 
  open, 
  onClose, 
  order 
}: LockedOrderDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [creativeDetailOpen, setCreativeDetailOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  
  // Preserve files in local state
  const [preservedFiles, setPreservedFiles] = useState<LockedFile[]>(() => {
    return order?.files && Array.isArray(order.files) && order.files.length > 0 ? order.files : [];
  });

  // Fetch files when popover opens if they're not already present
  useEffect(() => {
    if (open && order && order.id && preservedFiles.length === 0 && (!order.files || order.files.length === 0)) {
      setIsLoadingFiles(true);
      const fetchFiles = async () => {
        try {
          const response = await bookingService.downloadDeliverablesBatch(order.id);
          
          if (response.files && response.files.length > 0) {
            const fetchedFiles: LockedFile[] = response.files.map(f => ({
              id: f.deliverable_id,
              name: f.file_name,
              type: 'file',
              size: 'N/A'
            }));
            setPreservedFiles(fetchedFiles);
          } else if (response.unavailable_files && response.unavailable_files.length > 0) {
            const unavailableFiles: LockedFile[] = response.unavailable_files.map(f => ({
              id: f.deliverable_id,
              name: f.file_name,
              type: 'file',
              size: 'N/A'
            }));
            setPreservedFiles(unavailableFiles);
          }
        } catch (error) {
          console.error('[LockedOrderDetailPopover] Failed to fetch files:', error);
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

  // Use preserved files if available, otherwise fall back to order files
  const displayFiles = useMemo(() => {
    if (preservedFiles.length > 0) {
      return preservedFiles;
    }
    if (order?.files && order.files.length > 0) {
      return order.files;
    }
    return [];
  }, [preservedFiles, order?.files]);

  if (!order) return null;

  const statusColor = '#9c27b0'; // Purple for locked

  const getPaymentOptionLabel = (option: LockedPaymentOption) => {
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

  const getPaymentOptionColor = (option: LockedPaymentOption) => {
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

  const handlePayNow = () => {
    // Open payment dialog
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    onClose();
    // Refresh the page or update the order status
    window.location.reload();
  };

  // Calculate payment amounts - similar to PaymentApprovalOrderDetailPopover
  // For locked orders, the deposit is always already paid (it's the second payment)
  const depositAmount = order.depositAmount || (order.paymentOption === 'split_payment' ? Math.round(order.price * 0.5 * 100) / 100 : 0);
  const remainingAmount = order.remainingAmount || (order.paymentOption === 'split_payment' ? Math.round((order.price - depositAmount) * 100) / 100 : 0);
  const amountPaid = typeof order.amountPaid === 'number' ? order.amountPaid : (parseFloat(String(order.amountPaid || 0)) || 0);
  
  // Locked orders are always the second payment (deposit already paid)
  // So for split payment, show remaining amount; for payment_later, show full price
  const amountDueNow = order.paymentOption === 'split_payment' 
    ? remainingAmount
    : order.price;

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('image')) return <Image sx={{ color: theme.palette.primary.main }} />;
    if (type.includes('video')) return <VideoFile sx={{ color: theme.palette.primary.main }} />;
    if (type.includes('audio')) return <AudioFile sx={{ color: theme.palette.primary.main }} />;
    if (type.includes('pdf')) return <PictureAsPdf sx={{ color: theme.palette.error.main }} />;
    return <InsertDriveFile sx={{ color: theme.palette.text.secondary }} />;
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

              {/* Completed Date */}
              {order.completedDate && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckCircle sx={{ fontSize: 20, color: theme.palette.success.main, mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
                      Completed On
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {new Date(order.completedDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                  </Box>
                </Box>
              )}

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

              {/* Payment Option */}
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

          {/* Locked Files Section */}
          {(displayFiles.length > 0 || isLoadingFiles) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                  Locked Files
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                  {order.fileCount || displayFiles.length} file{(order.fileCount || displayFiles.length) !== 1 ? 's' : ''} • {order.fileSize || 'N/A'}
                </Typography>
                <List sx={{ 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 2,
                  p: 0,
                }}>
                  {isLoadingFiles ? (
                    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Loading files...
                      </Typography>
                    </Box>
                  ) : displayFiles.length > 0 ? (
                    displayFiles.map((file, index) => (
                      <ListItem
                        key={file.id}
                        sx={{
                          borderBottom: index < displayFiles.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                          opacity: 0.7,
                          cursor: 'not-allowed',
                        }}
                      >
                        <ListItemIcon>
                          <Box sx={{ position: 'relative' }}>
                            {getFileIcon(file.type)}
                            <Lock 
                              sx={{ 
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                fontSize: 14,
                                color: statusColor,
                              }} 
                            />
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {file.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {file.type} • {file.size} • Locked
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No files available
                      </Typography>
                    </Box>
                  )}
                </List>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, fontStyle: 'italic' }}>
                  Files will be unlocked after payment is completed
                </Typography>
              </Box>
            </>
          )}

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
                {order.description}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', ml: 2.5 }}>
              {order.paymentOption === 'payment_later' 
                ? 'This order is awaiting your payment. The service has been completed, and files are ready. Please complete the payment to unlock and download your files.'
                : order.paymentOption === 'split_payment'
                ? 'This order is awaiting your final payment. The service has been completed, and files are ready. Please complete the remaining payment to unlock and download your files.'
                : 'This order is awaiting payment. Please complete the payment to proceed with your service.'
              }
            </Typography>
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
                  {order.paymentOption === 'split_payment'
                    ? 'Deposit has been paid. Complete your payment with the remaining balance.'
                    : order.paymentOption === 'payment_later'
                    ? 'Full payment is required to unlock and download your files.'
                    : 'Full payment is required to unlock and download your files.'
                  }
                </Typography>
              </Box>
            </Box>

            {/* Payment Breakdown */}
            <Box 
              sx={{ 
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.05)',
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
                  {/* Second Payment - Show what was paid and what's due (locked orders are always second payment) */}
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
              ) : (
                /* Payment Later or Upfront */
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

          {/* Payment Requests Section */}
          <BookingPaymentRequests bookingId={order.id} isClient={true} />
        </Box>
        {/* End of scrollable content */}

        {/* Sticky Pay Now Button */}
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
          }}
        >
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handlePayNow}
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              bgcolor: statusColor,
              borderRadius: 2,
              boxShadow: `0 4px 14px ${statusColor}40`,
              transition: 'all 0.2s ease',
              '& .lock-icon': {
                display: 'inline-flex',
                transition: 'opacity 0.2s ease-in-out',
              },
              '& .lock-closed': {
                opacity: 1,
              },
              '& .lock-open': {
                opacity: 0,
                position: 'absolute',
                left: 0,
              },
              '&:hover': {
                bgcolor: statusColor,
                filter: 'brightness(1.1)',
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${statusColor}50`,
                '& .lock-closed': {
                  opacity: 0,
                },
                '& .lock-open': {
                  opacity: 1,
                },
              },
            }}
          >
            <Box sx={{ display: 'inline-flex', mr: 1, position: 'relative', alignItems: 'center' }}>
              <Lock className="lock-icon lock-closed" sx={{ fontSize: 20 }} />
              <LockOpen className="lock-icon lock-open" sx={{ fontSize: 20 }} />
            </Box>
            Unlock Files & Pay ${amountDueNow.toFixed(2)}
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

