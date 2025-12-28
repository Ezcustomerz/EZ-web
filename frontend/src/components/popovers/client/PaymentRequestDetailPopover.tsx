import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Slide,
  Divider,
  Chip,
  Avatar,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotesIcon from '@mui/icons-material/Notes';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';
import { format } from 'date-fns';
import type { PaymentRequest } from '../../../api/paymentRequestsService';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface PaymentRequestDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  paymentRequest: PaymentRequest | null;
  onPay?: (paymentRequest: PaymentRequest) => void;
}

export function PaymentRequestDetailPopover({
  open,
  onClose,
  paymentRequest,
  onPay,
}: PaymentRequestDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!paymentRequest) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'paid':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    const iconStyle = { color: 'white', fontSize: 24 };
    switch (status) {
      case 'pending':
        return <PaymentIcon sx={iconStyle} />;
      case 'paid':
        return <CheckCircleIcon sx={iconStyle} />;
      case 'cancelled':
        return <CancelIcon sx={iconStyle} />;
      default:
        return <PaymentIcon sx={iconStyle} />;
    }
  };

  const handlePay = () => {
    if (onPay && paymentRequest) {
      onPay(paymentRequest);
    }
    onClose();
  };

  const getStatusGradientColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.palette.warning.main;
      case 'paid':
        return theme.palette.success.main;
      case 'cancelled':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const statusColor = getStatusGradientColor(paymentRequest.status);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      sx={{
        zIndex: isMobile ? 10000 : 1300,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? '100vh' : '90vh',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }
        },
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.32)' } }
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          pt: 2.5,
          px: 3,
          background: `linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}08 100%)`,
          borderBottom: `2px solid ${statusColor}20`,
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 6 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}CC 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${statusColor}30`,
            }}
          >
            {getStatusIcon(paymentRequest.status)}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              Payment Request Details
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              {formatCurrency(paymentRequest.amount)} • {paymentRequest.status.charAt(0).toUpperCase() + paymentRequest.status.slice(1)}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'text.secondary',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'text.primary'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, flex: 1 }}>
        <Stack spacing={3}>
          {/* Creative Info */}
          <Box sx={{ pt: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              border: '1px solid rgba(0, 0, 0, 0.08)'
            }}>
              <Avatar
                src={paymentRequest.creative_avatar_url || undefined}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 48,
                  height: 48,
                  fontSize: '1.2rem',
                  fontWeight: 600
                }}
              >
                {(paymentRequest.creative_display_name || paymentRequest.creative_name || 'Creative').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                  {paymentRequest.creative_display_name || paymentRequest.creative_name || 'Creative'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                  Creative Professional
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Amount & Status */}
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
              Payment Amount
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: statusColor, mb: 2 }}>
              {formatCurrency(paymentRequest.amount)}
            </Typography>
            <Chip
              icon={getStatusIcon(paymentRequest.status)}
              label={paymentRequest.status.charAt(0).toUpperCase() + paymentRequest.status.slice(1)}
              color={getStatusColor(paymentRequest.status) as any}
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                height: 32
              }}
            />
          </Box>

          {/* Booking Association */}
          {paymentRequest.booking_id && paymentRequest.service_name && (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
                Associated Booking
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {paymentRequest.service_name}
                </Typography>
                {paymentRequest.booking_order_date && (
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(paymentRequest.booking_order_date)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Notes */}
          {paymentRequest.notes && (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
                Notes
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <NotesIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.25, flexShrink: 0 }} />
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {paymentRequest.notes}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Divider />

          {/* Dates */}
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
              Timeline
            </Typography>
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Requested
                </Typography>
                <Typography variant="body1" color="text.primary">
                  {formatDate(paymentRequest.created_at)}
                </Typography>
              </Box>

              {paymentRequest.paid_at && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Paid
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {formatDate(paymentRequest.paid_at)}
                  </Typography>
                </Box>
              )}

              {paymentRequest.cancelled_at && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Cancelled
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {formatDate(paymentRequest.cancelled_at)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Close
        </Button>
        {paymentRequest.status === 'pending' && onPay && (
          <Button
            variant="contained"
            startIcon={<AttachMoneyIcon />}
            onClick={handlePay}
            sx={{
              textTransform: 'none',
              background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}CC 100%)`,
              boxShadow: `0 4px 12px ${statusColor}30`,
              '&:hover': {
                background: `linear-gradient(135deg, ${statusColor}CC 0%, ${statusColor} 100%)`,
                boxShadow: `0 6px 16px ${statusColor}40`,
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Pay {formatCurrency(paymentRequest.amount)}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

