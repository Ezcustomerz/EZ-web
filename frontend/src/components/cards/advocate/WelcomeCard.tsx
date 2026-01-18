import { Box, Typography, Card, CardContent, useTheme, Chip, Tooltip, Button } from '@mui/material';
import {
  GroupOutlined,
  AttachMoneyOutlined,
  CalendarMonthOutlined,
  TrendingUpOutlined,
  EmojiEventsOutlined,
  EmojiEventsRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import { ComingSoonDialog } from '../../dialogs/ComingSoonDialog';

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
  tierLabel?: string;
  onRewardfulClick?: () => void;
}

export function WelcomeCard({ 
  userName = "Demo User", 
  userRole = "Advocate", 
  tierLabel = "Silver • 18%",
  onRewardfulClick 
}: WelcomeCardProps) {
  const theme = useTheme();
  const [comingSoonDialogOpen, setComingSoonDialogOpen] = useState(false);

  const statsCards: StatsCard[] = [
    {
      title: 'Active Referrals',
      value: '0',
      icon: GroupOutlined,
      color: theme.palette.custom.amber,
      bgColor: `${theme.palette.custom.amber}1A`,
    },
    {
      title: 'Total Earned',
      value: '$0',
      icon: AttachMoneyOutlined,
      color: theme.palette.info.main,
      bgColor: `${theme.palette.info.main}1A`,
    },
    {
      title: 'Earned This Month',
      value: '$0',
      icon: CalendarMonthOutlined,
      color: theme.palette.success.main,
      bgColor: `${theme.palette.success.main}1A`,
    },
    {
      title: 'Tier Percentage',
      value: '18%',
      icon: TrendingUpOutlined,
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
      borderRadius: 1,
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'center', md: 'flex-start' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 0 },
      }}>
        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
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
            <Chip
              icon={<EmojiEventsOutlined sx={{ fontSize: 16, color: '#C0C0C0' }} />}
              label={tierLabel}
              size="small"
              sx={{
                backgroundColor: 'rgba(192, 192, 192, 0.1)',
                color: '#6B7280',
                border: '1px solid rgba(192, 192, 192, 0.3)',
                fontSize: '0.7rem',
                fontWeight: 600,
                '& .MuiChip-icon': {
                  color: '#C0C0C0',
                },
              }}
            />
          </Box>
        </Box>

        {/* Rewardful Portal Ribbon Button */}
        <Box sx={{ display: { xs: 'flex', md: 'flex' }, justifyContent: 'center' }}>
          <Tooltip 
            title="Go to your Rewardful affiliate dashboard"
            arrow
            placement="top"
          >
            <Button
              startIcon={<EmojiEventsRounded sx={{ fontSize: 20 }} />}
              onClick={() => setComingSoonDialogOpen(true)}
              aria-label="Open Rewardful Portal"
              sx={{
                // Main ribbon rectangle
                background: 'linear-gradient(135deg, #FFCD38 0%, #FFD56A 50%, #E6B800 100%)',
                border: '1.5px solid #B98F00',
                borderRadius: '6px',
                color: theme.palette.text.primary,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                px: { xs: 2.5, md: 3.5 },
                py: { xs: 1.25, md: 1.5 },
                minHeight: { xs: '40px', md: '44px' },
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                boxShadow: '0 4px 10px rgba(255, 205, 56, 0.35)',
                // Subtle fabric texture
                backgroundImage: `
                  linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
                  linear-gradient(-45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%),
                  linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%)
                `,
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                position: 'relative',
                overflow: 'visible',
                margin: '0 20px', // Space for ribbon folds
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'background-color 0.3s ease-in-out',
                },
                // Left ribbon fold
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: { xs: '-16px', md: '-20px' },
                  top: '0',
                  width: '0',
                  height: '0',
                  borderTop: { xs: '20px solid #E6B800', md: '22px solid #E6B800' },
                  borderBottom: { xs: '20px solid #E6B800', md: '22px solid #E6B800' },
                  borderLeft: { xs: '16px solid transparent', md: '20px solid transparent' },
                  borderRight: '1.5px solid #B98F00',
                  zIndex: -1,
                  transition: 'transform 0.3s ease-in-out',
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                  },
                },
                // Right ribbon fold
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  right: { xs: '-16px', md: '-20px' },
                  top: '0',
                  width: '0',
                  height: '0',
                  borderTop: { xs: '20px solid #E6B800', md: '22px solid #E6B800' },
                  borderBottom: { xs: '20px solid #E6B800', md: '22px solid #E6B800' },
                  borderRight: { xs: '16px solid transparent', md: '20px solid transparent' },
                  borderLeft: '1.5px solid #B98F00',
                  zIndex: -1,
                  transition: 'transform 0.3s ease-in-out',
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                  },
                },
                // Shimmer overlay container
                '& .shimmer-overlay': {
                  position: 'absolute',
                  top: 0,
                  left: '-150%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)',
                  transition: 'left 1.2s ease-in-out',
                  zIndex: 1,
                  borderRadius: '6px',
                  '@media (prefers-reduced-motion: reduce)': {
                    display: 'none',
                  },
                },
                '& .MuiButton-startIcon': {
                  zIndex: 2,
                  position: 'relative',
                  color: theme.palette.text.primary,
                },
                '& .MuiButton-text': {
                  zIndex: 2,
                  position: 'relative',
                },
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: '0 6px 16px rgba(255, 205, 56, 0.45)',
                  '&::before': {
                    transform: 'translateX(-3px)',
                    '@media (prefers-reduced-motion: reduce)': {
                      transform: 'none',
                    },
                  },
                  '&::after': {
                    transform: 'translateX(3px)',
                    '@media (prefers-reduced-motion: reduce)': {
                      transform: 'none',
                    },
                  },
                  '& .shimmer-overlay': {
                    left: '250%',
                    '@media (prefers-reduced-motion: reduce)': {
                      left: '-150%',
                    },
                  },
                },
                '&:active': {
                  transform: 'scale(1.03) translateY(1px)',
                  background: 'linear-gradient(135deg, #F3C02F 0%, #E6B800 50%, #D4A600 100%)',
                  boxShadow: '0 2px 6px rgba(255, 205, 56, 0.35)',
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.secondary.main}`,
                  outlineOffset: '3px',
                },
                // Keyframes for shimmer
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '-150% 0' },
                  '100%': { backgroundPosition: '250% 0' },
                },
              }}
            >
              <Box className="shimmer-overlay" />
              Open Rewardful Portal
            </Button>
          </Tooltip>
        </Box>
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
                  transform: 'scale(1.02) translateY(-2px)',
                  boxShadow: `0 6px 20px ${card.color}30`,
                  '&::before': {
                    opacity: 0.08,
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
              <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
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

      {/* Coming Soon Dialog */}
      <ComingSoonDialog
        open={comingSoonDialogOpen}
        onClose={() => setComingSoonDialogOpen(false)}
        featureName="Rewardful Portal"
        description="The Rewardful affiliate dashboard integration is currently under development. This feature will allow you to manage your referrals and track earnings directly from here!"
      />
    </Box>
  );
}
