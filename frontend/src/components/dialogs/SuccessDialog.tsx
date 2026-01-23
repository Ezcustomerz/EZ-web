import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttonText?: string;
}

export function SuccessDialog({
  open,
  onClose,
  title,
  message,
  buttonText = 'OK',
}: SuccessDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      sx={{
        zIndex: isMobile ? 10000 : 1300,
      }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxWidth: isMobile ? '100%' : '480px',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        pb: 2,
        pt: 3,
        px: 3,
      }}>
        <Box sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: 'success.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <CheckCircleIcon sx={{ color: 'success.contrastText', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            lineHeight: 1.2,
          }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      {message && (
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Typography variant="body1" sx={{ 
            color: 'text.secondary',
            lineHeight: 1.6,
          }}>
            {message}
          </Typography>
        </DialogContent>
      )}

      <DialogActions sx={{ 
        px: 3, 
        pb: 3,
        gap: 1,
        justifyContent: 'flex-end',
      }}>
        <Button 
          onClick={onClose}
          variant="contained"
          color="success"
          sx={{ 
            minWidth: 100,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': {
              backgroundColor: 'success.dark',
            },
          }}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
