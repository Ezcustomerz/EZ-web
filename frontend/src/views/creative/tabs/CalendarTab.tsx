import { Box, Typography, IconButton, Button, useTheme, useMediaQuery, Paper, Tooltip, Zoom, Skeleton } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos, Settings } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parse } from 'date-fns';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Fade, Stack } from '@mui/material';
import { orange, grey } from '@mui/material/colors';
import { Fab, Menu as MuiMenu, MenuItem as MuiMenuItem } from '@mui/material';
import { HeadsetMic, MoreVert } from '@mui/icons-material';
import { CalendarDaySessionListPopover } from '../../../components/popovers/creative/CalendarDaySessionListPopover';
import { CalendarSessionDetailPopover } from '../../../components/popovers/creative/CalendarSessionDetailPopover';
import { CalendarDayCard } from '../../../components/cards/creative/CalendarDayCard';
import { bookingService } from '../../../api/bookingService';
import type { CalendarSession } from '../../../api/bookingService';
import { useAuth } from '../../../context/auth';
import { AuthPopover } from '../../../components/popovers/auth/AuthPopover';
import { ComingSoonDialog } from '../../../components/dialogs/ComingSoonDialog';

type Session = CalendarSession;

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarTabProps {
  dayDialogOpen: boolean;
  setDayDialogOpen: (open: boolean) => void;
  sessionDialogOpen: boolean;
  setSessionDialogOpen: (open: boolean) => void;
}

