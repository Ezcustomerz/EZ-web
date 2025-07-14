import { useState } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';
import { ClientTable } from '../../components/tables/ClientTable';
import type { Client } from '../../components/tables/ClientTable';

export function ClientProducer() {
  const [clients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };
  const handleStatusFilterChange = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value);
  };
  const handleInviteClient = () => {
    console.log('Invite client clicked');
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
        '@media (max-height: 780px)': {
          p: { xs: 1, sm: 2, md: 3 },
        },
      }}>
        {/* Header Section */}
        <Box 
          sx={{ 
            mb: 3,
            textAlign: { xs: 'center', md: 'left' },
            px: { xs: 2, md: 0 },
            '@media (max-height: 780px)': {
              my: 2,
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
      </Box>
    </LayoutProducer>
  );
} 