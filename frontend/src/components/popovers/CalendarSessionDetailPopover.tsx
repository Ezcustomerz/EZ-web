import { Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Button, Typography, Divider, Box, Chip, IconButton as MuiIconButton, Stack } from '@mui/material';
import { Close, Edit, Delete, Comment, ArrowBackIosNew } from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';
import { parse } from 'date-fns';
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

export interface CalendarSessionDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  session: Session | null;
  onBack: () => void;
}

export function CalendarSessionDetailPopover({ 
  open, 
  onClose, 
  session, 
  onBack 
}: CalendarSessionDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      {/* Header for mobile and desktop */}
      {isMobile ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 3, pt: 3 }}>
          <MuiIconButton
            onClick={onBack}
            color="inherit"
            aria-label="Back"
            sx={{ color: theme.palette.text.secondary, mr: 1 }}
          >
            <ArrowBackIosNew />
          </MuiIconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', flex: 1, textAlign: 'center' }}>
            {session?.type || ''}
          </Typography>
          <MuiIconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.text.primary } }}>
            <Close />
          </MuiIconButton>
        </Box>
      ) : (
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'primary.main', pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MuiIconButton
              onClick={onBack}
              color="inherit"
              aria-label="Back"
              sx={{ color: theme.palette.text.secondary, mr: 1 }}
            >
              <ArrowBackIosNew />
            </MuiIconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', ml: 1 }}>
              {session?.type || ''}
            </Typography>
          </Box>
          <MuiIconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.text.primary } }}>
            <Close />
          </MuiIconButton>
        </DialogTitle>
      )}
      
      {/* Content */}
      <DialogContent sx={{ pt: 0, px: 3, minHeight: 120 }}>
        {session && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Avatar sx={{ bgcolor: getSessionDotColor(session.status), color: '#fff', fontWeight: 700, width: 44, height: 44 }}>{getInitials(session.client)}</Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>{session.client}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>{session.type}</Typography>
              </Box>
            </Box>
            <Divider />
            <Box>
              <Typography sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Time</Typography>
              <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>{session.time} - {session.endTime} ({session.date})</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Status</Typography>
              <Chip label={session.status} size="small" sx={{ bgcolor: getSessionDotColor(session.status), color: '#fff', fontWeight: 600, textTransform: 'capitalize' }} />
            </Box>
            {session.notes && (
              <Box>
                <Typography sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Notes</Typography>
                <Typography sx={{ color: 'text.primary' }}>{session.notes}</Typography>
              </Box>
            )}
            {/* Metadata */}
            <Box sx={{ mt: 2, color: 'text.disabled', fontSize: '0.85rem' }}>
              <Typography>Event created: {session.date}</Typography>
              <Typography>Date updated: {session.date}</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      {isMobile ? (
        <DialogActions sx={{ px: 2, pb: 2, pt: 0, mt: 2 }}>
          <Stack spacing={1} width="100%">
            <Button fullWidth variant="outlined" startIcon={<Edit />} color="primary" sx={{ fontWeight: 700 }}>Edit</Button>
            <Button fullWidth variant="outlined" startIcon={<Delete />} color="error" sx={{ fontWeight: 700 }}>Delete</Button>
            <Button fullWidth variant="contained" startIcon={<Comment />} color="primary" sx={{ fontWeight: 700 }}>Add Comment</Button>
          </Stack>
        </DialogActions>
      ) : (
        <DialogActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
          <Box>
            <Button startIcon={<Edit />} variant="outlined" color="primary" sx={{ mr: 1 }}>Edit</Button>
            <Button startIcon={<Delete />} variant="outlined" color="error" sx={{ mr: 1 }}>Delete</Button>
          </Box>
          <Button startIcon={<Comment />} variant="contained" color="primary">Add Comment</Button>
        </DialogActions>
      )}
    </Dialog>
  );
} 