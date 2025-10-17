import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { Warning, Check, Close } from '@mui/icons-material';

interface PendingApprovalRowProps {
  status: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  orderId: string;
  isMobile?: boolean;
  showActions?: boolean;
}

export function PendingApprovalRow({ 
  status, 
  onApprove, 
  onReject, 
  orderId, 
  isMobile = false,
  showActions = true
}: PendingApprovalRowProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      minHeight: isMobile ? 32 : 28,
      height: isMobile ? 32 : 28,
      pointerEvents: showActions ? 'auto' : 'none'
    }}>
      <Chip
        label={status}
        size="small"
        sx={{
          backgroundColor: '#f59e0b',
          color: '#fff',
          fontSize: isMobile ? '0.8rem' : '0.75rem',
          fontWeight: 500,
          height: isMobile ? 22 : 24,
          borderRadius: isMobile ? 1.5 : '12px',
          textTransform: 'capitalize',
          px: isMobile ? 1.5 : 2,
        }}
      />
      <Tooltip title="Your approval needed" arrow placement="top">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: isMobile ? 24 : 28,
          height: isMobile ? 24 : 28,
          minWidth: isMobile ? 24 : 28,
          minHeight: isMobile ? 24 : 28,
          maxWidth: isMobile ? 24 : 28,
          maxHeight: isMobile ? 24 : 28,
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '50%',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          cursor: 'help',
          transition: 'all 0.2s ease',
          pointerEvents: 'auto', // Ensure tooltip works regardless of parent pointerEvents
          flexShrink: 0, // Prevent the container from shrinking
          '&:hover': {
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            transform: 'scale(1.1)'
          }
        }}>
          <Warning sx={{ fontSize: isMobile ? 14 : 16, color: '#f59e0b' }} />
        </Box>
      </Tooltip>
      {isMobile && showActions && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          right: 16, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 0.5
        }}>
          <Box sx={{ 
            color: 'text.secondary', 
            fontSize: '0.7rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Actions
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Accept Order" arrow>
              <IconButton
                size="small"
                onClick={() => onApprove(orderId)}
                sx={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  width: 32,
                  height: 32,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    transition: 'left 0.5s',
                  },
                  '&:hover': {
                    backgroundColor: '#059669',
                    transform: 'scale(1.1) translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                    '&::before': {
                      left: '100%',
                    },
                    '& .MuiSvgIcon-root': {
                      transform: 'rotate(360deg) scale(1.2)',
                      transition: 'transform 0.3s ease',
                    }
                  },
                  '&:active': {
                    transform: 'scale(0.95) translateY(0)',
                    transition: 'transform 0.1s ease',
                  }
                }}
              >
                <Check sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reject Order" arrow>
              <IconButton
                size="small"
                onClick={() => onReject(orderId)}
                sx={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  width: 32,
                  height: 32,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.5s',
                  },
                  '&:hover': {
                    backgroundColor: '#dc2626',
                    transform: 'scale(1.1) translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
                    '&::before': {
                      left: '100%',
                    },
                    '& .MuiSvgIcon-root': {
                      transform: 'rotate(180deg) scale(1.2)',
                      transition: 'transform 0.3s ease',
                    }
                  },
                  '&:active': {
                    transform: 'scale(0.95) translateY(0)',
                    transition: 'transform 0.1s ease',
                  }
                }}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  );
}
