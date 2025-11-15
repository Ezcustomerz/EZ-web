import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Alert,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Close as CloseIcon,
  Security,
} from '@mui/icons-material';
import type { FileScanResult, FileScanResponse } from '../../api/fileScanningService';

interface ClamAVScanDialogProps {
  open: boolean;
  onClose: () => void;
  scanResponse: FileScanResponse | null;
  isScanning: boolean;
  onContinue?: () => void;
  onCancel?: () => void;
}

export function ClamAVScanDialog({
  open,
  onClose,
  scanResponse,
  isScanning,
  onContinue,
  onCancel,
}: ClamAVScanDialogProps) {
  const hasUnsafeFiles = scanResponse && scanResponse.unsafe_files > 0;
  const allFilesSafe = scanResponse && scanResponse.unsafe_files === 0 && scanResponse.safe_files > 0;
  const scannerUnavailable = scanResponse && !scanResponse.scanner_available;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security sx={{ color: '#8b5cf6', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            File Security Scan
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {isScanning ? (
          <Box sx={{ py: 3 }}>
            <Typography variant="body1" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
              Scanning files for malware and security threats...
            </Typography>
            <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'center', color: 'text.secondary' }}>
              This may take a few moments
            </Typography>
          </Box>
        ) : scanResponse ? (
          <Box>
            {scannerUnavailable ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Scanner service is currently unavailable. Files cannot be verified at this time.
                </Typography>
              </Alert>
            ) : hasUnsafeFiles ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Security Threat Detected
                </Typography>
                <Typography variant="body2">
                  {scanResponse.unsafe_files} file(s) were flagged as potentially unsafe and cannot be uploaded.
                </Typography>
              </Alert>
            ) : allFilesSafe ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  All files passed security scan successfully!
                </Typography>
              </Alert>
            ) : null}

            {/* Scan Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                Scan Summary
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip
                  label={`Total: ${scanResponse.total_files}`}
                  size="small"
                  sx={{ backgroundColor: '#f3f4f6', color: 'text.primary' }}
                />
                <Chip
                  icon={<CheckCircle sx={{ fontSize: 16 }} />}
                  label={`Safe: ${scanResponse.safe_files}`}
                  size="small"
                  color="success"
                />
                {scanResponse.unsafe_files > 0 && (
                  <Chip
                    icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                    label={`Unsafe: ${scanResponse.unsafe_files}`}
                    size="small"
                    color="error"
                  />
                )}
              </Stack>
            </Box>

            {/* File Results */}
            {scanResponse.results.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                  File Details
                </Typography>
                <Stack spacing={1}>
                  {scanResponse.results.map((result, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: result.is_safe ? '#d1fae5' : '#fee2e2',
                        borderRadius: 2,
                        backgroundColor: result.is_safe ? '#f0fdf4' : '#fef2f2',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {result.is_safe ? (
                          <CheckCircle sx={{ fontSize: 20, color: '#10b981' }} />
                        ) : (
                          <ErrorIcon sx={{ fontSize: 20, color: '#ef4444' }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {result.filename}
                        </Typography>
                        <Chip
                          label={result.is_safe ? 'Safe' : 'Unsafe'}
                          size="small"
                          color={result.is_safe ? 'success' : 'error'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      {result.error_message && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#ef4444',
                            display: 'block',
                            mt: 0.5,
                            ml: 4,
                          }}
                        >
                          {result.error_message}
                        </Typography>
                      )}
                      {result.scan_details?.threat_name && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#ef4444',
                            display: 'block',
                            mt: 0.5,
                            ml: 4,
                            fontWeight: 600,
                          }}
                        >
                          Threat: {result.scan_details.threat_name}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              No scan results available
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        {hasUnsafeFiles ? (
          <Button
            onClick={onCancel || onClose}
            variant="contained"
            color="error"
            sx={{ minWidth: 100 }}
          >
            Close
          </Button>
        ) : allFilesSafe ? (
          <>
            <Button onClick={onCancel || onClose} sx={{ minWidth: 100 }}>
              Cancel
            </Button>
            <Button
              onClick={onContinue}
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              sx={{ minWidth: 120 }}
            >
              Continue
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant="contained" sx={{ minWidth: 100 }}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

