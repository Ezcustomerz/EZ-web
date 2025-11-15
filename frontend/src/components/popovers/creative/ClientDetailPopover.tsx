import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Slide,
  Button,
  Stack,
} from '@mui/material';
import {
  Close,
  Email,
  Phone,
  AttachMoney,
  Folder,
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import { type CreativeClient } from '../../../api/userService';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface ClientDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  client: CreativeClient | null;
}

export function ClientDetailPopover({ open, onClose, client }: ClientDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!client) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusChipProps = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          sx: {
            backgroundColor: '#22c55e',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 500,
            height: 28,
            borderRadius: '14px',
            textTransform: 'none',
          },
        };
      case 'inactive':
        return {
          label: 'Inactive',
          sx: {
            backgroundColor: '#2563eb',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 500,
            height: 28,
            borderRadius: '14px',
            textTransform: 'none',
          },
        };
      default:
        return {
          label: status,
          sx: {
            backgroundColor: '#6b7280',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 500,
            height: 28,
            borderRadius: '14px',
            textTransform: 'none',
          },
        };
    }
  };

  const getContactIcon = (contactType: 'email' | 'phone') => {
    return contactType === 'email' ? <Email /> : <Phone />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      sx={{
        zIndex: isMobile ? 10000 : 1300,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            p: 0,
            backgroundColor: '#fff',
            boxShadow: theme.shadows[8],
            height: isMobile ? '100dvh' : 'auto',
            maxHeight: isMobile ? '100dvh' : '80vh',
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
            }),
          },
        },
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.32)' } }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        pb: 2, 
        flexShrink: 0,
        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        color: 'white',
        px: 3,
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={client.profile_picture_url}
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              fontSize: '1.5rem',
              fontWeight: 600,
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {!client.profile_picture_url && client.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'white' }}>
              {client.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {client.title || 'Client'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{
        p: { xs: 2, sm: 3 },
        flex: '1 1 auto',
        overflowY: 'auto'
      }}>
        <Stack spacing={3} sx={{ mt: 2 }}>
           {/* Status and Basic Info */}
           <Card variant="outlined" sx={{ borderRadius: 2 }}>
             <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600}>
                    Status & Overview
                  </Typography>
                  <Chip {...getStatusChipProps(client.status)} />
                </Box>
                
                <Divider />
                
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getContactIcon(client.contactType)}
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {client.contactType === 'email' ? 'Email' : 'Phone'}
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {client.contact}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={600}>
                  Financial Overview
                </Typography>
                
                <Divider />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AttachMoney sx={{ color: 'success.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Spent
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      {formatCurrency(client.totalSpent)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={600}>
                  Project Information
                </Typography>
                
                <Divider />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Folder sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Projects
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {client.projects}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={600}>
                  Quick Actions
                </Typography>
                
                <Divider />
                
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    size="small"
                    sx={{ textTransform: 'none' }}
                    onClick={() => window.open(`mailto:${client.contact}`, '_blank')}
                  >
                    Send Email
                  </Button>
                  
                  {client.contactType === 'phone' && (
                    <Button
                      variant="outlined"
                      startIcon={<Phone />}
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={() => window.open(`tel:${client.contact}`, '_blank')}
                    >
                      Call
                    </Button>
                  )}
                  
                  <Button
                    variant="contained"
                    startIcon={<Folder />}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    View Projects
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
