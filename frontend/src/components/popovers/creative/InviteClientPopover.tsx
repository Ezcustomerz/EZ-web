import { useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  IconButton,
  InputAdornment,
  useTheme,
  Chip,
  useMediaQuery,
  Slide,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';
import {
  Close,
  Email,
  Link,
  ContentCopy,
  Check,
  PersonAdd,
} from '@mui/icons-material';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface InviteClientPopoverProps {
  open: boolean;
  onClose: () => void;
}

export function InviteClientPopover({ open, onClose }: InviteClientPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'link'>('email');

  // Placeholder invite link
  const inviteLink = 'https://ezcustomers.com/invite/creative/abc123xyz';

  const handleEmailInvite = () => {
    console.log('Sending email invite to:', email);
    // TODO: Implement email invite functionality
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleClose = () => {
    setEmail('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      PaperProps={{
        sx: {
          width: { xs: '92vw', sm: 420 },
          maxWidth: 480,
          borderRadius: 3,
          boxShadow: '0 28px 60px rgba(0,0,0,0.22)',
          border: '1px solid rgba(122, 95, 255, 0.18)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
          backdropFilter: 'blur(8px)',
          overflow: 'hidden',
          position: 'relative',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(10, 10, 20, 0.45)',
            backdropFilter: 'blur(2px)'
          }
        }
      }}
    >
      {/* Close Button */}
      <Box sx={{ position: 'absolute', right: 12, top: 12, zIndex: 10 }}>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          size="medium"
          sx={{ 
            color: 'text.primary', 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 1)',
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Close sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          p: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1 }}>
          <PersonAdd sx={{ fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Invite Client
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 0.5, position: 'relative', zIndex: 1 }}>
          Choose how you'd like to invite your client
        </Typography>
      </Box>

      {/* Tab Selection */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderRadius: 2,
            p: 0.5,
            position: 'relative',
          }}
        >
          <Button
            variant="text"
            size="small"
            startIcon={<Email sx={{ fontSize: 18 }} />}
            onClick={() => setActiveTab('email')}
            sx={{
              flex: 1,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              py: 1,
              px: 2,
              color: activeTab === 'email' ? 'white' : 'text.secondary',
              backgroundColor: activeTab === 'email' ? theme.palette.primary.main : 'transparent',
              boxShadow: activeTab === 'email' ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: activeTab === 'email' ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.08)',
                transform: activeTab === 'email' ? 'translateY(-1px)' : 'none',
                boxShadow: activeTab === 'email' ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
              },
            }}
          >
            Email
          </Button>
          <Button
            variant="text"
            size="small"
            startIcon={<Link sx={{ fontSize: 18 }} />}
            onClick={() => setActiveTab('link')}
            sx={{
              flex: 1,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              py: 1,
              px: 2,
              color: activeTab === 'link' ? 'white' : 'text.secondary',
              backgroundColor: activeTab === 'link' ? theme.palette.primary.main : 'transparent',
              boxShadow: activeTab === 'link' ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: activeTab === 'link' ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.08)',
                transform: activeTab === 'link' ? 'translateY(-1px)' : 'none',
                boxShadow: activeTab === 'link' ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
              },
            }}
          >
            Link
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* Content */}
      <Box sx={{ p: 3, pt: 2, minHeight: 280 }}>
        {activeTab === 'email' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary', fontSize: '1.1rem' }}>
              Send Email Invitation
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter client's email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    },
                  },
                },
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleEmailInvite}
              disabled={!email.trim()}
              startIcon={<Email sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                fontSize: '1rem',
                backgroundColor: theme.palette.primary.main,
                boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.5)',
                },
                '&:disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500',
                  boxShadow: 'none',
                  transform: 'none',
                },
              }}
            >
              Send Invitation
            </Button>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, display: 'block', textAlign: 'center', lineHeight: 1.5 }}>
              We'll send them a personalized invitation to collaborate
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary', fontSize: '1.1rem' }}>
              Share Invite Link
            </Typography>
            <Box
              sx={{
                p: 2.5,
                backgroundColor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200',
                mb: 3,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(147, 197, 253, 0.02) 100%)',
                  borderRadius: 2,
                  pointerEvents: 'none',
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: 'text.secondary',
                  wordBreak: 'break-all',
                  lineHeight: 1.5,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {inviteLink}
              </Typography>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCopyLink}
              startIcon={copied ? <Check sx={{ fontSize: 18 }} /> : <ContentCopy sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                fontSize: '1rem',
                borderColor: copied ? theme.palette.success.main : theme.palette.primary.main,
                color: copied ? theme.palette.success.main : theme.palette.primary.main,
                backgroundColor: copied ? theme.palette.success.light + '10' : 'transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: copied ? theme.palette.success.dark : theme.palette.primary.dark,
                  backgroundColor: copied ? theme.palette.success.light + '20' : theme.palette.primary.light + '10',
                  transform: 'translateY(-1px)',
                  boxShadow: copied 
                    ? `0 4px 12px ${theme.palette.success.main}30`
                    : `0 4px 12px ${theme.palette.primary.main}30`,
                },
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, display: 'block', textAlign: 'center', lineHeight: 1.5 }}>
              Share this link via any messaging platform
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer Info */}
      <Box
        sx={{
          p: 2.5,
          backgroundColor: 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(147, 197, 253, 0.02) 100%)',
          borderTop: '1px solid',
          borderColor: 'grey.200',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(147, 197, 253, 0.02) 100%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, position: 'relative', zIndex: 1 }}>
          <Chip
            label="Secure"
            size="small"
            sx={{
              backgroundColor: theme.palette.success.main,
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              height: 24,
              borderRadius: 1.5,
              boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)',
            }}
          />
          <Chip
            label="Instant"
            size="small"
            sx={{
              backgroundColor: theme.palette.info.main,
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              height: 24,
              borderRadius: 1.5,
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ 
          color: 'text.secondary', 
          fontSize: '0.8rem',
          lineHeight: 1.5,
          position: 'relative',
          zIndex: 1,
        }}>
          Invited clients will have access to your public creative services and can book sessions directly
        </Typography>
      </Box>
    </Dialog>
  );
}
