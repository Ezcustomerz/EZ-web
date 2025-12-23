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
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  Skeleton,
  DialogActions,
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
  AccountBalance,
  Info,
  Storage,
  Delete,
  Download,
  Folder,
  InsertDriveFile,
  PictureAsPdf,
  VideoFile,
  AudioFile,
  Image,
} from '@mui/icons-material';
import { userService, type CreativeProfile, type CreativeService, type CreativeProfileSettingsRequest, type CreativeBundle } from '../../../api/userService';
import { bookingService } from '../../../api/bookingService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { errorToast, successToast } from '../../../components/toast/toast';
import { useAuth } from '../../../context/auth';
import { supabase } from '../../../config/supabase';

interface CreativeSettingsPopoverProps {
  open: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void; // Callback to refresh parent components
  initialSection?: SettingsSection; // Optional section to open to
}

type SettingsSection = 'account' | 'billing' | 'storage' | 'userAccount';

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

export function CreativeSettingsPopover({ open, onClose, onProfileUpdated, initialSection = 'account' }: CreativeSettingsPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  const [selectedSection, setSelectedSection] = useState<SettingsSection>(initialSection);
  
  // Update selected section when initialSection prop changes
  useEffect(() => {
    if (open && initialSection) {
      setSelectedSection(initialSection);
    }
  }, [open, initialSection]);
  
  // Data state
  const [creativeProfile, setCreativeProfile] = useState<CreativeProfile | null>(null);
  const [services, setServices] = useState<CreativeService[]>([]);
  const [bundles, setBundles] = useState<CreativeBundle[]>([]);
  
  // Bank account state (fetched from Stripe)
  const [bankAccountStatus, setBankAccountStatus] = useState<{
    connected: boolean;
    accountId?: string;
    payoutsEnabled: boolean;
    accountType?: 'individual' | 'company';
    lastPayoutDate?: string;
    payoutDisableReason?: string;
    currentlyDueRequirements?: string[];
    onboardingComplete?: boolean;
  }>({
    connected: false,
    payoutsEnabled: false,
    onboardingComplete: false,
  });
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(false);
  const [connectingAccount, setConnectingAccount] = useState(false);
  const [loadingAccountData, setLoadingAccountData] = useState(false);
  
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Storage state
  const [deliverables, setDeliverables] = useState<Array<{
    id: string;
    booking_id: string;
    file_name: string;
    file_type: string;
    file_size_bytes: number;
    file_url: string;
    booking?: {
      id: string;
      service_name?: string;
      client_name?: string;
      created_at?: string;
    };
  }>>([]);
  const [loadingDeliverables, setLoadingDeliverables] = useState(false);
  const [deletingDeliverableId, setDeletingDeliverableId] = useState<string | null>(null);
  
  // Fetch creative profile and services when popover opens
  useEffect(() => {
    if (open && isAuthenticated) {
      fetchData();
    }
  }, [open, isAuthenticated]);

  // Fetch Stripe account status when billing section is selected
  useEffect(() => {
    if (open && isAuthenticated && selectedSection === 'billing') {
      fetchStripeAccountStatus();
    }
  }, [open, isAuthenticated, selectedSection]);

  // Fetch deliverables when storage section is selected
  useEffect(() => {
    if (open && isAuthenticated && selectedSection === 'storage') {
      fetchDeliverables();
    }
  }, [open, isAuthenticated, selectedSection]);
  
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

      setLoadingAccountData(true);

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
    } finally {
      setLoadingAccountData(false);
    }
  };

  const fetchStripeAccountStatus = async () => {
    try {
      setLoadingStripeStatus(true);
      const status = await userService.getStripeAccountStatus();
      setBankAccountStatus({
        connected: status.connected,
        accountId: status.account_id,
        payoutsEnabled: status.payouts_enabled,
        accountType: status.account_type as 'individual' | 'company' | undefined,
        lastPayoutDate: status.last_payout_date 
          ? new Date(status.last_payout_date * 1000).toISOString() 
          : undefined,
        onboardingComplete: status.onboarding_complete,
        payoutDisableReason: status.payout_disable_reason,
        currentlyDueRequirements: status.currently_due_requirements,
      });
    } catch (error) {
      console.error('Failed to fetch Stripe account status:', error);
      errorToast('Failed to load account status');
    } finally {
      setLoadingStripeStatus(false);
    }
  };

  const handleConnectStripeAccount = async () => {
    try {
      setConnectingAccount(true);
      const result = await userService.createStripeConnectAccount();
      
      // Redirect to Stripe onboarding
      if (result.onboarding_url) {
        window.location.href = result.onboarding_url;
      } else {
        errorToast('Failed to get onboarding URL');
      }
    } catch (error: any) {
      console.error('Failed to create Stripe account:', error);
      errorToast(error.response?.data?.detail || 'Failed to connect Stripe account');
    } finally {
      setConnectingAccount(false);
    }
  };

  const handleManageStripeAccount = async () => {
    try {
      setConnectingAccount(true);
      const result: {login_url: string | null; needs_onboarding?: boolean; error?: string} = await userService.createStripeLoginLink();
      
      // Check if onboarding is needed
      if (result.needs_onboarding) {
        // Redirect to onboarding instead
        handleConnectStripeAccount();
        return;
      }
      
      // Redirect to Stripe Express Dashboard
      if (result.login_url) {
        window.open(result.login_url, '_blank');
        successToast('Opening Stripe dashboard...');
      } else {
        errorToast('Failed to get login URL');
      }
    } catch (error: any) {
      console.error('Failed to create login link:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to open Stripe dashboard';
      
      // Check if error indicates onboarding is needed
      if (errorMessage.toLowerCase().includes('onboarding') || errorMessage.toLowerCase().includes('not completed')) {
        // Redirect to onboarding instead
        handleConnectStripeAccount();
      } else {
        errorToast(errorMessage);
      }
    } finally {
      setConnectingAccount(false);
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
    {
      id: 'storage' as SettingsSection,
      label: 'Storage',
      icon: Storage,
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
          errorToast('Failed to upload profile photo', 'Your other settings will still be saved.');
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
      
      // Show success toast
      successToast('Profile Updated!', 'Your creative profile has been updated successfully.');
      
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
      
    } catch (error: any) {
      console.error('Failed to save profile settings:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update profile';
      errorToast('Update Failed', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCreativeRole = async () => {
    try {
      setDeleting(true);
      await userService.deleteCreativeRole();
      
      successToast('Creative role deleted successfully');
      
      // Close dialogs
      setDeleteDialogOpen(false);
      onClose();
      
      // Refresh the page to update the UI (user no longer has creative role)
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('Failed to delete creative role:', error);
      errorToast(error.response?.data?.detail || 'Failed to delete creative role');
    } finally {
      setDeleting(false);
    }
  };

  const fetchDeliverables = async () => {
    try {
      setLoadingDeliverables(true);
      
      // Get all bookings for this creative with service info
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          service_id,
          client_user_id,
          created_at,
          creative_services!inner(title)
        `)
        .eq('creative_user_id', creativeProfile?.user_id || '')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) {
        setDeliverables([]);
        return;
      }

      // Get client names
      const clientUserIds = [...new Set(bookings.map(b => b.client_user_id).filter(Boolean))];
      const { data: users } = await supabase
        .from('users')
        .select('user_id, name')
        .in('user_id', clientUserIds);

      const usersMap = new Map(users?.map(u => [u.user_id, u.name]) || []);

      // Get all deliverables for these bookings
      const bookingIds = bookings.map(b => b.id);
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('booking_deliverables')
        .select('id, booking_id, file_name, file_type, file_size_bytes, file_url')
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });

      if (deliverablesError) throw deliverablesError;

      // Combine deliverables with booking info
      const deliverablesWithBooking = (deliverablesData || []).map(deliverable => {
        const booking = bookings.find(b => b.id === deliverable.booking_id);
        const serviceTitle = (booking as any)?.creative_services?.title || 'Service';
        return {
          ...deliverable,
          booking: booking ? {
            id: booking.id,
            service_name: serviceTitle,
            client_name: usersMap.get(booking.client_user_id) || 'Unknown Client',
            created_at: booking.created_at,
          } : undefined,
        };
      });

      setDeliverables(deliverablesWithBooking);
    } catch (error) {
      console.error('Failed to fetch deliverables:', error);
      errorToast('Failed to load deliverables');
    } finally {
      setLoadingDeliverables(false);
    }
  };

  const handleDeleteDeliverable = async (deliverableId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingDeliverableId(deliverableId);
      
      // Use the backend API endpoint which handles both storage and database deletion
      // This ensures proper permissions and follows the same pattern as profile photo deletion
      await bookingService.deleteDeliverable(deliverableId);

      // Refresh the list
      await fetchDeliverables();
      successToast('File deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete deliverable:', error);
      errorToast(error?.response?.data?.detail || error?.message || 'Failed to delete file');
    } finally {
      setDeletingDeliverableId(null);
    }
  };

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <PictureAsPdf sx={{ color: '#f44336' }} />;
    if (type.includes('video') || type.includes('mp4') || type.includes('mov') || type.includes('avi')) return <VideoFile sx={{ color: '#2196f3' }} />;
    if (type.includes('audio') || type.includes('mp3') || type.includes('wav') || type.includes('flac')) return <AudioFile sx={{ color: '#4caf50' }} />;
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return <Image sx={{ color: '#ff9800' }} />;
    return <InsertDriveFile sx={{ color: theme.palette.text.secondary }} />;
  };


  const renderSectionContent = () => {
    switch (selectedSection) {
      case 'account':
        return (
          <Box sx={{ px: 3, pb: 3 }}>
            {loadingAccountData ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Loading Skeletons */}
                {[1, 2, 3, 4, 5].map((item) => (
                  <Card key={item} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Skeleton variant="circular" width={24} height={24} />
                        <Skeleton variant="text" width={200} height={32} />
                      </Box>
                      <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
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
                    onClick={() => setDeleteDialogOpen(true)}
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
            )}
          </Box>
        );
      case 'billing':
        return (
          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Bank Account Connection */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <AccountBalance color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Bank Account
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {loadingStripeStatus ? (
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: 'grey.400',
                            position: 'relative',
                            animation: 'loading-pulse 1.5s ease-in-out infinite',
                            '@keyframes loading-pulse': {
                              '0%, 100%': {
                                transform: 'scale(1)',
                                opacity: 0.6,
                              },
                              '50%': {
                                transform: 'scale(1.3)',
                                opacity: 1,
                              },
                            },
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: '200%',
                              height: '200%',
                              borderRadius: '50%',
                              border: '2px solid',
                              borderColor: 'grey.400',
                              animation: 'loading-ring 1.5s ease-in-out infinite',
                            },
                            '@keyframes loading-ring': {
                              '0%': {
                                transform: 'translate(-50%, -50%) scale(0.5)',
                                opacity: 1,
                              },
                              '100%': {
                                transform: 'translate(-50%, -50%) scale(1.5)',
                                opacity: 0,
                              },
                            },
                          }}
                        />
                      ) : (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: !bankAccountStatus.connected 
                            ? 'error.main' 
                            : bankAccountStatus.payoutsEnabled 
                              ? 'success.main' 
                              : 'warning.main',
                          ...(!bankAccountStatus.connected && {
                            animation: 'pulse-dot 2s ease-in-out infinite',
                            '@keyframes pulse-dot': {
                              '0%, 100%': {
                                transform: 'translateY(0) scale(1)',
                                opacity: 1,
                              },
                              '50%': {
                                transform: 'translateY(-3px) scale(1.1)',
                                opacity: 0.8,
                              },
                            },
                          }),
                          ...(bankAccountStatus.connected && !bankAccountStatus.payoutsEnabled && {
                            animation: 'pulse-dot 2s ease-in-out infinite',
                            '@keyframes pulse-dot': {
                              '0%, 100%': {
                                transform: 'translateY(0) scale(1)',
                                opacity: 1,
                              },
                              '50%': {
                                transform: 'translateY(-3px) scale(1.1)',
                                opacity: 0.8,
                              },
                            },
                          }),
                        }}
                      />
                      )}
                      <Typography variant="body1" fontWeight={500}>
                        {loadingStripeStatus 
                          ? 'Loading...'
                          : !bankAccountStatus.connected 
                            ? 'Not Connected' 
                            : bankAccountStatus.payoutsEnabled 
                              ? 'Connected' 
                              : 'Connected - Payouts Pending'}
                      </Typography>
                      {!loadingStripeStatus && bankAccountStatus.connected && (
                        <Chip
                          label={bankAccountStatus.payoutsEnabled ? "Active" : "Pending Verification"}
                          size="small"
                          color={bankAccountStatus.payoutsEnabled ? "success" : "warning"}
                          sx={{ ml: 'auto', fontWeight: 600 }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {loadingStripeStatus
                        ? 'Fetching your account status...'
                        : !bankAccountStatus.connected
                          ? 'Connect a bank account to accept paid bookings and receive payments.'
                          : bankAccountStatus.payoutsEnabled
                            ? 'Your bank account is connected and ready to receive payments from clients.'
                            : 'Your account is connected but payouts are not yet enabled. Complete your account verification to enable payouts.'}
                    </Typography>
                  </Box>

                  {!loadingStripeStatus && bankAccountStatus.connected && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Account Type:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {bankAccountStatus.accountType === 'company' ? 'Business' : 'Individual'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Payout Status:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {bankAccountStatus.payoutsEnabled ? 'Enabled' : 'Pending Verification'}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Button
                    variant={loadingStripeStatus ? "outlined" : bankAccountStatus.connected ? "outlined" : "contained"}
                    fullWidth
                    disabled={connectingAccount || loadingStripeStatus}
                    startIcon={loadingStripeStatus ? <CircularProgress size={20} /> : bankAccountStatus.connected ? <Settings /> : <AccountBalance />}
                    onClick={() => {
                      if (bankAccountStatus.connected) {
                        handleManageStripeAccount();
                      } else {
                        handleConnectStripeAccount();
                      }
                    }}
                    sx={{
                      position: 'relative',
                      overflow: 'visible',
                      ...(!bankAccountStatus.connected && {
                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                        animation: 'gentle-breathe 2.5s ease-in-out infinite',
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                        '@keyframes gentle-breathe': {
                          '0%, 100%': {
                            transform: 'scale(1)',
                          },
                          '50%': {
                            transform: 'scale(1.02)',
                          },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: -2,
                          borderRadius: 'inherit',
                          padding: '2px',
                          background: 'linear-gradient(135deg, #60a5fa, #3b82f6, #1d4ed8)',
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                          opacity: 0,
                          animation: 'border-glow 2.5s ease-in-out infinite',
                        },
                        '@keyframes border-glow': {
                          '0%, 100%': {
                            opacity: 0,
                          },
                          '50%': {
                            opacity: 0.6,
                          },
                        },
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(59, 130, 246, 0.35)',
                          animation: 'none',
                          '&::before': {
                            opacity: 0.8,
                            animation: 'none',
                          },
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                        },
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }),
                    }}
                  >
                    {loadingStripeStatus
                      ? 'Loading...'
                      : connectingAccount 
                        ? 'Connecting...' 
                        : bankAccountStatus.connected 
                          ? 'View Stripe Dashboard' 
                          : 'Connect Bank Account'}
                  </Button>
                </CardContent>
              </Card>

              {/* Payout Information */}
              {!loadingStripeStatus && (
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <CreditCard color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Payout Information
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Payouts are processed within 2-5 business days after a client completes payment.
                  </Typography>
                  {bankAccountStatus.connected && bankAccountStatus.lastPayoutDate && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Last Payout:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {new Date(bankAccountStatus.lastPayoutDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  )}
                  {bankAccountStatus.connected && !bankAccountStatus.payoutsEnabled && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mt: 2,
                        border: '1px solid',
                        borderColor: 'error.main',
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                        '& .MuiAlert-icon': {
                          color: 'error.main'
                        },
                        '& .MuiAlert-message': {
                          width: '100%'
                        }
                      }}
                    >
                      <AlertTitle sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Payouts Disabled
                      </AlertTitle>
                      {bankAccountStatus.payoutDisableReason ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          {bankAccountStatus.payoutDisableReason}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          Your payouts are currently disabled. Please complete your account setup to enable payouts.
                        </Typography>
                      )}
                      {bankAccountStatus.currentlyDueRequirements && bankAccountStatus.currentlyDueRequirements.length > 0 && (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                            Required information:
                          </Typography>
                          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                            {bankAccountStatus.currentlyDueRequirements.map((req, index) => (
                              <li key={index}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  {req.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Typography>
                              </li>
                            ))}
                          </Box>
                        </Box>
                      )}
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5, fontWeight: 500 }}>
                        Click "View Stripe Dashboard" to complete the required information.
                      </Typography>
                    </Alert>
                  )}
                  {bankAccountStatus.connected && bankAccountStatus.payoutsEnabled && !bankAccountStatus.onboardingComplete && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <AlertTitle>Onboarding Incomplete</AlertTitle>
                      Please complete your account setup to ensure all features are available. Click "View Stripe Dashboard" to continue.
                    </Alert>
                  )}
                  {!bankAccountStatus.connected && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Connect your bank account to view payout information.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Important Information */}
              {!loadingStripeStatus && !bankAccountStatus.connected && (
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Info color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        Important Information
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                      A bank account is required to accept paid bookings. Your banking information is securely 
                      processed by Stripe and we never store your account details.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
                      You'll need to provide:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                      <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Bank account details
                      </Typography>
                      <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Business information (if applicable)
                      </Typography>
                      <Typography component="li" variant="body2" color="text.secondary">
                        Identity verification documents
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      The setup process takes approximately 5-10 minutes.
                    </Typography>
                </CardContent>
              </Card>
              )}
            </Box>
          </Box>
        );
      case 'storage':
        // Calculate actual storage used from deliverables
        const actualStorageUsed = deliverables.reduce((sum, deliverable) => {
          const size = deliverable.file_size_bytes;
          return sum + (typeof size === 'number' && !isNaN(size) ? size : 0);
        }, 0);
        
        // Use actual storage if available, otherwise fall back to profile value
        const storageUsedBytes = actualStorageUsed > 0 ? actualStorageUsed : (creativeProfile?.storage_used_bytes || 0);
        const storageLimitBytes = creativeProfile?.storage_limit_bytes || 0;
        
        const storagePercentage = storageLimitBytes > 0
          ? (storageUsedBytes / storageLimitBytes) * 100
          : 0;
        const storageUsed = formatStorage(storageUsedBytes);
        const storageLimit = formatStorage(storageLimitBytes);
        const storageRemaining = formatStorage(Math.max(0, storageLimitBytes - storageUsedBytes));

        // Group deliverables by booking
        const deliverablesByBooking = deliverables.reduce((acc, deliverable) => {
          const bookingId = deliverable.booking_id;
          if (!acc[bookingId]) {
            acc[bookingId] = {
              booking: deliverable.booking,
              deliverables: [],
            };
          }
          acc[bookingId].deliverables.push(deliverable);
          return acc;
        }, {} as Record<string, { booking?: any; deliverables: typeof deliverables }>);

        return (
          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Storage Overview */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Storage color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Storage Overview
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Plan: {creativeProfile?.subscription_tier_name || 'Basic'}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {storageUsed} / {storageLimit}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(storagePercentage, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: storagePercentage > 80 
                            ? theme.palette.error.main 
                            : storagePercentage > 60 
                            ? theme.palette.warning.main 
                            : theme.palette.success.main,
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {storageRemaining} remaining
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {storagePercentage.toFixed(1)}% used
                      </Typography>
                    </Box>
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Storage is used for deliverable files you send to clients. Files are stored securely and can be managed below.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>

              {/* Deliverables List */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Folder color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Deliverables
                    </Typography>
                    {!loadingDeliverables && (
                      <Chip 
                        label={`${deliverables.length} file${deliverables.length !== 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {loadingDeliverables ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
                      ))}
                    </Box>
                  ) : deliverables.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Folder sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No deliverables yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Files you upload for completed bookings will appear here.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {Object.entries(deliverablesByBooking).map(([bookingId, { booking, deliverables: bookingDeliverables }]) => (
                        <Box key={bookingId}>
                          <Box sx={{ mb: 1.5, pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="subtitle2" fontWeight={600} color="primary">
                              {booking?.service_name || 'Service'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Client: {booking?.client_name || 'Unknown'} • {booking?.created_at ? new Date(booking.created_at).toLocaleDateString() : ''}
                            </Typography>
                          </Box>
                          <List sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', borderRadius: 1, p: 0 }}>
                            {bookingDeliverables.map((deliverable, index) => (
                              <ListItem
                                key={deliverable.id}
                                sx={{
                                  borderBottom: index < bookingDeliverables.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                  '&:hover': {
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                  },
                                }}
                                secondaryAction={
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => handleDeleteDeliverable(deliverable.id, deliverable.file_url)}
                                    disabled={deletingDeliverableId === deliverable.id}
                                    sx={{
                                      color: 'error.main',
                                      '&:hover': {
                                        bgcolor: 'error.main',
                                        color: 'white',
                                      },
                                    }}
                                  >
                                    {deletingDeliverableId === deliverable.id ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <Delete />
                                    )}
                                  </IconButton>
                                }
                              >
                                <ListItemIcon>
                                  {getFileIcon(deliverable.file_type)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {deliverable.file_name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography variant="caption" color="text.secondary">
                                      {deliverable.file_type} • {formatStorage(deliverable.file_size_bytes)}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
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
    <>
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
                {selectedSection === 'storage' && 'Manage your storage and file management settings.'}
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
    
    {/* Delete Confirmation Dialog */}
    <Dialog
      open={deleteDialogOpen}
      onClose={() => !deleting && setDeleteDialogOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={600} color="error">
          Delete Creative Role
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle sx={{ fontWeight: 600 }}>Warning: This action is permanent and cannot be undone</AlertTitle>
          This will permanently delete:
        </Alert>
        
        <Box component="ul" sx={{ pl: 2, mb: 3 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Your creative profile
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            All services and bundles
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            All service photos and profile photos
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            All calendar settings and schedules
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            All client relationships
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            All bookings and notifications
          </Typography>
        </Box>
        
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          To confirm, type <Box component="span" sx={{ color: 'error.main', fontFamily: 'monospace' }}>DELETE</Box> below:
        </Typography>
        
        <TextField
          fullWidth
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder="Type DELETE to confirm"
          disabled={deleting}
          sx={{ mb: 2 }}
          autoFocus
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={() => {
            setDeleteDialogOpen(false);
            setDeleteConfirmText('');
          }}
          disabled={deleting}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteCreativeRole}
          disabled={deleteConfirmText !== 'DELETE' || deleting}
          startIcon={deleting ? <CircularProgress size={20} /> : null}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {deleting ? 'Deleting...' : 'Delete Creative Role Permanently'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
