import { useState } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { LayoutCreative } from '../../layout/creative/LayoutCreative';
import { ClientTable, mockClients } from '../../components/tables/ClientTable';
import { InviteClientPopover } from '../../components/popovers/InviteClientPopover';
import { useInviteClient } from '../../hooks/useInviteClient';

export function ClientCreative() {
  const [clients] = useState(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { inviteClientOpen, handleInviteClient, closeInviteClient } = useInviteClient();

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };
  const handleStatusFilterChange = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value);
  };

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
        />

        {/* Invite Client Popover */}
        <InviteClientPopover
          open={inviteClientOpen}
          onClose={closeInviteClient}
        />
      </Box>
    </LayoutCreative>
  );
} 