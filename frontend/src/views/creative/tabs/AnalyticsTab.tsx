import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  useTheme,
  Button,
  Skeleton,
  Paper,
} from '@mui/material';
import { 
  AttachMoney,
  CheckCircle,
  HourglassEmpty,
  Workspaces,
  Add,
} from '@mui/icons-material';
import { apiClient } from '../../../api/apiClient';
import { userService } from '../../../api/userService';
import { successToast, errorToast } from '../../../components/toast/toast';
import { IncomeOverTime } from '../../../components/analytics/IncomeOverTime';
import { ServiceBreakdown } from '../../../components/analytics/ServiceBreakdown';
import { ClientAnalytics } from '../../../components/analytics/ClientLeaderboard';
import { AddAnalyticsPopover, type AnalyticsComponent } from '../../../components/popovers/creative/AddAnalyticsPopover';

export function AnalyticsTab() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalEarnings: 0,
    plan: 'Free',
    unpaidPending: 0,
    completedProjects: 0,
  });
  const hasFetched = useRef(false);
  
  // Track which analytics components are visible
  const [visibleComponents, setVisibleComponents] = useState<Set<AnalyticsComponent>>(() => {
    const saved = localStorage.getItem('analytics-visible-components');
    if (saved) {
      try {
        return new Set(JSON.parse(saved) as AnalyticsComponent[]);
      } catch {
        // If parsing fails, default to no components
        return new Set<AnalyticsComponent>();
      }
    }
    // Default to no components visible
    return new Set<AnalyticsComponent>();
  });
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [openingStripe, setOpeningStripe] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Prevent duplicate fetches
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        const response = await apiClient.get('/creative/analytics/metrics');
        
        if (response.data) {
          setMetrics({
            totalEarnings: response.data.total_earnings || 0,
            plan: response.data.plan || 'Free',
            unpaidPending: response.data.unpaid_pending || 0,
            completedProjects: response.data.completed_projects || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Save visible components to localStorage
  useEffect(() => {
    localStorage.setItem('analytics-visible-components', JSON.stringify(Array.from(visibleComponents)));
  }, [visibleComponents]);

  const handleDeleteComponent = (component: AnalyticsComponent) => {
    setVisibleComponents(prev => {
      const newSet = new Set(prev);
      newSet.delete(component);
      return newSet;
    });
  };

  const handleAddComponent = (component: AnalyticsComponent) => {
    setVisibleComponents(prev => {
      const newSet = new Set(prev);
      newSet.add(component);
      return newSet;
    });
  };

  const handleOpenStripeDashboard = async () => {
    try {
      setOpeningStripe(true);
      const result = await userService.createStripeLoginLink();
      
      if (result.needs_onboarding) {
        errorToast('Onboarding Required', 'Please complete your Stripe account setup first.');
        return;
      }
      
      if (result.login_url) {
        window.open(result.login_url, '_blank');
        successToast('Opening Stripe dashboard...');
      } else {
        errorToast('Failed to get login URL', 'Unable to access your Stripe dashboard. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to create login link:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to open Stripe dashboard';
      errorToast('Error', errorMessage);
    } finally {
      setOpeningStripe(false);
    }
  };

  const availableToAdd = (['income', 'service', 'client'] as AnalyticsComponent[]).filter(
    comp => !visibleComponents.has(comp)
  );
  const allComponentsVisible = visibleComponents.size >= 3;

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      overflow: 'auto',
      overflowY: 'scroll', // Always show scrollbar to prevent layout shift
      p: 2,
    }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.5,
            }}
          >
            Analytics Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.85rem',
            }}
          >
            Track your earnings, performance, and service breakdown
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={
            <Box
              component="svg"
              viewBox="0 0 60 25"
              sx={{
                width: 32,
                height: 13,
                fill: 'currentColor',
              }}
            >
              <path fillRule="evenodd" clipRule="evenodd" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z"/>
            </Box>
          }
          onClick={handleOpenStripeDashboard}
          disabled={openingStripe}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 2,
            px: 2.5,
            py: 1,
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
            },
            '&:disabled': {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.6,
            },
            '& .MuiButton-startIcon': {
              marginRight: 1,
            },
          }}
        >
          {openingStripe ? 'Opening...' : 'Dashboard'}
        </Button>
      </Box>

      {/* Summary Metric Cards - Always Visible */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={`skeleton-${index}`}
              sx={{
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1 }} />
                  <Skeleton variant="text" width={100} height={16} />
                </Box>
                <Skeleton variant="text" width={80} height={32} />
              </CardContent>
            </Card>
          ))
        ) : (
          [
            {
              title: "Total Earnings",
              value: `$${metrics.totalEarnings.toLocaleString()}`,
              icon: AttachMoney,
              color: theme.palette.success.main,
              bgColor: `${theme.palette.success.main}1A`,
            },
            {
              title: "Current Plan",
              value: metrics.plan,
              icon: Workspaces,
              color: theme.palette.warning.main,
              bgColor: `${theme.palette.warning.main}1A`,
            },
            {
              title: "Unpaid Pending",
              value: `$${metrics.unpaidPending.toLocaleString()}`,
              icon: HourglassEmpty,
              color: theme.palette.info.main,
              bgColor: `${theme.palette.info.main}1A`,
            },
            {
              title: "Completed Projects",
              value: metrics.completedProjects.toString(),
              icon: CheckCircle,
              color: theme.palette.primary.main,
              bgColor: `${theme.palette.primary.main}1A`,
            },
          ].map((card, index) => {
          const IconComponent = card.icon;
          const isPlanCard = card.title === "Current Plan";
          return (
            <Card
              key={card.title}
              sx={{
                backgroundColor: card.bgColor,
                border: `1px solid ${card.color}30`,
                borderRadius: 2,
                boxShadow: `0 2px 8px ${card.color}20`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: isPlanCard ? 'default' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: isPlanCard ? 'none' : 'scale(1.05) translateY(-4px)',
                  boxShadow: isPlanCard ? `0 2px 8px ${card.color}20` : `0 8px 25px ${card.color}40`,
                  '&::before': {
                    opacity: isPlanCard ? 0 : 0.1,
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                  {isPlanCard && (
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        minWidth: 'auto',
                        py: 0.25,
                        px: 1,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          transform: 'scale(1.05) translateY(-1px)',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Dispatch custom event to open subscription tiers popover
                        window.dispatchEvent(new CustomEvent('openSubscriptionTiers'));
                      }}
                    >
                      Upgrade
                    </Button>
                  )}
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
          })
        )}
      </Box>

      {/* Collapsible Card: Income Over Time */}
      {visibleComponents.has('income') && (
        <IncomeOverTime onDelete={() => handleDeleteComponent('income')} />
      )}

      {/* Collapsible Card: Service Breakdown */}
      {visibleComponents.has('service') && (
        <ServiceBreakdown onDelete={() => handleDeleteComponent('service')} />
      )}

      {/* Client Analytics Leaderboard */}
      {visibleComponents.has('client') && (
        <ClientAnalytics onDelete={() => handleDeleteComponent('client')} />
      )}

      {/* Add Analytics Button */}
      {!allComponentsVisible && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            borderRadius: 2,
            border: '2px dashed',
            borderColor: theme.palette.secondary.main,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          <Button
            fullWidth
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              py: 2,
              textTransform: 'none',
              color: theme.palette.text.secondary,
              fontSize: '1rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'transparent',
              },
            }}
          >
            Add Analytics
          </Button>
        </Paper>
      )}

      {/* Add Analytics Popover */}
      <AddAnalyticsPopover
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        availableComponents={availableToAdd}
        onSelect={handleAddComponent}
      />
    </Box>
  );
}
