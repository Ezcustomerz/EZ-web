import { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Tooltip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Paper,
  IconButton,
} from '@mui/material';
import { 
  People,
  ExpandMore,
  InfoOutlined,
  TrendingUp,
  RemoveCircleOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { errorToast } from '../toast/toast';

interface ClientAnalyticsData {
  id: string;
  name: string;
  avatar?: string;
  servicesAmount: number;
  totalPaid: number;
  lastPaymentDate: string;
}

interface ClientAnalyticsProps {
  onDelete?: () => void;
}

export function ClientAnalytics({ onDelete }: ClientAnalyticsProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientsData, setClientsData] = useState<ClientAnalyticsData[]>([]);
  
  // Remember expanded state from localStorage
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem('analytics-client-expanded');
    return saved !== null ? saved === 'true' : true; // Default to expanded
  });

  // Only fetch data when accordion is expanded
  useEffect(() => {
    if (!expanded) {
      return; // Don't fetch if collapsed
    }

    const abortController = new AbortController();
    let isMounted = true;

    const fetchClientLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/creative/analytics/client-leaderboard', {
          signal: abortController.signal,
        });
        
        if (isMounted && response.data && response.data.data) {
          // Map API response to component interface
          const mappedData = response.data.data.map((client: any) => ({
            id: client.id,
            name: client.name,
            servicesAmount: client.services_amount,
            totalPaid: client.total_paid,
            lastPaymentDate: client.last_payment_date,
          }));
          setClientsData(mappedData);
        }
      } catch (error: any) {
        if (error.name !== 'CanceledError' && isMounted) {
          errorToast('Unable to load client leaderboard', 'Analytics data could not be loaded. Please try again.');
          setClientsData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchClientLeaderboard();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [expanded]);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('analytics-client-expanded', expanded.toString());
  }, [expanded]);

  const handleAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/creative/clients?clientId=${clientId}`);
  };

  const sortedClients = useMemo(() => {
    return [...clientsData].sort((a, b) => b.totalPaid - a.totalPaid);
  }, [clientsData]);

  const maxTotalPaid = useMemo(() => {
    return Math.max(...sortedClients.map(c => c.totalPaid), 1);
  }, [sortedClients]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    
    // Parse UTC date string and convert to local time
    const date = new Date(dateString);
    const now = new Date();
    
    // Get local time components for proper day comparison
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate time difference in milliseconds
    const diffTime = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    
    // Calculate calendar day difference (in local time)
    const diffDays = Math.floor((nowLocal.getTime() - dateLocal.getTime()) / (1000 * 60 * 60 * 24));
    
    // More accurate relative time calculation
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) {
      // If same calendar day, show hours
      if (diffDays === 0) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      }
      // If different day but less than 24 hours, it's yesterday
      return 'Yesterday';
    }
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    // For older dates, show formatted date in local timezone
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
          }}
        >
          {rank}
        </Box>
      );
    }
    if (rank === 2) {
      return (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: '#C0C0C0',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px rgba(192, 192, 192, 0.4)',
          }}
        >
          {rank}
        </Box>
      );
    }
    if (rank === 3) {
      return (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: '#CD7F32',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px rgba(205, 127, 50, 0.4)',
          }}
        >
          {rank}
        </Box>
      );
    }
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: 1,
          }}
        >
          {rank}
        </Typography>
      </Box>
    );
  };

  return (
    <Accordion 
      expanded={expanded}
      onChange={handleAccordionChange}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        '&:before': { display: 'none' },
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          },
        }}
      >
        <People sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          Client Leaderboard
        </Typography>
        <Tooltip 
          title="View your top clients ranked by total revenue. Track services, payments, and engagement."
          placement="top"
          arrow
        >
          <InfoOutlined sx={{ fontSize: '1rem', color: 'text.secondary', ml: 0.5, cursor: 'help' }} />
        </Tooltip>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <IconButton
            component="div"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) {
                onDelete();
              }
            }}
            sx={{
              color: 'error.main',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.dark',
              },
            }}
          >
            <RemoveCircleOutline fontSize="small" />
          </IconButton>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Box
          sx={{
            p: 4,
            pt: 2,
            position: 'relative',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="circular" width={28} height={28} />
                  <Skeleton variant="text" width="30%" height={24} />
                  <Skeleton variant="text" width="20%" height={20} />
                  <Skeleton variant="text" width="15%" height={20} />
                  <Skeleton variant="text" width="20%" height={24} />
                </Box>
              ))}
            </Box>
          ) : sortedClients.length === 0 ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: 300,
                gap: 2,
              }}
            >
              <People sx={{ fontSize: 64, color: 'text.disabled' }} />
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                No client data available
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 400 }}>
                Client analytics will appear here once you have completed bookings with clients.
              </Typography>
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                bgcolor: '#fafbff',
                borderRadius: '0 0 8px 8px',
                border: '2px solid',
                borderColor: theme.palette.primary.main + '25',
                boxShadow: `inset 0 2px 8px rgba(0, 0, 0, 0.02), 0 2px 8px ${theme.palette.primary.main}08`,
                position: 'relative',
                overflow: 'hidden',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '0 0 8px 8px',
                  padding: '2px',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}30, transparent 50%, ${theme.palette.primary.main}20)`,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                },
              }}
            >
              <TableContainer sx={{ position: 'relative', zIndex: 1 }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
                        Rank
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
                        Client
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
                        Completed Services
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
                        Last Payment
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', py: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
                        Total Paid
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedClients.map((client, index) => {
                      const rank = index + 1;
                      const progress = (client.totalPaid / maxTotalPaid) * 100;
                      
                      return (
                        <TableRow
                          key={client.id}
                          onClick={() => handleClientClick(client.id)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                            transition: 'background-color 0.2s ease',
                            '&:last-child td': {
                              borderBottom: 0,
                            },
                          }}
                        >
                          <TableCell sx={{ py: 2.5, verticalAlign: 'middle' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                              {getRankBadge(rank)}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  bgcolor: theme.palette.primary.main,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.9rem',
                                  flexShrink: 0,
                                }}
                              >
                                {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </Box>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: 'text.primary',
                                }}
                              >
                                {client.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.secondary',
                                fontWeight: 500,
                              }}
                            >
                              {client.servicesAmount} {client.servicesAmount === 1 ? 'completed service' : 'completed services'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.secondary',
                              }}
                            >
                              {formatDate(client.lastPaymentDate)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2.5 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingUp sx={{ fontSize: '0.9rem', color: theme.palette.success.main }} />
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 700,
                                    color: theme.palette.success.main,
                                    fontSize: '1rem',
                                  }}
                                >
                                  ${client.totalPaid.toLocaleString()}
                                </Typography>
                              </Box>
                              <Box sx={{ width: 120, mt: 0.5 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={progress}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: theme.palette.grey[200],
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      bgcolor: theme.palette.success.main,
                                    },
                                  }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
