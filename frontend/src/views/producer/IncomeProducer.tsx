import { Box, Paper, Tab, Tabs, Typography, useTheme } from '@mui/material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';
import { useState } from 'react';
import { ReceiptLong, BarChart } from '@mui/icons-material';
import { InvoicesTable } from '../../components/tables/InvoicesTable';
import { InvoicesTab } from './tabs/InvoicesTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';

const tabLabels = [
  { label: 'Invoices', icon: <ReceiptLong sx={{ fontSize: 18, mr: 1 }} /> },
  { label: 'Analytics', icon: <BarChart sx={{ fontSize: 18, mr: 1 }} /> },
];

export function IncomeProducer() {
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('income-active-tab');
    return stored !== null ? Number(stored) : 0;
  });
  const theme = useTheme();

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    localStorage.setItem('income-active-tab', String(newValue));
  };

  return (
    <LayoutProducer selectedNavItem="income">
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          overflow: 'hidden',
          flexGrow: 1,
          minHeight: 0,
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
        }}
      >
        {/* Page Header */}
        <Box
          sx={{
            textAlign: { xs: 'center', md: 'left' },
            px: { xs: 2, md: 0 },
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
            Income
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
            Track your earnings and manage payment requests
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

          {/* Animated tab content placeholder */}
          <Box
            key={activeTab}
            sx={{
              minHeight: 300,
              width: '100%',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              px: 2,
              pb: 2,
              position: 'relative',
              animation: 'fadeSlideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              '@keyframes fadeSlideIn': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(24px) scale(0.98)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0) scale(1)',
                },
              },
              ...(activeTab === 1 && {
                alignItems: 'center',
                justifyContent: 'center',
              }),
            }}
          >
            {activeTab === 0 ? (
              <InvoicesTab />
            ) : (
              <AnalyticsTab />
            )}
          </Box>
        </Paper>
      </Box>
    </LayoutProducer>
  );
}
