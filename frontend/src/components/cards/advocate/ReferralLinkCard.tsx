import { useState } from 'react';
import { Box, Typography, TextField, IconButton, Tooltip, Snackbar, useTheme } from '@mui/material';
import { ContentCopyOutlined, LinkOutlined } from '@mui/icons-material';

interface ReferralLinkCardProps {
  referralLink?: string;
  description?: string;
}

export function ReferralLinkCard({ 
  referralLink = 'http://localhost:3000/signup/creative?via=demoUser123',
  description = "Share this link with creatives to start earning commissions. You'll receive 18% commission on all their client transactions."
}: ReferralLinkCardProps) {
  const theme = useTheme();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <>
      <Box sx={{
        position: 'relative',
        zIndex: 1,
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        border: '2px solid rgba(122, 95, 255, 0.2)',
        borderRadius: 2,
        p: 4,
        mb: 3,
        background: 'linear-gradient(135deg, rgba(122, 95, 255, 0.03) 0%, rgba(51, 155, 255, 0.02) 100%)',
        animation: 'fadeInUp 0.6s ease-out 0.4s both',
        '@keyframes fadeInUp': {
          from: { opacity: 0, transform: 'translateY(30px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LinkOutlined sx={{ 
            color: theme.palette.primary.main, 
            mr: 1.5, 
            fontSize: 24,
            p: 0.5,
            backgroundColor: `${theme.palette.primary.main}15`,
            borderRadius: 1,
          }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              letterSpacing: '-0.01em',
            }}
          >
            Your Referral Link
          </Typography>
        </Box>
        
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: 3,
            lineHeight: 1.6,
            fontSize: '0.95rem',
          }}
        >
          {description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            value={referralLink}
            InputProps={{
              readOnly: true,
              sx: {
                backgroundColor: 'rgba(122, 95, 255, 0.05)',
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(122, 95, 255, 0.2)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(122, 95, 255, 0.4)',
                },
              },
            }}
            size="medium"
          />
          <Tooltip title="Copy referral link" arrow>
            <IconButton
              onClick={handleCopyLink}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                width: 48,
                height: 48,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  transform: 'scale(1.05)',
                },
                boxShadow: '0 4px 12px rgba(122, 95, 255, 0.3)',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <ContentCopyOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message="Referral link copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
