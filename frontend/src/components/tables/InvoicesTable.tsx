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
  Alert,
  Stack,
} from '@mui/material';
import { ArrowDropUp, ArrowDropDown, SwapVert, Search as SearchIcon, Payment as PaymentIcon, ReceiptLong, FilterList as FilterIcon } from '@mui/icons-material';
import Card from '@mui/material/Card';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';

export const mockInvoices = [
  {
    id: 'inv-1',
    client: 'Alice Johnson',
    service: { title: 'Piano Lesson', desc: 'Beginner piano session' },
    amount: 120,
    status: 'Paid',
    date: '2024-05-01',
  },
  {
    id: 'inv-2',
    client: 'Bob Smith',
    service: { title: 'Guitar Lesson', desc: 'Intermediate guitar session' },
    amount: 90,
    status: 'Waiting',
    date: '2024-05-03',
  },
  {
    id: 'inv-3',
    client: 'Carol Lee',
    service: { title: 'Vocal Coaching', desc: 'Advanced vocal session' },
    amount: 150,
    status: 'Overdue',
    date: '2024-04-28',
  },
  {
    id: 'inv-4',
    client: 'David Kim',
    service: { title: 'Drum Lesson', desc: 'Beginner drum session' },
    amount: 110,
    status: 'Paid',
    date: '2024-05-02',
  },
  {
    id: 'inv-5',
    client: 'Eve White',
    service: { title: 'Bass Lesson', desc: 'Beginner bass session' },
    amount: 130,
    status: 'Paid',
    date: '2024-05-04',
  },
  {
    id: 'inv-6',
    client: 'Frank Green',
    service: { title: 'Saxophone Lesson', desc: 'Beginner saxophone session' },
    amount: 140,
    status: 'Paid',
    date: '2024-05-05',
  },
  {
    id: 'inv-7',
    client: 'Grace Brown',
    service: { title: 'Violin Lesson', desc: 'Beginner violin session' },
    amount: 160,
    status: 'Paid',
    date: '2024-05-06',
  },
  {
    id: 'inv-8',
    client: 'Henry Davis',
    service: { title: 'Flute Lesson', desc: 'Beginner flute session' },
    amount: 170,
    status: 'Paid',
    date: '2024-05-07',
  },
  {
    id: 'inv-9',
    client: 'Ivy Wilson',
    service: { title: 'Clarinet Lesson', desc: 'Beginner clarinet session' },
    amount: 180,
    status: 'Paid',
    date: '2024-05-08',
  },
  {
    id: 'inv-10',
    client: 'Jackie Brown',
    service: { title: 'Oboe Lesson', desc: 'Beginner oboe session' },
    amount: 190,
    status: 'Paid',
    date: '2024-05-09',
  },
  {
    id: 'inv-11',
    client: 'John Doe',
    service: { title: 'Piano Lesson', desc: 'Beginner piano session' },
    amount: 120,
    status: 'Paid',
    date: '2024-05-01',
  },
  {
    id: 'inv-12',
    client: 'John Doe',
    service: { title: 'Piano Lesson', desc: 'Beginner piano session' },
    amount: 120,
    status: 'Paid',
    date: '2024-05-01',
  },
];

type SortField = 'client' | 'service' | 'amount' | 'date' | undefined;
type SortDirection = 'asc' | 'desc' | undefined;

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function InvoicesTable({ invoices }: { invoices?: typeof mockInvoices }) {
  const theme = useTheme();
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hoveredSort, setHoveredSort] = useState<SortField | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = useMemo(() => {
    let data = filter === 'All' ? (invoices ?? mockInvoices) : (invoices ?? mockInvoices).filter((inv) => inv.status === filter);
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(inv =>
        inv.client.toLowerCase().includes(lower) ||
        inv.service.title.toLowerCase().includes(lower)
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
  }, [filter, sortField, sortDirection, searchTerm, invoices]);

  // Table is now fully scrollable, no pagination

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
            pt: 2,
            pb: 1,
          }}
        >
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', ml: 1, minWidth: 80 }}>
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
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
                  <MenuItem value="All" disableRipple>All</MenuItem>
                  <MenuItem value="Paid" disableRipple>Paid</MenuItem>
                  <MenuItem value="Waiting" disableRipple>Waiting</MenuItem>
                  <MenuItem value="Overdue" disableRipple>Overdue</MenuItem>
                </Select>
              </FormControl>
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
                  minWidth: 'auto',
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
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
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
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.5)',
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
              >
                <Box
                  className="spark-element"
                  sx={{
                    position: 'absolute',
                    top: '10%',
                    right: '10%',
                    width: 2,
                    height: 2,
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
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
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  }}
                />
                Payment
              </Button>
            </Box>
          </Stack>
        </Box>
        {/* Card List */}
        <Box sx={{ pt: 2 }}>
          {filteredInvoices.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>No invoices found</Alert>
          ) : (
            filteredInvoices.map((inv) => (
              <Card
                key={inv.id}
                elevation={1}
                tabIndex={0}
                aria-label={`Invoice for ${inv.client}, ${inv.status}, ${formatCurrency(inv.amount)}, ${formatDate(inv.date)}`}
                sx={{
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  cursor: 'pointer',
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
                    <Typography variant="subtitle1" fontWeight={600}>{inv.client}</Typography>
                    <Chip label={inv.status} color={inv.status === 'Paid' ? 'success' : inv.status === 'Waiting' ? 'warning' : 'error'} size="small" sx={{ fontWeight: 500, px: 1.5, height: 22, borderRadius: 1.5, boxShadow: 'none', fontSize: '0.8rem' }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95em', mb: 0.5 }}>{inv.service.title}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AttachMoneyIcon fontSize="small" color="action" />
                    <Typography variant="body2"><strong>{formatCurrency(inv.amount)}</strong></Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EventIcon fontSize="small" color="action" />
                    <Typography variant="body2">{formatDate(inv.date)}</Typography>
                  </Stack>
                </Stack>
              </Card>
            ))
          )}
        </Box>
      </Box>
      {/* --- DESKTOP ONLY --- */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', height: '100%' }}>
        {/* Controls: Search, Filter, Request Payment */}
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
                width: 280,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                },
              }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95em', ml: 1, minWidth: 80 }}>
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
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
                <MenuItem value="All" disableRipple>All</MenuItem>
                <MenuItem value="Paid" disableRipple>Paid</MenuItem>
                <MenuItem value="Waiting" disableRipple>Waiting</MenuItem>
                <MenuItem value="Overdue" disableRipple>Overdue</MenuItem>
              </Select>
            </FormControl>
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
                minWidth: 'auto',
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
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
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
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                },
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.5)',
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
            >
              <Box
                className="spark-element"
                sx={{
                  position: 'absolute',
                  top: '10%',
                  right: '10%',
                  width: 2,
                  height: 2,
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
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
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                }}
              />
              Payment
            </Button>
          </Box>
        </Box>
        {/* Table and rest of desktop content... */}
        <TableContainer
          sx={{
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            width: '100%',
            p: 0,
            overflow: 'auto',
            flex: '1 1 0',
            minHeight: 0,
          }}
        >
          {/* Desktop Table */}
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
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ border: 0, p: 0, height: '100%', verticalAlign: 'middle' }}>
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
                        mt: { xs: 2, md: 4 },
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
                        No Invoices Found
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
                        Try adjusting your filters or request a payment.
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
                        onClick={() => {/* TODO: handle request payment */ }}
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
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv: any) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
} 