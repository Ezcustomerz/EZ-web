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
import { DateRange, CalendarToday, AttachMoney } from '@mui/icons-material';
import { useState } from 'react';
import { InProgressOrderDetailPopover, type InProgressOrderDetail, type InProgressPaymentOption } from '../../popovers/client/InProgressOrderDetailPopover';

interface InProgressOrderCardProps {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  approvedDate: string | null;
  calendarDate: string | null;
  paymentOption?: InProgressPaymentOption;
  amountPaid?: number;
  amountRemaining?: number;
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
}

export function InProgressOrderCard({
  id,
  serviceName,
  creativeName,
  orderDate,
  description,
  price,
  approvedDate,
  calendarDate,
  paymentOption = 'payment_upfront',
  amountPaid,
  amountRemaining,
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
  creativeColor
}: InProgressOrderCardProps) {
  const theme = useTheme();
  const statusColor = '#2196f3';
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleCardClick = () => {
    setPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setPopoverOpen(false);
  };

  const orderDetail: InProgressOrderDetail = {
    id,
    serviceName,
    creativeName,
    orderDate,
    description,
    price,
    approvedDate,
    calendarDate,
    paymentOption,
    amountPaid,
    amountRemaining,
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
          borderColor: 'rgba(33, 150, 243, 0.3)',
          overflow: 'visible',
          minHeight: 'fit-content',
          height: 'auto',
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(33, 150, 243, 0.05)'
            : 'rgba(33, 150, 243, 0.02)',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(33, 150, 243, 0.3)'
              : '0 4px 20px rgba(33, 150, 243, 0.2)',
            borderColor: '#2196f3',
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
                • Service in progress
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              by {creativeName}
            </Typography>
          </Box>
          
          <Chip
            label="In Progress"
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

          {approvedDate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Approved On
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <DateRange sx={{ fontSize: 16, color: '#4caf50' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(approvedDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>
          )}

          {calendarDate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Booking Set For
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday sx={{ fontSize: 16, color: 'primary.main' }} />
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

          <Box sx={{ flex: 1 }} />

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

    <InProgressOrderDetailPopover
      open={popoverOpen}
      onClose={handlePopoverClose}
      order={orderDetail}
    />
  </>
  );
}

