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
  Divider,
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
  Check,
  AccountCircle,
} from '@mui/icons-material';
import { userService, type CreativeProfile, type CreativeService, type CreativeProfileSettingsRequest, type CreativeBundle } from '../../../api/userService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { errorToast } from '../../../components/toast/toast';
import { useAuth } from '../../../context/auth';

interface CreativeSettingsPopoverProps {
  open: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void; // Callback to refresh parent components
}

type SettingsSection = 'account' | 'billing' | 'userAccount';

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
  const { isAuthenticated } = useAuth();
  const [selectedSection, setSelectedSection] = useState<SettingsSection>('account');
  
  // Data state
  const [creativeProfile, setCreativeProfile] = useState<CreativeProfile | null>(null);
  const [services, setServices] = useState<CreativeService[]>([]);
  const [bundles, setBundles] = useState<CreativeBundle[]>([]);
  
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
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');
  
  // Fetch creative profile and services when popover opens
  useEffect(() => {
    if (open && isAuthenticated) {
      fetchData();
    }
  }, [open, isAuthenticated]);
  
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
      // Only fetch data if user is authenticated
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping data fetch');
        return;
      }

      // Fetch creative profile
      const profile = await userService.getCreativeProfile();
      setCreativeProfile(profile);
      
      // Fetch services and bundles from unified endpoint
      const response = await userService.getCreativeServices();
      const publicServices = response.services.filter((service: CreativeService) => 
        service.is_active && 
        service.status === 'Public'
      );
      setServices(publicServices);
      
      const publicBundles = response.bundles.filter((bundle: CreativeBundle) => 
        bundle.is_active && 
        bundle.status === 'Public'
      );
      setBundles(publicBundles);
    } catch (error) {
      console.error('Failed to fetch creative data:', error);
    }
  };

  const settingsSections = [
    {
      id: 'account' as SettingsSection,
      label: 'Creative Account',
      icon: Person,
    },
    {
      id: 'billing' as SettingsSection,
      label: 'Creative Billing',
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file type is allowed
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        errorToast('Only PNG and JPEG files are allowed');
        return;
      }
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
    // Combine services and bundles into a unified list
    const allItems = [
      ...services.map(service => ({ ...service, type: 'service' as const })),
      ...bundles.map(bundle => ({ ...bundle, type: 'bundle' as const }))
    ];
    
    return allItems.filter(item => item.id !== excludeService);
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
      
      // Upload profile photo if a new one was selected
      if (formData.profilePhoto) {
        try {
          const uploadResponse = await userService.uploadCreativeProfilePhoto(formData.profilePhoto);
          console.log('Profile photo uploaded:', uploadResponse);
        } catch (uploadError) {
          console.error('Failed to upload profile photo:', uploadError);
          // Continue with other settings even if photo upload fails
        }
      }
      
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
                        accept="image/png,image/jpeg,image/jpg"
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
                  
                  {/* Current Selection Preview */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                      Preview
                    </Typography>
                    <Box sx={{
                      background: `linear-gradient(135deg, ${formData.avatarBgColor} 0%, ${formData.avatarBgColor}CC 100%)`,
                      color: 'white',
                      p: 2,
                      borderRadius: 2,
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Avatar
                        src={formData.profilePhoto ? URL.createObjectURL(formData.profilePhoto) : creativeProfile?.profile_banner_url}
                        sx={{ 
                          width: 60, 
                          height: 60,
                          mx: 'auto',
                          mb: 1,
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        {creativeProfile?.display_name?.charAt(0) || 'C'}
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ opacity: 0.9 }}>
                        {creativeProfile?.display_name || 'Your Name'}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8, fontFamily: 'monospace', mt: 1 }}>
                        {formData.avatarBgColor.toUpperCase()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => {
                      const isSelected = color === formData.avatarBgColor;
                      return (
                        <Box
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          sx={{
                            position: 'relative',
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: '3px solid',
                            borderColor: isSelected ? 'primary.main' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              borderColor: isSelected ? 'primary.main' : 'grey.400',
                              boxShadow: isSelected ? '0 0 0 2px rgba(25, 118, 210, 0.2)' : '0 2px 8px rgba(0,0,0,0.15)',
                            },
                            ...(isSelected && {
                              boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                            })
                          }}
                        >
                          {isSelected && (
                            <Check 
                              sx={{ 
                                color: 'white', 
                                fontSize: 24,
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                              }} 
                            />
                          )}
                        </Box>
                      );
                    })}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        setColorPickerAnchor(e.currentTarget);
                        setColorPickerOpen(true);
                      }}
                      sx={{ 
                        minWidth: 80,
                        borderColor: formData.avatarBgColor && !['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].includes(formData.avatarBgColor) 
                          ? formData.avatarBgColor 
                          : undefined,
                        borderWidth: formData.avatarBgColor && !['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].includes(formData.avatarBgColor) 
                          ? 2 
                          : 1,
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
                  
                  {(() => {
                    const allServices = getAvailableServices();
                    const hasEnoughServices = allServices.length >= 2;
                    
                    if (!hasEnoughServices) {
                      return (
                        <Box sx={{ 
                          p: 3, 
                          textAlign: 'center', 
                          bgcolor: 'grey.50', 
                          borderRadius: 2,
                          border: '1px dashed',
                          borderColor: 'grey.300'
                        }}>
                          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            {allServices.length === 0 ? 'No Services Available' : 'Insufficient Services'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {allServices.length === 0 
                              ? 'You need to create at least 2 services or bundles to configure your profile display.'
                              : `You have ${allServices.length} service${allServices.length === 1 ? '' : 's'} available, but need at least 2 to configure your profile display.`
                            }
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight={500}>
                            Create more services or bundles in your creative dashboard to continue.
                          </Typography>
                        </Box>
                      );
                    }
                    
                    return (
                      <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Choose which 2 services or bundles to display on your profile and invite page:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Primary Service</InputLabel>
                      <Select 
                        label="Primary Service"
                        value={formData.primaryService}
                        onChange={(e) => handleInputChange('primaryService', e.target.value)}
                      >
                        {getAvailableServices(formData.secondaryService).map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FontAwesomeIcon 
                                icon={item.type === 'service' ? faGem : faLayerGroup} 
                                style={{ fontSize: '14px', color: item.color }} 
                              />
                              <Typography variant="body2">
                                {item.title}
                              </Typography>
                              {item.type === 'bundle' && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  (Bundle)
                                </Typography>
                              )}
                            </Box>
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
                        {getAvailableServices(formData.primaryService).map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FontAwesomeIcon 
                                icon={item.type === 'service' ? faGem : faLayerGroup} 
                                style={{ fontSize: '14px', color: item.color }} 
                              />
                              <Typography variant="body2">
                                {item.title}
                              </Typography>
                              {item.type === 'bundle' && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  (Bundle)
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Delete Account Section */}
              <Card variant="outlined" sx={{ borderColor: 'error.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} color="error">
                      Delete Creative Role
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                    ⚠️ <strong>Warning:</strong> Role deletion is permanent and irreversible. 
                    All your data related to the creative role, including services, reviews, and profile information,
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
                    Delete Creative Role
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
                    All your data, including user account, creative roles, services, reviews, and profile information,
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
                      Notify any clients about your account closure
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
            Creative Settings
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
                {[...settingsSections, ...accountSections].find(s => s.id === selectedSection)?.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedSection === 'account' && 'Manage your account information and profile settings.'}
                {selectedSection === 'billing' && 'Manage your subscription and payment information.'}
                {selectedSection === 'userAccount' && 'Manage your user account settings and security preferences.'}
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
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', height: '100%' }}>
        {/* Sidebar Navigation */}
        <Box
          sx={{
            width: { xs: 0, md: 280 },
            minWidth: { md: 280 },
            borderRight: { md: '1px solid rgba(0, 0, 0, 0.1)' },
            background: { md: 'rgba(255, 255, 255, 0.8)' },
            backdropFilter: { md: 'blur(10px)' },
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
          }}
        >

          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Creative Role Settings */}
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

            {/* Separator */}
            <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.1)' }} />

            {/* Account-Specific Settings - Pushed to bottom */}
            <List sx={{ py: 1 }}>
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
          </Box>

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
