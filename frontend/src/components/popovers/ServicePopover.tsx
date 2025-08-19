import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Button, Box, useTheme, useMediaQuery, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ServiceCardSimple } from '../cards/creative/ServiceCard';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface SessionPopoverProps {
  open: boolean;
  onClose: () => void;
  services: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    delivery: string;
    color: string;
  }>;
}

export function SessionPopover({ open, onClose, services }: SessionPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            p: 0,
            backgroundColor: '#fff',
            boxShadow: theme.shadows[8],
            height: isMobile ? '100dvh' : '700px', // Fixed height
            maxHeight: isMobile ? '100dvh' : '700px',
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
            }),
          },
        },
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.32)' } }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, flexShrink: 0 }}>
        All Services
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{
        p: { xs: 1, sm: 2 },
        px: { xs: 2.5, sm: 2 },
        flex: '1 1 auto',
        overflowY: 'auto',
        minHeight: 0,
        maxHeight: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {services.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              No services found.
            </Box>
          ) : (
            services.map((s) => (
              <Box key={s.id} sx={{ mb: 1 }}>
                <ServiceCardSimple {...s} color={s.color} />
              </Box>
            ))
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ py: 1, px: { xs: 1, sm: 2 }, minHeight: 0, height: 'auto', boxSizing: 'border-box', justifyContent: 'flex-end', flex: '0 0 auto', overflow: 'visible', alignItems: 'center', margin: 0, border: 'none', flexShrink: 0 }}>
        <Button onClick={onClose} size="small">Close</Button>
      </DialogActions>
    </Dialog>
  );
} 