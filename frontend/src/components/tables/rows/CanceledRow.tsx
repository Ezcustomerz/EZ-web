import { Box, Chip, Tooltip } from '@mui/material';
import { Cancel as CancelIcon } from '@mui/icons-material';

interface CanceledRowProps {
  status: string;
  isMobile?: boolean;
}

export function CanceledRow({ status, isMobile = false }: CanceledRowProps) {
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
          backgroundColor: '#ef4444',
          color: '#fff',
          fontSize: isMobile ? '0.8rem' : '0.75rem',
          fontWeight: 500,
          height: isMobile ? 22 : 24,
          borderRadius: isMobile ? 1.5 : '12px',
          textTransform: 'capitalize',
          px: isMobile ? 1.5 : 2,
        }}
      />
      <Tooltip title="Order canceled" arrow placement="top">
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
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '50%',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          cursor: 'help',
          transition: 'all 0.2s ease',
          pointerEvents: 'auto',
          flexShrink: 0,
          '&:hover': {
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            transform: 'scale(1.1)'
          }
        }}>
          <CancelIcon sx={{ fontSize: isMobile ? 14 : 16, color: '#ef4444' }} />
        </Box>
      </Tooltip>
    </Box>
  );
}
