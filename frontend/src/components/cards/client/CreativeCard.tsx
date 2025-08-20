import { Box, Card, Typography, Avatar, useTheme } from '@mui/material';
import { Star, MusicNote, Email } from '@mui/icons-material';

interface Creative {
  id: string;
  name: string;
  avatar: string | null;
  specialty: string;
  email: string;
  rating: number;
  reviewCount: number;
  servicesCount: number;
  isOnline: boolean;
  color: string;
}

interface CreativeCardProps {
  creative: Creative;
  index: number;
  onClick: (producerId: string) => void;
}

export function CreativeCard({ creative, index, onClick }: CreativeCardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        animation: `fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1) ${index * 0.1}s both`,
      }}
    >
      <Card
        onClick={() => onClick(creative.id)}
        sx={{
          position: 'relative',
          height: '100%',
          minHeight: { xs: 200, sm: 220 },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          boxShadow: 'none',
          cursor: 'pointer',
          p: 0,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
          border: '1px solid rgba(122, 95, 255, 0.08)',
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          '&:hover': {
            transform: 'translateY(-6px) scale(1.03)',
            boxShadow: `0 8px 25px ${creative.color}40, 0 4px 12px rgba(0, 0, 0, 0.08)`,
            borderColor: `${creative.color}60`,
          },
        }}
      >
        {/* Header with color accent */}
        <Box
          sx={{
            height: 6,
            background: `linear-gradient(135deg, ${creative.color} 0%, ${creative.color}80 50%, ${creative.color}40 100%)`,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            }
          }}
        >
        </Box>

        {/* Creative Info */}
        <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Avatar and Name */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5 }}>
            <Avatar
              sx={{
                width: 52,
                height: 52,
                backgroundColor: creative.color,
                mr: 2,
                fontSize: '1.25rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '2px solid rgba(255,255,255,0.8)',
              }}
            >
              {creative.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1.2,
                  mb: 0.5,
                  letterSpacing: '-0.02em',
                }}
              >
                {creative.name}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.85rem',
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {creative.specialty}
              </Typography>
              {/* Contact Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Email sx={{ fontSize: 14, color: theme.palette.primary.main, mr: 0.5 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  {creative.email}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Stats Section */}
          <Box sx={{
            display: 'flex',
            gap: 1.5,
            mb: 2.5,
            p: 1,
            backgroundColor: 'rgba(122, 95, 255, 0.04)',
            borderRadius: 2,
            border: '1px solid rgba(122, 95, 255, 0.08)',
          }}>
            {/* Rating */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 215, 0, 0.12)',
                borderRadius: 1.5,
                px: 1.2,
                py: 0.6,
                mr: 1,
              }}>
                <Star sx={{ fontSize: 16, color: '#FFD700', mr: 0.5 }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'text.primary',
                  }}
                >
                  {creative.rating}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                ({creative.reviewCount})
              </Typography>
            </Box>

            {/* Services Count */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(122, 95, 255, 0.12)',
                  borderRadius: 1.5,
                  px: 1.2,
                  py: 0.6,
                  mr: 1,
                }}>
                <MusicNote sx={{ fontSize: 16, color: theme.palette.primary.main, mr: 0.5 }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'text.primary',
                  }}
                >
                  {creative.servicesCount}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                services
              </Typography>
              {/* No profile button here anymore */}
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
} 