import { Card, CardContent, Box, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { Edit } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faLock } from '@fortawesome/free-solid-svg-icons';

const statusHelp = {
  Public: 'Visible to everyone on your public profile.',
  Private: 'Only visible to you. Not shown on your public profile.',
};

export interface ServiceCardProps {
  title: string;
  description: string;
  price: number;
  delivery: string;
  status: 'Public' | 'Private';
  onEdit?: () => void;
  color: string;
}

export function ServiceCard({ title, description, price, delivery, status, onEdit, color }: ServiceCardProps) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        minHeight: { xs: 135, sm: 170 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 1,
        boxShadow: '0px 1.5px 6px rgba(59,130,246,0.05)',
        p: { xs: 1.2, sm: 1.6 },
        transition: 'box-shadow 0.18s, transform 0.18s',
        cursor: 'pointer',
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
          boxShadow: `0 4px 16px ${color}`,
          transform: 'scale(1.025) translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top row: Title + Edit */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ mb: 1 }}>
            <Typography fontWeight={700} fontSize="1.08rem" sx={{ pr: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}>
              {title}
            </Typography>
            <Box
              sx={{
                mt: 0.5,
                height: '4px',
                width: '50px',
                borderRadius: '2px',
                backgroundColor: color || theme.palette.primary.main,
              }}
            />
          </Box>
          <Tooltip title="Edit Service" arrow>
            <IconButton
              size="small"
              sx={{
                color: 'primary.main',
                background: '#fff',
                border: '2px solid',
                borderColor: 'primary.main',
                boxShadow: '0 2px 8px 0 rgba(59,130,246,0.10)',
                '&:hover': {
                  background: 'primary.50',
                },
              }}
              onClick={onEdit}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2.5,
            minHeight: { xs: 'unset', sm: 44 },
            display: '-webkit-box',
            WebkitLineClamp: { xs: 4, sm: 2 },
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {description}
        </Typography>
        {/* Bottom row: Price left, pill+delivery right (responsive) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1, sm: 0 },
            mt: 'auto',
            pt: 1,
          }}
        >
          <Typography fontWeight={700} color="primary" fontSize="1rem" sx={{ mb: { xs: 0.5, sm: 0 } }}>
            ${price}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Tooltip title={statusHelp[status]} arrow>
              {/* Redesigned pill */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.7,
                  px: 1.6,
                  py: 0.4,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '0.01em',
                  textTransform: 'capitalize',
                  color: status === 'Public' ? '#1a7f37' : '#2563eb',
                  background: status === 'Public'
                    ? 'linear-gradient(90deg, #e6f9ed 0%, #d1f7e6 100%)'
                    : 'linear-gradient(90deg, #e0f2fe 0%, #bae6fd 100%)',
                  boxShadow: status === 'Public'
                    ? '0 1px 6px 0 rgba(26,127,55,0.08)'
                    : '0 1px 6px 0 rgba(59,130,246,0.10)',
                  border: status === 'Public'
                    ? '1.5px solid #7be495'
                    : '1.5px solid #3b82f6',
                  transition: 'box-shadow 0.18s, border 0.18s, background 0.18s, color 0.18s',
                  cursor: 'help',
                  outline: 'none',
                  '&:hover, &:focus': {
                    boxShadow: status === 'Public'
                      ? '0 0 0 3px #7be49533, 0 2px 12px 0 #7be49522'
                      : '0 0 0 3px #3b82f633, 0 2px 12px 0 #3b82f622',
                    borderColor: status === 'Public' ? '#1a7f37' : '#2563eb',
                    color: status === 'Public' ? '#1a7f37' : '#2563eb',
                  },
                }}
                tabIndex={0}
                role="status"
                aria-label={status}
              >
                <FontAwesomeIcon
                  icon={status === 'Public' ? faGlobe : faLock}
                  style={{ fontSize: 14, marginRight: 7, color: 'inherit', opacity: 0.92 }}
                />
                {status}
              </Box>
            </Tooltip>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {delivery} delivery
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Simple version for scrollable section (no edit/status pill)
export interface ServiceCardSimpleProps {
  title: string;
  description: string;
  price: number;
  delivery: string;
  color: string;
}

export function ServiceCardSimple({ title, description, price, delivery, color }: ServiceCardSimpleProps) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        minHeight: { xs: 135, sm: 170 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 1.5,
        boxShadow: '0px 1.5px 6px rgba(59,130,246,0.05)',
        p: { xs: 1.2, sm: 1.6 },
        transition: 'box-shadow 0.18s, transform 0.18s',
        cursor: 'pointer',
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
          boxShadow: `0 4px 16px ${color}`,
          transform: 'scale(1.035) translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Title + Underline */}
        <Box sx={{ mb: 1 }}>
          <Typography fontWeight={700} fontSize="1.08rem" sx={{ pr: 1, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </Typography>
          <Box
            sx={{
              mt: 0.5,
              height: '4px',
              width: '40px',
              borderRadius: '2px',
              backgroundColor: color || theme.palette.primary.main,
            }}
          />
        </Box>
        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2.5,
            minHeight: { xs: 'unset', sm: 44 },
            display: '-webkit-box',
            WebkitLineClamp: { xs: 4, sm: 2 },
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {description}
        </Typography>
        {/* Price and Delivery */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', pt: 1 }}>
          <Typography fontWeight={700} color="primary" fontSize="1rem">
            ${price}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            {delivery} delivery
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
} 