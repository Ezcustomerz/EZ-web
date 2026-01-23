import { Box, Typography, Paper, Stack, useTheme, useMediaQuery, Chip, Card, CardContent, Avatar, Divider, Skeleton, Pagination } from '@mui/material';
import { LayoutCreative } from '../../layout/creative/LayoutCreative';
import { useState, useEffect, useRef } from 'react';
import { paymentRequestsService, type PaymentRequest } from '../../api/paymentRequestsService';
import { useAuth } from '../../context/auth';
import { Payment as PaymentIcon, CheckCircle, Cancel } from '@mui/icons-material';
import { format } from 'date-fns';

const PAGE_SIZE = 10;

export function PaymentRequestsCreative() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
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

    paymentRequestsService.getCreativePaymentRequests(page, PAGE_SIZE)
      .then(result => {
        if (mountedRef.current) {
          setPaymentRequests(result.data);
          setPagination(result.pagination);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (mountedRef.current) {
          console.error('Error fetching payment requests:', err);
          setError(err.response?.data?.detail || 'Failed to load payment requests');
          setPaymentRequests([]);
          setIsLoading(false);
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated, page]);

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
    <LayoutCreative selectedNavItem="dashboard">
      {({ isSidebarOpen: _, isMobile: __, creativeProfile: ___ }) => (
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
              '@media (max-height: 784px)': {
                my: 1,
              },
            }}
          >
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
              View all payment requests you've sent to clients
            </Typography>
          </Box>

          {/* Content */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: { xs: 2, md: 3 },
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
              backgroundColor: 'background.paper',
            }}
          >
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                pr: { xs: 0, md: 1 },
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
              {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
              ) : error ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    gap: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'error.main', mb: 1 }}>
                    Error loading payment requests
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {error}
                  </Typography>
                </Box>
              ) : paymentRequests.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    gap: 2,
                    textAlign: 'center',
                  }}
                >
                  <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                    No payment requests yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400 }}>
                    You haven't sent any payment requests to clients yet. Create one from your orders page.
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
                            sx={{
                              border: `1px solid ${theme.palette.warning.main}30`,
                              borderLeft: `4px solid ${theme.palette.warning.main}`,
                              transition: 'all 0.2s ease',
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
                            sx={{
                              border: `1px solid ${theme.palette.success.main}30`,
                              borderLeft: `4px solid ${theme.palette.success.main}`,
                              transition: 'all 0.2s ease',
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
                            sx={{
                              border: `1px solid ${theme.palette.error.main}30`,
                              borderLeft: `4px solid ${theme.palette.error.main}`,
                              opacity: 0.7,
                              transition: 'all 0.2s ease',
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
        </Box>
      )}
    </LayoutCreative>
  );
}

