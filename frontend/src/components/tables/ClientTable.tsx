import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  InputAdornment,
  useTheme,
  Tooltip,
  Stack,
  IconButton,
  Skeleton,
  Card,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  PersonAddOutlined,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ArrowDropUp,
  ArrowDropDown,
  SwapVert,
  Groups,
  AttachMoney,
  Folder,
} from '@mui/icons-material';
import { useState } from 'react';
import { type CreativeClient } from '../../api/userService';

type SortField = 'name' | 'totalSpent' | 'projects';
type SortDirection = 'asc' | 'desc' | null;

interface ClientTableProps {
  clients: CreativeClient[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  onInviteClient: () => void;
  onClientClick?: (client: CreativeClient) => void;
  itemsPerPage?: number;
  loading?: boolean;
}

export const mockClients: CreativeClient[] = [
 
];

function EmptyClientState({ onInviteClient }: { onInviteClient: () => void }) {
  const theme = useTheme();
  return (
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
      }}
    >
      <Groups
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
        No Clients Found
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
        Invite a client to start managing collaborations and sessions or try adjusting your search or filter criteria.
      </Typography>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PersonAddOutlined />}
        onClick={onInviteClient}
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
        Invite Client
      </Button>
    </Box>
  );
}

export function ClientTable({
  clients,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onInviteClient,
  onClientClick,
  loading = false,
}: ClientTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [hoveredSort, setHoveredSort] = useState<SortField | null>(null);

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort clients
  const filteredAndSortedClients = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortField || !sortDirection) {
        if (a.status !== b.status) {
          return a.status === 'active' ? -1 : 1;
        }
        return b.totalSpent - a.totalSpent;
      }
      let aValue: any;
      let bValue: any;
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'totalSpent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case 'projects':
          aValue = a.projects;
          bValue = b.projects;
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

  // Remove pagination logic, just scroll all filtered/sorted clients
  const totalItems = filteredAndSortedClients.length;
  const handleSearchChange = (value: string) => {
    onSearchChange(value);
  };
  const handleStatusFilterChange = (value: 'all' | 'active' | 'inactive') => {
    onStatusFilterChange(value);
  };

  const getStatusChipProps = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'active',
          sx: {
            backgroundColor: '#22c55e',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 500,
            height: 24,
            borderRadius: '12px',
            textTransform: 'lowercase' as const,
          },
        };
      case 'inactive':
        return {
          label: 'inactive',
          sx: {
            backgroundColor: '#2563eb',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 500,
            height: 24,
            borderRadius: '12px',
            textTransform: 'lowercase' as const,
          },
        };
      default:
        return {
          label: status,
          sx: {
            backgroundColor: '#6b7280',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 500,
            height: 24,
            borderRadius: '12px',
            textTransform: 'lowercase' as const,
          },
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSortTooltip = (field: SortField) => {
    if (sortField !== field) {
      return 'Click to sort ascending';
    } else if (sortDirection === 'asc') {
      return 'Click to sort descending';
    } else {
      return 'Click to clear sorting';
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <SwapVert sx={{
          fontSize: 18,
          ml: 0.5,
          color: 'text.disabled',
          opacity: 0.4,
          transition: 'all 0.2s ease',
        }} />
      );
    } else if (sortDirection === 'asc') {
      return (
        <ArrowDropUp sx={{
          fontSize: 20,
          ml: 0.5,
          color: 'primary.main',
          transition: 'all 0.2s ease',
        }} />
      );
    } else {
      return (
        <ArrowDropDown sx={{
          fontSize: 20,
          ml: 0.5,
          color: 'primary.main',
          transition: 'all 0.2s ease',
        }} />
      );
    }
  };

  return (
    <Paper
      sx={{
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        p: 2,
        flex: '1 1 0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        '@media (max-height: 784px)': {
          p: 2,
        },
      }}
    >
      {/* Search, Filter, and Invite Controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          mb: 1,
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          '@media (max-height: 784px)': {
            mb: 1,
            gap: 1.5,
          },
        }}
      >
        {loading ? (
          // Skeleton for search and count
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1, width: { xs: '100%', md: 280 } }} />
            <Skeleton variant="text" width={80} height={20} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
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
            <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1, minWidth: 80 }}>
              {filteredAndSortedClients.length} client{filteredAndSortedClients.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexDirection: 'row',
            width: { xs: '100%', md: 'auto' },
          }}
        >
          {loading ? (
            // Skeleton for filter and invite button
            <>
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1, width: { xs: '100%', md: 120 } }} />
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1.5, width: { xs: '100%', md: 140 } }} />
            </>
          ) : (
            <>
              <FormControl
                size="small"
                sx={{
                  minWidth: { xs: 110, sm: 120 },
                  width: { xs: 'auto', sm: 'auto' },
                  flex: { xs: 1, sm: 'none' },
                }}
              >
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
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
                  <MenuItem value="all" disableRipple>Both</MenuItem>
                  <MenuItem value="active" disableRipple>Active</MenuItem>
                  <MenuItem value="inactive" disableRipple>Inactive</MenuItem>
                </Select>
              </FormControl>
              <Button
            variant="contained"
            startIcon={<PersonAddOutlined sx={{ fontSize: 18 }} />}
            onClick={onInviteClient}
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
                background: 'rgba(255, 255, 255, 0.8)',
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
                background: 'rgba(255, 255, 255, 0.6)',
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
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 1,
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
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 1,
                transform: 'scale(0)',
                opacity: 0,
                transition: 'all 0.2s ease-in-out',
              }}
            />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Invite Client</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Invite</Box>
          </Button>
            </>
          )}
        </Box>
      </Box>
      {/* Clients Table */}
      {/* MOBILE CARD LIST */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          maxHeight: totalItems === 0 ? 'none' : { xs: 'calc(100dvh - 120px)', md: 'none' },
          overflowY: totalItems === 0 ? 'hidden' : { xs: 'auto', md: 'unset' },
          pt: 2,
        }}
      >
        {loading ? (
          // Mobile card skeletons
          <>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Card
                key={`skeleton-${idx}`}
                elevation={1}
                sx={{
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  animation: `fadeIn 0.5s ease-in ${idx * 0.1}s both`,
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Skeleton variant="text" width="40%" height={24} />
                    <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: '12px' }} />
                  </Stack>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Skeleton variant="circular" width={20} height={20} />
                    <Skeleton variant="text" width={80} height={18} />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Skeleton variant="circular" width={20} height={20} />
                    <Skeleton variant="text" width={100} height={18} />
                  </Stack>
                </Stack>
              </Card>
            ))}
          </>
        ) : totalItems === 0 ? (
          <Box
            sx={{
              width: '100%',
              maxWidth: 400,
              mx: 'auto',
              py: 6,
              textAlign: 'center',
              minHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <EmptyClientState onInviteClient={onInviteClient} />
          </Box>
        ) : (
          filteredAndSortedClients.map((client) => (
            <Card
              key={client.id}
              elevation={1}
              tabIndex={0}
              aria-label={`Client ${client.name}, status ${client.status}, contact ${client.contact}, total spent ${formatCurrency(client.totalSpent)}, ${client.projects} projects`}
              onClick={() => onClientClick?.(client)}
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
                  <Typography variant="subtitle1" fontWeight={600}>{client.name}</Typography>
                  <Chip {...getStatusChipProps(client.status)} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95em', mb: 0.5 }}>{client.contact}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AttachMoney fontSize="small" color="action" />
                  <Typography variant="body2"><strong>{formatCurrency(client.totalSpent)}</strong></Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Folder fontSize="small" color="action" />
                  <Typography variant="body2">{client.projects} project{client.projects !== 1 ? 's' : ''}</Typography>
                </Stack>
              </Stack>
            </Card>
          ))
        )}
      </Box>
      {/* DESKTOP TABLE */}
      <TableContainer
        sx={{
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          flex: totalItems === 0 ? '0 1 auto' : '1 1 0',
          height: totalItems === 0 ? 'auto' : undefined,
          minHeight: totalItems === 0 ? 'auto' : 0,
          maxHeight: totalItems === 0 ? 'none' : undefined,
          overflowY: totalItems === 0 ? 'hidden' : 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Table sx={{ minWidth: 0, width: '100%' }}>
          <TableHead>
            <TableRow sx={{
              backgroundColor: '#e6f3fa',
            }}>
              <TableCell
                onClick={() => handleSort('name')}
                onMouseEnter={() => setHoveredSort('name')}
                onMouseLeave={() => setHoveredSort(null)}
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: sortField === 'name' ? 'primary.main' : 'text.primary',
                  fontWeight: sortField === 'name' ? 700 : 600,
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
                  <Tooltip title={getSortTooltip('name')} arrow placement="top" open={hoveredSort === 'name'}>
                    <span>{getSortIcon('name')}</span>
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
                Contact
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Status
                  <Tooltip title="Active means the client is currently engaged in a project or session." arrow>
                    <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell
                onClick={() => handleSort('totalSpent')}
                onMouseEnter={() => setHoveredSort('totalSpent')}
                onMouseLeave={() => setHoveredSort(null)}
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: sortField === 'totalSpent' ? 'primary.main' : 'text.primary',
                  fontWeight: sortField === 'totalSpent' ? 700 : 600,
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
                  Total Revenue
                  <Tooltip title={getSortTooltip('totalSpent')} arrow placement="top" open={hoveredSort === 'totalSpent'}>
                    <span>{getSortIcon('totalSpent')}</span>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell
                onClick={() => handleSort('projects')}
                onMouseEnter={() => setHoveredSort('projects')}
                onMouseLeave={() => setHoveredSort(null)}
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: sortField === 'projects' ? 'primary.main' : 'text.primary',
                  fontWeight: sortField === 'projects' ? 700 : 600,
                  transition: 'all 0.2s ease',
                  minWidth: { xs: 100, sm: 'auto' },
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
                  Projects
                  <Tooltip title={getSortTooltip('projects')} arrow placement="top" open={hoveredSort === 'projects'}>
                    <span>{getSortIcon('projects')}</span>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Desktop table row skeletons
              Array.from({ length: 10 }).map((_, idx) => (
                <TableRow
                  key={`skeleton-row-${idx}`}
                  sx={{
                    animation: `fadeIn 0.5s ease-in ${idx * 0.08}s both`,
                    '@keyframes fadeIn': {
                      from: { opacity: 0 },
                      to: { opacity: 1 },
                    },
                  }}
                >
                  <TableCell><Skeleton variant="text" width="80%" height={20} /></TableCell>
                  <TableCell><Skeleton variant="text" width="70%" height={20} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: '12px' }} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} height={20} /></TableCell>
                  <TableCell><Skeleton variant="text" width={40} height={20} /></TableCell>
                </TableRow>
              ))
            ) : totalItems === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  sx={{
                    border: 0,
                    p: 0,
                    height: '100%',
                    verticalAlign: 'middle',
                    width: '100%',
                    overflowX: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      maxWidth: 600,
                      mx: 'auto',
                      px: 0,
                      py: 6,
                      textAlign: 'center',
                      minHeight: 0,
                      color: 'text.secondary',
                      overflowX: 'hidden',
                    }}
                  >
                    <EmptyClientState onInviteClient={onInviteClient} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedClients.map((client) => (
                <TableRow
                  key={client.id}
                  onClick={() => onClientClick?.(client)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'grey.50',
                    },
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        fontSize: { xs: '0.85rem', md: '1rem' },
                      }}
                    >
                      {client.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: { xs: '0.8rem', md: '0.875rem' },
                      }}
                    >
                      {client.contact}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip {...getStatusChipProps(client.status)} />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        fontSize: { xs: '0.8rem', md: '0.875rem' },
                      }}
                    >
                      {formatCurrency(client.totalSpent)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        fontSize: { xs: '0.8rem', md: '0.875rem' },
                      }}
                    >
                      {client.projects}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* No pagination or count info, just scrollable table */}
    </Paper>
  );
} 