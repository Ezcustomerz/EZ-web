import { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  IconButton,
  useTheme,
  Chip,
  useMediaQuery,
  Slide,
  CircularProgress,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';
import {
  Close,
  ContentCopy,
  Check,
  PersonAdd,
  Error,
} from '@mui/icons-material';
import { inviteService } from '../../../api/inviteService';
import { errorToast, successToast } from '../../toast/toast';

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
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Generate invite link when popover opens
  useEffect(() => {
    if (open && !inviteLink) {
      generateInviteLink();
    }
  }, [open, inviteLink]);

  const generateInviteLink = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await inviteService.generateInviteLink();
      
      if (response.success && response.invite_link) {
        setInviteLink(response.invite_link);
        successToast('Invite Link Generated', 'Your invite link is ready to share!');
      } else {
        setError(response.message);
        errorToast('Generation Failed', response.message);
      }
    } catch (err: any) {
      const errorMessage = 'Failed to generate invite link';
      setError(errorMessage);
      errorToast('Generation Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      successToast('Copied!', 'Invite link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      errorToast('Copy Failed', 'Failed to copy link to clipboard');
    }
  };

  const handleClose = () => {
    setCopied(false);
    setError('');
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
      disableAutoFocus={false}
      disableEnforceFocus={false}
      disableRestoreFocus={false}
      sx={{
        zIndex: isMobile ? 10000 : 1300, // Higher z-index on mobile to cover mobile menu
      }}
      PaperProps={{
        'data-tour': 'invite-client-popup',
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
          Share your invite link with potential clients
        </Typography>
      </Box>


      {/* Content */}
      <Box sx={{ p: 3, pt: 2, minHeight: 280 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary', fontSize: '1.1rem' }}>
            Share Invite Link
          </Typography>
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Generating your invite link...
                </Typography>
              </Box>
            </Box>
          )}
          
          {error && !loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Error sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
                  {error}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={generateInviteLink}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Try Again
                </Button>
              </Box>
            </Box>
          )}
          
          {inviteLink && !loading && !error && (
            <>
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
            </>
          )}
        </Box>
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
