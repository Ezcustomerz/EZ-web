import { Box, Typography, Paper, Stack, useTheme, useMediaQuery, Chip, Button, Card, CardContent, Avatar, Divider, Skeleton, Pagination } from '@mui/material';
import { LayoutClient } from '../../layout/client/LayoutClient';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentRequestsService, type PaymentRequest } from '../../api/paymentRequestsService';
import { useAuth } from '../../context/auth';
import { Payment as PaymentIcon, CheckCircle, Cancel, AttachMoney } from '@mui/icons-material';
import { format } from 'date-fns';
import { PaymentRequestDetailPopover } from '../../components/popovers/client/PaymentRequestDetailPopover';

const PAGE_SIZE = 10;

export function PaymentRequestsClient() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<PaymentRequest | null>(null);
  const [detailPopoverOpen, setDetailPopoverOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; page: number; page_size: number; total_pages: number } | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated) {
      if (mountedRef.current) {
        setPaymentRequests([]);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    paymentRequestsService.getClientPaymentRequests(page, PAGE_SIZE)
      .then(result => {
        if (mountedRef.current) {
          setPaymentRequests(result.data);
          setPagination(result.pagination);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (mountedRef.current) {
          setError(err.response?.data?.detail || 'Failed to load payment requests');
          setPaymentRequests([]);
          setIsLoading(false);
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated, page]);

  // Check for paymentRequestId in URL params and open popover
  useEffect(() => {
    const paymentRequestId = searchParams.get('paymentRequestId');
    if (paymentRequestId && paymentRequests.length > 0 && !detailPopoverOpen) {
      const request = paymentRequests.find(r => r.id === paymentRequestId);
      if (request) {
        setSelectedPaymentRequest(request);
        setDetailPopoverOpen(true);
        // Remove paymentRequestId from URL to clean it up
        searchParams.delete('paymentRequestId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, paymentRequests, detailPopoverOpen, setSearchParams]);

  const handlePay = async (paymentRequest: PaymentRequest) => {
    try {
      const result = await paymentRequestsService.processPaymentRequest(paymentRequest.id);
      // Redirect to Stripe checkout
      window.location.href = result.checkout_url;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process payment');
    }
  };

  const handleCardClick = (paymentRequest: PaymentRequest) => {
    setSelectedPaymentRequest(paymentRequest);
    setDetailPopoverOpen(true);
  };

  const handleDetailPopoverClose = () => {
    setDetailPopoverOpen(false);
    setSelectedPaymentRequest(null);
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
    <LayoutClient selectedNavItem="orders">
      {({ isSidebarOpen: _, isMobile: __, clientProfile: ___ }) => (
        <Box
          sx={{
            px: { xs: 2, sm: 2, md: 3 },
            pb: { xs: 2, sm: 2, md: 3 },
            pt: { md: 2 },
            minHeight: { xs: '100dvh', md: '100vh' },
            height: { xs: '100dvh', md: '100vh' },
            maxHeight: { xs: '100dvh', md: '100vh' },
            overflow: { xs: 'hidden', md: 'auto' },
            display: 'flex',
            flexDirection: 'column',
            animation: 'pageSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            '@keyframes pageSlideIn': {
              '0%': {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          {/* Page Header */}
          <Box
            sx={{
              mb: 2,
              pt: { xs: 2, sm: 2, md: 1 },
              textAlign: { xs: 'center', md: 'left' },
              px: { xs: 2, md: 0 },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              '@media (max-height: 784px)': {
                my: 1,
              },
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
                  color: 'primary.main',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2,
                  mb: 0.25,
                }}
              >
                Payment Requests
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                  fontWeight: 400,
                  color: 'text.secondary',
                  letterSpacing: '0.01em',
                }}
              >
                View and manage payment requests from creatives
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => navigate('/client/orders')}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              Back to Orders
            </Button>
          </Box>

          {/* Content */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              flex: '1 1 0',
              minHeight: 0,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {isLoading ? (
              <Stack spacing={3}>
                {/* Pending Requests Skeleton */}
                <Box>
                  <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    {[1, 2].map((i) => (
                      <Card
                        key={i}
                        sx={{
                          border: `2px solid ${theme.palette.warning.main}20`,
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                              <Skeleton variant="circular" width={48} height={48} />
                              <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="60%" height={28} sx={{ mb: 0.5 }} />
                                <Skeleton variant="text" width="40%" height={20} />
                                <Skeleton variant="text" width="50%" height={20} sx={{ mt: 0.5 }} />
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Skeleton variant="text" width={100} height={40} sx={{ mb: 1 }} />
                              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                            </Box>
                          </Box>
                          <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
                          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 2 }} />
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>

                {/* Paid Requests Skeleton */}
                <Box>
                  <Divider sx={{ my: 2 }} />
                  <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    {[1, 2].map((i) => (
                      <Card
                        key={i}
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          opacity: 0.8,
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                              <Skeleton variant="circular" width={48} height={48} />
                              <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="60%" height={28} sx={{ mb: 0.5 }} />
                                <Skeleton variant="text" width="40%" height={20} />
                                <Skeleton variant="text" width="50%" height={20} sx={{ mt: 0.5 }} />
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Skeleton variant="text" width={100} height={32} sx={{ mb: 1 }} />
                              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            ) : error ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="error" sx={{ mb: 2 }}>
                  {error}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    paymentRequestsService.getClientPaymentRequests(page, PAGE_SIZE)
                      .then(result => {
                        if (mountedRef.current) {
                          setPaymentRequests(result.data);
                          setPagination(result.pagination);
                          setIsLoading(false);
                        }
                      })
                      .catch(err => {
                        if (mountedRef.current) {
                          setError(err.response?.data?.detail || 'Failed to load payment requests');
                          setIsLoading(false);
                        }
                      });
                  }}
                >
                  Retry
                </Button>
              </Box>
            ) : paymentRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No Payment Requests
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You don't have any payment requests at this time.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Pending ({pendingRequests.length})
                    </Typography>
                    <Stack spacing={2}>
                      {pendingRequests.map((request) => (
                        <Card
                          key={request.id}
                          onClick={() => handleCardClick(request)}
                          sx={{
                            border: `2px solid ${theme.palette.warning.main}20`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: theme.shadows[4],
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                                <Avatar
                                  src={request.creative_avatar_url || undefined}
                                  sx={{
                                    bgcolor: theme.palette.primary.main,
                                    width: 48,
                                    height: 48,
                                  }}
                                >
                                  {request.creative_display_name?.[0] || request.creative_name?.[0] || 'C'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {request.creative_display_name || request.creative_name || 'Creative'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDate(request.created_at)}
                                  </Typography>
                                  {request.booking_id && request.service_name && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                      For: {request.service_name}
                                      {request.booking_order_date && ` (${formatDate(request.booking_order_date)})`}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
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
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  "{request.notes}"
                                </Typography>
                              </Box>
                            )}
                            <Button
                              variant="contained"
                              startIcon={<AttachMoney />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePay(request);
                              }}
                              fullWidth
                              sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                py: 1.5,
                              }}
                            >
                              Pay {formatCurrency(request.amount)}
                            </Button>
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
                          onClick={() => handleCardClick(request)}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            opacity: 0.8,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              opacity: 1,
                              boxShadow: theme.shadows[2],
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                                <Avatar
                                  src={request.creative_avatar_url || undefined}
                                  sx={{
                                    bgcolor: theme.palette.success.main,
                                    width: 48,
                                    height: 48,
                                  }}
                                >
                                  {request.creative_display_name?.[0] || request.creative_name?.[0] || 'C'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {request.creative_display_name || request.creative_name || 'Creative'}
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
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
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
                          onClick={() => handleCardClick(request)}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            opacity: 0.6,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              opacity: 0.8,
                              boxShadow: theme.shadows[2],
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                                <Avatar
                                  src={request.creative_avatar_url || undefined}
                                  sx={{
                                    bgcolor: theme.palette.error.main,
                                    width: 48,
                                    height: 48,
                                  }}
                                >
                                  {request.creative_display_name?.[0] || request.creative_name?.[0] || 'C'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {request.creative_display_name || request.creative_name || 'Creative'}
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
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
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
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                <Pagination
                  count={pagination.total_pages}
                  page={page}
                  onChange={(_, newPage) => {
                    setPage(newPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Paper>

          {/* Payment Request Detail Popover */}
          <PaymentRequestDetailPopover
            open={detailPopoverOpen}
            onClose={handleDetailPopoverClose}
            paymentRequest={selectedPaymentRequest}
            onPay={handlePay}
          />
        </Box>
      )}
    </LayoutClient>
  );
}

