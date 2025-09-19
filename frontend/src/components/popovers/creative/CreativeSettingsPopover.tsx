import { useState, useEffect } from 'react';
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
  Divider,
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
  Chip,
  Avatar,
  Autocomplete,
  Popover,
} from '@mui/material';
import {
  Close,
  Person,
  Settings,
  CreditCard,
  PhotoCamera,
  Palette,
  Title,
  LocationOn,
  ContactPhone,
  Description,
  TrendingUp,
  Visibility,
} from '@mui/icons-material';
import { userService, type CreativeProfile, type CreativeService, type CreativeServicesListResponse, type CreativeProfileSettingsRequest } from '../../../api/userService';

interface CreativeSettingsPopoverProps {
  open: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void; // Callback to refresh parent components
}

type SettingsSection = 'account' | 'preferences' | 'billing';

const CREATIVE_TITLES = [
  'Other', // Move to top for easy access
  
  // Music & Audio
  'Music Creative',
  'Audio Engineer',
  'Mixing Engineer',
  'Mastering Engineer',
  'Beat Maker',
  'Composer',
  'Sound Designer',
  'Recording Engineer',
  'Session Musician',
  'Vocalist',
  'Songwriter',
  'Arranger',
  'DJ',
  'Podcast Creative',
  'Voice Over Artist',
  
  // Visual & Design
  'Graphic Designer',
  'UI/UX Designer',
  'Web Designer',
  'Logo Designer',
  'Brand Designer',
  'Illustrator',
  'Digital Artist',
  'Motion Graphics Designer',
  'Animator',
  '3D Artist',
  'Character Designer',
  'Concept Artist',
  
  // Video & Film
  'Video Editor',
  'Film Director',
  'Cinematographer',
  'Video Creative',
  'Documentary Filmmaker',
  'Content Creator',
  'YouTuber',
  'Colorist',
  'VFX Artist',
  
  // Photography
  'Photographer',
  'Portrait Photographer',
  'Wedding Photographer',
  'Product Photographer',
  'Event Photographer',
  'Photo Editor',
  'Retoucher',
  
  // Writing & Content
  'Writer',
  'Copywriter',
  'Content Writer',
  'Screenwriter',
  'Blogger',
  'Technical Writer',
  'Creative Writer',
  'Editor',
  'Proofreader',
  
  // Marketing & Social
  'Social Media Manager',
  'Digital Marketer',
  'SEO Specialist',
  'Email Marketing Specialist',
  'Influencer',
  
  // Development & Tech
  'Web Developer',
  'App Developer',
  'Game Developer',
  'Software Developer',
  
  // Other Creative Fields
  'Artist',
  'Painter',
  'Sculptor',
  'Fashion Designer',
  'Interior Designer',
  'Architect',
  'Consultant',
  'Coach',
  'Tutor',
] as const;

const PROFILE_HIGHLIGHTS_OPTIONS = [
  'Years of Experience',
  'Average Response Time',
  'Languages Spoken',
  'Certifications',
  'Education Level',
  'Skills Mastered',
  'Awards Won',
  'Specializations',
  'Software Proficiency',
  'Industry Experience',
  'Geographic Coverage',
  'Service Areas',
  'Availability Status',
  'Preferred Genres',
  'Studio Equipment',
  'Collaboration Style',
  'Communication Preference',
  'Project Timeline',
  'Budget Range',
  'Client Types',
] as const;

