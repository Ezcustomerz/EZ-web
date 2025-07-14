import { Box, Typography, Paper, Tab, Tabs, useTheme } from '@mui/material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';
import { useState } from 'react';
import { Build, CalendarMonth, Person } from '@mui/icons-material';
import { ServicesTab } from './tabs/ServicesTab';
import { CalendarTab } from './tabs/CalendarTab';
import { ProfileTab } from './tabs/ProfileTab';

const tabLabels = [
  { label: 'Services', icon: <Build sx={{ fontSize: 18, mr: 1 }} /> },
  { label: 'Calendar', icon: <CalendarMonth sx={{ fontSize: 18, mr: 1 }} /> },
  { label: 'Profile', icon: <Person sx={{ fontSize: 18, mr: 1 }} /> },
];

export function PublicProducer() {
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('public-active-tab');
    return stored !== null ? Number(stored) : 0;
  });
  const theme = useTheme();

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    localStorage.setItem('public-active-tab', String(newValue));
  };

  return (
    <LayoutProducer selectedNavItem="public">
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
            Public
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
            Manage your public profile and service visibility
          </Typography>
        </Box>
        {/* Tabs + content */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            minHeight: 0,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: `2px solid ${theme.palette.divider}`,
            }}
          >
            {tabLabels.map((tab, idx) => (
              <Tab
                key={tab.label}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {tab.icon}
                    <Typography
                      sx={{
                        fontWeight: activeTab === idx ? 600 : 500,
                        fontSize: { xs: '0.85rem', sm: '0.95rem' },
                        color:
                          activeTab === idx
                            ? theme.palette.primary.main
                            : theme.palette.text.primary,
                        textTransform: 'none',
                      }}
                    >
                      {tab.label}
                    </Typography>
                  </Box>
                }
                disableRipple
                sx={{
                  px: 4,
                  minHeight: 48,
                  borderBottom:
                    activeTab === idx
                      ? `2px solid ${theme.palette.primary.main}`
                      : '2px solid transparent',
                }}
              />
            ))}
          </Tabs>
          {/* Tab content */}
          {activeTab === 0 && <ServicesTab />}
          {activeTab === 1 && <CalendarTab />}
          {activeTab === 2 && <ProfileTab />}
        </Paper>
      </Box>
    </LayoutProducer>
  );
} 