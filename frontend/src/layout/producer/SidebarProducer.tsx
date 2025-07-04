import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AttachMoney as IncomeIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  Album as RecordIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface SidebarProducerProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedItem: string;
  onItemSelect: (item: string) => void;
}

export function SidebarProducer({ isOpen, onToggle, selectedItem, onItemSelect }: SidebarProducerProps) {
  const theme = useTheme();
  const [accountType, setAccountType] = useState<string>('producer');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'clients', label: 'Clients', icon: PeopleIcon },
    { id: 'income', label: 'Income', icon: IncomeIcon },
    { id: 'public', label: 'Public', icon: PublicIcon },
  ];

  const accountTypes = [
    { value: 'producer', label: 'Producer' },
    { value: 'client', label: 'Client' },
    { value: 'advocate', label: 'Advocate' },
  ];

  const sidebarWidth = isOpen ? 280 : 64;

  function handleAccountTypeChange(newType: string) {
    setAccountType(newType);
    setIsRoleDropdownOpen(false);
  }

  function handleRoleDropdownToggle() {
    if (isOpen) {
      setIsRoleDropdownOpen(!isRoleDropdownOpen);
    }
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {/* Header with Logo and Toggle */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isOpen ? 'space-between' : 'center',
        p: 2,
        minHeight: 64,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        {isOpen && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RecordIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              EZ
            </Typography>
          </Box>
        )}
        <IconButton
          onClick={onToggle}
          sx={{
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          {isOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      {/* Role/Account Dropdown */}
      <Box sx={{ p: isOpen ? 2 : 1 }}>
        {isOpen ? (
          <Box>
            <ListItemButton
              onClick={handleRoleDropdownToggle}
              sx={{
                borderRadius: 1,
                mb: 1,
                backgroundColor: isRoleDropdownOpen ? theme.palette.action.selected : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemText 
                primary={accountTypes.find(type => type.value === accountType)?.label}
                sx={{ 
                  '& .MuiListItemText-primary': { 
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }
                }}
              />
              {isRoleDropdownOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={isRoleDropdownOpen} timeout="auto" unmountOnExit>
              <List sx={{ pl: 2 }}>
                {accountTypes.map((type) => (
                  <ListItemButton
                    key={type.value}
                    onClick={() => handleAccountTypeChange(type.value)}
                    selected={accountType === type.value}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                        },
                      },
                    }}
                  >
                    <ListItemText 
                      primary={type.label}
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          fontSize: '0.85rem'
                        }
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar sx={{ 
              width: 32, 
              height: 32, 
              backgroundColor: theme.palette.primary.main,
              fontSize: '0.8rem'
            }}>
              {accountType.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isSelected = selectedItem === item.id;
          
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => onItemSelect(item.id)}
                selected={isSelected}
                sx={{
                  borderRadius: 1,
                  minHeight: 48,
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  px: isOpen ? 2 : 1.5,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  },
                  '&:hover': {
                    backgroundColor: isSelected ? theme.palette.primary.dark : theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isOpen ? 2 : 'auto',
                    justifyContent: 'center',
                    color: isSelected ? theme.palette.primary.contrastText : theme.palette.text.primary,
                  }}
                >
                  <IconComponent />
                </ListItemIcon>
                {isOpen && (
                  <ListItemText 
                    primary={item.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '0.9rem',
                        fontWeight: isSelected ? 600 : 400,
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Profile Section */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          sx={{
            borderRadius: 1,
            justifyContent: isOpen ? 'flex-start' : 'center',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: isOpen ? 2 : 0 }}>
            <Avatar sx={{ width: 32, height: 32 }}>
              <PersonIcon />
            </Avatar>
          </ListItemIcon>
          {isOpen && (
            <ListItemText
              primary="John Doe"
              secondary="Producer"
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.9rem',
                  fontWeight: 500,
                },
                '& .MuiListItemText-secondary': {
                  fontSize: '0.8rem',
                },
              }}
            />
          )}
        </ListItemButton>
      </Box>
    </Drawer>
  );
} 