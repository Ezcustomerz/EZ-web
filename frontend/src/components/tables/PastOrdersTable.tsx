import { useMemo, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  Chip,
  Tooltip,
  Button,
  TextField,
  InputAdornment,
  Stack,
  IconButton,
} from '@mui/material';
import { ArrowDropUp, ArrowDropDown, SwapVert, Search as SearchIcon, Payment as PaymentIcon, ReceiptLong, FilterList as FilterIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';
import Card from '@mui/material/Card';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';

type SortField = 'client' | 'service' | 'amount' | 'date' | undefined;
type SortDirection = 'asc' | 'desc' | undefined;

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function PastOrdersTable({ 
  orders = []
}: { 
  orders?: any[];
}) {
  const theme = useTheme();
  
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hoveredSort, setHoveredSort] = useState<SortField | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    let data = filter === 'All' ? orders : orders.filter((order) => order.status === filter);
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(order =>
        order.client.toLowerCase().includes(lower) ||
        order.service.title.toLowerCase().includes(lower)
      );
    }
    if (!sortField || !sortDirection) return data;
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      switch (sortField) {
        case 'client':
          aValue = a.client.toLowerCase();
          bValue = b.client.toLowerCase();
          break;
        case 'service':
          aValue = a.service.title.toLowerCase();
          bValue = b.service.title.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        default:
          return 0;
      }
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filter, sortField, sortDirection, searchTerm, orders]);

  function handleSort(field: Exclude<SortField, undefined>) {
    if (sortField === field) {
      // Cycle: asc -> desc -> undefined
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(undefined);
        setSortDirection(undefined);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function getSortTooltip(field: SortField) {
    if (sortField !== field) {
      return 'Click to sort ascending';
    } else if (sortDirection === 'asc') {
      return 'Click to sort descending';
    } else {
      return 'Click to clear sorting';
    }
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) {
      return (
        <SwapVert sx={{ fontSize: 18, ml: 0.5, color: 'text.disabled', opacity: 0.4, transition: 'all 0.2s ease' }} />
      );
    } else if (sortDirection === 'asc') {
      return (
        <ArrowDropUp sx={{ fontSize: 20, ml: 0.5, color: 'primary.main', transition: 'all 0.2s ease' }} />
      );
    } else {
      return (
        <ArrowDropDown sx={{ fontSize: 20, ml: 0.5, color: 'primary.main', transition: 'all 0.2s ease' }} />
      );
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { md: '100%' },
        minHeight: { md: 0 },
      }}
    >
      {/* --- MOBILE ONLY --- */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {/* Sticky Controls */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: '#fff',
            boxShadow: 0,
            pb: 1,
          }}
        >
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                placeholder="Search Past Orders..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', ml: 1, minWidth: 80 }}>
                {filteredOrders.length} Order{filteredOrders.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <FormControl
                size="small"
                sx={{
                  minWidth: 110,
                  width: 'auto',
                  flex: 1,
                }}
              >
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  label="Status Filter"
                  startAdornment={<FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <MenuItem value="All" disableRipple>All</MenuItem>
                  <MenuItem value="Complete" disableRipple>Complete</MenuItem>
                  <MenuItem value="Canceled" disableRipple>Canceled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Box>
        {/* Card List */}
        <Box sx={{ pt: 2 }}>
          {filteredOrders.length === 0 ? (
            <Box
              sx={{
                width: '100%',
                maxWidth: 600,
                mx: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 6, md: 8 },
                textAlign: 'center',
                minHeight: { xs: '350px', md: '400px' },
                position: 'relative',
                background: `radial-gradient(circle at center, ${theme.palette.info.main}08 0%, ${theme.palette.primary.main}05 40%, transparent 70%)`,
                borderRadius: 2,
                animation: 'fadeIn 0.6s ease-out 0.5s both',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(20px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <ReceiptLong
                sx={{
                  fontSize: { xs: 44, md: 52 },
                  color: theme.palette.info.main,
                  mb: { xs: 2, md: 3 },
                  opacity: 0.9,
                  position: 'relative',
                  zIndex: 1,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  fontWeight: 600,
                  color: theme.palette.info.main,
                  mb: 1.5,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                No Past Orders Found
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.8rem', md: '0.875rem' },
                  color: theme.palette.info.main,
                  maxWidth: { xs: '280px', md: '320px' },
                  lineHeight: 1.6,
                  opacity: 0.8,
                  mb: 3,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Your completed and canceled orders will appear here.
              </Typography>
            </Box>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                elevation={1}
                tabIndex={0}
                aria-label={`Past order for ${order.client}, ${order.status}, ${formatCurrency(order.amount)}, ${formatDate(order.date)}`}
                sx={{
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'box-shadow 0.2s, border 0.2s',
                  '&:hover, &:focus': {
                    boxShadow: 4,
                    border: '1.5px solid',
                    borderColor: 'primary.main',
                    outline: 'none',
                  },
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={600}>{order.client}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={order.status} 
                        color="info"
                        size="small" 
                        sx={{ 
                          backgroundColor: order.status === 'Complete' ? '#10b981' : 
                                          order.status === 'Canceled' ? '#ef4444' : undefined,
                          color: (order.status === 'Complete' || order.status === 'Canceled') ? '#fff' : undefined,
                          fontWeight: 500, 
                          px: 1.5, 
                          height: 22, 
                          borderRadius: 1.5, 
                          boxShadow: 'none', 
                          fontSize: '0.8rem' 
                        }} 
                      />
                      {order.status === 'Complete' && (
                        <Tooltip title="Order completed" arrow placement="top">
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: 18,
                            height: 18,
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '50%',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            <CheckCircleIcon sx={{ fontSize: 10, color: '#10b981' }} />
                          </Box>
                        </Tooltip>
                      )}
                      {order.status === 'Canceled' && (
                        <Tooltip title="Order canceled" arrow placement="top">
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: 18,
                            height: 18,
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '50%',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            <CancelIcon sx={{ fontSize: 10, color: '#ef4444' }} />
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95em', mb: 0.5 }}>{order.service.title}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AttachMoneyIcon fontSize="small" color="action" />
                    <Typography variant="body2"><strong>{formatCurrency(order.amount)}</strong></Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EventIcon fontSize="small" color="action" />
                    <Typography variant="body2">{formatDate(order.date)}</Typography>
                  </Stack>
                </Stack>
              </Card>
            ))
          )}
        </Box>
      </Box>
      {/* --- DESKTOP ONLY --- */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', height: '100%' }}>
        {/* Controls: Search, Filter */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0,
            pb: 1,
            flexDirection: 'row',
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              placeholder="Search Past Orders..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 280,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                },
              }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', ml: 1, minWidth: 80 }}>
              {filteredOrders.length} Order{filteredOrders.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: 'auto' }}>
            <FormControl
              size="small"
              sx={{
                minWidth: 120,
                width: 'auto',
                flex: 'none',
              }}
            >
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label="Status Filter"
                startAdornment={<FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                sx={{
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                }}
              >
                <MenuItem value="All" disableRipple>All</MenuItem>
                <MenuItem value="Complete" disableRipple>Complete</MenuItem>
                <MenuItem value="Canceled" disableRipple>Canceled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        {/* Table */}
        <TableContainer
          sx={{
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            width: '100%',
            p: 0,
            overflow: filteredOrders.length > 0 ? 'auto' : 'visible',
            flex: '1 1 0',
            minHeight: 0,
          }}
        >
          <Table
            sx={{
              minWidth: 0,
              width: '100%',
              tableLayout: 'fixed',
              display: { xs: 'none', md: 'table' },
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e6f3fa' }}>
                <TableCell
                  onClick={() => handleSort('client')}
                  onMouseEnter={() => setHoveredSort('client')}
                  onMouseLeave={() => setHoveredSort(null)}
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortField === 'client' ? 'primary.main' : 'text.primary',
                    fontWeight: sortField === 'client' ? 700 : 600,
                    transition: 'all 0.2s ease',
                    minWidth: { xs: 160, sm: 'auto' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                      '& .MuiSvgIcon-root': {
                        opacity: 1,
                        color: 'primary.main',
                        transform: 'scale(1.15)',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Client
                    <Tooltip title={getSortTooltip('client')} arrow placement="top" open={hoveredSort === 'client'}>
                      <span>{getSortIcon('client')}</span>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    minWidth: { xs: 140, sm: 'auto' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                  }}
                >
                  Service
                </TableCell>
                <TableCell
                  onClick={() => handleSort('amount')}
                  onMouseEnter={() => setHoveredSort('amount')}
                  onMouseLeave={() => setHoveredSort(null)}
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortField === 'amount' ? 'primary.main' : 'text.primary',
                    fontWeight: sortField === 'amount' ? 700 : 600,
                    transition: 'all 0.2s ease',
                    minWidth: { xs: 120, sm: 'auto' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                      '& .MuiSvgIcon-root': {
                        opacity: 1,
                        color: 'primary.main',
                        transform: 'scale(1.15)',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Amount
                    <Tooltip title={getSortTooltip('amount')} arrow placement="top" open={hoveredSort === 'amount'}>
                      <span>{getSortIcon('amount')}</span>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    minWidth: { xs: 100, sm: 'auto' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  onClick={() => handleSort('date')}
                  onMouseEnter={() => setHoveredSort('date')}
                  onMouseLeave={() => setHoveredSort(null)}
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortField === 'date' ? 'primary.main' : 'text.primary',
                    fontWeight: sortField === 'date' ? 700 : 600,
                    transition: 'all 0.2s ease',
                    minWidth: { xs: 120, sm: 'auto' },
                    textAlign: 'right',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: '#e6f3fa',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                      '& .MuiSvgIcon-root': {
                        opacity: 1,
                        color: 'primary.main',
                        transform: 'scale(1.15)',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    Date
                    <Tooltip title={getSortTooltip('date')} arrow placement="top" open={hoveredSort === 'date'}>
                      <span>{getSortIcon('date')}</span>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ border: 0, p: 0, height: '100%', verticalAlign: 'middle', textAlign: 'center', width: '100%' }}>
                    <Box
                      sx={{
                        width: '100%',
                        maxWidth: 600,
                        mx: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: { xs: 6, md: 8 },
                        px: { xs: 2, md: 3 },
                        textAlign: 'center',
                        minHeight: { xs: '350px', md: '400px' },
                        position: 'relative',
                        background: `radial-gradient(circle at center, ${theme.palette.info.main}08 0%, ${theme.palette.primary.main}05 40%, transparent 70%)`,
                        borderRadius: 2,
                        animation: 'fadeIn 0.6s ease-out 0.5s both',
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateY(20px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      <ReceiptLong
                        sx={{
                          fontSize: { xs: 44, md: 52 },
                          color: theme.palette.info.main,
                          mb: { xs: 2, md: 3 },
                          opacity: 0.9,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: '1rem', md: '1.125rem' },
                          fontWeight: 600,
                          color: theme.palette.info.main,
                          mb: 1.5,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        No Past Orders Found
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          color: theme.palette.info.main,
                          maxWidth: { xs: '280px', md: '320px' },
                          lineHeight: 1.6,
                          opacity: 0.8,
                          mb: 3,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        Your completed and canceled orders will appear here.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order: any) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{
                      transition: 'background 0.18s',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'grey.50',
                      },
                    }}
                  >
                    {/* Client */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{order.client}</Typography>
                    </TableCell>
                    {/* Service */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{order.service.title}</Typography>
                    </TableCell>
                    {/* Amount */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{formatCurrency(order.amount)}</Typography>
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={order.status}
                          size="small"
                          sx={{
                            backgroundColor: order.status === 'Complete' ? '#10b981' : 
                                            order.status === 'Canceled' ? '#ef4444' : theme.palette.info.main,
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            height: 24,
                            borderRadius: '12px',
                            textTransform: 'capitalize',
                            px: 2,
                          }}
                        />
                        {order.status === 'Complete' && (
                          <Tooltip title="Order completed" arrow placement="top">
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: 20,
                              height: 20,
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              borderRadius: '50%',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              <CheckCircleIcon sx={{ fontSize: 12, color: '#10b981' }} />
                            </Box>
                          </Tooltip>
                        )}
                        {order.status === 'Canceled' && (
                          <Tooltip title="Order canceled" arrow placement="top">
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: 20,
                              height: 20,
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              borderRadius: '50%',
                              border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                              <CancelIcon sx={{ fontSize: 12, color: '#ef4444' }} />
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    {/* Date */}
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{formatDate(order.date)}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
