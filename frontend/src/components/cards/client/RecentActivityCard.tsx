import { Box, Typography, Card, Chip, useTheme, Stack } from '@mui/material';
import { 
  History, 
  Download, 
  Payment, 
  CheckCircle, 
  Warning, 
  Error, 
  GraphicEqOutlined 
} from '@mui/icons-material';

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

  const getStatusChipProps = (status: string) => {
    switch (status) {
      case 'waiting':
        return { color: 'warning' as const, icon: <Warning /> };
      case 'payment':
        return { color: 'error' as const, icon: <Error /> };
      case 'completed':
        return { color: 'success' as const, icon: <CheckCircle /> };
      default:
        return { color: 'info' as const, icon: <History /> };
    }
  };

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
          maxHeight: { xs: '400px', md: 'none' },
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
                            width: 18,
                            height: 18,
                            color: chipProps.color === 'warning' ? theme.palette.warning.main :
                              chipProps.color === 'error' ? theme.palette.error.main :
                                chipProps.color === 'success' ? theme.palette.success.main :
                                  theme.palette.info.main,
                            mt: 0.25,
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
                                  fontSize: '0.8rem'
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