import { Box, Paper, Tab, Tabs, Typography, useTheme } from '@mui/material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';
import { useState } from 'react';
import { ReceiptLong, BarChart } from '@mui/icons-material';

const tabLabels = [
  { label: 'Invoices', icon: <ReceiptLong sx={{ fontSize: 18, mr: 1 }} /> },
  { label: 'Analytics', icon: <BarChart sx={{ fontSize: 18, mr: 1 }} /> },
];

export function IncomeProducer() {
  const [activeTab, setActiveTab] = useState(0); // Default: Invoices
  const theme = useTheme();

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <LayoutProducer selectedNavItem="income">
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
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
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: `2px solid ${theme.palette.divider}`,
              mb: 2,
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

          {/* Empty content placeholder */}
          <Box sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
              {tabLabels[activeTab].label}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </LayoutProducer>
  );
}
