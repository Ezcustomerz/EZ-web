import { Box, Chip, Tooltip } from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';

interface AwaitingPaymentRowProps {
  status: string;
  isMobile?: boolean;
}

export function AwaitingPaymentRow({ status, isMobile = false }: AwaitingPaymentRowProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      minHeight: isMobile ? 32 : 28,
      height: isMobile ? 32 : 28
    }}>
      <Tooltip title={status} arrow placement="top">
        <Chip
          label={status}
          size="small"
          sx={{
            backgroundColor: '#3b82f6',
            color: '#fff',
            fontSize: isMobile ? '0.8rem' : '0.75rem',
            fontWeight: 500,
            height: isMobile ? 22 : 24,
            borderRadius: isMobile ? 1.5 : '12px',
            textTransform: 'capitalize',
            px: isMobile ? 1.5 : 2,
            cursor: 'help',
          }}
        />
      </Tooltip>
      <Tooltip title="Waiting for client payment" arrow placement="top">
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
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '50%',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          cursor: 'help',
          transition: 'all 0.2s ease',
          pointerEvents: 'auto',
          flexShrink: 0,
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            transform: 'scale(1.1)'
          }
        }}>
          <ScheduleIcon sx={{ fontSize: isMobile ? 14 : 16, color: '#3b82f6' }} />
        </Box>
      </Tooltip>
    </Box>
  );
}
