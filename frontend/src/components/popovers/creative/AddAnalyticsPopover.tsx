import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Slide,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import {
  Close,
  ShowChart,
  PieChart as PieChartIcon,
  People,
} from '@mui/icons-material';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export type AnalyticsComponent = 'income' | 'service' | 'client';

interface AnalyticsOption {
  id: AnalyticsComponent;
  name: string;
  icon: React.ElementType;
  description: string;
}

interface AddAnalyticsPopoverProps {
  open: boolean;
  onClose: () => void;
  availableComponents: AnalyticsComponent[];
  onSelect: (component: AnalyticsComponent) => void;
}

const allAnalyticsOptions: AnalyticsOption[] = [
  {
    id: 'income',
    name: 'Income Over Time',
    icon: ShowChart,
    description: 'Track your income trends by week, month, or year',
  },
  {
    id: 'service',
    name: 'Service Breakdown',
    icon: PieChartIcon,
    description: 'View revenue distribution across your services',
  },
  {
    id: 'client',
    name: 'Client Leaderboard',
    icon: People,
    description: 'View your top clients ranked by total revenue',
  },
];

export function AddAnalyticsPopover({
  open,
  onClose,
  availableComponents,
  onSelect,
}: AddAnalyticsPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const availableOptions = allAnalyticsOptions.filter(option =>
    availableComponents.includes(option.id)
  );

  const handleSelect = (component: AnalyticsComponent) => {
    onSelect(component);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      sx={{
        zIndex: isMobile ? 10000 : 1300,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            p: 0,
            backgroundColor: '#fff',
            boxShadow: theme.shadows[8],
            height: isMobile ? '100dvh' : 'auto',
            maxHeight: isMobile ? '100dvh' : '80vh',
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
            }),
          },
        },
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.32)' } }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          color: 'white',
          px: 3,
          py: 2,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'white' }}>
          Add Analytics Component
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          flex: '1 1 auto',
          overflowY: 'auto',
        }}
      >
        {availableOptions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              All analytics components are already displayed.
            </Typography>
          </Box>
        ) : (
          <List>
            {availableOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <ListItem key={option.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => handleSelect(option.id)}
                    sx={{
                      borderRadius: 2,
                      py: 2,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: theme.palette.primary.main + '15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComponent sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {option.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                      }
                      sx={{ ml: 2 }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