export function CalendarTab({ dayDialogOpen, setDayDialogOpen, sessionDialogOpen, setSessionDialogOpen }: CalendarTabProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:700px), (max-height:700px)');
  const isTallScreen = useMediaQuery('(min-height: 900px)');
  const isIPadMini = useMediaQuery('(min-height: 1024px) and (max-width: 1024px)');
  const isIPadAir = useMediaQuery('(min-height: 1180px) and (max-width: 1180px)');
  const isIPadPro = useMediaQuery('(min-height: 1366px) and (max-width: 1366px)');
  const { isAuthenticated } = useAuth();
  
  // Determine max sessions to show based on screen height and width
  const maxSessionsToShow = isMobile ? 2 : isIPadPro ? 9 : isIPadAir ? 8 : isIPadMini ? 6 : isTallScreen ? 4 : 2;
  const [currentMonth, setCurrentMonth] = useState(new Date()); // for desktop
  const [mobileStartOfWeek, setMobileStartOfWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [fabMenuAnchor, setFabMenuAnchor] = useState<null | HTMLElement>(null);
  const handleFabMenuOpen = (e: React.MouseEvent<HTMLElement>) => setFabMenuAnchor(e.currentTarget);
  const handleFabMenuClose = () => setFabMenuAnchor(null);
  const [authPopoverOpen, setAuthPopoverOpen] = useState(false);
  const [comingSoonDialogOpen, setComingSoonDialogOpen] = useState(false);

  // Fetch sessions when month changes (desktop) or week changes (mobile)
  useEffect(() => {
    // Don't fetch calendar sessions if user is not authenticated
    if (!isAuthenticated) {
      setSessions([]);
      setIsLoadingSessions(false);
      return;
    }

    const fetchSessions = async () => {
      setIsLoadingSessions(true);
      try {
        if (isMobile) {
          // Mobile view: fetch sessions for the current week using week endpoint
          const weekEnd = addDays(mobileStartOfWeek, 6);
          const startDateStr = format(mobileStartOfWeek, 'yyyy-MM-dd');
          const endDateStr = format(weekEnd, 'yyyy-MM-dd');
          
          const fetchedSessions = await bookingService.getCreativeCalendarSessionsWeek(startDateStr, endDateStr);
          setSessions(fetchedSessions);
        } else {
          // Desktop view: fetch sessions for the current month
          const year = currentMonth.getFullYear();
          const month = currentMonth.getMonth() + 1; // JavaScript months are 0-indexed
          const fetchedSessions = await bookingService.getCreativeCalendarSessions(year, month);
          setSessions(fetchedSessions);
        }
      } catch (error) {
        console.error('Error fetching calendar sessions:', error);
        setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [currentMonth, mobileStartOfWeek, isMobile, isAuthenticated]);

  // Month navigation
  const [monthTransition, setMonthTransition] = useState<'left' | 'right' | null>(null);
  function handlePrevMonth() { setMonthTransition('left'); setTimeout(() => { setCurrentMonth(subMonths(currentMonth, 1)); setMonthTransition(null); }, 180); }
  function handleNextMonth() { setMonthTransition('right'); setTimeout(() => { setCurrentMonth(addMonths(currentMonth, 1)); setMonthTransition(null); }, 180); }

  // Calendar grid generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = '';
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, 'yyyy-MM-dd');
      days.push({
        date: new Date(day),
        formatted: formattedDate,
        isCurrentMonth: isSameMonth(day, monthStart),
        isToday: isToday(day),
        isSelected: selectedDate && isSameDay(day, selectedDate),
        sessions: isLoadingSessions ? [] : sessions.filter(s => s.date === formattedDate),
      });
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  // Open day dialog
  function openDayDialog(date: Date) {
    if (!isAuthenticated) {
      setAuthPopoverOpen(true);
      return;
    }
    setSelectedDate(date);
    setDayDialogOpen(true);
  }
  function closeDayDialog() {
    setDayDialogOpen(false);
    setSelectedDate(null);
  }
  // Open session detail dialog
  function openSessionDialog(session: Session) {
    setSelectedSession(session);
    setSessionDialogOpen(true);
  }
  function closeSessionDialog() {
    setSessionDialogOpen(false);
    setSelectedSession(null);
  }

  // Helper: session status to color (for dot/avatar)
  function getSessionDotColor(status: Session['status']) {
    if (status === 'confirmed') return theme.palette.success.main;
    if (status === 'pending') return theme.palette.warning.main;
    if (status === 'cancelled') return theme.palette.error.main;
    return grey[400];
  }

  // Main render
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{
        width: '100%',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        pb: { xs: 0, sm: 0 },
        minHeight: 0,
        maxWidth: '100%',
        height: '100%',
        overflow: 'hidden',
        maxHeight: '100%',
        animation: 'fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1)',
        '@keyframes fadeInCard': {
          '0%': { opacity: 0, transform: 'scale(0.97) translateY(16px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
      }}>
        {isMobile ? (
          <Box sx={{ 
            width: '100%', 
            maxWidth: '100%', 
            overflow: 'hidden', 
            position: 'relative', 
            height: 'calc(100vh - 240px)',
            display: 'flex', 
            flexDirection: 'column',
            minHeight: 0,
          }}>
            {/* Fixed header area */}
            <Box sx={{ flexShrink: 0, pb: 1 }}>
              {/* Week navigation header */}
              <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1}>
                <IconButton size="small" color="primary" aria-label="Previous week" onClick={() => setMobileStartOfWeek(prev => addDays(prev, -7))}>
                  <ChevronLeft />
                </IconButton>
                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 700 }}>
                  Week of {format(mobileStartOfWeek, 'MMM d')} – {format(addDays(mobileStartOfWeek, 6), 'MMM d')}
                </Typography>
                <IconButton size="small" color="primary" aria-label="Next week" onClick={() => setMobileStartOfWeek(prev => addDays(prev, 7))}>
                  <ChevronRight />
                </IconButton>
              </Box>
            </Box>
            
            {/* Scrollable day cards area */}
            <Box sx={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              minHeight: 0,
              px: 2,
              pb: 2,
            }}>
              <Stack spacing={1.5} sx={{ py: 1 }}>
                {isLoadingSessions ? (
                  Array.from({ length: 7 }, (_, i) => {
                    const date = addDays(mobileStartOfWeek, i);
                    // Create a pseudo-random but consistent pattern based on date
                    const dayOfWeek = date.getDay();
                    const dayOfMonth = date.getDate();
                    const seed = (dayOfMonth * 7 + dayOfWeek) % 5;
                    const skeletonCount = seed === 0 ? 0 : seed === 1 ? 1 : seed === 2 ? 2 : 3;
                    
                    return (
                      <Paper
                        key={`skeleton-${i}`}
                        elevation={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: theme.palette.background.paper,
                          minHeight: 48,
                          maxHeight: 160,
                        }}
                      >
                        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                        {skeletonCount > 0 && (
                          <Box sx={{ mt: 0.5, overflow: 'hidden', width: '100%' }}>
                            {Array.from({ length: Math.min(skeletonCount, 3) }, (_, j) => (
                              <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25, width: '100%' }}>
                                <Skeleton variant="circular" width={5} height={5} sx={{ flexShrink: 0 }} />
                                <Skeleton variant="rectangular" width={`${55 + (j * 10)}%`} height={16} sx={{ borderRadius: 1, flexShrink: 1, maxWidth: 'calc(100% - 10px)' }} />
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Paper>
                    );
                  })
                ) : (
                  Array.from({ length: 7 }, (_, i) => {
                  const date = addDays(mobileStartOfWeek, i);
                  const formatted = format(date, 'yyyy-MM-dd');
                  const daySessions = sessions.filter(s => s.date === formatted);
                  const isTodayCell = isToday(date);
                  return (
                    <CalendarDayCard
                      key={formatted}
                      date={date}
                      isToday={isTodayCell}
                      sessions={daySessions.map(s => ({ id: s.id, type: s.type, status: s.status }))}
                      onClick={() => {
                        if (!isAuthenticated) {
                          setAuthPopoverOpen(true);
                          return;
                        }
                        setSelectedDate(date);
                        setDayDialogOpen(true);
                      }}
                    />
                  );
                  })
                )}
              </Stack>
            </Box>
            
            {/* Fixed FAB for actions */}
            <Fab color="primary" aria-label="more options" sx={{ position: 'fixed', bottom: { xs: 80, sm: 24 }, right: 16, zIndex: 1301 }} onClick={handleFabMenuOpen}>
              <MoreVert />
            </Fab>
            <MuiMenu
              anchorEl={fabMenuAnchor}
              open={Boolean(fabMenuAnchor)}
              onClose={handleFabMenuClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              PaperProps={{ sx: { borderRadius: 2, minWidth: 160, p: 0.5 } }}
            >
              <MuiMenuItem onClick={() => { handleFabMenuClose(); setComingSoonDialogOpen(true); }}><HeadsetMic sx={{ mr: 1 }} /> New Session</MuiMenuItem>
              <MuiMenuItem onClick={handleFabMenuClose}><Settings sx={{ mr: 1 }} /> Calendar Settings</MuiMenuItem>
            </MuiMenu>

          </Box>
        ) : (
          <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 0, sm: 1 }, minHeight: 0, overflow: 'visible' }}>
            {/* Top bar: Month navigation & actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, mt: 0, pt: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={handlePrevMonth} size="medium" color="primary" aria-label="Previous month" sx={{ p: 1.2 }}><ArrowBackIosNew fontSize="medium" /></IconButton>
                <Typography variant="h6" sx={{ fontWeight: 700, mx: 1.2, color: 'text.primary', minWidth: 120, textAlign: 'center', py: 0, mt: 0, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>{format(currentMonth, 'MMMM yyyy')}</Typography>
                <IconButton onClick={handleNextMonth} size="medium" color="primary" aria-label="Next month" sx={{ p: 1.2 }}><ArrowForwardIos fontSize="medium" /></IconButton>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0, mt: 0 }}>
                <Button
                  variant="contained"
                  startIcon={<HeadsetMic />}
                  size="small"
                  onClick={() => setComingSoonDialogOpen(true)}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: 2,
                    px: 3,
                    height: '40px',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                    transition: 'all 0.2s ease-in-out',
                    minWidth: { xs: 'auto', sm: 'auto' },
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
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '20%',
                      left: '15%',
                      width: 4,
                      height: 4,
                      background: 'rgba(255,255,255,0.92)',
                      boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
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
                      background: 'rgba(255,255,255,0.92)',
                      boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                      borderRadius: '50%',
                      transform: 'scale(0)',
                      opacity: 0,
                      transition: 'all 0.2s ease-in-out',
                    },
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.5)',
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
                      background: 'rgba(255,255,255,0.92)',
                      boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
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
                      background: 'rgba(255,255,255,0.92)',
                      boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                      borderRadius: '50%',
                      transform: 'scale(0)',
                      opacity: 0,
                      transition: 'all 0.2s ease-in-out',
                    }}
                  />
                  New Session
                </Button>
              </Box>
            </Box>
            {/* Calendar grid with animated transition */}
            <Box sx={{ position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minHeight: 0, height: '100%' }}>
              <Fade in={!monthTransition} timeout={180} style={{ transitionDelay: monthTransition ? '180ms' : '0ms' }}>
                <Paper sx={{
                  p: { xs: 0.5, sm: 2 },
                  borderRadius: 3,
                  boxShadow: 2,
                  background: theme.palette.background.paper,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'visible',
                  height: '100%',
                  flexGrow: 1,
                }}>
                  {/* Weekday labels */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
                    {weekdayLabels.map(day => (
                      <Typography key={day} variant="subtitle2" sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 600, py: 0.2 }}>{day}</Typography>
                    ))}
                  </Box>
                  {/* Weeks as rows */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, flexGrow: 1 }}>
                    {rows.map((week, weekIdx) => (
                      <Box key={weekIdx} sx={{ display: 'flex', flex: 1, gap: 0 }}>
                        {week.map((cell, idx) => {
                          const cellSessions = cell.sessions;
                          const isTodayCell = isToday(cell.date);
                          return (
                            <Box
                              key={cell.formatted + idx}
                              onClick={() => openDayDialog(cell.date)}
                              sx={{
                                flex: 1,
                                minWidth: 0,
                                height: '100%',
                                borderRadius: 0,
                                background: cell.isSelected ? (theme.palette.custom?.amber || orange[100]) : (cell.isCurrentMonth ? (isTodayCell ? theme.palette.background.paper : theme.palette.background.default) : theme.palette.action.hover),
                                border: isTodayCell ? `1.5px solid ${theme.palette.secondary.main}` : '1px solid #e0e0e0',
                                opacity: cell.isCurrentMonth ? 1 : 0.5,
                                cursor: 'pointer',
                                p: { xs: 0.8, sm: 0.9, md: 1 },
                                position: 'relative',
                                transition: 'border 0.18s, box-shadow 0.18s, background 0.18s, opacity 0.18s',
                                boxShadow: cell.isSelected ? '0 4px 16px 0 rgba(122,95,255,0.10)' : (isTodayCell ? '0 2px 8px 0 rgba(122,95,255,0.07)' : undefined),
                                '&:hover, &:focus': {
                                  borderColor: theme.palette.primary.main,
                                  boxShadow: '0 2px 12px 0 rgba(122,95,255,0.09)',
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                overflow: 'hidden',
                                color: cell.isCurrentMonth ? 'inherit' : theme.palette.text.disabled,
                                boxSizing: 'border-box',
                              }}
                            >
                              {/* Date label */}
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  color: isTodayCell ? theme.palette.secondary.main : theme.palette.text.primary,
                                  lineHeight: 1.18,
                                  fontSize: { xs: isTodayCell ? '1.13rem' : '1.01rem', sm: isTodayCell ? '1.22rem' : '1.13rem' },
                                  letterSpacing: 0.01,
                                }}
                              >
                                {format(cell.date, 'd')}
                              </Typography>
                              {/* Session previews */}
                              <Box sx={{
                                overflow: 'hidden',
                                maxHeight: 'calc(100% - 24px)',
                                width: '100%',
                                pr: 0.5,
                              }}>
                                {isLoadingSessions ? (
                                  // Show realistic skeleton count - only for current month days, vary by day
                                  (() => {
                                    // Only show skeletons for current month days
                                    if (!cell.isCurrentMonth) {
                                      return null;
                                    }
                                    
                                    const dayOfWeek = cell.date.getDay();
                                    const dayOfMonth = cell.date.getDate();
                                    // Create a pseudo-random but consistent pattern based on date
                                    const seed = (dayOfMonth * 7 + dayOfWeek) % 6;
                                    // More days with 0-1 sessions, fewer with 2
                                    const skeletonCount = seed === 0 || seed === 1 ? 0 : seed === 2 || seed === 3 ? 1 : 2;
                                    
                                    if (skeletonCount === 0) {
                                      return null; // No sessions for this day
                                    }
                                    
                                    return (
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, mt: 0.5, width: '100%', overflow: 'hidden' }}>
                                        {Array.from({ length: skeletonCount }, (_, i) => (
                                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', width: '100%', minHeight: { xs: 14, sm: 16, md: 18 }, mb: 0 }}>
                                            <Skeleton 
                                              variant="circular" 
                                              width={6} 
                                              height={6} 
                                              sx={{ 
                                                mr: 0.5, 
                                                flexShrink: 0, 
                                                minWidth: 6,
                                                animation: 'pulse 1.5s ease-in-out infinite'
                                              }} 
                                            />
                                            <Skeleton 
                                              variant="text" 
                                              width={`${45 + (i * 12)}%`} 
                                              height={12} 
                                              sx={{ 
                                                flexShrink: 1, 
                                                maxWidth: 'calc(100% - 10px)',
                                                animation: 'pulse 1.5s ease-in-out infinite'
                                              }} 
                                            />
                                          </Box>
                                        ))}
                                      </Box>
                                    );
                                  })()
                                ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
                                    {cellSessions.slice(0, maxSessionsToShow).map((session, sessionIdx) => (
                                      <Fade
                                        key={session.id}
                                        in={!isLoadingSessions}
                                        timeout={300}
                                        style={{ transitionDelay: `${sessionIdx * 50}ms` }}
                                      >
                                        <Box>
                                    <Tooltip
                                      title={<>
                                        <Typography fontWeight={700}>{session.type}</Typography>
                                        <Typography fontSize="0.92rem">{session.time} - {session.endTime}</Typography>
                                        <Typography fontSize="0.92rem" color="text.secondary">{session.client}</Typography>
                                      </>}
                                      arrow
                                      placement="top"
                                      slots={{ transition: Zoom }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', minHeight: { xs: 14, sm: 16, md: 18 } }}>
                                        <Box sx={{ 
                                          width: { xs: 6, sm: 7, md: 8, lg: 9 }, 
                                          height: { xs: 6, sm: 7, md: 8, lg: 9 }, 
                                          borderRadius: '50%', 
                                          bgcolor: getSessionDotColor(session.status), 
                                          display: 'inline-block', 
                                          mr: 0.5, 
                                          mb: '-1.5px',
                                          flexShrink: 0,
                                          minWidth: { xs: 6, sm: 7, md: 8, lg: 9 },
                                          minHeight: { xs: 6, sm: 7, md: 8, lg: 9 }
                                        }} />
                                        <Typography variant="body2" sx={{ 
                                          color: 'text.secondary', 
                                          fontWeight: 500, 
                                          fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' }, 
                                          whiteSpace: 'nowrap', 
                                          overflow: 'hidden', 
                                          textOverflow: 'ellipsis',
                                          lineHeight: 1.2
                                        }}>{session.type} {session.client ? `– ${session.client}` : ''}</Typography>
                                      </Box>
                                    </Tooltip>
                                        </Box>
                                      </Fade>
                                  ))}
                                </Box>
                                )}
                              </Box>
                              {/* +X more indicator - outside overflow container */}
                              {cellSessions.length > maxSessionsToShow && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    fontWeight: 500,
                                    fontSize: '0.78rem',
                                    textAlign: 'center',
                                    mt: 0.5,
                                    position: 'absolute',
                                    bottom: 2,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  +{cellSessions.length - maxSessionsToShow} more
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Fade>
            </Box>
          </Box>
        )}

        {/* Session List Popover */}
        <CalendarDaySessionListPopover
          open={dayDialogOpen}
          onClose={closeDayDialog}
          selectedDate={selectedDate}
          sessions={sessions}
          onSessionClick={(session) => {
            openSessionDialog(session);
            closeDayDialog();
          }}
        />

        {/* Session Detail Popover */}
        <CalendarSessionDetailPopover
          open={sessionDialogOpen}
          onClose={closeSessionDialog}
          session={selectedSession}
          onBack={() => {
            if (selectedSession) {
              setSelectedDate(parse(selectedSession.date, 'yyyy-MM-dd', new Date()));
            }
            setSessionDialogOpen(false);
            setDayDialogOpen(true);
          }}
        />

        {/* Auth Popover */}
        <AuthPopover
          open={authPopoverOpen}
          onClose={() => setAuthPopoverOpen(false)}
          title="Sign in to view calendar"
          subtitle="Sign in with Google to access your calendar and manage sessions"
        />

        {/* Coming Soon Dialog */}
        <ComingSoonDialog
          open={comingSoonDialogOpen}
          onClose={() => setComingSoonDialogOpen(false)}
          featureName="New Session"
          description="The ability to create and schedule new calendar sessions is currently under development. This feature will be available soon!"
        />
      </Box>
    </LocalizationProvider>
  );
} 