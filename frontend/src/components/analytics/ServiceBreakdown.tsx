import { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Tooltip,
  Skeleton,
  IconButton,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import { 
  PieChart as PieChartIcon,
  ExpandMore,
  InfoOutlined,
  RemoveCircleOutline,
} from '@mui/icons-material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Sector,
} from 'recharts';
import { apiClient } from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

type TimePeriod = 'week' | 'month' | 'year' | 'all-time';

interface ServiceData {
  name: string;
  value: number;
  color: string;
  service_id: string;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

interface ServiceBreakdownData {
  data: ServiceData[];
  total: number;
  available_periods: number[];
}

interface ServiceBreakdownProps {
  onDelete?: () => void;
}

export function ServiceBreakdown({ onDelete }: ServiceBreakdownProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [breakdownData, setBreakdownData] = useState<ServiceBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Remember expanded state from localStorage
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem('analytics-service-expanded');
    return saved !== null ? saved === 'true' : true; // Default to expanded
  });

  // Only fetch data when accordion is expanded
  useEffect(() => {
    if (!expanded) {
      return; // Don't fetch if collapsed
    }

    const abortController = new AbortController();
    let isMounted = true;

    const fetchServiceBreakdown = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/creative/analytics/service-breakdown', {
          params: {
            time_period: timePeriod,
            period_offset: timePeriod !== 'all-time' ? periodOffset : undefined,
          },
          signal: abortController.signal,
        });
        
        if (isMounted && response.data) {
          setBreakdownData(response.data);
        }
      } catch (error: any) {
        if (error.name !== 'CanceledError' && isMounted) {
          console.error('Error fetching service breakdown:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchServiceBreakdown();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [expanded, timePeriod, periodOffset]);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('analytics-service-expanded', expanded.toString());
  }, [expanded]);

  // Sync periodOffset with available periods when data changes
  useEffect(() => {
    if (breakdownData?.available_periods && breakdownData.available_periods.length > 0 && timePeriod !== 'all-time') {
      setPeriodOffset(prev => {
        if (!breakdownData.available_periods.includes(prev)) {
          return breakdownData.available_periods[0];
        }
        return prev;
      });
    }
  }, [breakdownData, timePeriod]);

  const handleAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  const data = useMemo(() => breakdownData?.data || [], [breakdownData]);

  const handleTimePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: TimePeriod | null,
  ) => {
    if (newPeriod !== null) {
      setTimePeriod(newPeriod);
      setActiveIndex(null); // Reset active index when period changes
      if (newPeriod !== 'all-time') {
        setPeriodOffset(0); // Reset to current period when changing view
      }
    }
  };

  const handlePeriodOffsetChange = (event: any) => {
    setPeriodOffset(Number(event.target.value));
  };

  const calculateTotal = useMemo(() => {
    return breakdownData?.total || 0;
  }, [breakdownData]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props;
    
    // Only apply the effect if this is the active slice
    const isActive = index === activeIndex;
    const radiusOffset = isActive ? 10 : 0;
    
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + radiusOffset}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / calculateTotal) * 100).toFixed(1);
      return (
        <Paper sx={{ p: 1.5, bgcolor: 'rgba(255, 255, 255, 0.98)', boxShadow: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {payload[0].name}
          </Typography>
          <Typography variant="body2" sx={{ color: payload[0].payload.color, fontWeight: 600 }}>
            ${payload[0].value.toLocaleString()} ({percentage}%)
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const handleServiceClick = (serviceId: string) => {
    navigate(`/creative/public?serviceId=${serviceId}&tab=0`);
  };

  const CustomLegend = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', px: { xs: 0, md: 3 } }}>
        {data.map((entry, index) => {
          const percentage = ((entry.value / calculateTotal) * 100).toFixed(0);
          const isActive = activeIndex === index;
          
          return (
            <Box
              key={`legend-${index}`}
              role="button"
              tabIndex={0}
              aria-label={`${entry.name}: $${entry.value.toLocaleString()} (${percentage}%)`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              onClick={() => handleServiceClick(entry.service_id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleServiceClick(entry.service_id);
                  e.preventDefault();
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                borderBottom: index !== data.length - 1 ? '1px solid' : 'none',
                borderColor: isActive ? entry.color + '40' : 'divider',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                outline: 'none',
                '&:focus-visible': {
                  outline: `2px solid ${entry.color}`,
                  outlineOffset: '2px',
                  borderRadius: 1,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: -12,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  bgcolor: entry.color,
                  borderRadius: 1,
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover': {
                  transform: 'translateX(6px)',
                  '& .service-name': {
                    color: entry.color,
                  },
                  '& .service-dot': {
                    transform: 'scale(1.3)',
                    boxShadow: `0 0 0 4px ${entry.color}20`,
                  },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  className="service-dot"
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: entry.color,
                    flexShrink: 0,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: isActive ? `2px solid ${entry.color}` : 'none',
                    boxShadow: isActive ? `0 0 0 4px ${entry.color}20` : 'none',
                  }}
                />
                <Typography 
                  className="service-name"
                  variant="body2" 
                  sx={{ 
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? entry.color : 'text.primary',
                    fontSize: '0.95rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {entry.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700,
                    color: isActive ? entry.color : 'text.primary',
                    fontSize: '0.95rem',
                    transition: 'color 0.3s ease',
                  }}
                >
                  ${entry.value.toLocaleString()}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isActive ? entry.color : 'text.secondary',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    transition: 'color 0.3s ease',
                    minWidth: 48,
                  }}
                >
                  ({percentage}%)
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  const getAvailablePeriodOptions = () => {
    if (!breakdownData || !breakdownData.available_periods || breakdownData.available_periods.length === 0 || timePeriod === 'all-time') {
      const now = new Date();
      let label;
      if (timePeriod === 'week') {
        label = 'This Week';
      } else if (timePeriod === 'month') {
        label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else if (timePeriod === 'year') {
        label = `${now.getFullYear()}`;
      } else {
        return [{ value: 0, label: 'All Time' }];
      }
      return [{ value: 0, label }];
    }
    
    const now = new Date();
    const options = [];
    
    for (const offset of breakdownData.available_periods) {
      let label;
      
      if (timePeriod === 'week') {
        if (offset === 0) {
          label = 'This Week';
        } else if (offset === -1) {
          label = 'Last Week';
        } else {
          const abs = Math.abs(offset);
          label = `${abs} Weeks Ago`;
        }
      } else if (timePeriod === 'month') {
        if (offset === 0) {
          label = 'This Month';
        } else if (offset === -1) {
          label = 'Last Month';
        } else {
          const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
          label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
      } else {
        if (offset === 0) {
          label = 'This Year';
        } else if (offset === -1) {
          label = 'Last Year';
        } else {
          const year = now.getFullYear() + offset;
          label = `${year}`;
        }
      }
      
      options.push({ value: offset, label });
    }
    return options;
  };

  const getPeriodLabel = () => {
    if (timePeriod === 'all-time') {
      return 'All Time';
    }
    
    if (!breakdownData) return 'Loading...';
    
    const now = new Date();
    
    if (timePeriod === 'week') {
      if (periodOffset === 0) {
        return 'This Week';
      } else if (periodOffset === -1) {
        return 'Last Week';
      } else {
        const abs = Math.abs(periodOffset);
        return `${abs} Weeks Ago`;
      }
    } else if (timePeriod === 'month') {
      if (periodOffset === 0) {
        return 'This Month';
      } else if (periodOffset === -1) {
        return 'Last Month';
      } else {
        const date = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    } else {
      if (periodOffset === 0) {
        return 'This Year';
      } else if (periodOffset === -1) {
        return 'Last Year';
      } else {
        const year = now.getFullYear() + periodOffset;
        return `${year}`;
      }
    }
  };

  return (
    <Accordion 
      expanded={expanded}
      onChange={handleAccordionChange}
      sx={{
        mb: 2,
        borderRadius: 2,
        '&:before': { display: 'none' },
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          },
        }}
      >
        <PieChartIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          Service Breakdown
        </Typography>
        <Tooltip 
          title="View revenue distribution across your services. Switch between time periods to analyze service performance."
          placement="top"
          arrow
        >
          <InfoOutlined sx={{ fontSize: '1rem', color: 'text.secondary', ml: 0.5, cursor: 'help' }} />
        </Tooltip>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <IconButton
            component="div"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) {
                onDelete();
              }
            }}
            sx={{
              color: 'error.main',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.dark',
              },
            }}
          >
            <RemoveCircleOutline fontSize="small" />
          </IconButton>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
            {timePeriod !== 'all-time' && (
              <>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  Time Period:
                </Typography>
                <FormControl size="small">
                  <Select
                    value={
                      breakdownData?.available_periods?.includes(periodOffset)
                        ? periodOffset
                        : breakdownData?.available_periods?.[0] ?? 0
                    }
                    onChange={handlePeriodOffsetChange}
                    disabled={loading}
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      minWidth: 140,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main + '30',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    {loading ? (
                      <MenuItem value={0} sx={{ fontSize: '0.85rem' }}>
                        Loading...
                      </MenuItem>
                    ) : (
                      getAvailablePeriodOptions().map(option => (
                        <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.85rem' }}>
                          {option.label}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
          <ToggleButtonGroup
            value={timePeriod}
            exclusive
            onChange={handleTimePeriodChange}
            size="small"
            aria-label="Time period selection"
            disabled={loading}
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.75,
                fontSize: '0.85rem',
                fontWeight: 500,
                textTransform: 'none',
                '&.Mui-selected': {
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                },
              },
            }}
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="year">Year</ToggleButton>
            <ToggleButton value="all-time">All Time</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box 
          sx={{ 
            p: 4,
            pt: 2,
            position: 'relative',
          }}
        >
          {/* Period Summary - Above Content */}
          <Box 
            sx={{ 
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'baseline',
              gap: 0.75,
              mb: 3,
            }}
          >
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontSize: '0.75rem', fontWeight: 600 }}>
              {getPeriodLabel()}:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: '1.1rem' }}>
              ${calculateTotal.toLocaleString()}
            </Typography>
          </Box>

          {loading ? (
            // Skeleton loading state
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                gap: 6, 
                alignItems: 'center',
              }}
            >
              {/* Pie Chart Skeleton */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: '#fafbff',
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: theme.palette.primary.main + '25',
                  p: 3,
                  height: 300,
                }}
              >
                <Skeleton 
                  variant="circular" 
                  width={200} 
                  height={200}
                  sx={{ bgcolor: theme.palette.primary.main + '15' }}
                />
              </Box>

              {/* Legend Skeleton */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 0, md: 3 } }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <Box
                    key={item}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      borderBottom: item !== 5 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton variant="circular" width={14} height={14} />
                      <Skeleton variant="text" width={120} height={20} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton variant="text" width={80} height={20} />
                      <Skeleton variant="text" width={45} height={20} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : data.length === 0 ? (
            // Empty state
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: 300,
                gap: 2,
              }}
            >
              <PieChartIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                No service data available
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 400 }}>
                Complete some bookings to see your service breakdown. Revenue will appear here once you have completed and paid services.
              </Typography>
            </Box>
          ) : (
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
              gap: 6, 
              alignItems: 'center',
              animation: 'fadeIn 0.5s ease-in',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(10px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {/* Pie Chart - With Border and Background */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                bgcolor: '#fafbff',
                borderRadius: 3,
                border: '2px solid',
                borderColor: theme.palette.primary.main + '25',
                p: 3,
                boxShadow: `inset 0 2px 8px rgba(0, 0, 0, 0.02), 0 2px 8px ${theme.palette.primary.main}08`,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 3,
                  padding: '2px',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}30, transparent 50%, ${theme.palette.primary.main}20)`,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                }
              }}
            >
              <ResponsiveContainer width={300} height={300}>
                <PieChart style={{ cursor: 'pointer' }}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    onClick={(data) => {
                      if (data && data.service_id) {
                        handleServiceClick(data.service_id);
                      }
                    }}
                    activeShape={renderActiveShape}
                  >
                    {data.map((entry) => (
                      <Cell 
                        key={`cell-${entry.service_id}`} 
                        fill={entry.color}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            {/* Legend - Separate Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 300 }}>
              <CustomLegend />
            </Box>
          </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

