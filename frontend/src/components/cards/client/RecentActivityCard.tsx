import { Box, Typography, Card, Chip, useTheme, Stack, Button } from '@mui/material';
import { 
  HistoryOutlined, 
  CheckCircleOutlined, 
  WarningOutlined, 
  ErrorOutlined, 
  MusicNote,
  Timeline
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: number;
  action: string;
  timestamp: string;
  status: string;
  icon?: any;
  statusText: string;
  producer: string;
}

interface RecentActivityCardProps {
  activities?: Activity[];
}

export function RecentActivityCard({ activities = [] }: RecentActivityCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const getStatusChipProps = (status: string) => {
    switch (status) {
      case 'waiting':
        return { color: 'warning' as const, icon: <WarningOutlined fontSize="small" sx={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1 }} /> };
      case 'payment':
        return { color: 'error' as const, icon: <ErrorOutlined fontSize="small" sx={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1 }} /> };
      case 'completed':
        return { color: 'success' as const, icon: <CheckCircleOutlined fontSize="small" sx={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1 }} /> };
      default:
        return { color: 'info' as const, icon: <HistoryOutlined fontSize="small" sx={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1 }} /> };
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

        {/* Content Area */}
        <Box sx={{
          flex: { xs: 'none', md: 1 },
          minHeight: { xs: '300px', md: 0 },
          maxHeight: 'calc(100vh - 400px)',
          overflowY: activities.length === 0 ? 'visible' : 'auto',
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
          {activities.length === 0 ? (
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
              <Timeline
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
                You haven't done anything yet. Start by booking your first service!
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MusicNote />}
                onClick={() => {
                  navigate('/client/book');
                  // Set the active tab to 1 (Connected Services) in localStorage
                  localStorage.setItem('book-active-tab', '1');
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
                Connected Services
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {activities.map((activity, index) => {
                const chipProps = getStatusChipProps(activity.status);
                return (
                  <Box
                    key={activity.id}
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 1.5,
                      p: 1.5,
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderLeft: `4px solid ${chipProps.color === 'warning' ? theme.palette.warning.main :
                          chipProps.color === 'error' ? theme.palette.error.main :
                            chipProps.color === 'success' ? theme.palette.success.main :
                              theme.palette.info.main
                        }`,
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
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 20,
                            height: 20,
                            color: chipProps.color === 'warning' ? theme.palette.warning.main :
                              chipProps.color === 'error' ? theme.palette.error.main :
                                chipProps.color === 'success' ? theme.palette.success.main :
                                  theme.palette.info.main,
                            mt: 0.25,
                            '& .MuiSvgIcon-root': {
                              fontSize: '1rem',
                              '& path': {
                                fill: 'none !important',
                                stroke: 'currentColor',
                                strokeWidth: 1,
                              }
                            }
                          }}
                        >
                          {activity.icon || chipProps.icon}
                        </Box>
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
                              {activity.action}
                            </Typography>
                            <Chip
                              label={activity.statusText}
                              size="small"
                              color={chipProps.color}
                              icon={chipProps.icon}
                              variant="outlined"
                              sx={{
                                fontSize: '0.6rem',
                                height: 18,
                                ml: 1,
                                '& .MuiChip-label': {
                                  px: 0.8,
                                  py: 0.2,
                                },
                                '& .MuiChip-icon': {
                                  fontSize: '0.8rem',
                                  '& .MuiSvgIcon-root': {
                                    fontSize: '0.8rem',
                                  }
                                }
                              }}
                            />
                          </Box>
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
                              {activity.producer}
                            </Box>
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              color: 'rgba(0, 0, 0, 0.4)',
                              whiteSpace: 'nowrap',
                              display: { xs: 'block', md: 'none' },
                              mt: 1,
                            }}
                          >
                            {activity.timestamp}
                          </Typography>
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
                          display: { xs: 'none', md: 'block' },
                        }}
                      >
                        {activity.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Card>
    </Box>
  );
} 