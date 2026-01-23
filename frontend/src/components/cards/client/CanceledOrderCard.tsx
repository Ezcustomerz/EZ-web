import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Divider,
  Chip,
  Button,
  useTheme
} from '@mui/material';
import { DateRange, Cancel, Replay } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { CanceledOrderDetailPopover, type CanceledOrderDetail, type CanceledPaymentOption } from '../../popovers/client/CanceledOrderDetailPopover';
import { BookingServicePopover } from '../../popovers/client/BookingServicePopover';
import { bookingService, type CalendarSettings } from '../../../api/bookingService';

interface CanceledOrderCardProps {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  canceledDate?: string;
  paymentOption?: CanceledPaymentOption;
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

export function CanceledOrderCard({
  id,
  serviceName,
  creativeName,
  orderDate,
  description,
  price,
  canceledDate,
  paymentOption,
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
}: CanceledOrderCardProps) {
  const theme = useTheme();
  const statusColor = '#f44336';
  const [popoverOpen, setPopoverOpen] = useState(defaultOpen);
  const [bookingPopoverOpen, setBookingPopoverOpen] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);

  // Update popover state when defaultOpen changes
  useEffect(() => {
    if (defaultOpen) {
      setPopoverOpen(true);
    }
  }, [defaultOpen]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open popover if clicking the rebook button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setPopoverOpen(false);
  };

  const handleRebook = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Fetch calendar settings and open booking popover directly
    if (serviceId) {
      try {
        const response = await bookingService.getCalendarSettings(serviceId);
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

  const orderDetail: CanceledOrderDetail = {
    id,
    serviceName,
    creativeName,
    orderDate,
    description,
    price,
    canceledDate,
    paymentOption,
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
        borderColor: 'rgba(244, 67, 54, 0.3)',
        overflow: 'visible',
        minHeight: 'fit-content',
        height: 'auto',
        cursor: 'pointer',
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(244, 67, 54, 0.05)'
          : 'rgba(244, 67, 54, 0.02)',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(244, 67, 54, 0.3)'
            : '0 4px 20px rgba(244, 67, 54, 0.2)',
          borderColor: '#f44336',
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
                • Service canceled
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              by {creativeName}
            </Typography>
          </Box>
          
          <Chip
            label="Canceled"
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

          {canceledDate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Canceled On
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Cancel sx={{ fontSize: 16, color: '#f44336' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(canceledDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          <Box sx={{ position: 'relative' }}>
            <Button
              variant="contained"
              startIcon={<Replay sx={{ fontSize: 18 }} />}
              size="small"
              onClick={handleRebook}
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
              Book Service
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>

    <CanceledOrderDetailPopover
      open={popoverOpen}
      onClose={handlePopoverClose}
      order={orderDetail}
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
  </>
  );
}

