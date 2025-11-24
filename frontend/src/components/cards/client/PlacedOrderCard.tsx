import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Divider,
  Chip,
  useTheme
} from '@mui/material';
import { DateRange, AttachMoney } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { PlacedOrderDetailPopover, type PlacedOrderDetail, type PaymentOption } from '../../popovers/client/PlacedOrderDetailPopover';

interface PlacedOrderCardProps {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  calendarDate: string | null;
  paymentOption?: PaymentOption;
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
  onOrderCanceled?: () => void;
  defaultOpen?: boolean; // Allow parent to control popover open state
}

export function PlacedOrderCard({
  id,
  serviceName,
  creativeName,
  orderDate,
  description,
  price,
  calendarDate,
  paymentOption = 'payment_upfront',
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
  onOrderCanceled,
  defaultOpen = false
}: PlacedOrderCardProps) {
  const theme = useTheme();
  const statusColor = '#ff9800';
  const [popoverOpen, setPopoverOpen] = useState(defaultOpen);

  // Update popover state when defaultOpen changes
  useEffect(() => {
    if (defaultOpen) {
      setPopoverOpen(true);
    }
  }, [defaultOpen]);

  const handleCardClick = () => {
    setPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setPopoverOpen(false);
  };

  const orderDetail: PlacedOrderDetail = {
    id,
    serviceName,
    creativeName,
    orderDate,
    description,
    price,
    calendarDate,
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
  };

  return (
    <>
      <Card 
        onClick={handleCardClick}
        sx={{ 
          borderRadius: 2,
          transition: 'all 0.2s ease',
          border: '2px solid',
          borderColor: 'rgba(255, 152, 0, 0.3)',
          overflow: 'visible',
          minHeight: 'fit-content',
          height: 'auto',
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 152, 0, 0.05)'
            : 'rgba(255, 152, 0, 0.02)',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(255, 152, 0, 0.3)'
              : '0 4px 20px rgba(255, 152, 0, 0.2)',
            borderColor: '#ff9800',
            transform: 'translateY(-2px)',
          }
        }}
      >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
        {/* Header Section with Avatar */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          {/* Avatar */}
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

          {/* Service Info */}
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
                • Awaiting creative approval
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              by {creativeName}
            </Typography>
          </Box>
          
          {/* Status Chip */}
          <Chip
            label="Service Placed"
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

        {/* Details Grid */}
        <Box sx={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 0.5,
          alignItems: 'flex-end',
        }}>
          {/* Ordered Service Date */}
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

          {/* Calendar Date (Optional) */}
          {calendarDate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Booking Set For
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <DateRange sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(calendarDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })} at {new Date(calendarDate).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true
                  })}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Price */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'flex-end' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Price
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <AttachMoney sx={{ fontSize: 18, color: theme.palette.primary.main }} />
              <Typography variant="body1" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {price.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>

    <PlacedOrderDetailPopover
      open={popoverOpen}
      onClose={handlePopoverClose}
      order={orderDetail}
      onOrderCanceled={onOrderCanceled}
    />
  </>
  );
}

