import { Box, Paper, Tab, Tabs, Typography, useTheme } from '@mui/material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';
import { useState } from 'react';
import { ReceiptLong, BarChart } from '@mui/icons-material';
import { InvoicesTable } from '../../components/tables/InvoicesTable';

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

          {/* Empty content placeholder */}
          <Box sx={{ minHeight: 300, width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' , px: 2, pb: 2}}>
            {activeTab === 0 ? (
              <InvoicesTable />
            ) : (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 440,
                  mx: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: { xs: 6, sm: 8 },
                  px: { xs: 2, sm: 4 },
                  borderRadius: 3,
                  boxShadow: '0 8px 32px 0 rgba(59,130,246,0.18)',
                  background: `linear-gradient(135deg, #60a5fa 0%, ${theme.palette.secondary.main} 100%)`,
                  overflow: 'hidden',
                  mt: 2,
                  mb: 2,
                }}
              >
                {/* Semi-transparent white overlay for contrast */}
                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.13)',
                  zIndex: 1,
                  borderRadius: 3,
                }} />
                {/* Pro badge */}
                <Box sx={{
                  position: 'absolute',
                  top: 18,
                  right: 18,
                  zIndex: 3,
                  background: `linear-gradient(90deg, #fbbf24 0%, ${theme.palette.custom.amber} 100%)`,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px 0 rgba(251,191,36,0.18)',
                  letterSpacing: '0.08em',
                  textTransform: 'none',
                  display: 'inline-block',
                }}>Pro Feature</Box>
                {/* Wireframe/mock chart in background */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '54%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: 300, sm: 360 },
                    height: { xs: 110, sm: 140 },
                    opacity: 0.13,
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                >
                  {/* Soft white SVG wireframe chart */}
                  <svg width="100%" height="100%" viewBox="0 0 360 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="0,120 40,100 80,80 120,90 160,60 200,70 240,40 280,60 320,30 360,50" stroke="#fff" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                    <rect x="0" y="120" width="20" height="20" rx="4" fill="#fff" opacity="0.15" />
                    <rect x="80" y="80" width="20" height="60" rx="4" fill="#fff" opacity="0.15" />
                    <rect x="160" y="60" width="20" height="80" rx="4" fill="#fff" opacity="0.15" />
                    <rect x="240" y="40" width="20" height="100" rx="4" fill="#fff" opacity="0.15" />
                    <rect x="320" y="30" width="20" height="110" rx="4" fill="#fff" opacity="0.15" />
                  </svg>
                </Box>
                {/* Icon above heading */}
                <Box sx={{ position: 'relative', zIndex: 2, mb: 1.5 }}>
                  <BarChart sx={{ fontSize: 44, color: '#fff', opacity: 0.92, filter: 'drop-shadow(0 2px 8px #3B82F655)' }} />
                </Box>
                {/* Title */}
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    fontWeight: 800,
                    mb: 1.5,
                    fontSize: { xs: '1.22rem', sm: '1.38rem' },
                    letterSpacing: '-0.01em',
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'center',
                  }}
                >
                  Unlock Powerful Revenue Insights
                </Typography>
                {/* Body */}
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255,255,255,0.97)',
                    fontWeight: 500,
                    mb: 3,
                    textAlign: 'center',
                    maxWidth: 340,
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  Track trends, measure growth, and discover where your income comes from. Upgrade to Pro for full access.
                </Typography>
                {/* Upgrade Button */}
                <Box sx={{ position: 'relative', zIndex: 2, mt: 2, width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <Box
                    component="button"
                    sx={{
                      background: `linear-gradient(90deg, ${theme.palette.custom.amber} 0%, #f59e42 100%)`,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      border: 'none',
                      borderRadius: 2,
                      px: 3.5,
                      py: 1.3,
                      cursor: 'pointer',
                      boxShadow: '0 2px 12px 0 rgba(251,191,36,0.13)',
                      transition: 'box-shadow 0.2s, background 0.2s, transform 0.18s',
                      outline: 'none',
                      '&:hover': {
                        boxShadow: '0 0 0 0.18rem #fbbf2455, 0 2px 16px 0 rgba(251,191,36,0.18)',
                        background: `linear-gradient(90deg, ${theme.palette.custom.amber} 0%, #fbbf24 100%)`,
                        transform: 'scale(1.045)',
                        animation: 'pulseGlow 0.7s',
                      },
                      '@keyframes pulseGlow': {
                        '0%': { boxShadow: '0 0 0 0.18rem #fbbf2455, 0 2px 12px 0 rgba(251,191,36,0.13)', transform: 'scale(1)' },
                        '50%': { boxShadow: '0 0 0 0.32rem #fbbf24AA, 0 2px 20px 0 rgba(251,191,36,0.18)', transform: 'scale(1.07)' },
                        '100%': { boxShadow: '0 0 0 0.18rem #fbbf2455, 0 2px 12px 0 rgba(251,191,36,0.13)', transform: 'scale(1.045)' },
                      },
                    }}
                  >
                    Upgrade to Pro
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </LayoutProducer>
  );
}
