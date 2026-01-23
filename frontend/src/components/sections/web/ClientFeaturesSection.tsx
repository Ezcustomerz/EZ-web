import React, { useState } from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ExpandMore,
  Dashboard,
  ShoppingCart,
  Assignment,
  Payment,
  Notifications,
  People,
  CloudDownload,
} from '@mui/icons-material';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
}

export function ClientFeaturesSection() {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const features: Feature[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Your clients get a real-time overview of their bookings, upcoming sessions, and recent activity. They can stay on top of all their creative projects in one centralized location with quick access to what matters most.',
      icon: <Dashboard />,
      color: theme.palette.secondary.main,
    },
    {
      id: 'book',
      title: 'Book Services',
      description: 'Your clients can easily book studio sessions, mixing, mastering, and other creative services directly from you. They can view available time slots, select services, and confirm bookings with just a few clicks.',
      icon: <ShoppingCart />,
      color: '#9C27B0',
    },
    {
      id: 'orders',
      title: 'Order Management',
      description: 'Your clients can track all their orders from booking to completion. They can view active projects, see what needs their attention, and access their complete order history. They stay organized with detailed status updates and project timelines.',
      icon: <Assignment />,
      color: '#FF9800',
    },
    {
      id: 'payments',
      title: 'Payment Management',
      description: 'Your clients can handle all payments securely through Stripe integration. They can pay upfront, split payments with deposits, or pay later based on your payment options. They can track payment requests and manage invoices all in one place.',
      icon: <Payment />,
      color: '#4CAF50',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Your clients stay informed with real-time notifications about booking confirmations, payment requests, order updates, and new deliverables. They never miss an important update about their creative projects.',
      icon: <Notifications />,
      color: '#F44336',
    },
    {
      id: 'connected',
      title: 'Connected Creatives',
      description: 'Your clients can manage their relationships with all their favorite creatives in one place. They can view their connected professionals, their services, and booking history. They can build lasting partnerships with the creatives they trust.',
      icon: <People />,
      color: '#00BCD4',
    },
    {
      id: 'deliverables',
      title: 'Deliverables & Files',
      description: 'Your clients can access all their completed project files, stems, final mixes, and deliverables in a secure, organized portal. They can download files once payments are complete and keep everything organized by project.',
      icon: <CloudDownload />,
      color: '#607D8B',
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {features.map((feature, index) => (
          <Accordion
            key={feature.id}
            expanded={expanded === feature.id}
            onChange={handleChange(feature.id)}
            sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:before': {
                display: 'none',
              },
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)',
              },
              '&.Mui-expanded': {
                margin: '0 !important',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                minHeight: { xs: 56, md: 64 },
                '&.Mui-expanded': {
                  minHeight: { xs: 56, md: 64 },
                },
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0',
                  alignItems: 'center',
                  '&.Mui-expanded': {
                    margin: '12px 0',
                  },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box
                  sx={{
                    width: { xs: 40, md: 48 },
                    height: { xs: 40, md: 48 },
                    borderRadius: 2,
                    backgroundColor: feature.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {React.cloneElement(feature.icon, {
                    sx: { color: 'white', fontSize: { xs: 20, md: 24 } },
                  })}
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.95rem', md: '1.1rem' },
                    color: 'text.primary',
                  }}
                >
                  {feature.title}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                pt: 0,
                pb: 2,
                px: { xs: 2, md: 3 },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.7,
                  fontSize: { xs: '0.875rem', md: '0.95rem' },
                  pl: { xs: 0, md: 8 },
                }}
              >
                {feature.description}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}
