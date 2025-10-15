import { useState } from 'react';
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
  Login,
} from '@mui/icons-material';
import { RoleSwitcherPopover } from '../popovers/RoleSwitcherPopover';
import { CreativeSettingsPopover } from '../popovers/creative/CreativeSettingsPopover';
import { ClientSettingsPopover } from '../popovers/client/ClientSettingsPopover';
import { AdvocateSettingsPopover } from '../popovers/advocate/AdvocateSettingsPopover';
import { useAuth } from '../../context/auth';

interface UserDropdownMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  isOpen?: boolean;
}

export function UserDropdownMenu({ anchorEl, open, onClose, isOpen = true }: UserDropdownMenuProps) {
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isAuthenticated, signOut, openAuth } = useAuth();

  // Determine current role based on URL path
  const getCurrentRole = () => {
    const path = window.location.pathname;
    if (path.startsWith('/creative')) return 'creative';
    if (path.startsWith('/client')) return 'client';
    if (path.startsWith('/advocate')) return 'advocate';
    return 'creative'; // default
  };

  const currentRole = getCurrentRole();

  const menuItems = [
    {
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      action: () => {
        setSettingsOpen(true);
        onClose();
      }
    },
    { 
      id: 'switch-role', 
      label: 'Switch Role', 
      icon: Shuffle,
      action: () => {
        setRoleSwitcherOpen(true);
        onClose();
      }
    },
    { 
      id: 'contact-us', 
      label: 'Contact Us', 
      icon: ChatBubbleOutline,
      action: () => {
        window.location.href = '/contact';
        onClose();
      }
    },
  ];

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      await signOut();
    } else {
      openAuth();
    }
    onClose();
  };

  return (
    <>
    <Popper
      anchorEl={anchorEl}
      open={open}
      placement="top"
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: isOpen === false ? [70, 10] : [0, 0],
          },
        },
      ]}
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
            animation: open ? `menuSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)` : 'none',
            '@keyframes menuSlideIn': {
              '0%': {
                transform: 'translateY(30px) scale(0.8)',
                opacity: 0,
              },
              '60%': {
                transform: 'translateY(-5px) scale(1.05)',
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
        onClick={handleAuthAction}
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
              color: isAuthenticated ? '#ef4444' : '#10b981',
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
            color: isAuthenticated ? '#ef4444' : '#10b981',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isAuthenticated ? <Logout fontSize="small" /> : <Login fontSize="small" />}
        </ListItemIcon>
        <ListItemText 
          primary={isAuthenticated ? "Sign out" : "Sign in"}
          sx={{
            '& .MuiListItemText-primary': {
              fontSize: '0.9rem',
              fontWeight: 500,
              color: isAuthenticated ? '#ef4444' : '#10b981',
            },
          }}
        />
      </MenuItem>
          </MenuList>
        </Paper>
      </ClickAwayListener>
    </Popper>

    {/* Role Switcher Dialog */}
    <RoleSwitcherPopover
      open={roleSwitcherOpen}
      onClose={() => setRoleSwitcherOpen(false)}
    />

    {/* Settings Popovers - Show based on current role */}
    {currentRole === 'creative' && (
      <CreativeSettingsPopover
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    )}

    {currentRole === 'client' && (
      <ClientSettingsPopover
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    )}

    {currentRole === 'advocate' && (
      <AdvocateSettingsPopover
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    )}
    </>
  );
} 