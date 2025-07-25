import { Card, CardContent, Box, Typography, IconButton, Tooltip, useTheme, Button } from '@mui/material';
import { Edit, MoreVert, Delete, Block } from '@mui/icons-material';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faLock } from '@fortawesome/free-solid-svg-icons';
import MenuList from '@mui/material/MenuList';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';

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
  onDelete?: () => void;
  onDisable?: () => void;
  color: string;
}

export function ServiceCard({ title, description, price, delivery, status, onEdit, onDelete, onDisable, color }: ServiceCardProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
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
        {/* Top row: Title + More menu */}
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
          <IconButton
            size="small"
            sx={{ color: 'primary.main', background: '#fff', border: '2px solid', borderColor: 'primary.main', boxShadow: '0 2px 8px 0 rgba(59,130,246,0.10)' }}
            onClick={handleMenuOpen}
          >
            <MoreVert fontSize="small" />
          </IconButton>
          <Popper
            anchorEl={anchorEl}
            open={open}
            placement="bottom-end"
            sx={{ zIndex: 1300 }}
          >
            <ClickAwayListener onClickAway={handleMenuClose}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 1,
                  minWidth: 140,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  mt: 1,
                  py: 0.5,
                  transform: open ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.8)',
                  opacity: open ? 1 : 0,
                  transformOrigin: 'center top',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  animation: open ? `menuSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)` : 'none',
                  '@keyframes menuSlideIn': {
                    '0%': {
                      transform: 'translateY(-40px) scale(0.5)',
                      opacity: 0,
                    },
                    '60%': {
                      transform: 'translateY(5px) scale(1.05)',
                      opacity: 0.9,
                    },
                    '100%': {
                      transform: 'translateY(0) scale(1)',
                      opacity: 1,
                    },
                  },
                }}
              >
                <MenuList
                  role="menu"
                  aria-expanded={open}
                  sx={{
                    py: 0,
                    gap: 0,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <MenuItem
                    onClick={() => { handleMenuClose(); onEdit && onEdit(); }}
                    role="menuitem"
                    sx={{
                      py: 1,
                      px: 2,
                      mx: 0,
                      borderRadius: 0,
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: open ? `itemSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s both` : 'none',
                      '@keyframes itemSlideIn': {
                        '0%': {
                          transform: 'translateX(-20px)',
                          opacity: 0,
                        },
                        '100%': {
                          transform: 'translateX(0)',
                          opacity: 1,
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'transparent',
                        '& .menu-icon': {
                          color: '#7A5FFF',
                          transform: 'scale(1.05) rotate(15deg)',
                        },
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                      '&:focus': {
                        backgroundColor: 'transparent',
                        outline: 'none',
                        boxShadow: 'none',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'transparent',
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    <ListItemIcon className="menu-icon" sx={{ minWidth: 24, color: '#6B7280', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                      <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Edit" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 500, color: '#241E1A' } }} />
                  </MenuItem>
                  <MenuItem
                    onClick={() => { handleMenuClose(); onDisable && onDisable(); }}
                    role="menuitem"
                    sx={{
                      py: 1,
                      px: 2,
                      mx: 0,
                      borderRadius: 0,
                      color: '#64748b',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: open ? `itemSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.13s both` : 'none',
                      '@keyframes itemSlideIn': {
                        '0%': {
                          transform: 'translateX(-20px)',
                          opacity: 0,
                        },
                        '100%': {
                          transform: 'translateX(0)',
                          opacity: 1,
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'primary.main',
                        '& .menu-icon': {
                          color: 'primary.main',
                          transform: 'scale(1.05) rotate(15deg)',
                        },
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                      '&:focus': {
                        backgroundColor: 'transparent',
                        outline: 'none',
                        boxShadow: 'none',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'transparent',
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    <ListItemIcon className="menu-icon" sx={{ minWidth: 24, color: '#64748b', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                      <Block fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Disable" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 500, color: 'inherit' } }} />
                  </MenuItem>
                  <Divider sx={{
                    my: 0.25,
                    mx: 0,
                    borderColor: 'rgba(0, 0, 0, 0.06)',
                    animation: open ? `itemSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.16s both` : 'none',
                    '@keyframes itemSlideIn': {
                      '0%': {
                        transform: 'translateX(-20px)',
                        opacity: 0,
                      },
                      '100%': {
                        transform: 'translateX(0)',
                        opacity: 1,
                      },
                    },
                  }} />
                  <MenuItem
                    onClick={() => { handleMenuClose(); onDelete && onDelete(); }}
                    role="menuitem"
                    sx={{
                      py: 1,
                      px: 2,
                      mx: 0,
                      borderRadius: 0,
                      color: 'error.main',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: open ? `itemSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s both` : 'none',
                      '@keyframes itemSlideIn': {
                        '0%': {
                          transform: 'translateX(-20px)',
                          opacity: 0,
                        },
                        '100%': {
                          transform: 'translateX(0)',
                          opacity: 1,
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'transparent',
                        '& .menu-icon': {
                          color: '#e11d48',
                          transform: 'scale(1.05) rotate(15deg)',
                        },
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                      '&:focus': {
                        backgroundColor: 'transparent',
                        outline: 'none',
                        boxShadow: 'none',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'transparent',
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    <ListItemIcon className="menu-icon" sx={{ minWidth: 24, color: '#e11d48', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                      <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Delete" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 500, color: '#e11d48' } }} />
                  </MenuItem>
                </MenuList>
              </Paper>
            </ClickAwayListener>
          </Popper>
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
  onBook?: () => void;
}

export function ServiceCardSimple({ title, description, price, delivery, color, onBook }: ServiceCardSimpleProps) {
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
        {/* Title + Book Button */}
        <Box sx={{ mb: 1 }}>
          <Typography fontWeight={700} fontSize="1.08rem" sx={{ pr: 1, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </Typography>
        </Box>
        <Box
          sx={{
            mt: 0.5,
            height: '4px',
            width: '40px',
            borderRadius: '2px',
            backgroundColor: color || theme.palette.primary.main,
          }}
        />
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
        {/* Price, Delivery, and Book Button Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box>
            <Typography fontWeight={700} color="primary" fontSize="1rem">
              ${price}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {delivery} delivery
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{
              px: 2,
              py: 0.5,
              minWidth: 0,
              fontSize: '0.95rem',
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              position: 'relative',
              overflow: 'hidden',
              '@keyframes sparkle': {
                '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                '50%': { transform: 'scale(1) rotate(180deg)', opacity: 1 },
                '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
              },
              '@keyframes sparkle2': {
                '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                '60%': { transform: 'scale(1) rotate(240deg)', opacity: 1 },
                '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
              },
              '@keyframes sparkle3': {
                '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                '40%': { transform: 'scale(1) rotate(120deg)', opacity: 1 },
                '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '20%',
                left: '15%',
                width: 4,
                height: 4,
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                borderRadius: '50%',
                transform: 'scale(0)',
                opacity: 0,
                transition: 'all 0.2s ease-in-out',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '70%',
                right: '20%',
                width: 3,
                height: 3,
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                borderRadius: '50%',
                transform: 'scale(0)',
                opacity: 0,
                transition: 'all 0.2s ease-in-out',
              },
              '&:hover, &:focus': {
                backgroundColor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.5)',
                '&::before': {
                  animation: 'sparkle 0.8s ease-in-out',
                },
                '&::after': {
                  animation: 'sparkle2 0.8s ease-in-out 0.1s',
                },
                '& .spark-element': {
                  '&:nth-of-type(1)': {
                    animation: 'sparkle3 0.8s ease-in-out 0.2s',
                  },
                  '&:nth-of-type(2)': {
                    animation: 'sparkle 0.8s ease-in-out 0.3s',
                  },
                },
              },
            }}
            onClick={onBook || (() => console.log(`Book clicked for ${title}`))}
          >
            <Box
              className="spark-element"
              sx={{
                position: 'absolute',
                top: '10%',
                right: '10%',
                width: 2,
                height: 2,
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                borderRadius: '50%',
                transform: 'scale(0)',
                opacity: 0,
                transition: 'all 0.2s ease-in-out',
              }}
            />
            <Box
              className="spark-element"
              sx={{
                position: 'absolute',
                bottom: '15%',
                left: '25%',
                width: 2,
                height: 2,
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 0 6px 2px rgba(255,255,255,0.35)',
                borderRadius: '50%',
                transform: 'scale(0)',
                opacity: 0,
                transition: 'all 0.2s ease-in-out',
              }}
            />
            Book
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
} 