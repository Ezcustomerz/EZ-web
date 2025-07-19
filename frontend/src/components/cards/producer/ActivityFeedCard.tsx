import { Box, Typography, Card, Chip, useTheme, useMediaQuery, Button } from '@mui/material';
import {
  GraphicEqOutlined,
  PersonAddOutlined,
} from '@mui/icons-material';

interface Notification {
  icon: any;
  label: string;
  description: string;
  client: string;
  date: string;
  isNew: boolean;
  type: string;
  borderColor: string;
}

interface ActivityFeedCardProps {
  notifications?: Notification[];
  newCount?: number;
}

export function ActivityFeedCard({ }: ActivityFeedCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Empty notifications array for testing
  const testNotifications: Notification[] = [];

  // Use test notifications (empty array) instead of hardcoded ones
  const displayNotifications = testNotifications;

  // Calculate actual new count from notifications
  const actualNewCount = displayNotifications.filter(n => n.isNew).length;

  return (
    <Card sx={{ 
      position: 'relative', 
      zIndex: 1, 
      // Responsive flex behavior
      flex: isMobile ? 'none' : 1, 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0,
      height: '100%',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      borderRadius: 1,
      p: 3,
      transition: 'all 0.3s ease-in-out',
      animation: 'fadeIn 0.6s ease-out 0.4s both',
      // Add bottom margin for better mobile scrolling
      mb: isMobile ? 4 : 0,
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    }}>
      {/* Activity Feed Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap',
        gap: 1,
      }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.25,
            }}
          >
            Recent Activity
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              color: 'text.secondary',
            }}
          >
            Latest updates and interactions
          </Typography>
        </Box>
        {actualNewCount > 0 && (
          <Chip
            label={`${actualNewCount} new`}
            size="small"
            sx={{
              backgroundColor: theme.palette.error.main,
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 600,
              height: 24,
              '& .MuiChip-label': {
                px: 1.2,
                py: 0.3,
              },
            }}
          />
        )}
      </Box>

      {/* Notifications List or Empty State */}
      <Box
        sx={{
          // Responsive sizing behavior
          ...(isMobile 
            ? { maxHeight: '400px' } 
            : { flex: 1, minHeight: 0 }
          ),
          overflowY: displayNotifications.length === 0 ? 'visible' : 'auto',
          overflowX: 'visible',
          px: 2,
          py: 1,
          transition: 'all 0.3s ease-in-out',
          // Custom scrollbar styling
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
          // Smooth scrolling
          scrollBehavior: 'smooth',
        }}
      >
        {/* Empty State */}
        {displayNotifications.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pb: { xs: 4, sm: 4, md: 5, lg: 6 },
              px: 3,
              textAlign: 'center',
              minHeight: { xs: '280px', sm: '280px', md: '300px' },
              position: 'relative',
              // Soft gradient background
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
            }}
          >
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
              You're all caught up!
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
              We'll notify you here when your clients book, pay, or have upcoming sessions.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PersonAddOutlined />}
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
              Invite Client
            </Button>
          </Box>
        ) : (
          /* Notifications List */
          displayNotifications.map((notification, index) => {
            const IconComponent = notification.icon;
            return (
              <Box
                key={index}
                sx={{
                  backgroundColor: '#fafbfc',
                  borderRadius: 1.5,
                  p: 1.5,
                  mb: 2,
                  mt: 1,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  border: `1px solid rgba(0, 0, 0, 0.06)`,
                  borderLeft: `4px solid ${notification.borderColor}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'visible',
                  '&:hover': {
                    transform: 'scale(1.03) translateY(-8px)',
                    backgroundColor: '#f1f5f9',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
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
                    <IconComponent
                      sx={{
                        width: 18,
                        height: 18,
                        color: notification.borderColor,
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
                          {notification.label}
                        </Typography>
                        {notification.isNew && (
                          <Chip
                            label="New"
                            size="small"
                            sx={{
                              backgroundColor: theme.palette.primary.main,
                              color: 'white',
                              fontSize: '0.6rem',
                              height: 18,
                              ml: 1,
                              '& .MuiChip-label': {
                                px: 0.8,
                                py: 0.2,
                              },
                            }}
                          />
                        )}
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
                        {notification.description}
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
                          {notification.client}
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
                    }}
                  >
                    {notification.date}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Card>
  );
} 