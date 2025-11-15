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
  Cancel,
  Info,
  Warning,
  Block
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';
import { ServiceCard } from '../../cards/creative/ServiceCard';
import { ServicesDetailPopover, type ServiceDetail } from '../ServicesDetailPopover';
import { CalendarSessionDetailPopover } from './CalendarSessionDetailPopover';

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

export interface CancelledOrder {
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
  cancelledDate: string;
  cancelledBy: 'system' | 'client' | 'creative';
  cancellationReason?: string;
  // Additional order details
  description?: string;
  clientEmail?: string;
  clientPhone?: string;
  specialRequirements?: string;
}

export interface CancelledPopoverProps {
  open: boolean;
  onClose: () => void;
  order: CancelledOrder | null;
}

export function CancelledPopover({ 
  open, 
  onClose, 
  order
}: CancelledPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);

  if (!order) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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

  const handleServiceDetailClose = () => {
    setServiceDetailOpen(false);
  };

  const handleViewBooking = () => {
    setBookingDetailOpen(true);
  };

  const handleBookingDetailClose = () => {
    setBookingDetailOpen(false);
  };

  // Get cancellation details
  const getCancellationDetails = () => {
    switch (order.cancelledBy) {
      case 'system':
        return {
          title: 'Cancelled by System',
          description: 'This order was automatically cancelled by the system',
          icon: <Block sx={{ color: '#ef4444' }} />,
          color: '#ef4444',
          bgColor: '#fef2f2',
          borderColor: '#fecaca'
        };
      case 'client':
        return {
          title: 'Cancelled by Client',
          description: 'The client cancelled this order',
          icon: <Person sx={{ color: '#ef4444' }} />,
          color: '#ef4444',
          bgColor: '#fef2f2',
          borderColor: '#fecaca'
        };
      case 'creative':
        return {
          title: 'Cancelled by You',
          description: 'You cancelled this order',
          icon: <Cancel sx={{ color: '#ef4444' }} />,
          color: '#ef4444',
          bgColor: '#fef2f2',
          borderColor: '#fecaca'
        };
      default:
        return {
          title: 'Order Cancelled',
          description: 'This order has been cancelled',
          icon: <Cancel sx={{ color: '#ef4444' }} />,
          color: '#ef4444',
          bgColor: '#fef2f2',
          borderColor: '#fecaca'
        };
    }
  };

  const cancellationDetails = getCancellationDetails();

  // Create service detail data for the popover
  const serviceDetail: ServiceDetail = {
    id: order.service.id,
    title: order.service.title,
    description: order.service.description,
    price: order.service.price,
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
    status: 'cancelled',
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
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {order.service.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Order has been cancelled
            </Typography>
          </Box>
          <Chip
            label="Cancelled"
            size="small"
            sx={{
              backgroundColor: '#ef4444',
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Cancellation Details */}
          <Card sx={{ 
            border: `1px solid ${cancellationDetails.borderColor}`, 
            borderRadius: 2,
            bgcolor: cancellationDetails.bgColor
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Cancellation Details
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: `${cancellationDetails.color}20`,
                  border: `2px solid ${cancellationDetails.color}30`
                }}>
                  {cancellationDetails.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: cancellationDetails.color, mb: 1 }}>
                    {cancellationDetails.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {cancellationDetails.description}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Cancelled on {formatDateTime(order.cancelledDate)}
                  </Typography>
                </Box>
              </Box>

              {order.cancellationReason && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                    Reason for Cancellation:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {order.cancellationReason}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Order Overview */}
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Order Overview
              </Typography>
              
              <Stack spacing={2}>
                {/* Client Information */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ backgroundColor: '#6b7280', width: 40, height: 40 }}>
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
                        Amount
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
          onClick={onClose}
          sx={{
            borderColor: '#6b7280',
            color: '#6b7280',
            '&:hover': {
              borderColor: '#4b5563',
              backgroundColor: '#f9fafb',
            },
          }}
        >
          Close
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
