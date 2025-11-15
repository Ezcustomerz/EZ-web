import { Card, CardContent, Box, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faLock, faLayerGroup, faGem, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { ServiceDialog } from '../../dialogs/ServiceDialog';

const statusHelp = {
  Public: 'Visible to everyone on your public profile.',
  Private: 'Only visible to you. Not shown on your public profile.',
  'Bundle-Only': 'Only available as part of bundles. Not shown as a standalone service.',
};

export interface ServiceCardProps {
  title: string;
  description: string;
  price: number;
  delivery?: string;
  status: 'Public' | 'Private' | 'Bundle-Only';
  creative: string;
  onEdit?: () => void;
  onDelete?: () => void;
  color: string;
  showMenu?: boolean;
  onClick?: () => void;
  requires_booking?: boolean;
}

export function ServiceCard({ title, description, price, delivery, status, creative, onEdit, onDelete, color, showMenu = true, onClick, requires_booking = false }: ServiceCardProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent card click from firing
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);
  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        minHeight: { xs: 135, sm: 170 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 1,
        boxShadow: '0px 1.5px 6px rgba(59,130,246,0.05)',
        p: { xs: 1.2, sm: 1.6 },
        transition: 'box-shadow 0.18s, transform 0.18s, opacity 0.2s',
        cursor: 'pointer',
        backgroundColor: theme.palette.background.paper,
        boxSizing: 'border-box',
        overflow: 'visible',
        '&:hover': {
          boxShadow: `0 4px 16px ${color}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, width: '100%' }}>
        {/* Top row: Title + More menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, minWidth: 0, width: '100%' }}>
          <Box sx={{ mb: 1, flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, minWidth: 0 }}>
              <FontAwesomeIcon icon={faGem} style={{ fontSize: '14px', color: color || theme.palette.primary.main, flexShrink: 0 }} />
              <Typography fontWeight={700} fontSize="1.08rem" sx={{ pr: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary', flex: 1 }}>
                {title}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
              by {creative}
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
            {showMenu && (
              <IconButton
                size="small"
                sx={{
                  color: 'primary.main',
                  backgroundColor: '#ffffff',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  boxShadow: '0 3px 12px rgba(59,130,246,0.25)',
                  transition: 'box-shadow 0.2s, transform 0.2s, background-color 0.2s',
                  '&:hover, &:focus': {
                    backgroundColor: '#eef5ff',
                    boxShadow: '0 6px 18px rgba(59,130,246,0.35)',
                    transform: 'scale(1.06)'
                  }
                }}
                onClick={handleMenuOpen}
              >
              <MoreVert fontSize="small" />
              </IconButton>
            )}
          {showMenu && (
            <ServiceDialog
              open={open}
              anchorEl={anchorEl}
              onClose={handleMenuClose}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </Box>
        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2.5,
            minHeight: { xs: 'unset', sm: 44 },
            minWidth: 0,
            width: '100%',
            display: '-webkit-box',
            WebkitLineClamp: { xs: 4, sm: 2 },
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
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
            minWidth: 0,
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, sm: 0 } }}>
            <Typography fontWeight={700} color="primary" fontSize="1rem">
              ${price}
            </Typography>
            {requires_booking && (
              <Tooltip title="This service requires booking a session" arrow>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.3,
                    px: 0.8,
                    py: 0.2,
                    borderRadius: 1,
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    color: '#92400e',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    letterSpacing: '0.01em',
                    cursor: 'help',
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCalendar}
                    style={{ fontSize: 8, color: 'inherit' }}
                  />
                  Book
                </Box>
              </Tooltip>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', minWidth: 0, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}>
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
                  flexShrink: 0,
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
                  icon={status === 'Public' ? faGlobe : status === 'Bundle-Only' ? faLayerGroup : faLock}
                  style={{ fontSize: 14, marginRight: 7, color: 'inherit', opacity: 0.92 }}
                />
                {status}
              </Box>
            </Tooltip>
            {delivery && delivery.trim() && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, flexShrink: 0 }}>
                {delivery} delivery
              </Typography>
            )}
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
  delivery?: string;
  color: string;
  creative: string;
  onBook?: () => void;
  requires_booking?: boolean;
}

export function ServiceCardSimple({ title, description, price, delivery, color, creative, onBook, requires_booking = false }: ServiceCardSimpleProps) {
  const theme = useTheme();
  return (
    <Card
      onClick={onBook}
      sx={{
        height: '100%',
        width: '100%',
        maxWidth: '100%',
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
        boxSizing: 'border-box',
        overflow: 'visible',
        '&:hover': {
          boxShadow: `0 4px 16px ${color}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, width: '100%' }}>
        {/* Title + Creative */}
        <Box sx={{ mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <FontAwesomeIcon icon={faGem} style={{ fontSize: '14px', color: color || theme.palette.primary.main }} />
            <Typography fontWeight={700} fontSize="1.08rem" sx={{ pr: 1, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
            by {creative}
          </Typography>
        </Box>
          <Box
            sx={{
              height: '4px',
              width: '40px',
              borderRadius: '2px',
              backgroundColor: color || theme.palette.primary.main,
              mb: 1,
            }}
          />
        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            minHeight: { xs: 'unset', sm: 40 },
            display: '-webkit-box',
            WebkitLineClamp: { xs: 4, sm: 2 },
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {description}
        </Typography>
        {/* Price and Delivery Row */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
            <Typography fontWeight={700} color="primary" fontSize="1rem">
              ${price}
            </Typography>
            {requires_booking && (
              <Tooltip title="This service requires booking a session" arrow>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.3,
                    px: 0.6,
                    py: 0.15,
                    borderRadius: 1,
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    color: '#92400e',
                    fontWeight: 600,
                    fontSize: '0.6rem',
                    letterSpacing: '0.01em',
                    cursor: 'help',
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCalendar}
                    style={{ fontSize: 7, color: 'inherit' }}
                  />
                  Book
                </Box>
              </Tooltip>
            )}
          </Box>
          {delivery && delivery.trim() && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {delivery} delivery
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
} 