export function CreativeSettingsPopover({ open, onClose, onProfileUpdated }: CreativeSettingsPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedSection, setSelectedSection] = useState<SettingsSection>('account');
  
  // Data state
  const [creativeProfile, setCreativeProfile] = useState<CreativeProfile | null>(null);
  const [services, setServices] = useState<CreativeService[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    profilePhoto: null as File | null,
    avatarBgColor: '#3B82F6',
    title: '',
    customTitle: '',
    location: '',
    primaryContact: '',
    secondaryContact: '',
    description: '',
    selectedProfileHighlights: [] as string[],
    primaryService: '',
    secondaryService: '',
    customStatValues: {} as Record<string, string>, // For storing values of custom stats
  });

  // Store original values to reset to when popover closes
  const [originalFormData, setOriginalFormData] = useState({
    displayName: '',
    profilePhoto: null as File | null,
    avatarBgColor: '#3B82F6',
    title: '',
    customTitle: '',
    location: '',
    primaryContact: '',
    secondaryContact: '',
    description: '',
    selectedProfileHighlights: [] as string[],
    primaryService: '',
    secondaryService: '',
    customStatValues: {} as Record<string, string>,
  });
  
  // UI state
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Fetch creative profile and services when popover opens
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);
  
  // Update form data when creative profile loads
  useEffect(() => {
    if (creativeProfile) {
      const newFormData = {
        displayName: creativeProfile.display_name || '',
        profilePhoto: null as File | null,
        avatarBgColor: creativeProfile.avatar_background_color || '#3B82F6', // Use configured color or default
        title: creativeProfile.title || '',
        customTitle: '',
        location: creativeProfile.availability_location || '',
        primaryContact: creativeProfile.primary_contact || '',
        secondaryContact: creativeProfile.secondary_contact || '',
        description: creativeProfile.description || '',
        selectedProfileHighlights: creativeProfile.profile_highlights || ['Years of Experience', 'Average Response Time', 'Industry Experience'], // Use configured highlights or defaults
        primaryService: creativeProfile.primary_service_id || '',
        secondaryService: creativeProfile.secondary_service_id || '',
        customStatValues: creativeProfile.profile_highlight_values || {},
      };
      
      setFormData(newFormData);
      setOriginalFormData(newFormData); // Store as original values
    }
  }, [creativeProfile]);
  
  const fetchData = async () => {
    try {
      // Fetch creative profile
      const profile = await userService.getCreativeProfile();
      setCreativeProfile(profile);
      
      // Fetch services
      const servicesResponse: CreativeServicesListResponse = await userService.getCreativeServices();
      const publicServices = servicesResponse.services.filter((service: CreativeService) => 
        service.is_active && 
        service.is_enabled && 
        service.status === 'Public'
      );
      setServices(publicServices);
    } catch (error) {
      console.error('Failed to fetch creative data:', error);
    }
  };

  const settingsSections = [
    {
      id: 'account' as SettingsSection,
      label: 'Account',
      icon: Person,
    },
    {
      id: 'preferences' as SettingsSection,
      label: 'Preferences',
      icon: Settings,
    },
    {
      id: 'billing' as SettingsSection,
      label: 'Billing',
      icon: CreditCard,
    },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('profilePhoto', file);
    }
  };

  const handleColorSelect = (color: string) => {
    handleInputChange('avatarBgColor', color);
    setColorPickerOpen(false);
  };

  const handleProfileHighlightToggle = (stat: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedProfileHighlights.includes(stat);
      if (isSelected) {
        return {
          ...prev,
          selectedProfileHighlights: prev.selectedProfileHighlights.filter(s => s !== stat)
        };
      } else if (prev.selectedProfileHighlights.length < 3) {
        return {
          ...prev,
          selectedProfileHighlights: [...prev.selectedProfileHighlights, stat]
        };
      }
      return prev;
    });
  };

  const getAvailableServices = (excludeService?: string) => {
    return services.filter(service => service.id !== excludeService);
  };

  const resetFormToOriginal = () => {
    setFormData(originalFormData);
  };

  const handleClose = () => {
    // Reset form to original values when closing
    resetFormToOriginal();
    onClose();
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Prepare the settings request
      const settingsRequest: CreativeProfileSettingsRequest = {
        display_name: formData.displayName,
        title: formData.title,
        custom_title: formData.customTitle || undefined,
        availability_location: formData.location,
        primary_contact: formData.primaryContact,
        secondary_contact: formData.secondaryContact,
        description: formData.description,
        selected_profile_highlights: formData.selectedProfileHighlights,
        profile_highlight_values: formData.customStatValues,
        primary_service_id: formData.primaryService || undefined,
        secondary_service_id: formData.secondaryService || undefined,
        avatar_background_color: formData.avatarBgColor,
      };

      // Call the API
      await userService.updateCreativeProfileSettings(settingsRequest);
      
      // Update the original form data to reflect the saved state
      setOriginalFormData({ ...formData });
      
      // Notify parent components to refresh their data
      if (onProfileUpdated) {
        onProfileUpdated();
      }
      
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('creativeProfileUpdated'));
      
      // Close the popover
      onClose();
      
    } catch (error) {
      console.error('Failed to save profile settings:', error);
      // You could add a toast notification here for error handling
    } finally {
      setSaving(false);
    }
  };

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
                      sx={{ 
                        width: 80, 
                        height: 80,
                        backgroundColor: formData.avatarBgColor
                      }}
                      src={formData.profilePhoto ? URL.createObjectURL(formData.profilePhoto) : creativeProfile?.profile_banner_url}
                    >
                      {creativeProfile?.display_name?.charAt(0) || 'C'}
                    </Avatar>
                    <Box>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="profile-photo-upload"
                        type="file"
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="profile-photo-upload">
                        <Button variant="outlined" startIcon={<PhotoCamera />} component="span">
                          Upload Photo
                        </Button>
                      </label>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                        Recommended: 400x400px, JPG or PNG
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Display Name Section */}
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
                    variant="outlined"
                    size="small"
                    placeholder="Enter your display name"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    This is the name that will be displayed on your profile and to clients.
                  </Typography>
                </CardContent>
              </Card>

              {/* Avatar Background Color */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Palette color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Avatar Background Color
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                      <Box
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: '2px solid',
                          borderColor: color === formData.avatarBgColor ? 'primary.main' : 'transparent',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                        }}
                      />
                    ))}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        setColorPickerAnchor(e.currentTarget);
                        setColorPickerOpen(true);
                      }}
                    >
                      Custom
                    </Button>
                  </Box>
                  
                  {/* Custom Color Picker */}
                  <Popover
                    open={colorPickerOpen}
                    anchorEl={colorPickerAnchor}
                    onClose={() => setColorPickerOpen(false)}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Choose Custom Color
                      </Typography>
                      <input
                        type="color"
                        value={formData.avatarBgColor}
                        onChange={(e) => handleColorSelect(e.target.value)}
                        style={{ width: '100%', height: 40, border: 'none', borderRadius: 4 }}
                      />
                    </Box>
                  </Popover>
                </CardContent>
              </Card>

              {/* Basic Information Row */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Title color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        Title
                      </Typography>
                    </Box>
                    <Autocomplete
                      options={CREATIVE_TITLES}
                      value={formData.title || null}
                      onChange={(_, newValue) => handleInputChange('title', newValue || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search or select your title..."
                          variant="outlined"
                          size="small"
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          {option === 'Other' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: 'primary.main' }}>
                              ✨ {option}
                            </Box>
                          ) : (
                            option
                          )}
                        </Box>
                      )}
                      filterOptions={(options, { inputValue }) => {
                        const filtered = options.filter(option =>
                          option.toLowerCase().includes(inputValue.toLowerCase())
                        );
                        return filtered;
                      }}
                    />
                    {formData.title === 'Other' && (
                      <TextField
                        fullWidth
                        placeholder="Enter your custom title..."
                        variant="outlined"
                        size="small"
                        value={formData.customTitle}
                        onChange={(e) => handleInputChange('customTitle', e.target.value)}
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <LocationOn color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        Location Availability
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      placeholder="e.g., Los Angeles, CA"
                      variant="outlined"
                      size="small"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </CardContent>
                </Card>
              </Box>

              {/* Contact Information Row */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <ContactPhone color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        Primary Contact
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      placeholder="Email or phone number"
                      variant="outlined"
                      size="small"
                      value={formData.primaryContact}
                      onChange={(e) => handleInputChange('primaryContact', e.target.value)}
                    />
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <ContactPhone color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        Secondary Contact
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      placeholder="Alternative contact method"
                      variant="outlined"
                      size="small"
                      value={formData.secondaryContact}
                      onChange={(e) => handleInputChange('secondaryContact', e.target.value)}
                    />
                  </CardContent>
                </Card>
              </Box>

              {/* Description */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Description color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Description
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Tell clients about yourself and your services..."
                    variant="outlined"
                    size="small"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {formData.description.length}/500 characters
                  </Typography>
                </CardContent>
              </Card>

              {/* Profile Highlights Configuration */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <TrendingUp color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Profile Highlights Configuration
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Select up to 3 highlights to display on your profile:
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    {PROFILE_HIGHLIGHTS_OPTIONS.map((stat) => {
                      const isSelected = formData.selectedProfileHighlights.includes(stat);
                      const canSelect = formData.selectedProfileHighlights.length < 3 || isSelected;
                      
                      return (
                        <Chip
                          key={stat}
                          label={stat}
                          size="small"
                          clickable
                          onClick={() => handleProfileHighlightToggle(stat)}
                          color={isSelected ? 'primary' : 'default'}
                          variant={isSelected ? 'filled' : 'outlined'}
                          disabled={!canSelect}
                        />
                      );
                    })}
                  </Box>

                  {/* Show input fields only for selected highlights */}
                  {formData.selectedProfileHighlights.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                        Configure values for selected highlights:
                      </Typography>
                      
                    {formData.selectedProfileHighlights.map((stat) => {
                      // For all highlights, show a generic text field
                      const statKey = stat.replace(/\s+/g, '').toLowerCase();
                      return (
                        <TextField
                          key={stat}
                          fullWidth
                          label={`${stat} value`}
                          variant="outlined"
                          size="small"
                          placeholder={`Enter ${stat.toLowerCase()} value`}
                          value={formData.customStatValues[statKey] || ''}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              customStatValues: {
                                ...prev.customStatValues,
                                [statKey]: e.target.value
                              }
                            }));
                          }}
                        />
                      );
                    })}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Services Display Configuration */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Visibility color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Services Display Configuration
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Choose which 2 services to display on your profile and invite page:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Primary Service</InputLabel>
                      <Select 
                        label="Primary Service"
                        value={formData.primaryService}
                        onChange={(e) => handleInputChange('primaryService', e.target.value)}
                      >
                        {getAvailableServices(formData.secondaryService).map((service) => (
                          <MenuItem key={service.id} value={service.id}>
                            {service.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Secondary Service</InputLabel>
                      <Select 
                        label="Secondary Service"
                        value={formData.secondaryService}
                        onChange={(e) => handleInputChange('secondaryService', e.target.value)}
                      >
                        {getAvailableServices(formData.primaryService).map((service) => (
                          <MenuItem key={service.id} value={service.id}>
                            {service.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
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
                    All your data, services, reviews, and profile information will be permanently removed. 
                    This action cannot be undone.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>

            </Box>
          </Box>
        );
      case 'preferences':
        return (
          <Box sx={{ px: 3, pb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Preference settings will be implemented here.
            </Typography>
          </Box>
        );
      case 'billing':
        return (
          <Box sx={{ px: 3, pb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Billing management features will be implemented here.
            </Typography>
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
            width: { xs: '100%', md: 280 },
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.1)', md: 'none' },
          }}
        >
          <Typography variant="h5" fontWeight={600}>
            Settings
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
        {!isMobile && (
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
                {settingsSections.find(s => s.id === selectedSection)?.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedSection === 'account' && 'Manage your account information and profile settings.'}
                {selectedSection === 'preferences' && 'Customize your app experience and interface.'}
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
                  disabled={saving}
                  onClick={handleSaveChanges}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
              
              {/* Close Button */}
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
            </Box>
          </Box>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', height: '100%' }}>
        {/* Sidebar Navigation */}
        <Box
          sx={{
            width: { xs: '100%', md: 280 },
            minWidth: { md: 280 },
            borderRight: { md: '1px solid rgba(0, 0, 0, 0.1)' },
            background: { md: 'rgba(255, 255, 255, 0.8)' },
            backdropFilter: { md: 'blur(10px)' },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Mobile: Show section selector */}
          {isMobile && (
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Settings Sections
              </Typography>
            </Box>
          )}

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
                        color: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        },
                        '& .MuiListItemIcon-root': {
                          color: theme.palette.primary.main,
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: isSelected ? theme.palette.primary.main : 'text.secondary',
                        transition: 'color 0.2s ease-in-out',
                      }}
                    >
                      <IconComponent />
                    </ListItemIcon>
                    <ListItemText
                      primary={section.label}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: '0.95rem',
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {/* Mobile: Show current section info */}
          {isMobile && (
            <>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Current Section
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {settingsSections.find(s => s.id === selectedSection)?.label}
                </Typography>
              </Box>
            </>
          )}
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
