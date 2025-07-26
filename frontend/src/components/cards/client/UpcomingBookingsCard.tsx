import { Box, Typography, Card, Chip, useTheme, Stack } from '@mui/material';
import { Schedule, GraphicEqOutlined } from '@mui/icons-material';

interface Booking {
  id: number;
  serviceTitle: string;
  dateTime: string;
  producer: string;
  startsIn: string;
  color: string;
}

interface UpcomingBookingsCardProps {
  bookings?: Booking[];
}

export function UpcomingBookingsCard({ bookings = [] }: UpcomingBookingsCardProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'auto', md: '100%' } }}>
      <Card sx={{ 
        position: 'relative', 
        zIndex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        flex: { xs: 'none', md: 0.82 },
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: 1,
        p: 2,
        mb: 0,
        transition: 'all 0.3s ease-in-out',
        animation: 'fadeIn 0.6s ease-out 0.4s both',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}>
        {/* Section Header */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.25,
            }}
          >
            Upcoming Bookings
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              color: 'text.secondary',
            }}
          >
            Your scheduled sessions and appointments
          </Typography>
        </Box>

        {/* Content Area */}
        <Box sx={{
          flex: { xs: 'none', md: 1 },
          minHeight: { xs: '300px', md: 0 },
          maxHeight: { xs: '400px', md: 'none' },
          overflowY: bookings.length === 0 ? 'visible' : 'auto',
          overflowX: 'visible',
          px: 2,
          py: 1,
          pb: 2,
          transition: 'all 0.3s ease-in-out',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 3,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          scrollBehavior: 'smooth',
        }}>
          {bookings.length === 0 ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pb: { xs: 4, sm: 4, md: 5, lg: 6 },
              px: 3,
              textAlign: 'center',
              minHeight: { xs: '280px', sm: '280px', md: '300px' },
              position: 'relative',
              background: `radial-gradient(circle at center, 
                ${theme.palette.info.main}08 0%, 
                ${theme.palette.primary.main}05 40%, 
                transparent 70%)`,
              borderRadius: 2,
              animation: 'fadeIn 0.6s ease-out 0.5s both',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}>
              <GraphicEqOutlined
                sx={{
                  fontSize: { xs: 44, sm: 48, md: 52 },
                  color: theme.palette.info.main,
                  mb: { xs: 2, sm: 2.5, md: 3 },
                  opacity: 0.9,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '1rem', sm: '1.075rem', md: '1.125rem' },
                  fontWeight: 600,
                  color: theme.palette.info.main,
                  mb: { xs: 1, sm: 1.25, md: 1.5 },
                }}
              >
                No upcoming bookings
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' },
                  color: theme.palette.info.main,
                  maxWidth: { xs: '280px', sm: '300px', md: '320px' },
                  lineHeight: 1.6,
                  opacity: 0.8,
                  mb: { xs: 2, sm: 2.5, md: 3 },
                }}
              >
                Explore connected producers to get started!
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {bookings.map((booking, index) => (
                <Box
                  key={booking.id}
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 1.5,
                    p: 1.5,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderLeft: `4px solid ${booking.color}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'scale(1.03) translateY(-8px)',
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
                    },
                    animation: `slideInLeft 0.6s ease-out ${index * 0.1 + 0.5}s both`,
                    '@keyframes slideInLeft': {
                      from: { opacity: 0, transform: 'translateX(-30px)' },
                      to: { opacity: 1, transform: 'translateX(0)' },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                      <Schedule
                        sx={{
                          width: 18,
                          height: 18,
                          color: theme.palette.primary.main,
                          mt: 0.25,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: 'text.primary',
                            }}
                          >
                            {booking.serviceTitle}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            mb: 1,
                            lineHeight: 1.4,
                          }}
                        >
                          {booking.dateTime}
                        </Typography>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          <Box
                            sx={{
                              backgroundColor: 'rgba(0, 0, 0, 0.06)',
                              color: 'text.secondary',
                              fontSize: '0.65rem',
                              fontWeight: 500,
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                            }}
                          >
                            {booking.producer}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        color: 'rgba(0, 0, 0, 0.4)',
                        whiteSpace: 'nowrap',
                        ml: 1,
                        mt: 0.25,
                      }}
                    >
                      {booking.startsIn}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Card>
    </Box>
  );
} 