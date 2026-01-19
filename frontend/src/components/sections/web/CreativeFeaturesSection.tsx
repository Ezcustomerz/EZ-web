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
  People,
  MusicNote,
  CalendarMonth,
  Payment,
  Timeline,
  BarChart,
  Storage,
  Public,
  AccountBox,
} from '@mui/icons-material';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
}

export function CreativeFeaturesSection() {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const features: Feature[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Real-time overview of your business with earnings stats, active orders, and client activity. Get instant insights into your performance and stay on top of your workflow.',
      icon: <Dashboard />,
      color: theme.palette.primary.main,
    },
    {
      id: 'clients',
      title: 'Client Management',
      description: 'Organize and track all your artist and label relationships, view booking history, and interaction history in one place. Build stronger connections with detailed client profiles.',
      icon: <People />,
      color: '#2196F3',
    },
    {
      id: 'services',
      title: 'Services & Bundles',
      description: 'Create custom service offerings like mixing, mastering, and production with flexible pricing. Bundle multiple services together for special packages that clients can book directly.',
      icon: <MusicNote />,
      color: '#9C27B0',
    },
    {
      id: 'calendar',
      title: 'Calendar & Scheduling',
      description: 'Visual calendar to manage studio sessions, track availability, and coordinate booking schedules. See all your sessions at a glance and never double-book again.',
      icon: <CalendarMonth />,
      color: '#FF9800',
    },
    {
      id: 'payments',
      title: 'Payment Requests',
      description: 'Send and track payment requests with flexible options including deposits, final payments, and custom invoicing. Get paid faster with built-in Stripe integration and transparent fee structure.',
      icon: <Payment />,
      color: '#4CAF50',
    },
    {
      id: 'activity',
      title: 'Activity & Orders',
      description: 'Monitor all booking statuses from pending approval through completion. Track every order with detailed status updates, client communications, and project timelines.',
      icon: <Timeline />,
      color: '#F44336',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Track earnings over time, analyze service performance, and identify your top clients. Gain actionable insights into your business growth with visual charts and comprehensive reports.',
      icon: <BarChart />,
      color: '#00BCD4',
    },
    {
      id: 'storage',
      title: 'Storage & Files',
      description: 'Secure cloud storage for deliverables with organized file management. Upload finished tracks, stems, project files, and raw image files directly to clients with automatic organization by booking.',
      icon: <Storage />,
      color: '#607D8B',
    },
    {
      id: 'public',
      title: 'Public Profile',
      description: 'Customizable portfolio page showcasing your services and professional information. Share your profile link with potential clients to attract new business.',
      icon: <Public />,
      color: '#673AB7',
    },
    {
      id: 'client-portal',
      title: 'Client Portal',
      description: 'Every client who books with you automatically receives a free client portal. This professional dashboard helps you appear more organized and polished, giving clients a seamless way to track their orders, view deliverables, and manage payments all in one place.',
      icon: <AccountBox />,
      color: '#E91E63',
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
