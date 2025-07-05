import { Box, Typography, Divider, useTheme, useMediaQuery } from '@mui/material';
import { LayoutProducer } from '../../layout/producer/LayoutProducer';
import { WelcomeCard } from '../../components/cards/producer/WelcomeCard';
import { ActivityFeedCard } from '../../components/cards/producer/ActivityFeedCard';

export function DashProducer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // iPad Air and smaller

  return (
    <>
      {/* Full-screen background gradient */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, 
            ${theme.palette.background.default} 0%,
            ${theme.palette.primary.main}08 50%,
            ${theme.palette.background.default} 100%
          )`,
          zIndex: -1,
        }}
      />
      
      <LayoutProducer selectedNavItem="dashboard">
        {({ isSidebarOpen }) => (
          <Box
          sx={{
            p: { xs: 2, md: 4 },
            // Responsive height and overflow behavior
            height: isMobile ? 'auto' : '100vh',
            minHeight: isMobile ? '100vh' : 'auto',
            overflowY: isMobile ? 'auto' : 'hidden',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: 'all 0.3s ease-in-out',
            // Add top padding on mobile to account for menu button
            pt: isMobile ? 5 : { xs: 2, md: 4 },
            // Ensure proper scrolling on mobile
            WebkitOverflowScrolling: isMobile ? 'touch' : 'auto',
          }}
        >
        {/* Welcome Card */}
        <WelcomeCard userName="Demo User" userRole="Music Producer" isSidebarOpen={isSidebarOpen} />



        {/* Section Divider */}
        <Box sx={{ 
          position: 'relative', 
          zIndex: 1, 
          mb: 2,
          animation: 'fadeIn 0.6s ease-out 0.35s both',
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}>
          <Divider sx={{ 
            borderColor: 'rgba(0, 0, 0, 0.12)',
            my: 2,
          }} />
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mt: -1.5,
          }}>
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'text.disabled',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                backgroundColor: 'background.default',
                px: 2,
              }}
            >
              Activity Feed
            </Typography>
          </Box>
        </Box>

        {/* Activity Feed Card */}
        <ActivityFeedCard newCount={3} />
        </Box>
        )}
      </LayoutProducer>
      </>
    );
  } 