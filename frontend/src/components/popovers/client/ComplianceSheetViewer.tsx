import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';

interface ComplianceSheetViewerProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  onDownloadComplianceSheet: (bookingId: string) => Promise<Blob>;
}

export function ComplianceSheetViewer({
  open,
  onClose,
  bookingId,
  onDownloadComplianceSheet,
}: ComplianceSheetViewerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && bookingId) {
      loadPdf();
    } else {
      // Clean up URL when dialog closes
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }

    return () => {
      // Cleanup on unmount
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [open, bookingId]);

  const loadPdf = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await onDownloadComplianceSheet(bookingId);
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch {
      setError('Failed to load compliance sheet. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      disableEnforceFocus
      disableAutoFocus
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Box>
            <Box sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              EZ Compliance Sheet
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.5 }}>
              Booking Reference: {bookingId.substring(0, 8)}
            </Box>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'grey.500',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          flex: 1,
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {loading && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  border: `4px solid ${theme.palette.primary.main}20`,
                  borderTop: `4px solid ${theme.palette.primary.main}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  mx: 'auto',
                  mb: 2,
                }}
              />
              <Box sx={{ color: 'text.secondary' }}>Loading compliance sheet...</Box>
            </Box>
          </Box>
        )}

        {error && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            }}
          >
            <Box sx={{ textAlign: 'center', color: 'error.main' }}>
              {error}
            </Box>
          </Box>
        )}

        {pdfUrl && !loading && !error && (
          <Box
            component="iframe"
            src={pdfUrl}
            sx={{
              flex: 1,
              width: '100%',
              border: 'none',
              minHeight: isMobile ? 'calc(100vh - 120px)' : '600px',
            }}
          />
        )}
      </DialogContent>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </Dialog>
  );
}

