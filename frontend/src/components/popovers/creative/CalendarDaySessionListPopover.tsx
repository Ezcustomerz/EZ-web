import { Dialog, DialogTitle, DialogContent, DialogActions, Avatar, List, ListItem, ListItemAvatar, ListItemText, ListItemButton, Button, Typography, IconButton as MuiIconButton } from '@mui/material';
import { Close, HeadsetMic } from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';
import { format } from 'date-fns';
import { Slide } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';

interface Session {
  id: string;
  date: string;
  time: string;
  endTime: string;
  client: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface CalendarDaySessionListPopoverProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  sessions: Session[];
  onSessionClick: (session: Session) => void;
}

export function CalendarDaySessionListPopover({ 
  open, 
  onClose, 
  selectedDate, 
  sessions, 
  onSessionClick 
}: CalendarDaySessionListPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Helper: get sessions for selected day
  const selectedDaySessions = selectedDate
    ? sessions.filter(s => s.date === format(selectedDate, 'yyyy-MM-dd'))
    : [];

  // Helper: session status to color (for dot/avatar)
  function getSessionDotColor(status: Session['status']) {
    if (status === 'confirmed') return theme.palette.success.main;
    if (status === 'pending') return theme.palette.warning.main;
    if (status === 'cancelled') return theme.palette.error.main;
    return theme.palette.grey[400];
  }

  // Helper: get initials
  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: { sx: { borderRadius: isMobile ? 0 : 3, p: 0, backgroundColor: '#fff', boxShadow: theme.shadows[8] } },
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.32)' } }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'primary.main', pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : ''}
        <MuiIconButton onClick={onClose} size="small"><Close /></MuiIconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0, px: 0, minHeight: 120 }}>
        <List>
          {selectedDaySessions.length === 0 && (
            <ListItem>
              <ListItemText primary={<Typography color="text.secondary">No sessions for this day</Typography>} />
            </ListItem>
          )}
          {selectedDaySessions.map(session => (
            <ListItemButton key={session.id} onClick={() => onSessionClick(session)} sx={{ py: 1.2, px: 2 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getSessionDotColor(session.status), color: '#fff', fontWeight: 700, width: 36, height: 36 }}>{getInitials(session.client)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={<Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.05rem' }}>{session.type}</Typography>}
                secondary={<Typography sx={{ color: 'text.secondary', fontSize: '0.92rem' }}>{session.time} - {session.endTime} — {session.client}</Typography>}
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" startIcon={<HeadsetMic />} sx={{ fontWeight: 700, borderRadius: 2 }}>
          New Session
        </Button>
      </DialogActions>
    </Dialog>
  );
} 