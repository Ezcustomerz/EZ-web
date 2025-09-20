import { Card, CardContent, Box, Typography, useTheme, Tooltip, IconButton } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faGem, faGlobe, faLock } from '@fortawesome/free-solid-svg-icons';
import { BundleDialog } from '../../dialogs/BundleDialog';
// Define the interface locally to avoid import issues
interface BundleService {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_time: string;
  status: string;
  color: string;
}

interface CreativeBundle {
  id: string;
  title: string;
  description: string;
  color: string;
  status: string;
  pricing_option: string;
  fixed_price?: number;
  discount_percentage?: number;
  total_services_price: number;
  final_price: number;
  services: BundleService[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BundleCardProps {
  bundle: CreativeBundle;
  creative: string;
  showStatus?: boolean;
  showMenu?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusHelp = {
  Public: 'Visible to everyone on your public profile.',
  Private: 'Only visible to you. Not shown on your public profile.',
};

export function BundleCard({ bundle, creative, showStatus = true, showMenu = false, onEdit, onDelete }: BundleCardProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);


  const calculateSavings = () => {
    if (bundle.pricing_option === 'discount' && bundle.discount_percentage) {
      return bundle.total_services_price - bundle.final_price;
    }
    return bundle.total_services_price - bundle.final_price;
  };

  const savings = calculateSavings();

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
        borderLeft: `4px solid ${bundle.color}`, // Left border like service cards
        '&:hover': {
          boxShadow: `0 4px 16px ${bundle.color}`,
          transform: 'scale(1.035) translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top row: Title + More menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ mb: 1, flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <FontAwesomeIcon icon={faLayerGroup} style={{ fontSize: '14px', color: bundle.color }} />
              <Typography fontWeight={700} fontSize="1.08rem" sx={{ pr: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}>
                {bundle.title}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
              by {creative}
            </Typography>
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
            <BundleDialog
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
            mb: 1,
            minHeight: { xs: 'unset', sm: 40 },
            fontSize: '0.85rem',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: { xs: 4, sm: 2 },
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {bundle.description}
        </Typography>

        {/* Services Count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FontAwesomeIcon icon={faGem} style={{ fontSize: '12px', color: bundle.color }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
            {bundle.services.length} service{bundle.services.length !== 1 ? 's' : ''} included
          </Typography>
        </Box>

        {/* Price and Status Row */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography fontWeight={700} color="primary" fontSize="1rem">
                ${bundle.final_price.toFixed(2)}
              </Typography>
              {savings > 0 && (
                <Typography variant="caption" color="success.main" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Save ${savings.toFixed(2)}
                </Typography>
              )}
            </Box>
            {showStatus && (
              <Tooltip title={statusHelp[bundle.status as keyof typeof statusHelp]} arrow>
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
                    color: bundle.status === 'Public' ? '#1a7f37' : '#2563eb',
                    background: bundle.status === 'Public'
                      ? 'linear-gradient(90deg, #e6f9ed 0%, #d1f7e6 100%)'
                      : 'linear-gradient(90deg, #e0f2fe 0%, #bae6fd 100%)',
                    boxShadow: bundle.status === 'Public'
                      ? '0 1px 6px 0 rgba(26,127,55,0.08)'
                      : '0 1px 6px 0 rgba(59,130,246,0.10)',
                    border: bundle.status === 'Public'
                      ? '1.5px solid #7be495'
                      : '1.5px solid #3b82f6',
                    transition: 'box-shadow 0.18s, border 0.18s, background 0.18s, color 0.18s',
                    cursor: 'help',
                    outline: 'none',
                    '&:hover, &:focus': {
                      boxShadow: bundle.status === 'Public'
                        ? '0 0 0 3px #7be49533, 0 2px 12px 0 #7be49522'
                        : '0 0 0 3px #3b82f633, 0 2px 12px 0 #3b82f622',
                      borderColor: bundle.status === 'Public' ? '#1a7f37' : '#2563eb',
                      color: bundle.status === 'Public' ? '#1a7f37' : '#2563eb',
                    },
                  }}
                  tabIndex={0}
                  role="status"
                  aria-label={bundle.status}
                >
                  <FontAwesomeIcon
                    icon={bundle.status === 'Public' ? faGlobe : faLock}
                    style={{ fontSize: 14, marginRight: 7, color: 'inherit', opacity: 0.92 }}
                  />
                  {bundle.status}
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
