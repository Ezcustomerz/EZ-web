import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  PersonOutlined,
  AccessTime,
  MusicNote,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';

interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  lastSession: string;
  totalSessions: number;
  genre: string;
  avatar?: string;
}

// Mock client data
const mockClients: Client[] = [
  {
    id: '1',
    name: 'Alex Rodriguez',
    email: 'alex@example.com',
    status: 'active',
    lastSession: '2 hours ago',
    totalSessions: 12,
    genre: 'Hip-Hop',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    status: 'active',
    lastSession: '1 day ago',
    totalSessions: 8,
    genre: 'R&B',
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@example.com',
    status: 'inactive',
    lastSession: '2 weeks ago',
    totalSessions: 15,
    genre: 'Pop',
  },
  {
    id: '4',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    status: 'active',
    lastSession: '3 days ago',
    totalSessions: 6,
    genre: 'Electronic',
  },
];

export function ClientProducer() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [clients] = useState<Client[]>(mockClients);

  function handleNavItemChange(item: string) {
    switch (item) {
      case 'dashboard':
        navigate('/producer');
        break;
      case 'clients':
        navigate('/producer/clients');
        break;
      case 'income':
        navigate('/producer/income');
        break;
      case 'public':
        navigate('/producer/public');
        break;
      default:
        break;
    }
  }

  function handleInviteClient() {
    console.log('Invite client clicked');
    // Add your invite client logic here
  }

  function handleClientClick(clientId: string) {
    console.log('Navigate to client detail:', clientId);
    // Add navigation to client detail page
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#3B82F6',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        };
      case 'inactive':
        return {
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          color: '#6B7280',
          border: '1px solid rgba(156, 163, 175, 0.2)',
        };
      default:
        return {};
    }
  }

  // Filter clients based on search and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.genre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const EmptyState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        textAlign: 'center',
      }}
    >
      <PersonOutlined
        sx={{
          fontSize: 80,
          color: 'text.secondary',
          mb: 2,
        }}
      />
      <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
        You haven't added any clients yet
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Click "Invite Client" to get started and begin managing your music production clients.
      </Typography>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleInviteClient}
        sx={{
          px: 3,
          py: 1.5,
          borderRadius: 2,
        }}
      >
        Invite Client
      </Button>
    </Box>
  );

  const ClientCard = ({ client }: { client: Client }) => (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        },
        mb: 2,
      }}
      onClick={() => handleClientClick(client.id)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              backgroundColor: theme.palette.primary.main,
              mr: 2,
              fontWeight: 600,
            }}
          >
            {getInitials(client.name)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {client.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {client.email}
            </Typography>
          </Box>
          <Chip
            label={client.status}
            size="small"
            sx={{
              ...getStatusColor(client.status),
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Stack direction="row" spacing={3} sx={{ color: 'text.secondary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MusicNote fontSize="small" />
            <Typography variant="body2">{client.genre}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime fontSize="small" />
            <Typography variant="body2">{client.lastSession}</Typography>
          </Box>
          <Typography variant="body2">
            {client.totalSessions} sessions
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <LayoutProducer selectedNavItem="clients" onNavItemChange={handleNavItemChange}>
      <Box sx={{ p: 3 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            mb: 4,
            gap: isMobile ? 2 : 0,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 0.5,
              }}
            >
              Clients
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: '1.1rem',
              }}
            >
              Manage your ongoing and past clients
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleInviteClient}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Invite Client
          </Button>
        </Box>

        {/* Search and Filter Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('all')}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              All Clients
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('active')}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('inactive')}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Inactive
            </Button>
          </Box>
        </Box>

        {/* Client List */}
        {filteredClients.length === 0 ? (
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <EmptyState />
          </Paper>
        ) : (
          <>
            {isMobile ? (
              // Mobile Card Layout
              <Box>
                {filteredClients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </Box>
            ) : (
              // Desktop Table Layout
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: theme.shadows[1],
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Genre</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Session</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Total Sessions</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 50 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        hover
                        onClick={() => handleClientClick(client.id)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: theme.palette.primary.main,
                                mr: 2,
                                fontWeight: 600,
                              }}
                            >
                              {getInitials(client.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {client.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {client.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={client.status}
                            size="small"
                            sx={{
                              ...getStatusColor(client.status),
                              fontWeight: 500,
                              textTransform: 'capitalize',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <MusicNote fontSize="small" color="action" />
                            <Typography variant="body2">{client.genre}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {client.lastSession}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {client.totalSessions}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnchorEl(e.currentTarget);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: { borderRadius: 2 },
          }}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>View Details</MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>Edit Client</MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>Send Message</MenuItem>
          <Divider />
          <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: 'error.main' }}>
            Remove Client
          </MenuItem>
        </Menu>
      </Box>
    </LayoutProducer>
  );
} 