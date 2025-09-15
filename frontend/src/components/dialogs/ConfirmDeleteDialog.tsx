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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName?: string;
  description?: string;
  isDeleting?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  itemName,
  description,
  isDeleting = false,
}: ConfirmDeleteDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={!isDeleting ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      sx={{
        zIndex: isMobile ? 10000 : 1300, // Higher z-index on mobile to cover mobile menu
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
          backgroundColor: 'error.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <WarningAmberIcon sx={{ color: 'error.contrastText', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            lineHeight: 1.2,
          }}>
            {title}
          </Typography>
          {itemName && (
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              mt: 0.5,
            }}>
              {itemName}
            </Typography>
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
          lineHeight: 1.6,
        }}>
          {description || 'This action cannot be undone. Are you sure you want to proceed?'}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        pb: 3,
        gap: 1,
        justifyContent: 'flex-end',
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={isDeleting}
          sx={{ 
            minWidth: 100,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={isDeleting}
          sx={{ 
            minWidth: 100,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': {
              backgroundColor: 'error.dark',
            },
          }}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
