import { Box, Typography, IconButton, Button, useTheme, useMediaQuery, Paper, Tooltip, Zoom } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos, Settings } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parse } from 'date-fns';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useState } from 'react';
import { Fade, Stack } from '@mui/material';
import { orange, grey } from '@mui/material/colors';
import { Fab, Menu as MuiMenu, MenuItem as MuiMenuItem } from '@mui/material';
import { HeadsetMic, MoreVert } from '@mui/icons-material';
import { CalendarDaySessionListPopover } from '../../../components/popovers/CalendarDaySessionListPopover';
import { CalendarSessionDetailPopover } from '../../../components/popovers/CalendarSessionDetailPopover';

interface Session {
  id: string;
  date: string; // ISO date string (yyyy-MM-dd)
  time: string; // start time (e.g., '09:00')
  endTime: string; // end time (e.g., '10:00')
  client: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarTabProps {
  dayDialogOpen: boolean;
  setDayDialogOpen: (open: boolean) => void;
  sessionDialogOpen: boolean;
  setSessionDialogOpen: (open: boolean) => void;
}

export function CalendarTab({ dayDialogOpen, setDayDialogOpen, sessionDialogOpen, setSessionDialogOpen }: CalendarTabProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentMonth, setCurrentMonth] = useState(new Date()); // for desktop
  const [mobileStartOfWeek, setMobileStartOfWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [sessions] = useState<Session[]>([
    {
      id: '1',
      date: '2025-07-15',
      time: '09:00',
      endTime: '11:00',
      client: 'John Smith',
      type: 'Recording',
      status: 'confirmed',
      notes: 'Studio A - Bring your own headphones'
    },
    {
      id: '2',
      date: '2025-07-15',
      time: '14:00',
      endTime: '16:00',
      client: 'Sarah Johnson',
      type: 'Mixing',
      status: 'pending',
      notes: 'Mix review session'
    },
    {
      id: '3',
      date: '2025-07-18',
      time: '10:00',
      endTime: '12:00',
      client: 'Mike Davis',
      type: 'Mastering',
      status: 'confirmed'
    },
    {
      id: '4',
      date: '2025-07-20',
      time: '13:00',
      endTime: '15:00',
      client: 'Emma Wilson',
      type: 'Consultation',
      status: 'confirmed',
      notes: 'Project planning meeting'
    },
    {
      id: '5',
      date: '2025-07-22',
      time: '16:00',
      endTime: '18:00',
      client: 'Alex Brown',
      type: 'Recording',
      status: 'cancelled'
    },
    {
      id: '6',
      date: '2025-07-25',
      time: '11:00',
      endTime: '13:00',
      client: 'Lisa Chen',
      type: 'Mixing',
      status: 'confirmed'
    },
    {
      id: '7',
      date: '2025-07-25',
      time: '15:00',
      endTime: '17:00',
      client: 'Tom Anderson',
      type: 'Recording',
      status: 'pending'
    },
    {
      id: '8',
      date: '2025-07-25',
      time: '19:00',
      endTime: '21:00',
      client: 'Rachel Green',
      type: 'Mastering',
      status: 'confirmed'
    },
    {
      id: '9',
      date: '2025-07-28',
      time: '09:00',
      endTime: '11:00',
      client: 'David Lee',
      type: 'Consultation',
      status: 'confirmed'
    },
    {
      id: '10',
      date: '2025-07-30',
      time: '14:00',
      endTime: '16:00',
      client: 'Maria Garcia',
      type: 'Recording',
      status: 'confirmed',
      notes: 'Vocal recording session'
    },
    {
      id: '11',
      date: '2025-07-30',
      time: '14:00',
      endTime: '16:00',
      client: 'Maria Garcia',
      type: 'Recording',
      status: 'confirmed',
      notes: 'Vocal recording session'
    },
    {
      id: '12',
      date: '2025-07-25',
      time: '14:00',
      endTime: '16:00',
      client: 'Maria Garcia',
      type: 'Recording',
      status: 'confirmed',
      notes: 'Vocal recording session'
    }
  ]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [fabMenuAnchor, setFabMenuAnchor] = useState<null | HTMLElement>(null);
  const handleFabMenuOpen = (e: React.MouseEvent<HTMLElement>) => setFabMenuAnchor(e.currentTarget);
  const handleFabMenuClose = () => setFabMenuAnchor(null);
  // Color mapping for session type
  function getSessionTypeColor(type: string) {
    // Use accent if defined, else fallback to primary
    if (type === 'Recording') return (theme.palette as any).accent?.main || theme.palette.primary.main;
    if (type === 'Mixing') return theme.palette.warning.main;
    if (type === 'Mastering') return theme.palette.error.main;
    if (type === 'Consultation') return theme.palette.info.main;
    return theme.palette.text.secondary;
  }

  // Month navigation
  const [monthTransition, setMonthTransition] = useState<'left' | 'right' | null>(null);
  function handlePrevMonth() { setMonthTransition('right'); setTimeout(() => { setCurrentMonth(subMonths(currentMonth, 1)); setMonthTransition(null); }, 180); }
  function handleNextMonth() { setMonthTransition('left'); setTimeout(() => { setCurrentMonth(addMonths(currentMonth, 1)); setMonthTransition(null); }, 180); }

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
        sessions: sessions.filter(s => s.date === formattedDate),
      });
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  // Open day dialog
  function openDayDialog(date: Date) {
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
        pb: { xs: 5, sm: 0 },
        minHeight: 0,
        maxWidth: '100%',
        height: 'auto',
        overflow: 'visible',
        animation: 'fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1)',
        '@keyframes fadeInCard': {
          '0%': { opacity: 0, transform: 'scale(0.97) translateY(16px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
      }}>
        {isMobile ? (
          <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden', position: 'relative', pb: 'env(safe-area-inset-bottom, 16px)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            {/* Scrollable vertical agenda week view */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 2 }}>
              <Stack spacing={2} px={2}>
                {Array.from({ length: 7 }, (_, i) => {
                  const date = addDays(mobileStartOfWeek, i);
                  const formatted = format(date, 'yyyy-MM-dd');
                  const daySessions = sessions.filter(s => s.date === formatted);
                  const isTodayCell = isToday(date);
                  return (
                    <Paper
                      key={formatted}
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        minHeight: 56,
                        cursor: 'pointer',
                        transition: 'box-shadow 0.18s, border 0.18s',
                        boxShadow: isTodayCell ? '0 2px 8px 0 rgba(122,95,255,0.07)' : 1,
                        border: isTodayCell ? `1.5px solid ${theme.palette.secondary.main}` : '1px solid #e0e0e0',
                        '&:hover': { boxShadow: 4 },
                      }}
                      onClick={() => { setSelectedDate(date); setDayDialogOpen(true); }}
                    >
                      <Typography variant="subtitle2" color={isTodayCell ? theme.palette.secondary.main : theme.palette.text.primary}>
                        {format(date, 'EEEE')}, {format(date, 'MMMM d')}
                      </Typography>
                      {daySessions.length > 0 ? (
                        <Stack spacing={1} mt={1}>
                          {daySessions.slice(0, 3).map((session: Session) => (
                            <Box key={session.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 44 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: getSessionTypeColor(session.type),
                                }}
                              />
                              <Typography variant="body2" color={theme.palette.text.primary}>
                                {session.type[0]}. {session.type}
                              </Typography>
                            </Box>
                          ))}
                          {daySessions.length > 3 && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={e => { e.stopPropagation(); setSelectedDate(date); setDayDialogOpen(true); }}
                              sx={{
                                p: 0,
                                minHeight: 0,
                                minWidth: 0,
                                fontSize: '0.78rem',
                                color: theme.palette.text.secondary,
                                textTransform: 'none',
                                fontWeight: 500,
                                mt: 0.7,
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                letterSpacing: 0.01,
                              }}
                            >
                              +{daySessions.length - 3} more
                            </Button>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color={theme.palette.text.secondary} mt={1}>
                          No sessions
                        </Typography>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
            {/* FAB for actions */}
            <Fab color="primary" aria-label="more options" sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 10 }} onClick={handleFabMenuOpen}>
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
              <MuiMenuItem onClick={handleFabMenuClose}><HeadsetMic sx={{ mr: 1 }} /> New Session</MuiMenuItem>
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
                <Tooltip title="Studio Calendar Settings"><IconButton color="primary" sx={{ p: 0.7, mt: 0 }}><Settings /></IconButton></Tooltip>
                <Button
                  variant="contained"
                  startIcon={<HeadsetMic />}
                  size="small"
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
            <Box sx={{ position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
              <Fade in={!monthTransition} timeout={180} style={{ transitionDelay: monthTransition ? '180ms' : '0ms' }}>
                <Paper sx={{
                  p: { xs: 0.5, sm: 2 },
                  borderRadius: 3,
                  boxShadow: 2,
                  background: theme.palette.background.paper,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'visible',
                  height: 'fit-content',
                }}>
                  {/* Weekday labels */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
                    {weekdayLabels.map(day => (
                      <Typography key={day} variant="subtitle2" sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 600, py: 0.5 }}>{day}</Typography>
                    ))}
                  </Box>
                  {/* Weeks as rows */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {rows.map((week, weekIdx) => (
                      <Box key={weekIdx} sx={{ display: 'flex', height: 120, gap: 0.5 }}>
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
                                height: 120,
                                borderRadius: 2.5,
                                background: cell.isSelected ? (theme.palette.custom?.amber || orange[100]) : (cell.isCurrentMonth ? (isTodayCell ? theme.palette.background.paper : theme.palette.background.default) : theme.palette.action.hover),
                                border: isTodayCell ? `1.5px solid ${theme.palette.secondary.main}` : '1px solid #e0e0e0',
                                opacity: cell.isCurrentMonth ? 1 : 0.5,
                                cursor: 'pointer',
                                p: 1,
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
                                  mb: 0.5,
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
                                maxHeight: 'calc(100% - 40px)',
                                width: '100%',
                                pr: 0.5,
                              }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
                                  {cellSessions.slice(0, 3).map(session => (
                                    <Tooltip
                                      key={session.id}
                                      title={<>
                                        <Typography fontWeight={700}>{session.type}</Typography>
                                        <Typography fontSize="0.92rem">{session.time} - {session.endTime}</Typography>
                                        <Typography fontSize="0.92rem" color="text.secondary">{session.client}</Typography>
                                      </>}
                                      arrow
                                      placement="top"
                                      slots={{ transition: Zoom }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: getSessionDotColor(session.status), display: 'inline-block', mr: 1, mb: '-1.5px' }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.type} {session.client ? `– ${session.client}` : ''}</Typography>
                                      </Box>
                                    </Tooltip>
                                  ))}
                                </Box>
                              </Box>
                              {/* +X more indicator - outside overflow container */}
                              {cellSessions.length > 3 && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    fontWeight: 500,
                                    fontSize: '0.78rem',
                                    textAlign: 'center',
                                    mt: 0.5,
                                    position: 'absolute',
                                    bottom: 4,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                  }}
                                >
                                  +{cellSessions.length - 3} more
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
      </Box>
    </LocalizationProvider>
  );
} 