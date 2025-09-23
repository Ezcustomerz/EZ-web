import { Edit, Delete } from '@mui/icons-material';
import MenuList from '@mui/material/MenuList';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';

export interface ServiceDialogProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ServiceDialog({ open, anchorEl, onClose, onEdit, onDelete }: ServiceDialogProps) {
  return (
    <Popper
      anchorEl={anchorEl}
      open={open}
      placement="bottom-end"
      sx={{ zIndex: 1300 }}
    >
      <ClickAwayListener onClickAway={onClose}>
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
              onClick={(event) => { 
                event.stopPropagation(); 
                onClose(); 
                onEdit && onEdit(); 
              }}
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
              onClick={(event) => { 
                event.stopPropagation(); 
                onClose(); 
                onDelete && onDelete(); 
              }}
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
  );
} 