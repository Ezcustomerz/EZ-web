import { Box, Typography, Chip, useTheme } from '@mui/material';
import { TrendingUpRounded, EmojiEventsOutlined } from '@mui/icons-material';

interface ProgressCardProps {
  currentReferrals?: number;
  targetReferrals?: number;
  targetTier?: string;
  targetCommission?: string;
  description?: string;
}

export function ProgressCard({ 
  currentReferrals = 18,
  targetReferrals = 25,
  targetTier = "GOLD",
  targetCommission = "25%",
  description = "Reach gold tier to earn 25% commission on all referrals (retroactive)"
}: ProgressCardProps) {
  const theme = useTheme();
  
  const progressPercentage = (currentReferrals / targetReferrals) * 100;
  const referralsNeeded = targetReferrals - currentReferrals;

  return (
    <Box sx={{
      position: 'relative',
      zIndex: 1,
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: 2,
      p: 4,
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(34, 197, 94, 0.02) 100%)',
      animation: 'fadeInUp 0.6s ease-out 0.5s both',
      '@keyframes fadeInUp': {
        from: { opacity: 0, transform: 'translateY(30px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUpRounded sx={{ 
            color: theme.palette.success.main, 
            mr: 1.5, 
            fontSize: 24,
            p: 0.5,
            backgroundColor: `${theme.palette.success.main}15`,
            borderRadius: 1,
          }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: theme.palette.success.dark,
              letterSpacing: '-0.01em',
            }}
          >
            Progress to {targetTier} Tier
          </Typography>
        </Box>
        <Chip
          icon={<EmojiEventsOutlined sx={{ fontSize: 14, color: '#D4AF37' }} />}
          label={`${targetCommission} Commission`}
          size="small"
          sx={{
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            color: '#B8860B',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            fontSize: '0.7rem',
            fontWeight: 600,
          }}
        />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.9rem' }}>
            Current: {currentReferrals} active referrals
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.success.dark, fontWeight: 600, fontSize: '0.9rem' }}>
            Need {referralsNeeded} more
          </Typography>
        </Box>
        
        {/* Custom Progress Bar */}
        <Box sx={{ 
          position: 'relative',
          height: 12,
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid rgba(16, 185, 129, 0.15)',
        }}>
          <Box sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${Math.min(progressPercentage, 100)}%`,
            background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
            borderRadius: 6,
            transition: 'width 1.2s ease-in-out',
            boxShadow: `0 2px 8px ${theme.palette.success.main}30`,
            animation: 'progressPulse 3s ease-in-out infinite',
            '@keyframes progressPulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.8 },
            },
          }} />
          
          {/* Progress indicator */}
          <Box sx={{
            position: 'absolute',
            right: `${100 - Math.min(progressPercentage, 100)}%`,
            top: '50%',
            transform: 'translate(50%, -50%)',
            width: 14,
            height: 14,
            backgroundColor: theme.palette.success.main,
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: `0 2px 6px ${theme.palette.success.main}40`,
            zIndex: 2,
          }} />
        </Box>
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          display: 'block',
          lineHeight: 1.5,
          fontSize: '0.85rem',
          mt: 1,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}
