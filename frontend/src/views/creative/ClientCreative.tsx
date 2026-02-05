import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { LayoutCreative } from '../../layout/creative/LayoutCreative';
import { ClientTable, mockClients } from '../../components/tables/ClientTable';
import { InviteClientPopover } from '../../components/popovers/creative/InviteClientPopover';
import { ClientDetailPopover } from '../../components/popovers/creative/ClientDetailPopover';
import { useInviteClient } from '../../hooks/useInviteClient';
import { userService, type CreativeClient } from '../../api/userService';
import { useAuth } from '../../context/auth';
import { errorToast } from '../../components/toast/toast';

export function ClientCreative() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState<CreativeClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { inviteClientOpen, handleInviteClient, closeInviteClient } = useInviteClient();
  const [selectedClient, setSelectedClient] = useState<CreativeClient | null>(null);
  const [clientDetailOpen, setClientDetailOpen] = useState(false);
  
  // Ref to prevent duplicate API calls (especially in React StrictMode)
  const fetchingRef = useRef(false);
  const lastAuthStateRef = useRef<boolean | null>(null);

  // Fetch clients when component mounts and user is authenticated
  useEffect(() => {
    const fetchClients = async () => {
      // Prevent duplicate calls if already fetching or auth state hasn't changed
      if (fetchingRef.current || lastAuthStateRef.current === isAuthenticated) {
        return;
      }

      fetchingRef.current = true;
      lastAuthStateRef.current = isAuthenticated;

      if (!isAuthenticated) {
        // In demo mode (not authenticated), use empty mock data
        setClients(mockClients);
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      try {
        setLoading(true);
        const response = await userService.getCreativeClients();
        setClients(response.clients);
      } catch {
        errorToast('Failed to load clients');
        setClients([]);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchClients();
  }, [isAuthenticated]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };
  const handleStatusFilterChange = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value);
  };

  const handleClientClick = (client: CreativeClient) => {
    setSelectedClient(client);
    setClientDetailOpen(true);
  };

  const handleCloseClientDetail = () => {
    setClientDetailOpen(false);
    setSelectedClient(null);
    // Remove clientId from URL when closing popover
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('clientId');
    setSearchParams(newSearchParams, { replace: true });
  };

  // Handle opening client popover from URL parameter
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    if (clientId && clients.length > 0) {
      // Match by user_id (which is the client_user_id from leaderboard)
      const client = clients.find(c => c.user_id === clientId);
      if (client) {
        setSelectedClient(client);
        setClientDetailOpen(true);
        // Remove clientId from URL after opening
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('clientId');
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [searchParams, clients, setSearchParams]);

  return (
    <LayoutCreative selectedNavItem="clients">
      <Box sx={{ 
        px: { xs: 2, sm: 2, md: 3 }, 
        pb: { xs: 2, sm: 2, md: 3 }, 
        pt: { md: 2 },
        display: 'flex', 
        flexDirection: 'column',
        minHeight: { xs: '100dvh', md: '100vh', lg: '100vh' },
        height: { xs: '100dvh', md: '100vh', lg: '100vh' },
        maxHeight: { xs: '100dvh', md: '100vh', lg: '100vh' },
        overflow: { xs: 'hidden', md: 'auto', lg: 'auto' },
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
        '@media (max-height: 784px)': {
          p: { xs: 1, sm: 1.5, md: 2 },
          pt: { md: 1 },
        },
      }}>
        {/* Header Section */}
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
        {/* Client Table */}
        <ClientTable
          clients={clients}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onInviteClient={handleInviteClient}
          onClientClick={handleClientClick}
          loading={loading}
        />

        {/* Invite Client Popover */}
        <InviteClientPopover
          open={inviteClientOpen}
          onClose={closeInviteClient}
        />

        {/* Client Detail Popover */}
        <ClientDetailPopover
          open={clientDetailOpen}
          onClose={handleCloseClientDetail}
          client={selectedClient}
        />
      </Box>
    </LayoutCreative>
  );
} 