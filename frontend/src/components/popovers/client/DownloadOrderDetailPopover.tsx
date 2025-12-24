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
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { 
  DateRange, 
  AttachMoney, 
  Payment, 
  CalendarMonth, 
  CheckCircle, 
  Download,
  Description,
  InsertDriveFile,
  VideoFile,
  AudioFile,
  Image,
  PictureAsPdf,
  Folder,
  ErrorOutline,
  Visibility,
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';
import { ServicesDetailPopover, type ServiceDetail } from '../ServicesDetailPopover';
import { ServiceCardSimple } from '../../cards/creative/ServiceCard';
import { CreativeDetailPopover } from './CreativeDetailPopover';
import { bookingService } from '../../../api/bookingService';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export type DownloadPaymentOption = 'split_payment' | 'payment_upfront' | 'payment_later' | 'free';

export interface DownloadFile {
  id: string;
  name: string;
  type: string;
  size: string;
  url?: string;
}

export interface DownloadOrderDetail {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  calendarDate: string | null;
  approvedDate: string | null;
  completedDate: string | null;
  paymentOption: DownloadPaymentOption;
  files: DownloadFile[];
  fileCount: number | null;
  fileSize: string | null;
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

export interface DownloadOrderDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  order: DownloadOrderDetail | null;
  onDownloadProgress?: (progress: string) => void;
  onDownloadStateChange?: (downloading: boolean) => void;
  onOrderStatusChanged?: () => void;
}

export function DownloadOrderDetailPopover({ 
  open, 
  onClose, 
  order,
  onDownloadProgress,
  onDownloadStateChange,
  onOrderStatusChanged
}: DownloadOrderDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [creativeDetailOpen, setCreativeDetailOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [downloadingFileIndex, setDownloadingFileIndex] = useState<number>(-1);

  if (!order) return null;

  const statusColor = '#9c27b0'; // Purple for download
  const invoices = order.invoices || [];

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <PictureAsPdf sx={{ color: '#f44336' }} />;
    if (type.includes('video') || type.includes('mp4') || type.includes('mov') || type.includes('avi')) return <VideoFile sx={{ color: '#2196f3' }} />;
    if (type.includes('audio') || type.includes('mp3') || type.includes('wav') || type.includes('flac')) return <AudioFile sx={{ color: '#4caf50' }} />;
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return <Image sx={{ color: '#ff9800' }} />;
    if (type.includes('text') || type.includes('txt')) return <Description sx={{ color: '#607d8b' }} />;
    return <InsertDriveFile sx={{ color: theme.palette.text.secondary }} />;
  };

  const isViewableFile = (fileType: string): boolean => {
    const type = fileType.toLowerCase();
    // Viewable file types: PDF, images
    return (
      type.includes('pdf') ||
      type.includes('image') ||
      type.includes('jpg') ||
      type.includes('jpeg') ||
      type.includes('png') ||
      type.includes('gif') ||
      type.includes('webp') ||
      type.includes('svg') ||
      type.includes('bmp')
    );
  };

  const handleViewFile = async (file: DownloadFile) => {
    try {
      // Get signed URL from backend
      const response = await bookingService.downloadDeliverable(file.id);
      
      // Open file in new tab for viewing
      window.open(response.signed_url, '_blank');
    } catch (error) {
      console.error('Failed to view file:', error);
      alert(`Failed to view ${file.name}. Please try again.`);
    }
  };

  const getPaymentOptionLabel = (option: DownloadPaymentOption) => {
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

  const getPaymentOptionColor = (option: DownloadPaymentOption) => {
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

  const handleDownloadFile = async (file: DownloadFile, index?: number) => {
    setIsDownloading(true);
    if (onDownloadStateChange) onDownloadStateChange(true);
    setDownloadProgress(`Preparing ${file.name}...`);
    if (onDownloadProgress) onDownloadProgress(`Preparing ${file.name}...`);
    if (index !== undefined) {
      setDownloadingFileIndex(index);
    }
    
    try {
      // Get signed URL from backend
      setDownloadProgress(`Getting download link for ${file.name}...`);
      if (onDownloadProgress) onDownloadProgress(`Getting download link for ${file.name}...`);
      const response = await bookingService.downloadDeliverable(file.id);
      
      // Download the file using the signed URL
      setDownloadProgress(`Downloading ${file.name}...`);
      if (onDownloadProgress) onDownloadProgress(`Downloading ${file.name}...`);
      const downloadResponse = await fetch(response.signed_url);
      if (!downloadResponse.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await downloadResponse.blob();
      
      // Use the file name from the backend response, fallback to file.name
      const fileName = response.file_name || file.name;
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      setDownloadProgress(`Successfully downloaded ${file.name}`);
      if (onDownloadProgress) onDownloadProgress(`Successfully downloaded ${file.name}`);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress('');
        setDownloadingFileIndex(-1);
        if (onDownloadStateChange) onDownloadStateChange(false);
        if (onDownloadProgress) onDownloadProgress('');
      }, 500);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download ${file.name}. Please try again.`);
      setIsDownloading(false);
      setDownloadProgress('');
      setDownloadingFileIndex(-1);
      if (onDownloadStateChange) onDownloadStateChange(false);
      if (onDownloadProgress) onDownloadProgress('');
    }
  };

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

  const handleDownloadAll = async () => {
    if (!order.files || order.files.length === 0) {
      alert('No files available to download.');
      return;
    }

    setIsDownloading(true);
    if (onDownloadStateChange) onDownloadStateChange(true);
    setDownloadProgress('Preparing files for download...');
    if (onDownloadProgress) onDownloadProgress('Preparing files for download...');
    setDownloadingFileIndex(-1);

    try {
      // Get all signed URLs in one API call
      setDownloadProgress('Getting downloads...');
      if (onDownloadProgress) onDownloadProgress('Getting downloads...');
      const response = await bookingService.downloadDeliverablesBatch(order.id);
      
      if (!response.success || !response.files || response.files.length === 0) {
        alert('No files available to download.');
        setIsDownloading(false);
        setDownloadProgress('');
        return;
      }

      // Download all files using the signed URLs
      for (let i = 0; i < response.files.length; i++) {
        const fileInfo = response.files[i];
        const progressMsg = `Downloading ${i + 1} of ${response.files.length}: ${fileInfo.file_name}...`;
        setDownloadProgress(progressMsg);
        if (onDownloadProgress) onDownloadProgress(progressMsg);
        setDownloadingFileIndex(i);
        
        try {
          // Download the file using the signed URL
          const downloadResponse = await fetch(fileInfo.signed_url);
          if (!downloadResponse.ok) {
            throw new Error('Failed to download file');
          }
          
          const blob = await downloadResponse.blob();
          
          // Create download link and trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileInfo.file_name;
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);
          
          // Add a small delay between downloads to prevent browser blocking
          if (i < response.files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`Failed to download ${fileInfo.file_name}:`, error);
          // Continue with other files even if one fails
        }
      }
      
      const successMsg = `Successfully downloaded ${response.files.length} file${response.files.length > 1 ? 's' : ''}`;
      setDownloadProgress(successMsg);
      if (onDownloadProgress) onDownloadProgress(successMsg);
      
      // Mark booking as complete after all files are downloaded
      try {
        await bookingService.markDownloadComplete(order.id);
        
        // Small delay to ensure backend has processed the update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Notify parent component to refresh orders list
        if (onOrderStatusChanged) {
          onOrderStatusChanged();
        }
      } catch (error) {
        console.error('Failed to mark booking as complete:', error);
        // Don't show error to user, just log it
      }
      
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress('');
        setDownloadingFileIndex(-1);
        if (onDownloadStateChange) onDownloadStateChange(false);
        if (onDownloadProgress) onDownloadProgress('');
      }, 1000);
    } catch (error) {
      console.error('Error downloading all files:', error);
      alert('Failed to download files. Please try again.');
      setIsDownloading(false);
      setDownloadProgress('');
      setDownloadingFileIndex(-1);
      if (onDownloadStateChange) onDownloadStateChange(false);
      if (onDownloadProgress) onDownloadProgress('');
    }
  };


  // Check if files are expired
  const areFilesExpired = () => {
    // Files never expire
    return false;
  };

  const filesExpired = areFilesExpired();

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
                  label="Download"
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

        <DialogContent sx={{ pt: 0, pb: 0, px: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Download Progress Indicator */}
          {isDownloading && (
            <Box sx={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              p: 2,
              borderRadius: 2,
              mb: 2,
              mx: { xs: 2, sm: 3 },
              mt: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
                : '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                  {downloadProgress || 'Downloading files...'}
                </Typography>
              </Box>
              <LinearProgress sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {downloadingFileIndex >= 0 && order.files && order.files.length > 1
                  ? `Downloading file ${downloadingFileIndex + 1} of ${order.files.length}`
                  : 'Please wait while your files are being downloaded.'}
              </Typography>
            </Box>
          )}
          {/* Scrollable Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }}}>
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

          {/* Invoices Section */}
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

          <Divider sx={{ my: 2 }} />

          {/* Files Section */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  Deliverable Files
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                 {order.fileCount} file{order.fileCount !== 1 ? 's' : ''} • {order.fileSize}
               </Typography>
             </Box>
             {!filesExpired && (
               <Button
                 variant="contained"
                 size="small"
                 startIcon={isDownloading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Folder />}
                 onClick={handleDownloadAll}
                 disabled={isDownloading}
                 sx={{
                   textTransform: 'none',
                   fontWeight: 600,
                   bgcolor: statusColor,
                   '&:hover': {
                     bgcolor: statusColor,
                     filter: 'brightness(1.1)',
                   },
                   '&:disabled': {
                     bgcolor: statusColor,
                     opacity: 0.7,
                   },
                 }}
               >
                 {isDownloading ? 'Downloading...' : 'Download All'}
               </Button>
             )}
           </Box>

           {filesExpired ? (
             <Box
               sx={{
                 p: 3,
                 borderRadius: 2,
                 bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
                 border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)'}`,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 gap: 2,
               }}
             >
               <ErrorOutline sx={{ fontSize: 48, color: theme.palette.warning.main }} />
               <Box sx={{ textAlign: 'center' }}>
                 <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                   Files No Longer Available
                 </Typography>
                 <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                   The downloadable files for this order have expired and are no longer accessible.
                 </Typography>
               </Box>
             </Box>
           ) : (
             <List sx={{
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: 2,
              p: 0,
            }}>
              {order.files.map((file, index) => {
                const viewable = isViewableFile(file.type);
                return (
                  <ListItem
                    key={file.id}
                    sx={{
                      borderBottom: index < order.files.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      },
                    }}
                    secondaryAction={
                      viewable ? (
                        <IconButton
                          size="small"
                          onClick={() => handleViewFile(file)}
                          disabled={isDownloading}
                          sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                              bgcolor: theme.palette.primary.main + '10',
                            },
                          }}
                          title="View file"
                        >
                          <Visibility />
                        </IconButton>
                      ) : null
                    }
                  >
                    <ListItemIcon>
                      {getFileIcon(file.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {file.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {file.type} • {file.size}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
             </List>
           )}
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
                {order.description}
              </Typography>
            </Box>
             <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', ml: 2.5 }}>
               {filesExpired 
                 ? 'Your service is complete! Contact the creative if you need the files again.'
                 : 'Your service is complete! Download your files and invoice above.'
               }
             </Typography>
           </Box>
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
            startIcon={isDownloading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Download />}
            onClick={handleDownloadAll}
            disabled={isDownloading || filesExpired || !order.files || order.files.length === 0}
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              bgcolor: statusColor,
              borderRadius: 2,
              boxShadow: `0 4px 14px ${statusColor}40`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: statusColor,
                filter: 'brightness(1.1)',
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${statusColor}50`,
              },
              '&:disabled': {
                bgcolor: statusColor,
                opacity: 0.6,
              },
            }}
          >
            {isDownloading ? 'Downloading...' : 'Download All Files'}
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

    </>
  );
}

