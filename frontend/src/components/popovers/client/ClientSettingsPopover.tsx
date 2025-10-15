import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Close,
  Person,
  Settings,
  CreditCard,
  PhotoCamera,
  Title,
  ContactPhone,
  AccountCircle,
  Check,
} from '@mui/icons-material';

interface ClientSettingsPopoverProps {
  open: boolean;
  onClose: () => void;
}

type SettingsSection = 'account' | 'billing' | 'userAccount';

const CLIENT_TITLES = [
  'Other', // Move to top for easy access
  
  // Music & Entertainment
  'Music Fan',
  'Artist Manager',
  'Record Label',
  'Music Venue',
  'Event Organizer',
  'Promoter',
  'Festival Organizer',
  'Booking Agent',
  
  // Business
  'Brand',
  'Small Business',
  'Startup',
  'Enterprise',
  'Marketing Agency',
  'PR Agency',
  'Advertising Agency',
  
  // Content & Media
  'Content Creator',
  'Influencer',
  'Podcaster',
  'YouTuber',
  'Streamer',
  'Blogger',
  'Media Company',
  'Production Company',
  
  // Individual Clients
  'Individual',
  'Hobbyist',
  'Student',
  'Enthusiast',
];

export function ClientSettingsPopover({ open, onClose }: ClientSettingsPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedSection, setSelectedSection] = useState<SettingsSection>('account');
  const [selectedTheme, setSelectedTheme] = useState('light');
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    profilePhoto: null as File | null,
    title: '',
    customTitle: '',
    primaryContact: '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('profilePhoto', file);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const settingsSections = [
    {
      id: 'account' as SettingsSection,
      label: 'Client Account',
      icon: Person,
    },
    {
      id: 'billing' as SettingsSection,
      label: 'Client Billing',
      icon: CreditCard,
    },
  ];

  const accountSections = [
    {
      id: 'userAccount' as SettingsSection,
      label: 'User Account',
      icon: AccountCircle,
    },
  ];

  const renderSectionContent = () => {
    switch (selectedSection) {
      case 'account':
        return (
          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Profile Photo Section */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <PhotoCamera color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Profile Photo
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Avatar
                      src={formData.profilePhoto ? URL.createObjectURL(formData.profilePhoto) : undefined}
                      sx={{ width: 80, height: 80 }}
                    >
                      {!formData.profilePhoto && formData.displayName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Upload Photo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Display Name */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Person color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Display Name
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="Enter your display name"
                  />
                </CardContent>
              </Card>

              {/* Title */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Title color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Title
                    </Typography>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Select Title</InputLabel>
                    <Select
                      label="Select Title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    >
                      {CLIENT_TITLES.map((title) => (
                        <MenuItem key={title} value={title}>
                          {title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {/* Custom Title Field - Only shown when "Other" is selected */}
                  {formData.title === 'Other' && (
                    <TextField
                      fullWidth
                      value={formData.customTitle}
                      onChange={(e) => handleInputChange('customTitle', e.target.value)}
                      placeholder="Enter custom title"
                      sx={{ mt: 2 }}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Primary Contact */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <ContactPhone color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Primary Contact
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    value={formData.primaryContact}
                    onChange={(e) => handleInputChange('primaryContact', e.target.value)}
                    placeholder="email@example.com or +1234567890"
                  />
                </CardContent>
              </Card>

              {/* Delete Client Role Section */}
              <Card variant="outlined" sx={{ borderColor: 'error.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} color="error">
                      Delete Client Role
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                    ⚠️ <strong>Warning:</strong> Role deletion is permanent and irreversible. 
                    All your data related to the client role, including bookings, orders, and profile information,
                    will be permanently removed. This action cannot be undone.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Delete Client Role
                  </Button>
                </CardContent>
              </Card>

            </Box>
          </Box>
        );
      case 'billing':
        return (
          <Box sx={{ px: 3, pb: 3 }}>
      
          </Box>
        );
      case 'userAccount':
        return (
          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Theme Preferences */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Settings color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Theme Preferences
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Choose your preferred theme for the application interface.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    {/* Light Theme Option */}
                    <Card 
                      variant="outlined" 
                      onClick={() => setSelectedTheme('light')}
                      sx={{ 
                        flex: 1, 
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: selectedTheme === 'light' ? 'primary.main' : 'grey.300',
                        opacity: selectedTheme === 'light' ? 1 : 0.6,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          opacity: 1,
                          borderColor: selectedTheme === 'light' ? 'primary.main' : 'primary.light',
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: selectedTheme === 'light' ? 'primary.main' : 'grey.100',
                            border: '1px solid',
                            borderColor: selectedTheme === 'light' ? 'primary.main' : 'grey.300'
                          }} />
                          <Typography variant="subtitle2" fontWeight={600}>
                            Light Theme
                          </Typography>
                          {selectedTheme === 'light' && (
                            <Check sx={{ ml: 'auto', color: 'primary.main', fontSize: 16 }} />
                          )}
                        </Box>
                        <Box sx={{ 
                          bgcolor: 'grey.50', 
                          p: 2, 
                          borderRadius: 1, 
                          border: '1px solid',
                          borderColor: 'grey.200'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'grey.300' }} />
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'grey.300' }} />
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'grey.300' }} />
                          </Box>
                          <Box sx={{ 
                            height: 8, 
                            bgcolor: 'grey.200', 
                            borderRadius: 0.5, 
                            mb: 1 
                          }} />
                          <Box sx={{ 
                            height: 6, 
                            bgcolor: 'grey.200', 
                            borderRadius: 0.5, 
                            width: '60%' 
                          }} />
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Dark Theme Option */}
                    <Card 
                      variant="outlined" 
                      onClick={() => setSelectedTheme('dark')}
                      sx={{ 
                        flex: 1, 
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: selectedTheme === 'dark' ? 'primary.main' : 'grey.300',
                        opacity: selectedTheme === 'dark' ? 1 : 0.6,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          opacity: 1,
                          borderColor: selectedTheme === 'dark' ? 'primary.main' : 'primary.light',
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: selectedTheme === 'dark' ? 'primary.main' : 'grey.800',
                            border: '1px solid',
                            borderColor: selectedTheme === 'dark' ? 'primary.main' : 'grey.600'
                          }} />
                          <Typography variant="subtitle2" fontWeight={600}>
                            Dark Theme
                          </Typography>
                          {selectedTheme === 'dark' && (
                            <Check sx={{ ml: 'auto', color: 'primary.main', fontSize: 16 }} />
                          )}
                        </Box>
                        <Box sx={{ 
                          bgcolor: 'grey.900', 
                          p: 2, 
                          borderRadius: 1, 
                          border: '1px solid',
                          borderColor: 'grey.700'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'grey.600' }} />
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'grey.600' }} />
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'grey.600' }} />
                          </Box>
                          <Box sx={{ 
                            height: 8, 
                            bgcolor: 'grey.700', 
                            borderRadius: 0.5, 
                            mb: 1 
                          }} />
                          <Box sx={{ 
                            height: 6, 
                            bgcolor: 'grey.700', 
                            borderRadius: 0.5, 
                            width: '60%' 
                          }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                </CardContent>
              </Card>

              {/* Delete Account Section */}
              <Card variant="outlined" sx={{ borderColor: 'error.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} color="error">
                      Delete Account
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                    ⚠️ <strong>Warning:</strong> Account deletion is permanent and irreversible. 
                    All your data, including user account, client roles, bookings, orders, and profile information,
                    will be permanently removed. This action cannot be undone.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.5 }}>
                    Before deleting your account, make sure to:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                    <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Download any important data you want to keep
                    </Typography>
                    <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Cancel any active subscriptions
                    </Typography>
                    <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Complete any pending orders or bookings
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Delete Account Permanently
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Account deletion will be available in a future update.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          minHeight: isMobile ? '100vh' : '600px',
          maxHeight: isMobile ? '100vh' : '80vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          display: 'flex',
          alignItems: 'stretch',
          minHeight: 72,
        }}
      >
        {/* Blue header section - only extends to sidebar width */}
        <Box
          sx={{
            width: { xs: 0, md: 280 },
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: 'white',
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.1)', md: 'none' },
          }}
        >
          <Typography variant="h5" fontWeight={600}>
            Client Settings
          </Typography>
          {/* Close button for mobile - inside blue area */}
          {isMobile && (
            <IconButton
              onClick={handleClose}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Close />
            </IconButton>
          )}
        </Box>
        
        {/* Right section for desktop - part of content area with title, subtitle, and close button */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            px: 3,
            py: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
            {/* Title and Subtitle */}
            <Box sx={{ flex: 1, pt: 1 }}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {settingsSections.find(s => s.id === selectedSection)?.label || accountSections.find(s => s.id === selectedSection)?.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedSection === 'account' && 'Manage your account information and profile settings.'}
                {selectedSection === 'userAccount' && 'Customize your app experience and interface.'}
                {selectedSection === 'billing' && 'Manage your subscription and payment information.'}
              </Typography>
            </Box>
            
            {/* Action Buttons positioned absolutely in top-right */}
            <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
              {/* Save Changes Button - only show for account section */}
              {selectedSection === 'account' && (
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Save Changes
                </Button>
              )}

              {/* Close button for desktop */}
              {!isMobile && (
                <IconButton
                  onClick={handleClose}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <Close />
                </IconButton>
              )}
            </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          overflow: 'hidden',
          flex: 1,
        }}
      >
        {/* Sidebar Navigation - Desktop */}
        <Box
          sx={{
            width: { xs: 0, md: 280 },
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.05) 100%)',
            backdropFilter: { md: 'blur(10px)' },
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
          }}
        >

          <List sx={{ flex: 1, py: 1 }}>
            {settingsSections.map((section) => {
              const IconComponent = section.icon;
              const isSelected = selectedSection === section.id;

              return (
                <ListItem key={section.id} disablePadding sx={{ px: 2, mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => setSelectedSection(section.id)}
                    selected={isSelected}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderLeft: '3px solid',
                        borderColor: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                      <IconComponent />
                    </ListItemIcon>
                    <ListItemText
                      primary={section.label}
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'primary.main' : 'text.primary',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {/* Account Section Divider & Items */}
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, fontWeight: 600 }}>
              User Settings
            </Typography>
          </Box>

          <List sx={{ py: 0, pb: 2 }}>
            {accountSections.map((section) => {
              const IconComponent = section.icon;
              const isSelected = selectedSection === section.id;

              return (
                <ListItem key={section.id} disablePadding sx={{ px: 2, mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => setSelectedSection(section.id)}
                    selected={isSelected}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderLeft: '3px solid',
                        borderColor: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                      <IconComponent />
                    </ListItemIcon>
                    <ListItemText
                      primary={section.label}
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'primary.main' : 'text.primary',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

        </Box>

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            overflow: 'auto',
          }}
        >
          {/* Section Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {renderSectionContent()}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
