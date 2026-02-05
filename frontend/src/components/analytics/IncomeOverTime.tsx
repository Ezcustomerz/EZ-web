import { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  Skeleton,
  IconButton,
} from '@mui/material';
import { 
  ShowChart,
  ExpandMore,
  InfoOutlined,
  RemoveCircleOutline,
} from '@mui/icons-material';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { apiClient } from '../../api/apiClient';
import { errorToast } from '../toast/toast';

type TimePeriod = 'week' | 'month' | 'year';

interface IncomeDataPoint {
  name: string;
  income: number | null;
  isCurrent: boolean;
}

interface IncomeOverTimeData {
  data: IncomeDataPoint[];
  total: number;
  available_periods: number[];
  account_created_at: string;
}

interface IncomeOverTimeProps {
  onDelete?: () => void;
}

export function IncomeOverTime({ onDelete }: IncomeOverTimeProps) {
  const theme = useTheme();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [incomeData, setIncomeData] = useState<IncomeOverTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Remember expanded state from localStorage
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem('analytics-income-expanded');
    return saved !== null ? saved === 'true' : true; // Default to expanded
  });

  // Only fetch data when accordion is expanded
  useEffect(() => {
    if (!expanded) {
      return; // Don't fetch if collapsed
    }

    const abortController = new AbortController();
    let isMounted = true;

    const fetchIncomeData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/creative/analytics/income-over-time', {
          params: {
            time_period: timePeriod,
            period_offset: periodOffset,
          },
          signal: abortController.signal,
        });
        
        if (isMounted && response.data) {
          setIncomeData(response.data);
        }
      } catch (error: any) {
        if (error.name !== 'CanceledError' && isMounted) {
          errorToast('Unable to load income data', 'Analytics data could not be loaded. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchIncomeData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [expanded, timePeriod, periodOffset]);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('analytics-income-expanded', expanded.toString());
  }, [expanded]);

  // Sync periodOffset with available periods when data changes
  useEffect(() => {
    if (incomeData?.available_periods && incomeData.available_periods.length > 0) {
      // If current periodOffset is not in available periods, set it to the first available
      setPeriodOffset(prev => {
        if (!incomeData.available_periods.includes(prev)) {
          return incomeData.available_periods[0];
        }
        return prev;
      });
    }
  }, [incomeData]); // Only depend on incomeData, use functional update to read current periodOffset

  const handleAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  const handleTimePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: TimePeriod | null,
  ) => {
    if (newPeriod !== null) {
      setTimePeriod(newPeriod);
      // Reset to 0, but it will be synced with available periods when data loads
      setPeriodOffset(0);
    }
  };

  const handlePeriodOffsetChange = (event: any) => {
    setPeriodOffset(Number(event.target.value));
  };

  const getAvailablePeriodOptions = () => {
    if (!incomeData || !incomeData.available_periods || incomeData.available_periods.length === 0) {
      // Default to just showing current period if no data
      const now = new Date();
      let label;
      if (timePeriod === 'week') {
        label = 'This Week';
      } else if (timePeriod === 'month') {
        label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else {
        label = `${now.getFullYear()}`;
      }
      return [{ value: 0, label }];
    }
    
    const now = new Date();
    const options = [];
    
    for (const offset of incomeData.available_periods) {
      let label;
      
      if (timePeriod === 'week') {
        // For weeks, keep simple labels
        if (offset === 0) {
          label = 'This Week';
        } else if (offset === -1) {
          label = 'Last Week';
        } else {
          const abs = Math.abs(offset);
          label = `${abs} Weeks Ago`;
        }
      } else if (timePeriod === 'month') {
        // For months, show special label for current month, otherwise show month and year
        if (offset === 0) {
          label = 'This Month';
        } else if (offset === -1) {
          label = 'Last Month';
        } else {
          const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
          label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
      } else {
        // For years, show special label for current year, otherwise show year
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
    if (!incomeData) return 'Loading...';
    
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

  const getChartData = () => {
    return incomeData?.data || [];
  };

  const calculatePeriodTotal = () => {
    return incomeData?.total || 0;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, bgcolor: 'rgba(255, 255, 255, 0.98)', boxShadow: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {payload[0].payload.name}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            ${payload[0].value.toLocaleString()}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    
    if (payload.income === null) return null;
    
    if (payload.isCurrent) {
      // Current period - larger, pulsing dot with ring
      return (
        <g>
          {/* Outer ring */}
          <circle
            cx={cx}
            cy={cy}
            r={10}
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            opacity={0.4}
          />
          {/* Main dot */}
          <circle
            cx={cx}
            cy={cy}
            r={7}
            fill={theme.palette.primary.main}
            stroke="#fff"
            strokeWidth={3}
          />
        </g>
      );
    }
    
    // Regular dots
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={theme.palette.primary.main}
        stroke="#fff"
        strokeWidth={2}
      />
    );
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
        <ShowChart sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          Income Over Time
        </Typography>
        <Tooltip 
          title="Track your income trends by week, month, or year. View current and past periods to analyze your earnings history."
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              Time Period:
            </Typography>
            {/* Period Selector Dropdown */}
              <FormControl size="small">
                <Select
                  value={
                    incomeData?.available_periods?.includes(periodOffset)
                      ? periodOffset
                      : incomeData?.available_periods?.[0] ?? 0
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
          </Box>
          <ToggleButtonGroup
            value={timePeriod}
            exclusive
            onChange={handleTimePeriodChange}
            size="small"
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
          </ToggleButtonGroup>
        </Box>

        {/* Chart Container */}
        {loading ? (
          <Box 
            sx={{ 
              p: 4,
              bgcolor: '#fafbff',
              borderRadius: 3,
              border: '2px solid',
              borderColor: theme.palette.primary.main + '25',
            }}
          >
            {/* Skeleton for period total */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Skeleton variant="text" width={180} height={30} />
            </Box>
            
            {/* Simple skeleton mimicking the chart structure */}
            <Box sx={{ height: 400, display: 'flex', gap: 1 }}>
              {/* Y-axis */}
              <Box sx={{ width: 50, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 3 }}>
                <Skeleton variant="text" width={45} height={16} />
                <Skeleton variant="text" width={45} height={16} />
                <Skeleton variant="text" width={45} height={16} />
                <Skeleton variant="text" width={45} height={16} />
                <Skeleton variant="text" width={45} height={16} />
              </Box>
              
              {/* Chart area */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: 2 }}>
                {/* Main chart skeleton */}
                <Box sx={{ height: 340, mb: 1 }}>
                  <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 1 }} />
                </Box>
                
                {/* X-axis labels */}
                <Box sx={{ display: 'flex', justifyContent: 'space-around', pt: 1 }}>
                  <Skeleton variant="text" width={60} height={16} />
                  <Skeleton variant="text" width={60} height={16} />
                  <Skeleton variant="text" width={60} height={16} />
                  <Skeleton variant="text" width={60} height={16} />
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
        <Box 
          sx={{ 
            p: 4,
            bgcolor: '#fafbff',
            borderRadius: 3,
            border: '2px solid',
            borderColor: theme.palette.primary.main + '25',
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
          {/* Period Summary - Top Right */}
          <Box 
            sx={{ 
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 0.75,
              zIndex: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontSize: '0.75rem', fontWeight: 600 }}>
              {getPeriodLabel()}:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: '1.1rem' }}>
              ${calculatePeriodTotal().toLocaleString()}
            </Typography>
          </Box>

          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={getChartData()} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="name" 
                stroke={theme.palette.text.secondary}
                style={{ fontSize: '0.85rem' }}
                dy={10}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                style={{ fontSize: '0.85rem' }}
                tickFormatter={(value) => {
                  if (value === 0) return '$0';
                  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
                  return `$${value}`;
                }}
                width={60}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke={theme.palette.primary.main} 
                strokeWidth={3}
                fill="url(#colorIncome)"
                dot={<CustomDot />}
                activeDot={{ r: 8, fill: theme.palette.primary.main, stroke: '#fff', strokeWidth: 3 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

