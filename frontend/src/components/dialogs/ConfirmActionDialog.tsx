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
import CancelIcon from '@mui/icons-material/Cancel';

export type ActionType = 'approve' | 'reject';

export interface ConfirmActionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: ActionType;
  isProcessing?: boolean;
}

export function ConfirmActionDialog({
  open,
  onClose,
  onConfirm,
  actionType,
  isProcessing = false,
}: ConfirmActionDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleConfirm = () => {
    onConfirm();
  };

  const isApprove = actionType === 'approve';
  const title = isApprove ? 'Approve Order' : 'Reject Order';
  const description = isApprove
    ? 'Are you sure you want to approve this order? The client will be notified and the order will proceed.'
    : 'Are you sure you want to reject this order? This action cannot be undone and the client will be notified.';
  const confirmButtonText = isProcessing 
    ? (isApprove ? 'Approving...' : 'Rejecting...')
    : (isApprove ? 'Approve' : 'Reject');
  const confirmButtonColor = isApprove ? 'success' : 'error';

  return (
    <Dialog
      open={open}
      onClose={!isProcessing ? onClose : undefined}
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
          backgroundColor: isApprove ? 'success.light' : 'error.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {isApprove ? (
            <CheckCircleIcon sx={{ color: 'success.contrastText', fontSize: 24 }} />
          ) : (
            <CancelIcon sx={{ color: 'error.contrastText', fontSize: 24 }} />
          )}
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

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
          lineHeight: 1.6,
        }}>
          {description}
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
          disabled={isProcessing}
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
          color={confirmButtonColor}
          disabled={isProcessing}
          sx={{ 
            minWidth: 100,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': {
              backgroundColor: isApprove ? 'success.dark' : 'error.dark',
            },
          }}
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

