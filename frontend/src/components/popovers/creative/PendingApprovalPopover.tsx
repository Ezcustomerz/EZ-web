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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { 
  AttachMoney, 
  CalendarMonth, 
  Person, 
  Check, 
  Close,
  AccessTime
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

export interface PendingApprovalOrder {
  id: string;
  client: string;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    delivery_time: string;
    color: string;
    photos?: Array<{ url: string; alt?: string }>;
  };
  amount: number;
  status: string;
  date: string;
  bookingDate: string | null;
  // Additional order details
  description?: string;
  clientEmail?: string;
  clientPhone?: string;
  specialRequirements?: string;
}

export interface PendingApprovalPopoverProps {
  open: boolean;
  onClose: () => void;
  order: PendingApprovalOrder | null;
  onApprove: (orderId: string) => void;
  onReject: (orderId: string) => void;
}

export function PendingApprovalPopover({ 
  open, 
  onClose, 
  order,
  onApprove,
  onReject
}: PendingApprovalPopoverProps) {
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
    status: 'pending',
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
              Review order details and take action
            </Typography>
          </Box>
          <Chip
            label="Pending Approval"
            size="small"
            sx={{
              backgroundColor: '#f59e0b',
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
          {/* Order Overview */}
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
              Order Overview
            </Typography>
            
            <Stack spacing={2}>
              {/* Client Information */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ backgroundColor: '#f59e0b', width: 40, height: 40 }}>
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

        {/* Booking Date Card */}
        {order.bookingDate && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2, cursor: 'pointer', '&:hover': { boxShadow: 2 } }} onClick={handleViewBooking}>
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
                <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                  View Details →
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        {(order.description || order.specialRequirements) && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Additional Information
              </Typography>
              
              {order.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {order.description}
                  </Typography>
                </Box>
              )}

              {order.specialRequirements && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Special Requirements
                  </Typography>
                  <Typography variant="body1">
                    {order.specialRequirements}
                  </Typography>
                </Box>
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
          startIcon={<Close />}
          onClick={() => onReject(order.id)}
          sx={{
            borderColor: '#ef4444',
            color: '#ef4444',
            '&:hover': {
              borderColor: '#dc2626',
              backgroundColor: '#fef2f2',
            },
          }}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          startIcon={<Check />}
          onClick={() => onApprove(order.id)}
          sx={{
            backgroundColor: '#10b981',
            '&:hover': {
              backgroundColor: '#059669',
            },
          }}
        >
          Approve
        </Button>
      </DialogActions>

      {/* Service Detail Popover */}
      <ServicesDetailPopover
        open={serviceDetailOpen}
        onClose={handleServiceDetailClose}
        service={serviceDetail}
        context="services-tab"
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
