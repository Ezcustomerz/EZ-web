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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SettingsIcon from '@mui/icons-material/Settings';

export interface StripeAccountRequiredDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  orderAmount?: number;
}

export function StripeAccountRequiredDialog({
  open,
  onClose,
  onOpenSettings,
  orderAmount,
}: StripeAccountRequiredDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpenSettings = () => {
    onOpenSettings();
    onClose();
  };

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
          backgroundColor: 'warning.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <AccountBalanceIcon sx={{ color: 'warning.contrastText', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            lineHeight: 1.2,
          }}>
            Bank Account Required
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
          lineHeight: 1.6,
          mb: 2,
        }}>
          To approve this paid order{orderAmount ? ` (${orderAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})` : ''}, you need to have payouts enabled on your Stripe account.
        </Typography>
        <Typography variant="body2" sx={{ 
          color: 'text.secondary',
          lineHeight: 1.6,
        }}>
          Please complete your Stripe account verification in Settings to enable payouts. This only takes a few minutes.
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
          onClick={handleOpenSettings}
          variant="contained"
          color="primary"
          startIcon={<SettingsIcon />}
          sx={{ 
            minWidth: 180,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          Open Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
}

