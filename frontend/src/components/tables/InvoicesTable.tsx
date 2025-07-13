import React, { useMemo, useState } from 'react';
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
} from '@mui/material';
import { ArrowDropUp, ArrowDropDown, SwapVert, Search as SearchIcon, Payment as PaymentIcon, ReceiptLong } from '@mui/icons-material';
import Pagination from '@mui/material/Pagination';

// Remove all mock invoice data
const mockInvoices: Array<{
  id: string;
  client: string;
  service: { title: string; desc: string };
  amount: number;
  status: string;
  date: string;
}> = [];

const statusOptions = ['All', 'Paid', 'Waiting', 'Overdue'];

type InvoiceStatus = 'Paid' | 'Waiting' | 'Overdue';

type SortField = 'client' | 'service' | 'amount' | 'date' | undefined;
type SortDirection = 'asc' | 'desc' | undefined;

function getStatusColor(status: InvoiceStatus, theme: any) {
  switch (status) {
    case 'Paid':
      return {
        bg: theme.palette.success.light,
        color: theme.palette.success.dark,
        border: `1px solid ${theme.palette.success.main}`,
      };
    case 'Waiting':
      return {
        bg: theme.palette.warning.light,
        color: theme.palette.warning.dark,
        border: `1px solid ${theme.palette.warning.main}`,
      };
    case 'Overdue':
      return {
        bg: theme.palette.error.light,
        color: theme.palette.error.dark,
        border: `1px solid ${theme.palette.error.main}`,
      };
    default:
      return {};
  }
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function InvoicesTable() {
  const theme = useTheme();
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hoveredSort, setHoveredSort] = useState<SortField | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = useMemo(() => {
    let invoices = filter === 'All' ? mockInvoices : mockInvoices.filter((inv) => inv.status === filter);
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      invoices = invoices.filter(inv =>
        inv.client.toLowerCase().includes(lower) ||
        inv.service.title.toLowerCase().includes(lower)
      );
    }
    if (!sortField || !sortDirection) return invoices;
    return [...invoices].sort((a, b) => {
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
  }, [filter, sortField, sortDirection, searchTerm]);

  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = filteredInvoices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

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
    <>
      {/* Controls: Search, Filter, Request Payment */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', my: 2, flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        {/* Search Bar */}
        <TextField
          placeholder="Search invoices..."
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
            width: { xs: '100%', md: 280 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              backgroundColor: 'background.paper',
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          {/* Filter Dropdown */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="invoice-status-filter-label">Status</InputLabel>
            <Select
              labelId="invoice-status-filter-label"
              value={filter}
              label="Status"
              onChange={(e) => setFilter(e.target.value)}
              sx={{ borderRadius: 1, backgroundColor: 'background.paper' }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 1,
                    mt: 1,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    '& .MuiMenuItem-root': {
                      py: 1,
                      px: 2,
                      borderRadius: 0,
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        transform: 'translateX(4px)',
                        fontWeight: 600,
                        color: 'primary.main',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'transparent',
                        fontWeight: 600,
                        color: 'text.primary',
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'transparent',
                        color: 'primary.main',
                      },
                      '&.Mui-focusVisible': {
                        backgroundColor: 'transparent',
                      },
                    },
                  },
                },
              }}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status} disableRipple>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Request Payment Button */}
          <Button
            variant="contained"
            startIcon={<PaymentIcon sx={{ fontSize: 18 }} />}
            size="small"
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: 2,
              px: 3,
              height: '40px',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.9rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
              transition: 'all 0.2s ease-in-out',
              minWidth: { xs: 'auto', sm: 'auto' },
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.5)',
              },
            }}
          >
            Request Payment
          </Button>
        </Box>
      </Box>
      {/* Table */}
      <TableContainer sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 1, border: `1px solid ${theme.palette.divider}`, minHeight: 400, height: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {filteredInvoices.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: { xs: 6, md: 8 },
              px: { xs: 2, md: 4 },
              textAlign: 'center',
              minHeight: { xs: '350px', md: '400px' },
              position: 'relative',
              background: `radial-gradient(circle at center, \
                ${theme.palette.info.main}08 0%, \
                ${theme.palette.primary.main}05 40%, \
                transparent 70%)`,
              borderRadius: 2,
              animation: 'fadeIn 0.6s ease-out 0.5s both',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(ellipse at center, \
                  ${theme.palette.info.main}03 0%, \
                  transparent 50%)`,
                borderRadius: 2,
                pointerEvents: 'none',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                background: `radial-gradient(ellipse at center, \
                  ${theme.palette.primary.main}02 0%, \
                  transparent 60%)`,
                borderRadius: 2,
                zIndex: -1,
                pointerEvents: 'none',
              },
              mt: { xs: 6, md: 10 },
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
              No Invoices Yet
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
              Request your first payment to start tracking invoices.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PaymentIcon />}
              sx={{
                borderColor: theme.palette.info.main,
                color: theme.palette.info.main,
                fontSize: '0.8rem',
                fontWeight: 500,
                px: 2.5,
                height: '40px',
                borderRadius: 1.5,
                textTransform: 'none',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out',
                zIndex: 1,
                '@keyframes sparkle': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '50%': { transform: 'scale(1) rotate(180deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '@keyframes sparkle2': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '60%': { transform: 'scale(1) rotate(240deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '@keyframes sparkle3': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '40%': { transform: 'scale(1) rotate(120deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '20%',
                  left: '15%',
                  width: 4,
                  height: 4,
                  background: theme.palette.info.main,
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '70%',
                  right: '20%',
                  width: 3,
                  height: 3,
                  background: theme.palette.info.main,
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                },
                '&:hover': {
                  borderColor: theme.palette.info.main,
                  backgroundColor: `${theme.palette.info.main}08`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${theme.palette.info.main}20`,
                  '&::before': {
                    animation: 'sparkle 0.8s ease-in-out',
                  },
                  '&::after': {
                    animation: 'sparkle2 0.8s ease-in-out 0.1s',
                  },
                  '& .spark-element': {
                    '&:nth-of-type(1)': {
                      animation: 'sparkle3 0.8s ease-in-out 0.2s',
                    },
                    '&:nth-of-type(2)': {
                      animation: 'sparkle 0.8s ease-in-out 0.3s',
                    },
                  },
                },
              }}
              onClick={() => {/* TODO: handle request payment */}}
            >
              <Box
                className="spark-element"
                sx={{
                  position: 'absolute',
                  top: '10%',
                  right: '10%',
                  width: 2,
                  height: 2,
                  background: theme.palette.info.main,
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                }}
              />
              <Box
                className="spark-element"
                sx={{
                  position: 'absolute',
                  bottom: '15%',
                  left: '25%',
                  width: 2,
                  height: 2,
                  background: theme.palette.info.main,
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                }}
              />
              Request Payment
            </Button>
          </Box>
        ) : (
          <>
            <Table sx={{ minWidth: 650, flexGrow: 0 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: `${theme.palette.info.main}1A` }}>
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
                    onClick={() => handleSort('service')}
                    onMouseEnter={() => setHoveredSort('service')}
                    onMouseLeave={() => setHoveredSort(null)}
                    sx={{
                      cursor: 'pointer',
                      userSelect: 'none',
                      color: sortField === 'service' ? 'primary.main' : 'text.primary',
                      fontWeight: sortField === 'service' ? 700 : 600,
                      transition: 'all 0.2s ease',
                      minWidth: { xs: 140, sm: 'auto' },
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
                      Service
                      <Tooltip title={getSortTooltip('service')} arrow placement="top" open={hoveredSort === 'service'}>
                        <span>{getSortIcon('service')}</span>
                      </Tooltip>
                    </Box>
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
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>Status</TableCell>
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
                {paginatedInvoices.map((inv) => (
                  <TableRow
                    key={inv.id}
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
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{inv.client}</Typography>
                    </TableCell>
                    {/* Service */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{inv.service.title}</Typography>
                    </TableCell>
                    {/* Amount */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{formatCurrency(inv.amount)}</Typography>
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                      <Chip
                        label={inv.status}
                        size="small"
                        sx={{
                          backgroundColor:
                            inv.status === 'Paid'
                              ? theme.palette.success.main
                              : inv.status === 'Waiting'
                              ? theme.palette.warning.main
                              : theme.palette.error.main,
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          height: 24,
                          borderRadius: '12px',
                          textTransform: 'capitalize',
                          px: 2,
                        }}
                      />
                    </TableCell>
                    {/* Date */}
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>{formatDate(inv.date)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Filler to push border to bottom */}
            <Box sx={{ flexGrow: 1 }} />
          </>
        )}
      </TableContainer>
      {/* Pagination Controls */}
      {totalItems > 0 && (
        <Box sx={{
          display: 'flex',
          justifyContent: { xs: 'center', md: 'space-between' },
          alignItems: 'center',
          mt: 2,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 },
        }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setCurrentPage(value)}
            color="primary"
            size="small"
            siblingCount={0}
            boundaryCount={1}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.8rem', md: '0.875rem' },
              textAlign: 'center',
            }}
          >
            {totalItems <= itemsPerPage || totalPages === 1
              ? `Showing ${totalItems} of ${totalItems}`
              : `Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems}`}
          </Typography>
        </Box>
      )}
    </>
  );
} 