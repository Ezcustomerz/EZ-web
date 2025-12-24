import { Box, Typography, Card, useTheme, Stack, Button, Skeleton } from '@mui/material';
import { Schedule, People, CalendarToday, CalendarMonth } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Booking {
  id: number;
  bookingId?: string; // The actual booking/order UUID
  serviceId?: string;
  serviceTitle: string;
  dateTime: string;
  creative: string;
  startsIn: string;
  color: string;
}

interface UpcomingBookingsCardProps {
  bookings?: Booking[];
  onBookingClick?: (booking: Booking) => void;
  isLoading?: boolean;
}

const DISPLAY_LIMIT = 5; // Show only 5 bookings initially

export function UpcomingBookingsCard({ bookings = [], onBookingClick, isLoading = false }: UpcomingBookingsCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const displayedBookings = bookings.slice(0, DISPLAY_LIMIT);
  const hasMoreBookings = bookings.length > DISPLAY_LIMIT;

  const handleBookingClick = (booking: Booking) => {
    if (onBookingClick) {
      onBookingClick(booking);
    } else if (booking.bookingId) {
      // Default behavior: navigate to orders page with order ID to open the popover
      navigate(`/client/orders?orderId=${booking.bookingId}&tab=0`);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'auto', md: '100%' } }}>
      <Card sx={{ 
        position: 'relative', 
        zIndex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        flex: { xs: 'none', md: 1 },
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
          maxHeight: 'calc(100vh - 400px)',
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
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
              {[1, 2, 3].map((i) => (
                <Box
                  key={i}
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 1.5,
                    p: 1.5,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderLeft: '4px solid',
                    borderLeftColor: 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                      <Skeleton variant="circular" width={18} height={18} sx={{ mt: 0.25 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
                        <Skeleton variant="rectangular" width="40%" height={20} sx={{ borderRadius: 1 }} />
                      </Box>
                    </Box>
                    <Skeleton variant="text" width={60} height={14} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : bookings.length === 0 ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pb: { xs: 8, sm: 8, md: 10, lg: 12 },
              pt: { xs: 4, sm: 4, md: 6, lg: 8 },
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
              <CalendarToday
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
                Explore connected creatives to get started!
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<People />}
                onClick={() => {
                  navigate('/client/book');
                  // Set the active tab to 0 (Connected Creatives) in localStorage
                  localStorage.setItem('book-active-tab', '0');
                }}
                sx={{
                  borderColor: theme.palette.info.main,
                  color: theme.palette.info.main,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  px: 2.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease-in-out',
                  // Spark animations
                  '@keyframes sparkle': {
                    '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                    '50%': { transform: 'scale(1) rotate(180deg)', opacity: 1 },
                    '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                  },
                  '@keyframes sparkle2': {
                    '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                    '60%': { transform: 'scale(1) rotate(240deg)', opacity: 1 },
                    '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                  },
                  '@keyframes sparkle3': {
                    '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                    '40%': { transform: 'scale(1) rotate(120deg)', opacity: 1 },
                    '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                  },
                  // Spark elements
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '20%',
                    left: '15%',
                    width: 4,
                    height: 4,
                    background: theme.palette.info.main,
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '70%',
                    right: '20%',
                    width: 3,
                    height: 3,
                    background: theme.palette.info.main,
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&:hover': {
                    borderColor: theme.palette.info.main,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${theme.palette.info.main}20`,
                    '&::before': {
                      animation: 'sparkle 0.8s ease-in-out',
                    },
                    '&::after': {
                      animation: 'sparkle2 0.8s ease-in-out 0.1s',
                    },
                    '& .spark-element': {
                      '&:nth-of-type(1)': {
                        animation: 'sparkle3 0.8s ease-in-out 0.2s',
                      },
                      '&:nth-of-type(2)': {
                        animation: 'sparkle 0.8s ease-in-out 0.3s',
                      },
                    },
                  },
                }}
              >
                <Box
                  className="spark-element"
                  sx={{
                    position: 'absolute',
                    top: '10%',
                    right: '10%',
                    width: 2,
                    height: 2,
                    background: theme.palette.info.main,
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  }}
                />
                <Box
                  className="spark-element"
                  sx={{
                    position: 'absolute',
                    bottom: '15%',
                    left: '25%',
                    width: 2,
                    height: 2,
                    background: theme.palette.info.main,
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                  }}
                />
                Connected Creatives
              </Button>
            </Box>
          ) : (
            <>
            <Stack spacing={2}>
                {displayedBookings.map((booking, index) => (
                <Box
                  key={booking.id}
                    onClick={() => handleBookingClick(booking)}
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
                            {booking.creative}
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
              {hasMoreBookings && (
                <Box sx={{ pt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CalendarMonth />}
                    onClick={() => {
                      // Navigate to orders page with All Orders tab to see all bookings
                      navigate('/client/orders?tab=0');
                    }}
                    sx={{
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      px: 2.5,
                      py: 0.75,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                      },
                    }}
                  >
                    View All Bookings ({bookings.length})
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
} 