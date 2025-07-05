import {
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Popper,
  Paper,
  MenuList,
  ClickAwayListener,
} from '@mui/material';
import {
  Settings,
  Shuffle,
  ChatBubbleOutline,
  Logout,
} from '@mui/icons-material';

interface UserDropdownMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  isOpen?: boolean;
}

export function UserDropdownMenu({ anchorEl, open, onClose, isOpen = true }: UserDropdownMenuProps) {
  const menuItems = [
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      action: () => {
        console.log('Settings clicked');
        onClose();
      }
    },
    { 
      id: 'switch-role', 
      label: 'Switch Role', 
      icon: Shuffle,
      action: () => {
        console.log('Switch Role clicked');
        onClose();
      }
    },
    { 
      id: 'contact-us', 
      label: 'Contact Us', 
      icon: ChatBubbleOutline,
      action: () => {
        console.log('Contact Us clicked');
        onClose();
      }
    },
  ];

  const handleSignIn = () => {
    console.log('Sign In clicked');
    onClose();
  };

    return (
    <Popper
      anchorEl={anchorEl}
      open={open}
      placement="top"
      sx={{ zIndex: 1300 }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 1, 
            minWidth: 160,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
            border: '1px solid rgba(0, 0, 0, 0.05)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            mt: 1,
            py: 0.5,
            transform: open 
              ? `translateY(0) scale(1) ${isOpen ? 'translateX(0)' : 'translateX(30px)'}`
              : `translateY(-30px) scale(0.8) ${isOpen ? 'translateX(0)' : 'translateX(30px)'}`,
            opacity: open ? 1 : 0,
            transformOrigin: 'center bottom',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            animation: open ? `menuSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)` : 'none',
            '@keyframes menuSlideIn': {
              '0%': {
                transform: `translateY(-40px) scale(0.5) ${isOpen ? 'translateX(0)' : 'translateX(30px)'}`,
                opacity: 0,
              },
              '60%': {
                transform: `translateY(5px) scale(1.05) ${isOpen ? 'translateX(0)' : 'translateX(30px)'}`,
                opacity: 0.9,
              },
              '100%': {
                transform: `translateY(0) scale(1) ${isOpen ? 'translateX(0)' : 'translateX(30px)'}`,
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
      {menuItems.map((item, index) => {
        const IconComponent = item.icon;
        
        return (
          <MenuItem
            key={item.id}
            onClick={item.action}
            role="menuitem"
            sx={{
              py: 1,
              px: 2,
              mx: 0,
              borderRadius: 0,
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: open ? `itemSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.1 + index * 0.05}s both` : 'none',
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
            <ListItemIcon 
              className="menu-icon"
              sx={{ 
                minWidth: 24,
                color: '#6B7280',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <IconComponent fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#241E1A',
                },
              }}
            />
          </MenuItem>
        );
      })}
      
      <Divider sx={{ 
        my: 0.25, 
        mx: 0,
        borderColor: 'rgba(0, 0, 0, 0.06)',
        animation: open ? `itemSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.1 + menuItems.length * 0.05}s both` : 'none',
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
        onClick={handleSignIn}
        role="menuitem"
        sx={{
          py: 1,
          px: 2,
          mx: 0,
          borderRadius: 0,
          backgroundColor: 'transparent',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: open ? `itemSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.1 + menuItems.length * 0.05 + 0.05}s both` : 'none',
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
              color: '#10b981',
              transform: 'scale(1.05) rotate(10deg)',
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
        <ListItemIcon 
          className="menu-icon"
          sx={{ 
            minWidth: 24,
            color: '#10b981',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Logout fontSize="small" />
        </ListItemIcon>
        <ListItemText 
          primary="Sign in"
          sx={{
            '& .MuiListItemText-primary': {
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#10b981',
            },
          }}
        />
      </MenuItem>
          </MenuList>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
} 