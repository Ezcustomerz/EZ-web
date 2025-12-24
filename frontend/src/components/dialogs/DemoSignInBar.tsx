import { Box, Typography, useTheme, useMediaQuery, keyframes } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Initial bounce animation - large and noticeable
const initialBounce = keyframes`
  0% {
    transform: translateY(0) scale(1);
  }
  30% {
    transform: translateY(-20px) scale(1.05);
  }
  50% {
    transform: translateY(-15px) scale(1.03);
  }
  70% {
    transform: translateY(-10px) scale(1.02);
  }
  100% {
    transform: translateY(0) scale(1);
  }
`;

// Subtle periodic bounce - gentle reminder
const subtleBounce = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-6px) scale(1.02);
  }
`;

interface DemoSignInBarProps {
  sidebarWidth?: number;
  isSidebarOpen?: boolean;
  isMobile?: boolean;
}

export function DemoSignInBar({ sidebarWidth = 280, isSidebarOpen = true, isMobile: isMobileProp }: DemoSignInBarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobileBreakpoint = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = isMobileProp ?? isMobileBreakpoint;

  const handleClick = () => {
    // Navigate to current page with auth=1 parameter to trigger AuthPopover
    navigate({ search: '?auth=1' });
  };

  // Calculate margins to align with content container borders
  // Content containers typically have px: { xs: 2, md: 3 } which is 16px/24px
  const bottomMargin = isMobile ? 28 : 40;
  const sideMargin = isMobile ? 28 : 40;
  
  // Calculate left position: on desktop, account for sidebar + content padding
  const leftPosition = isMobile ? sideMargin : (isSidebarOpen ? sidebarWidth + sideMargin : sideMargin);

  return (
    <Box
      onClick={handleClick}
      sx={{
        position: 'fixed',
        bottom: bottomMargin,
        left: leftPosition,
        right: sideMargin,
        height: isMobile ? '45px' : '50px',
        borderRadius: 3,
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        border: '2px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 0 20px rgba(255, 255, 255, 0.5), 0 -4px 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 1300,
        transition: 'all 0.3s ease',
        // Initial bounce animation followed by continuous pulse
        // Initial bounce: 0-0.6s, short pause: 0.6-1.5s, then pulse starts at 1.5s and repeats
        animation: `${initialBounce} 0.6s ease-out forwards, ${subtleBounce} 3s ease-in-out 1.5s infinite`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 0 24px rgba(255, 255, 255, 0.6), 0 -6px 24px rgba(0, 0, 0, 0.2)',
        },
        '&:active': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Add
          sx={{
            fontSize: isMobile ? '20px' : '24px',
            color: 'white',
            fontWeight: 'bold',
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontWeight: 600,
            fontSize: isMobile ? '0.875rem' : '1rem',
            letterSpacing: '0.5px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          Sign In or Sign Up
        </Typography>
      </Box>
    </Box>
  );
}

