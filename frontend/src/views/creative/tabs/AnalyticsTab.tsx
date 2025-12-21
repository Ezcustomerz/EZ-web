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
      <Box sx={{ mb: 3 }}>
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
                        // Handle upgrade click
                        console.log('Upgrade clicked');
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
