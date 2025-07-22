import { Box, Typography, useTheme } from '@mui/material';
import { BarChart } from '@mui/icons-material';

export function AnalyticsTab() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'relative',
        width: 'fit-content',
        maxWidth: { xs: 'calc(100% - 32px)', sm: 480, md: 600, lg: 680 },
        minHeight: { xs: 280, sm: 320, md: 380, lg: 420 },
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 3, sm: 4, md: 5 },
        px: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        boxShadow: '0 8px 32px 0 rgba(59,130,246,0.18)',
        background: `linear-gradient(135deg, #60a5fa 0%, ${theme.palette.secondary.main} 100%)`,
        overflow: 'hidden',
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
        fontSize: { xs: '0.7rem', sm: '0.75rem' },
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
          width: { xs: 220, sm: 300, md: 360 },
          height: { xs: 80, sm: 110, md: 140 },
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
        <BarChart sx={{ fontSize: { xs: 36, sm: 44 }, color: '#fff', opacity: 0.92, filter: 'drop-shadow(0 2px 8px #3B82F655)' }} />
      </Box>
      {/* Title */}
      <Typography
        variant="h6"
        sx={{
          color: '#fff',
          fontWeight: 800,
          mb: 1.5,
          fontSize: { xs: '1.05rem', sm: '1.22rem', md: '1.38rem' },
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
          maxWidth: { xs: 260, sm: 340 },
          position: 'relative',
          zIndex: 2,
          fontSize: { xs: '0.92rem', sm: '1rem' },
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
            fontSize: { xs: '0.95rem', sm: '1rem' },
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
  );
} 