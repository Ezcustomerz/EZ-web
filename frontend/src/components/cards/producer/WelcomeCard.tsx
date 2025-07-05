import { Box, Typography, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { 
  PeopleOutlined, 
  AttachMoneyOutlined, 
  EventOutlined, 
  HeadsetOutlined
} from '@mui/icons-material';

interface StatsCard {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
}

interface WelcomeCardProps {
  userName?: string;
  userRole?: string;
  isSidebarOpen?: boolean;
}

export function WelcomeCard({ userName = "Demo User", userRole = "Music Producer", isSidebarOpen = true }: WelcomeCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Center text when hamburger menu is visible (mobile + sidebar closed)
  const shouldCenterText = isMobile && !isSidebarOpen;

  const statsCards: StatsCard[] = [
    {
      title: 'Active Clients',
      value: '0',
      icon: PeopleOutlined,
      color: theme.palette.success.main,
      bgColor: `${theme.palette.success.main}1A`,
    },
    {
      title: 'Monthly Income',
      value: '$0',
      icon: AttachMoneyOutlined,
      color: theme.palette.info.main,
      bgColor: `${theme.palette.info.main}1A`,
    },
    {
      title: 'Total Bookings',
      value: '0',
      icon: EventOutlined,
      color: theme.palette.custom.amber,
      bgColor: `${theme.palette.custom.amber}1A`,
    },
    {
      title: 'Completed Sessions',
      value: '0',
      icon: HeadsetOutlined,
      color: theme.palette.primary.main,
      bgColor: `${theme.palette.primary.main}1A`,
    },
  ];

  return (
    <Box sx={{ 
      position: 'relative', 
      zIndex: 1, 
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      borderRadius: 2,
      p: 3,
      mb: 3,
      overflowX: 'visible',
      animation: 'fadeInDown 0.6s ease-out',
      '@keyframes fadeInDown': {
        from: { opacity: 0, transform: 'translateY(-20px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
    }}>
      {/* Header with Greeting */}
      <Box sx={{ 
        mb: 3,
        textAlign: shouldCenterText ? 'center' : 'left',
        transition: 'text-align 0.3s ease-in-out',
      }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            fontWeight: 600,
            color: 'primary.main',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
            mb: 0.25,
          }}
        >
          Hello, {userName}
        </Typography>
        
        <Typography
          variant="subtitle1"
          sx={{
            fontSize: { xs: '0.85rem', md: '0.9rem' },
            fontWeight: 400,
            color: 'text.secondary',
            letterSpacing: '0.01em',
          }}
        >
          {userRole}
        </Typography>
      </Box>

      {/* Stats Cards Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: 'repeat(2, 1fr)', 
          sm: 'repeat(4, 1fr)' 
        },
        gap: 2,
        maxWidth: '100%',
      }}>
        {statsCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card
              key={card.title}
              sx={{
                backgroundColor: card.bgColor,
                border: `1px solid ${card.color}30`,
                borderRadius: 2,
                boxShadow: `0 2px 8px ${card.color}20`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'scale(1.05) translateY(-4px)',
                  boxShadow: `0 8px 25px ${card.color}40`,
                  '&::before': {
                    opacity: 0.1,
                  },
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(135deg, ${card.color}20 0%, transparent 100%)`,
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                animation: `slideInUp 0.6s ease-out ${index * 0.1 + 0.3}s both`,
                '@keyframes slideInUp': {
                  from: { opacity: 0, transform: 'translateY(30px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <IconComponent
                    sx={{
                      width: 20,
                      height: 20,
                      color: card.color,
                      mr: 1,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      fontWeight: 500,
                    }}
                  >
                    {card.title}
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: card.color,
                    letterSpacing: '-0.025em',
                  }}
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
} 