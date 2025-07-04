import { useState, type ReactNode } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { SidebarProducer } from './SidebarProducer';
import { useTheme } from '@mui/material/styles';

interface LayoutProducerProps {
  children: ReactNode;
  selectedNavItem?: string;
  onNavItemChange?: (item: string) => void;
}

export function LayoutProducer({ 
  children, 
  selectedNavItem = 'dashboard',
  onNavItemChange 
}: LayoutProducerProps) {
  const theme = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentNavItem, setCurrentNavItem] = useState(selectedNavItem);

  function handleSidebarToggle() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  function handleNavItemSelect(item: string) {
    setCurrentNavItem(item);
    if (onNavItemChange) {
      onNavItemChange(item);
    }
  }

  const sidebarWidth = isSidebarOpen ? 280 : 64;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Sidebar */}
      <SidebarProducer
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
        selectedItem={currentNavItem}
        onItemSelect={handleNavItemSelect}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: theme.palette.background.default,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: 0,
          width: `calc(100% - ${sidebarWidth}px)`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Content Container */}
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
} 