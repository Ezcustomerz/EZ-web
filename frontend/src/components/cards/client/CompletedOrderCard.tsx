import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Divider,
  Chip,
  Button,
  useTheme,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { DateRange, CheckCircle, Folder, Replay } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { CompletedOrderDetailPopover, type CompletedOrderDetail, type CompletedPaymentOption, type CompletedFile } from '../../popovers/client/CompletedOrderDetailPopover';
import { BookingServicePopover } from '../../popovers/client/BookingServicePopover';
import { bookingService, type CalendarSettings } from '../../../api/bookingService';

interface CompletedOrderCardProps {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  approvedDate: string | null;
  completedDate: string | null;
  calendarDate: string | null;
  fileCount: number | null;
  fileSize?: string | null;
  paymentOption?: CompletedPaymentOption;
  files?: CompletedFile[];
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
  invoices?: Array<{ type: string; name: string; download_url: string; session_id?: string }>;
  defaultOpen?: boolean;
}

export function CompletedOrderCard({
  id,
  serviceName,
  creativeName,
  orderDate,
  description,
  price,
  approvedDate,
  completedDate,
  calendarDate,
  fileCount,
  fileSize,
  paymentOption = 'payment_upfront',
  files = [],
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
  invoices,
  defaultOpen = false
}: CompletedOrderCardProps) {
  const theme = useTheme();
  const statusColor = '#4caf50';
  const [popoverOpen, setPopoverOpen] = useState(defaultOpen);
  const [bookingPopoverOpen, setBookingPopoverOpen] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);

  // Update popover state when defaultOpen changes
  useEffect(() => {
    if (defaultOpen) {
      setPopoverOpen(true);
    }
  }, [defaultOpen]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open popover if clicking buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setPopoverOpen(false);
  };

  const handleBookAgain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Fetch calendar settings and open booking popover directly
    if (serviceId) {
      try {
        const response = await bookingService.getCalendarSettings(serviceId);
        setCalendarSettings(response);
        setBookingPopoverOpen(true);
      } catch {
        // 404 is expected for services without scheduling - don't treat as error
        // Open booking popover without calendar settings
        setCalendarSettings(null);
        setBookingPopoverOpen(true);
      }
    }
  };

  const orderDetail: CompletedOrderDetail = {
    id,
    serviceName,
    creativeName,
    orderDate,
    description,
    price,
    approvedDate,
    completedDate,
    calendarDate,
    paymentOption,
    files,
    fileCount,
    fileSize: fileSize ?? null,
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
    invoices: invoices || [],
  };

  return (
    <>
      <Card 
        onClick={handleCardClick} 
      sx={{ 
        borderRadius: 2,
        transition: 'all 0.2s ease',
        border: '2px solid',
        borderColor: 'rgba(76, 175, 80, 0.3)',
        overflow: 'visible',
        minHeight: 'fit-content',
        height: 'auto',
        cursor: 'pointer',
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(76, 175, 80, 0.05)'
          : 'rgba(76, 175, 80, 0.02)',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(76, 175, 80, 0.3)'
            : '0 4px 20px rgba(76, 175, 80, 0.2)',
          borderColor: '#4caf50',
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
                • Order completed
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              by {creativeName}
            </Typography>
          </Box>
          
          <Chip
            label="Completed"
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

          {completedDate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Completed On
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(completedDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>
          )}

          {fileCount && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Deliverables
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Folder sx={{ fontSize: 16 }} />}
                size="small"
                sx={{
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  borderRadius: 2,
                  px: 2,
                  height: '32px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  '&:hover': {
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  }
                }}
              >
                View Files
              </Button>
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          <Box sx={{ position: 'relative' }}>
            <Button
              variant="contained"
              startIcon={<Replay sx={{ fontSize: 18 }} />}
              size="small"
              onClick={handleBookAgain}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: 2,
                px: 2.5,
                height: '36px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.85rem',
                position: 'relative',
                overflow: 'visible',
                boxShadow: '0 2px 8px 0 rgba(59, 130, 246, 0.3)',
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
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px 0 rgba(59, 130, 246, 0.4)',
                  '&::before': {
                    animation: 'sparkle 0.6s ease-out',
                  },
                  '&::after': {
                    animation: 'sparkle2 0.6s ease-out 0.1s',
                  },
                  '& .sparkle-3': {
                    animation: 'sparkle3 0.6s ease-out 0.15s',
                  },
                  '& .sparkle-4': {
                    animation: 'sparkle4 0.6s ease-out 0.2s',
                  },
                  '& .sparkle-5': {
                    animation: 'sparkle5 0.6s ease-out 0.25s',
                  },
                },
              }}
            >
              <Box
                className="sparkle-3"
                sx={{
                  position: 'absolute',
                  top: '40%',
                  right: '25%',
                  width: 4,
                  height: 4,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                  transition: 'all 0.2s ease-in-out',
                }}
              />
              <Box
                className="sparkle-4"
                sx={{
                  position: 'absolute',
                  top: '20%',
                  left: '35%',
                  width: 5,
                  height: 5,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                  transition: 'all 0.2s ease-in-out',
                }}
              />
              <Box
                className="sparkle-5"
                sx={{
                  position: 'absolute',
                  top: '75%',
                  left: '80%',
                  width: 4,
                  height: 4,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                  transition: 'all 0.2s ease-in-out',
                }}
              />
              Book Again
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>

    <CompletedOrderDetailPopover
      open={popoverOpen}
      onClose={handlePopoverClose}
      order={orderDetail}
      onDownloadProgress={(progress: string) => setDownloadProgress(progress)}
      onDownloadStateChange={(downloading: boolean) => setIsDownloading(downloading)}
    />

    {/* Booking Service Popover */}
    <BookingServicePopover
      open={bookingPopoverOpen}
      onClose={() => setBookingPopoverOpen(false)}
      service={{
        id: serviceId || id,
        title: serviceName,
        description: serviceDescription || 'Service description not available',
        price: price,
        delivery_time: serviceDeliveryTime || '3-5 days',
        creative_name: creativeName,
        creative_display_name: creativeDisplayName || creativeName,
        creative_title: creativeTitle,
        creative_avatar_url: creativeAvatarUrl,
        color: serviceColor || statusColor,
        payment_option: paymentOption === 'payment_upfront' ? 'upfront' : 
                        paymentOption === 'split_payment' ? 'split' : 
                        paymentOption === 'payment_later' ? 'later' : 'upfront',
        split_deposit_amount: undefined,
        requires_booking: calendarSettings?.is_scheduling_enabled || false,
      }}
      calendarSettings={calendarSettings}
    />

    {/* Persistent Download Progress Card */}
    {isDownloading && (
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
              ? 'rgba(76, 175, 80, 0.1)' 
              : 'rgba(76, 175, 80, 0.05)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <CircularProgress size={24} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Downloading Files
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {serviceName}
              </Typography>
            </Box>
          </Box>
          <LinearProgress sx={{ mt: 1 }} />
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'text.primary', fontWeight: 500 }}>
            {downloadProgress || 'Downloading files...'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Please wait while your files are being downloaded. You can continue working while this completes.
          </Typography>
        </Box>
      </Box>
    )}
  </>
  );
}

