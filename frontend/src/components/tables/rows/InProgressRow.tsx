import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { Build as BuildIcon, Done as DoneIcon } from '@mui/icons-material';

interface InProgressRowProps {
  status: string;
  onComplete: (id: string) => void;
  orderId: string;
  isMobile?: boolean;
}

export function InProgressRow({ status, onComplete, orderId, isMobile = false }: InProgressRowProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      minHeight: isMobile ? 32 : 28,
      height: isMobile ? 32 : 28
    }}>
      <Chip
        label={status}
        size="small"
        sx={{
          backgroundColor: '#8b5cf6',
          color: '#fff',
          fontSize: isMobile ? '0.8rem' : '0.75rem',
          fontWeight: 500,
          height: isMobile ? 22 : 24,
          borderRadius: isMobile ? 1.5 : '12px',
          textTransform: 'capitalize',
          px: isMobile ? 1.5 : 2,
        }}
      />
      <Tooltip title="Work in progress" arrow placement="top">
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
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '50%',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          cursor: 'help',
          transition: 'all 0.2s ease',
          pointerEvents: 'auto',
          flexShrink: 0,
          '&:hover': {
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            transform: 'scale(1.1)'
          }
        }}>
          <BuildIcon sx={{ fontSize: isMobile ? 14 : 16, color: '#8b5cf6' }} />
        </Box>
      </Tooltip>
      {isMobile && (
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
            <Tooltip title="Complete Order" arrow>
              <IconButton
                size="small"
                onClick={() => onComplete(orderId)}
                sx={{
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  width: 80,
                  height: 32,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
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
                    backgroundColor: '#7c3aed',
                    transform: 'scale(1.05) translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
                    '&::before': {
                      left: '100%',
                    },
                    '& .MuiSvgIcon-root': {
                      transform: 'scale(1.1)',
                      transition: 'transform 0.3s ease',
                    }
                  },
                  '&:active': {
                    transform: 'scale(0.98) translateY(0)',
                    transition: 'transform 0.1s ease',
                  }
                }}
              >
                <DoneIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  );
}
