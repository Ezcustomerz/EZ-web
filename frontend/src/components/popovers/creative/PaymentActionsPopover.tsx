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
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Payment as PaymentIcon, ReceiptLong, CheckCircle, Cancel, AttachMoney } from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect, useRef } from 'react';
import { paymentRequestsService, type PaymentRequest } from '../../../api/paymentRequestsService';
import { useAuth } from '../../../context/auth';
import { format } from 'date-fns';
import { PaymentRequestDetailPopover } from '../client/PaymentRequestDetailPopover';
import { DirectPaymentPopover, type DirectPaymentData } from './DirectPaymentPopover';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface PaymentActionsPopoverProps {
  open: boolean;
  onClose: () => void;
  paymentRequestIdToOpen?: string | null;
  onOpenSettings?: (section?: 'billing') => void; // Callback to open settings
}


// Module-level cache to prevent duplicate fetches
let paymentRequestsCache: {
  promise: Promise<{ data: PaymentRequest[]; pagination: any }> | null;
  data: PaymentRequest[] | null;
  timestamp: number;
  resolved: boolean;
} = {
  promise: null,
  data: null,
  timestamp: 0,
  resolved: false,
};

const CACHE_DURATION = 10000; // Cache for 10 seconds

export function PaymentActionsPopover({ 
  open, 
  onClose,
  paymentRequestIdToOpen,
  onOpenSettings
}: PaymentActionsPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();
  const mountedRef = useRef(true);
  
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [directPaymentOpen, setDirectPaymentOpen] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<PaymentRequest | null>(null);
  const [detailPopoverOpen, setDetailPopoverOpen] = useState(false);

  // Fetch payment requests when popover opens
  useEffect(() => {
    mountedRef.current = true;

    if (!open || !isAuthenticated) {
      return;
    }

    const now = Date.now();
    const cacheAge = now - paymentRequestsCache.timestamp;

    // Check if cached data is still valid
    if (paymentRequestsCache.resolved && paymentRequestsCache.data && cacheAge < CACHE_DURATION) {
      if (mountedRef.current) {
        setPaymentRequests(paymentRequestsCache.data);
        setIsLoadingRequests(false);
      }
      return;
    }

    // Check if a promise already exists - reuse it
    if (paymentRequestsCache.promise) {
      setIsLoadingRequests(true);
      paymentRequestsCache.promise
        .then(requests => {
          if (mountedRef.current) {
            setPaymentRequests(requests);
            setIsLoadingRequests(false);
          }
        })
        .catch(err => {
          if (mountedRef.current) {
            console.error('Error fetching payment requests:', err);
            setPaymentRequests([]);
            setIsLoadingRequests(false);
          }
        });
      return;
    }

    // No promise exists - create one
    if (cacheAge >= CACHE_DURATION) {
      paymentRequestsCache.data = null;
      paymentRequestsCache.resolved = false;
    }

    setIsLoadingRequests(true);
    paymentRequestsCache.timestamp = now;
    paymentRequestsCache.resolved = false;

    const fetchPromise = paymentRequestsService.getCreativePaymentRequests(1, 50); // Fetch first 50 for popover
    paymentRequestsCache.promise = fetchPromise;

    fetchPromise
      .then(result => {
        paymentRequestsCache.data = result.data;
        paymentRequestsCache.resolved = true;
        paymentRequestsCache.promise = null;

        if (mountedRef.current) {
          setPaymentRequests(result.data);
          setIsLoadingRequests(false);
        }
      })
      .catch(err => {
        console.error('Error fetching payment requests:', err);
        paymentRequestsCache.data = [];
        paymentRequestsCache.resolved = true;
        paymentRequestsCache.promise = null;

        if (mountedRef.current) {
          setPaymentRequests([]);
          setIsLoadingRequests(false);
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, [open, isAuthenticated]);

  // Open specific payment request detail when paymentRequestIdToOpen is provided
  useEffect(() => {
    if (open && paymentRequestIdToOpen && paymentRequests.length > 0) {
      const request = paymentRequests.find(r => r.id === paymentRequestIdToOpen);
      if (request) {
        setSelectedPaymentRequest(request);
        setDetailPopoverOpen(true);
      }
    }
  }, [open, paymentRequestIdToOpen, paymentRequests]);

  const handleDirectPaymentClose = () => {
    setDirectPaymentOpen(false);
    // Refresh payment requests when a new one is created
    paymentRequestsCache.data = null;
    paymentRequestsCache.resolved = false;
    paymentRequestsCache.timestamp = 0;
  };

  const handleDirectPaymentSubmit = () => {
    // Refresh payment requests list
    paymentRequestsCache.data = null;
    paymentRequestsCache.resolved = false;
    paymentRequestsCache.timestamp = 0;
    // Refetch payment requests
    if (open && isAuthenticated) {
      const fetchPromise = paymentRequestsService.getCreativePaymentRequests();
      paymentRequestsCache.promise = fetchPromise;
      paymentRequestsCache.timestamp = Date.now();
      paymentRequestsCache.resolved = false;

      fetchPromise
        .then(requests => {
          paymentRequestsCache.data = requests;
          paymentRequestsCache.resolved = true;
          paymentRequestsCache.promise = null;

          if (mountedRef.current) {
            setPaymentRequests(requests);
            setIsLoadingRequests(false);
          }
        })
        .catch(err => {
          console.error('Error fetching payment requests:', err);
          paymentRequestsCache.data = [];
          paymentRequestsCache.resolved = true;
          paymentRequestsCache.promise = null;

          if (mountedRef.current) {
            setPaymentRequests([]);
            setIsLoadingRequests(false);
          }
        });
    }
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
    switch (status) {
      case 'pending':
        return <PaymentIcon />;
      case 'paid':
        return <CheckCircle />;
      case 'cancelled':
        return <Cancel />;
      default:
        return <PaymentIcon />;
    }
  };

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

  const pendingRequests = paymentRequests.filter(r => r.status === 'pending');
  const paidRequests = paymentRequests.filter(r => r.status === 'paid');
  const cancelledRequests = paymentRequests.filter(r => r.status === 'cancelled');

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            maxHeight: isMobile ? '100vh' : '90vh',
            m: isMobile ? 0 : 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}08 100%)`,
            borderBottom: `1px solid ${theme.palette.primary.main}20`,
            position: 'relative',
            p: { xs: 2, sm: 3 },
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}15 100%)`,
                border: `1px solid ${theme.palette.primary.main}30`,
                boxShadow: `0 4px 12px ${theme.palette.primary.main}20`,
              }}
            >
              <PaymentIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Payment Requests
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Create new requests or view existing ones
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  color: 'text.primary',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              maxHeight: isMobile ? 'calc(100vh - 200px)' : 'calc(90vh - 200px)',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: 8,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 4,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                },
              },
            }}
          >
            {/* Create New Payment Request Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Create New Payment Request
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Request payment from a client, either associated with a booking or as a direct payment.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<AttachMoney />}
                onClick={() => {
                  setDirectPaymentOpen(true);
                }}
                sx={{
                  py: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  boxShadow: `0 4px 14px 0 ${theme.palette.primary.main}40`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                    boxShadow: `0 6px 20px 0 ${theme.palette.primary.main}50`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Create Payment Request
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* View Payment Requests Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Payment Requests ({paymentRequests.length})
              </Typography>
              {isLoadingRequests ? (
                <Stack spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              ) : paymentRequests.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 6,
                    gap: 2,
                    textAlign: 'center',
                  }}
                >
                  <ReceiptLong sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400 }}>
                    You haven't sent any payment requests to clients yet.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {/* Pending Requests */}
                  {pendingRequests.length > 0 && (
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                          Pending ({pendingRequests.length})
                        </Typography>
                        <Stack spacing={2}>
                          {pendingRequests.map((request) => (
                            <Card
                              key={request.id}
                              onClick={() => {
                                setSelectedPaymentRequest(request);
                                setDetailPopoverOpen(true);
                              }}
                              sx={{
                                border: `1px solid ${theme.palette.warning.main}30`,
                                borderLeft: `4px solid ${theme.palette.warning.main}`,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                  boxShadow: 2,
                                  transform: 'translateY(-2px)',
                                },
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                                    <Avatar
                                      sx={{
                                        bgcolor: theme.palette.warning.main,
                                        width: 48,
                                        height: 48,
                                      }}
                                    >
                                      {request.client_display_name?.[0] || request.client_name?.[0] || 'C'}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        {request.client_display_name || request.client_name || 'Client'}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Requested on {formatDate(request.created_at)}
                                      </Typography>
                                      {request.booking_id && request.service_name && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                          For: {request.service_name}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                      {formatCurrency(request.amount)}
                                    </Typography>
                                    <Chip
                                      icon={getStatusIcon(request.status)}
                                      label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                      color={getStatusColor(request.status) as any}
                                      size="small"
                                    />
                                  </Box>
                                </Box>
                                {request.notes && (
                                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {request.notes}
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Paid Requests */}
                    {paidRequests.length > 0 && (
                      <Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          Paid ({paidRequests.length})
                        </Typography>
                        <Stack spacing={2}>
                          {paidRequests.map((request) => (
                            <Card
                              key={request.id}
                              onClick={() => {
                                setSelectedPaymentRequest(request);
                                setDetailPopoverOpen(true);
                              }}
                              sx={{
                                border: `1px solid ${theme.palette.success.main}30`,
                                borderLeft: `4px solid ${theme.palette.success.main}`,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                  boxShadow: 2,
                                  transform: 'translateY(-2px)',
                                },
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                                    <Avatar
                                      sx={{
                                        bgcolor: theme.palette.success.main,
                                        width: 48,
                                        height: 48,
                                      }}
                                    >
                                      {request.client_display_name?.[0] || request.client_name?.[0] || 'C'}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        {request.client_display_name || request.client_name || 'Client'}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Paid on {formatDate(request.paid_at)}
                                      </Typography>
                                      {request.booking_id && request.service_name && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                          For: {request.service_name}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                      {formatCurrency(request.amount)}
                                    </Typography>
                                    <Chip
                                      icon={getStatusIcon(request.status)}
                                      label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                      color={getStatusColor(request.status) as any}
                                      size="small"
                                    />
                                  </Box>
                                </Box>
                                {request.notes && (
                                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {request.notes}
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Cancelled Requests */}
                    {cancelledRequests.length > 0 && (
                      <Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          Cancelled ({cancelledRequests.length})
                        </Typography>
                        <Stack spacing={2}>
                          {cancelledRequests.map((request) => (
                            <Card
                              key={request.id}
                              onClick={() => {
                                setSelectedPaymentRequest(request);
                                setDetailPopoverOpen(true);
                              }}
                              sx={{
                                border: `1px solid ${theme.palette.error.main}30`,
                                borderLeft: `4px solid ${theme.palette.error.main}`,
                                opacity: 0.7,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                  boxShadow: 2,
                                  transform: 'translateY(-2px)',
                                },
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                                    <Avatar
                                      sx={{
                                        bgcolor: theme.palette.error.main,
                                        width: 48,
                                        height: 48,
                                      }}
                                    >
                                      {request.client_display_name?.[0] || request.client_name?.[0] || 'C'}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        {request.client_display_name || request.client_name || 'Client'}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Cancelled on {formatDate(request.cancelled_at)}
                                      </Typography>
                                      {request.booking_id && request.service_name && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                          For: {request.service_name}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                      {formatCurrency(request.amount)}
                                    </Typography>
                                    <Chip
                                      icon={getStatusIcon(request.status)}
                                      label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                      color={getStatusColor(request.status) as any}
                                      size="small"
                                    />
                                  </Box>
                                </Box>
                                {request.notes && (
                                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {request.notes}
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    )}

                  </Stack>
                )}
              </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Direct Payment Popover */}
      <DirectPaymentPopover
        open={directPaymentOpen}
        onClose={handleDirectPaymentClose}
        onSubmit={handleDirectPaymentSubmit}
        onOpenSettings={onOpenSettings}
      />

      {/* Payment Request Detail Popover */}
      <PaymentRequestDetailPopover
        open={detailPopoverOpen}
        onClose={() => {
          setDetailPopoverOpen(false);
          setSelectedPaymentRequest(null);
        }}
        paymentRequest={selectedPaymentRequest}
      />
    </>
  );
}

