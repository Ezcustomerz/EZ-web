import {
  Box,
  Typography,
  Stack,
  Skeleton,
  Card,
  CardContent,
  Chip,
  Avatar,
  useTheme,
  IconButton,
} from '@mui/material';
import { 
  Payment as PaymentIcon, 
  CheckCircle, 
  Cancel,
  Visibility,
} from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { paymentRequestsService, type PaymentRequest } from '../../api/paymentRequestsService';
import { format } from 'date-fns';
import { PaymentRequestDetailPopover } from '../popovers/client/PaymentRequestDetailPopover';

interface BookingPaymentRequestsProps {
  bookingId: string;
  isClient: boolean; // true for client view, false for creative view
}

export function BookingPaymentRequests({ bookingId, isClient }: BookingPaymentRequestsProps) {
  const theme = useTheme();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<PaymentRequest | null>(null);
  const [detailPopoverOpen, setDetailPopoverOpen] = useState(false);
  const fetchingRef = useRef(false);
  const lastBookingIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!bookingId) {
      setIsLoading(false);
      setPaymentRequests([]);
      setHasFetched(false);
      fetchingRef.current = false;
      return;
    }

    // Reset state when bookingId changes
    if (lastBookingIdRef.current !== bookingId) {
      setHasFetched(false);
      setPaymentRequests([]);
      fetchingRef.current = false;
    }

    // Prevent duplicate fetches
    if (fetchingRef.current && lastBookingIdRef.current === bookingId) {
      return;
    }

    let isMounted = true;
    fetchingRef.current = true;
    lastBookingIdRef.current = bookingId;
    setIsLoading(true);
    
    // Add aggressive timeout to prevent infinite loading
    // Set timeout to 2 seconds - if it takes longer, assume no payment requests
    timeoutRef.current = setTimeout(() => {
      if (isMounted && fetchingRef.current) {
        console.warn(`[BookingPaymentRequests] Fetch timeout for booking ${bookingId} - assuming no payment requests, hiding section`);
        setPaymentRequests([]);
        setIsLoading(false);
        setHasFetched(true);
        fetchingRef.current = false;
      }
    }, 2000); // 2 second timeout - fail fast and hide section
    
    paymentRequestsService.getPaymentRequestsByBooking(bookingId)
      .then(requests => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (isMounted) {
          // Ensure requests is an array
          const paymentRequestsArray = Array.isArray(requests) ? requests : [];
          console.log(`[BookingPaymentRequests] Fetched ${paymentRequestsArray.length} payment requests for booking ${bookingId}`);
          setPaymentRequests(paymentRequestsArray);
          setIsLoading(false);
          setHasFetched(true);
          fetchingRef.current = false;
        }
      })
      .catch(err => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (isMounted) {
          console.error(`[BookingPaymentRequests] Error fetching payment requests for booking ${bookingId}:`, err);
          // On error, assume no payment requests (don't show section)
          setPaymentRequests([]);
          setIsLoading(false);
          setHasFetched(true);
          fetchingRef.current = false;
        }
      });

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [bookingId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
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
        return theme.palette.warning.main;
      case 'paid':
        return theme.palette.success.main;
      case 'cancelled':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PaymentIcon fontSize="small" />;
      case 'paid':
        return <CheckCircle fontSize="small" />;
      case 'cancelled':
        return <Cancel fontSize="small" />;
      default:
        return <PaymentIcon fontSize="small" />;
    }
  };

  const handleViewPaymentRequest = (request: PaymentRequest) => {
    setSelectedPaymentRequest(request);
    setDetailPopoverOpen(true);
  };

  // CRITICAL: Don't show section at all if there are no payment requests
  // Only show if we actually have payment requests to display
  if (paymentRequests.length === 0) {
    // Don't show skeleton or anything - just return null
    // The timeout will ensure we don't get stuck in loading state
    return null;
  }

  return (
    <>
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'text.primary' }}>
            Payment Requests ({paymentRequests.length})
          </Typography>
          <Stack spacing={1.5}>
          {paymentRequests.map((request) => (
            <Card
              key={request.id}
              onClick={() => handleViewPaymentRequest(request)}
              sx={{
                border: `1px solid ${getStatusColor(request.status)}30`,
                borderLeft: `4px solid ${getStatusColor(request.status)}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: 2,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, flex: 1, alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: getStatusColor(request.status),
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getStatusIcon(request.status)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {formatCurrency(request.amount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {isClient ? (
                          <>From {request.creative_display_name || request.creative_name || 'Creative'}</>
                        ) : (
                          <>To {request.client_display_name || request.client_name || 'Client'}</>
                        )}
                        {' • '}
                        {request.status === 'paid' && request.paid_at
                          ? `Paid ${formatDate(request.paid_at)}`
                          : request.status === 'cancelled' && request.cancelled_at
                          ? `Cancelled ${formatDate(request.cancelled_at)}`
                          : `Requested ${formatDate(request.created_at)}`
                        }
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={getStatusIcon(request.status)}
                      label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      size="small"
                      sx={{
                        bgcolor: `${getStatusColor(request.status)}20`,
                        color: getStatusColor(request.status),
                        fontWeight: 600,
                        borderColor: getStatusColor(request.status),
                        border: '1px solid',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPaymentRequest(request);
                      }}
                      sx={{
                        color: theme.palette.primary.main,
                      }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {request.notes && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      {request.notes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
        </CardContent>
      </Card>

      {/* Payment Request Detail Popover */}
      <PaymentRequestDetailPopover
        open={detailPopoverOpen}
        onClose={() => {
          setDetailPopoverOpen(false);
          setSelectedPaymentRequest(null);
        }}
        paymentRequest={selectedPaymentRequest}
        onPay={isClient ? (pr) => {
          // Handle payment action for client
          paymentRequestsService.processPaymentRequest(pr.id)
            .then(result => {
              window.location.href = result.checkout_url;
            })
            .catch(err => {
              console.error('Error processing payment:', err);
              alert('Failed to process payment. Please try again.');
            });
        } : undefined}
      />
    </>
  );
}
