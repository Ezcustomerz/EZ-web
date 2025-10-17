import { Box, Chip, Tooltip } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

interface CompleteRowProps {
  status: string;
  isMobile?: boolean;
}

export function CompleteRow({ status, isMobile = false }: CompleteRowProps) {
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
          backgroundColor: '#10b981',
          color: '#fff',
          fontSize: isMobile ? '0.8rem' : '0.75rem',
          fontWeight: 500,
          height: isMobile ? 22 : 24,
          borderRadius: isMobile ? 1.5 : '12px',
          textTransform: 'capitalize',
          px: isMobile ? 1.5 : 2,
        }}
      />
      <Tooltip title="Order completed" arrow placement="top">
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
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '50%',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          cursor: 'help',
          transition: 'all 0.2s ease',
          pointerEvents: 'auto',
          flexShrink: 0,
          '&:hover': {
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            transform: 'scale(1.1)'
          }
        }}>
          <CheckCircleIcon sx={{ fontSize: isMobile ? 14 : 16, color: '#10b981' }} />
        </Box>
      </Tooltip>
    </Box>
  );
}
