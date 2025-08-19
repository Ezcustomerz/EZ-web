import { Paper, Box, Typography, Stack, useTheme } from '@mui/material';

export interface CalendarDayCardSession {
  id: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface CalendarDayCardProps {
  date: Date;
  isToday: boolean;
  isSelected?: boolean;
  sessions: CalendarDayCardSession[];
  onClick?: () => void;
}

function getSessionDotColor(status: 'confirmed' | 'pending' | 'cancelled', theme: any) {
  if (status === 'confirmed') return theme.palette.success.main;
  if (status === 'pending') return theme.palette.warning.main;
  if (status === 'cancelled') return theme.palette.error.main;
  return theme.palette.text.secondary;
}

export function CalendarDayCard({ date, isToday, sessions, onClick }: CalendarDayCardProps) {
  const theme = useTheme();
  return (
    <Paper
      elevation={1}
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        minHeight: 48,
        maxHeight: 160,
        cursor: 'pointer',
        transition: 'box-shadow 0.18s, border 0.18s',
        boxShadow: isToday ? '0 2px 8px 0 rgba(122,95,255,0.07)' : 1,
        border: isToday ? `1.5px solid ${theme.palette.secondary.main}` : '1px solid #e0e0e0',
        '&:hover': { boxShadow: 4 },
        overflow: 'visible',
      }}
      onClick={onClick}
    >
      <Typography variant="subtitle2" color={isToday ? theme.palette.secondary.main : theme.palette.text.primary} sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
        {date.toLocaleDateString(undefined, { weekday: 'long' })}, {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
      </Typography>
      {sessions.length > 0 ? (
        <Box sx={{ mt: 0.5, position: 'relative' }}>
          <Stack spacing={0.25}>
            {sessions.slice(0, 3).map((session) => (
              <Box key={session.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 24 }}>
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: getSessionDotColor(session.status, theme),
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" color={theme.palette.text.primary} sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {session.type}
                </Typography>
              </Box>
            ))}
          </Stack>
          {sessions.length > 3 && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: '0.7rem',
                textAlign: 'center',
                mt: 0.5,
                whiteSpace: 'nowrap',
                display: 'block',
                position: 'relative',
                zIndex: 1,
              }}
            >
              +{sessions.length - 3} more
            </Typography>
          )}
        </Box>
      ) : (
        <Typography variant="caption" color={theme.palette.text.secondary} sx={{ mt: 0.5, fontSize: '0.75rem' }}>
          No sessions
        </Typography>
      )}
    </Paper>
  );
} 