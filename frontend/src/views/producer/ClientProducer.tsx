import { useState } from 'react';
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
  Pagination,
} from '@mui/material';
import {
  PersonAddOutlined,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ArrowDropUp,
  ArrowDropDown,
  SwapVert,
  Groups,
} from '@mui/icons-material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';

interface Client {
  id: string;
  name: string;
  contact: string;
  contactType: 'email' | 'phone';
  status: 'active' | 'inactive';
  totalSpent: number;
  projects: number;
}

type SortField = 'name' | 'totalSpent' | 'projects';
type SortDirection = 'asc' | 'desc' | null;

// Mock client data
const mockClients: Client[] = [];

// Empty Client State Component
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
        // Soft gradient background matching activity feed
        background: `radial-gradient(circle at center, 
          ${theme.palette.info.main}08 0%, 
          ${theme.palette.primary.main}05 40%, 
          transparent 70%)`,
        borderRadius: 2,
        animation: 'fadeIn 0.6s ease-out 0.5s both',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        // Add subtle inner glow effect
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at center, 
            ${theme.palette.info.main}03 0%, 
            transparent 50%)`,
          borderRadius: 2,
          pointerEvents: 'none',
        },
        // Add outer glow
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          background: `radial-gradient(ellipse at center, 
            ${theme.palette.primary.main}02 0%, 
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
        No Clients Yet
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
        Invite your first client to start managing collaborations and sessions.
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
          py: 0.75,
          borderRadius: 1.5,
          textTransform: 'none',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
          zIndex: 1,
          // Spark animations
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
          // Spark elements
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

export function ClientProducer() {
  const theme = useTheme();
  const [clients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Same column clicked - cycle through asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      // Different column clicked - start with ascending
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
      if (!sortField || !sortDirection) return 0;

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

  // Calculate pagination
  const totalItems = filteredAndSortedClients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredAndSortedClients.slice(startIndex, endIndex);

  // Reset to first page when search/filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleInviteClient = () => {
    console.log('Invite client clicked');
  };

  const getStatusChipProps = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'active',
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
      case 'inactive':
        return {
          label: 'inactive',
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

  const getSortIcon = (field: SortField) => {
    let tooltipText = '';
    let icon;
    
    if (sortField !== field) {
      // Show neutral sorting icon for sortable columns
      tooltipText = 'Click to sort ascending';
      icon = (
        <SwapVert sx={{ 
          fontSize: 18, 
          ml: 0.5, 
          color: 'text.disabled',
          opacity: 0.4,
          transition: 'all 0.2s ease',
        }} />
      );
    } else if (sortDirection === 'asc') {
      tooltipText = 'Click to sort descending';
      icon = (
        <ArrowDropUp sx={{ 
          fontSize: 20, 
          ml: 0.5, 
          color: 'primary.main',
          transition: 'all 0.2s ease',
        }} />
      );
    } else {
      tooltipText = 'Click to clear sorting';
      icon = (
        <ArrowDropDown sx={{ 
          fontSize: 20, 
          ml: 0.5, 
          color: 'primary.main',
          transition: 'all 0.2s ease',
        }} />
      );
    }
    
    return (
      <Tooltip title={tooltipText} arrow placement="top">
        {icon}
      </Tooltip>
    );
  };

  return (
    <LayoutProducer selectedNavItem="clients">
      <Box sx={{ 
        p: { xs: 2, sm: 3, md: 4 }, 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
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
        // Compact layout for small height screens
        '@media (max-height: 780px)': {
          p: { xs: 1, sm: 2, md: 3 }, // Reduce padding
        },
      }}>
        {/* Header Section - Dashboard Style */}
        <Box 
          sx={{ 
            mb: 3,
            textAlign: { xs: 'center', md: 'left' }, // Center on mobile, left on desktop
            px: { xs: 2, md: 0 }, // Add padding on mobile
            // Compact header for small height screens
            '@media (max-height: 780px)': {
              mb: 2, // Reduce bottom margin
            },
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontSize: { xs: '1.4rem', sm: '1.5rem', md: '1.75rem' },
              fontWeight: 600,
              color: 'primary.main',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              mb: 0.25,
            }}
          >
            Clients
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
            Manage your client relationships and collaborations
          </Typography>
        </Box>

        {/* Section Divider */}
        <Box sx={{ 
          mb: 2,
          // Compact divider for small height screens
          '@media (max-height: 780px)': {
            mb: 1.5, // Reduce bottom margin
          },
        }}>
          <Box sx={{ 
            height: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
            width: '100%',
          }} />
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
          }}>
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'text.disabled',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
                          >
                Clients Table
              </Typography>
          </Box>
        </Box>

        {/* Client Management Card */}
        <Paper
          sx={{
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            p: 3,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            // Compact card for small height screens
            '@media (max-height: 780px)': {
              p: 2, // Reduce padding
            },
          }}
        >
          {/* Search, Filter, and Invite Controls */}
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
              mb: 3,
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              // Compact controls for small height screens
              '@media (max-height: 780px)': {
                mb: 2, // Reduce bottom margin
                gap: 1.5, // Reduce gap
              },
            }}
          >
            {/* Search Bar - Top on mobile, left on desktop */}
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

            {/* Controls - Bottom on mobile, right on desktop */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                flexDirection: 'row', // Always horizontal, even on mobile
                width: { xs: '100%', md: 'auto' },
              }}
            >
              {/* Filter Dropdown */}
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: { xs: 110, sm: 120 },
                  width: { xs: 'auto', sm: 'auto' },
                  flex: { xs: 1, sm: 'none' }, // Take remaining space on mobile
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

                             {/* Invite Client Button */}
               <Button
                 variant="contained"
                 startIcon={<PersonAddOutlined sx={{ fontSize: 18 }} />}
                 onClick={handleInviteClient}
                 sx={{
                   backgroundColor: 'primary.main',
                   color: 'white',
                   borderRadius: 2,
                   px: 3,
                   py: 1.5,
                   fontWeight: 600,
                   textTransform: 'none',
                   fontSize: '0.9rem',
                   position: 'relative',
                   overflow: 'hidden',
                   boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                   transition: 'all 0.2s ease-in-out',
                   minHeight: { xs: '48px', md: 'auto' }, // Better touch target on mobile
                   minWidth: { xs: 'auto', sm: 'auto' }, // Compact on mobile
                   // Spark animations
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
                   // Spark elements
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
            </Box>
          </Box>

          {/* Clients Table */}
          <TableContainer
            sx={{
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              flexGrow: 1,
              overflow: { xs: 'auto', sm: 'hidden' }, // Horizontal scroll only on mobile phones
              overflowY: 'auto', // Always allow vertical scroll
              maxHeight: totalItems === 0 ? 'auto' : 'calc(100% - 60px)', // Auto height for empty state
              minHeight: totalItems === 0 ? '450px' : 'auto', // Ensure minimum height for empty state
              // Improve mobile scrolling
              WebkitOverflowScrolling: 'touch',
              // Handle small vertical screens
              '@media (max-height: 780px)': {
                maxHeight: totalItems === 0 ? 'auto' : '350px', // Fixed height for small screens
                overflowY: 'auto', // Ensure vertical scroll
                overflow: 'auto', // Enable both horizontal and vertical scroll if needed
              },
            }}
          >
          <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}> {/* Force min width on mobile phones only */}
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: `${theme.palette.info.main}1A`,
              }}>
                <TableCell
                  onClick={() => handleSort('name')}
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortField === 'name' ? 'primary.main' : 'text.primary',
                    fontWeight: sortField === 'name' ? 700 : 600,
                    transition: 'all 0.2s ease',
                    minWidth: { xs: 160, sm: 'auto' }, // Min width on mobile phones only
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
                    {getSortIcon('name')}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    minWidth: { xs: 140, sm: 'auto' }, // Min width on mobile phones only
                  }}
                >
                  Contact
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    minWidth: { xs: 100, sm: 'auto' }, // Min width on mobile phones only
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  onClick={() => handleSort('totalSpent')}
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortField === 'totalSpent' ? 'primary.main' : 'text.primary',
                    fontWeight: sortField === 'totalSpent' ? 700 : 600,
                    transition: 'all 0.2s ease',
                    minWidth: { xs: 120, sm: 'auto' }, // Min width on mobile phones only
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
                    Total Spent
                    {getSortIcon('totalSpent')}
                  </Box>
                </TableCell>
                <TableCell
                  onClick={() => handleSort('projects')}
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortField === 'projects' ? 'primary.main' : 'text.primary',
                    fontWeight: sortField === 'projects' ? 700 : 600,
                    transition: 'all 0.2s ease',
                    minWidth: { xs: 100, sm: 'auto' }, // Min width on mobile phones only
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
                    {getSortIcon('projects')}
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {totalItems === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={5} // Spans all columns regardless of responsive hiding
                    sx={{ 
                      border: 0, 
                      p: 0,
                      height: { xs: '400px', md: '550px' }, // Smaller height on mobile
                      verticalAlign: 'middle',
                    }}
                  >
                    {clients.length === 0 ? (
                      <EmptyClientState onInviteClient={handleInviteClient} />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 8,
                          textAlign: 'center',
                          height: '100%',
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'text.secondary',
                            mb: 1,
                          }}
                        >
                          No clients found
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                          }}
                        >
                          Try adjusting your search or filter criteria
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClients.map((client) => (
                  <TableRow
                    key={client.id}
                    onClick={() => console.log('Client clicked:', client.name, client)}
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



        {/* Pagination Controls */}
        {totalItems > 0 && clients.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: { xs: 'center', md: 'space-between' },
              alignItems: 'center',
              mt: 2,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 0 },
            }}
          >
            {/* Pagination */}
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              color="primary"
              size="small"
              siblingCount={0} // Show fewer page numbers on mobile
              boundaryCount={1}
            />

            {/* Showing text */}
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
                : `Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems}`
              }
            </Typography>
          </Box>
        )}
      </Paper>
      </Box>
    </LayoutProducer>
  );
} 