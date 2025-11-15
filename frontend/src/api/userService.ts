import axios from 'axios';
import { supabase } from '../config/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const jwtToken = data.session?.access_token;
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
  };
};

export interface UserProfile {
  user_id: string;
  name: string;
  email?: string;
  profile_picture_url?: string;
  avatar_source: string;
  roles: string[];
  first_login: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface UpdateRolesRequest {
  selected_roles: string[];
}

export interface UpdateRolesResponse {
  success: boolean;
  message: string;
  user_profile?: UserProfile;
}

export interface RoleOption {
  value: string;
  label: string;
  description: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  storage_amount_bytes: number;
  storage_display: string;
  description?: string;
  fee_percentage: number;
}

export interface CreativeSetupRequest {
  display_name: string;
  title: string;
  custom_title?: string;
  primary_contact?: string;
  secondary_contact?: string;
  bio?: string;
  subscription_tier_id: string;
}

export interface CreativeSetupResponse {
  success: boolean;
  message: string;
}

export interface ClientSetupRequest {
  display_name: string;
  title: string;
  custom_title?: string;
  email: string;
}

export interface ClientSetupResponse {
  success: boolean;
  message: string;
}

export interface AdvocateSetupResponse {
  success: boolean;
  message: string;
}

export interface SetupStatusResponse {
  incomplete_setups: string[];
}

export interface BatchSetupRequest {
  creative_data?: any;
  client_data?: any;
  advocate_data?: any;
}

export interface BatchSetupResponse {
  success: boolean;
  message: string;
}

export interface CreativeProfile {
  user_id: string;
  display_name: string;
  title: string;
  bio?: string;
  description?: string;
  subscription_tier_id: string;
  subscription_tier?: string; // Subscription tier name (e.g., 'basic', 'growth', 'pro') - for backward compatibility
  subscription_tier_name?: string; // Explicit subscription tier name
  primary_contact?: string;
  secondary_contact?: string;
  profile_banner_url?: string;
  profile_source: string;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  availability_location?: string;
  created_at: string;
  profile_highlights?: string[];
  profile_highlight_values?: Record<string, string>;
  primary_service_id?: string;
  secondary_service_id?: string;
  avatar_background_color?: string;
}

export interface ClientProfile {
  user_id: string;
  display_name: string;
  title: string;
  email: string;
  profile_banner_url?: string;
  profile_source: string;
  created_at: string;
}

export interface AdvocateProfile {
  user_id: string;
  display_name?: string;
  profile_banner_url?: string;
  profile_source: string;
  tier: string;
  fp_affiliate_id?: string;
  fp_referral_code?: string;
  fp_referral_link?: string;
  active_referrals: number;
  currency: string;
  total_earned: number;
  earned_this_month: number;
  total_paid_out: number;
  pending_payout: number;
  last_payout_at?: string;
  last_synced_at?: string;
  sync_source: string;
  created_at: string;
}

export interface CreativeClient {
  id: string;
  name: string;
  contact: string;
  contactType: 'email' | 'phone';
  status: 'active' | 'inactive';
  totalSpent: number;
  projects: number;
  profile_picture_url?: string;
  title?: string;
}

export interface CreativeClientsListResponse {
  clients: CreativeClient[];
  total_count: number;
}

export interface ClientCreative {
  id: string;
  name: string;
  avatar: string | null;
  specialty: string;
  email: string;
  rating: number;
  reviewCount: number;
  servicesCount: number;
  isOnline: boolean;
  color: string;
  status: string;
  description?: string;
  primary_contact?: string;
  secondary_contact?: string;
  availability_location?: string;
  profile_highlights?: string[];
  profile_highlight_values?: Record<string, string>;
}

export interface ClientCreativesListResponse {
  creatives: ClientCreative[];
  total_count: number;
}

export interface CreativeService {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_time: string;
  status: 'Public' | 'Private' | 'Bundle-Only';
  color: string;
  payment_option: 'upfront' | 'split' | 'later';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  requires_booking: boolean;
  photos?: ServicePhoto[];
}

export interface CreativeServicesListResponse {
  services: CreativeService[];
  total_count: number;
}

// Calendar scheduling types
export interface TimeBlock {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface TimeSlot {
  time: string;    // HH:MM format
  enabled: boolean;
}

export interface WeeklySchedule {
  day: string;     // Day of week
  enabled: boolean;
  time_blocks: TimeBlock[];
  time_slots: TimeSlot[];
}

export interface CalendarSettings {
  is_scheduling_enabled: boolean;
  session_duration: number; // Duration in minutes
  default_session_length: number;
  min_notice_amount: number;
  min_notice_unit: 'minutes' | 'hours' | 'days';
  max_advance_amount: number;
  max_advance_unit: 'hours' | 'days' | 'weeks' | 'months';
  buffer_time_amount: number;
  buffer_time_unit: 'minutes' | 'hours';
  weekly_schedule: WeeklySchedule[];
}

export interface ServicePhoto {
  photo_url: string;
  photo_filename?: string;
  photo_size_bytes?: number;
  is_primary: boolean;
  display_order: number;
}

export interface CreateServiceRequest {
  title: string;
  description: string;
  price: number;
  delivery_time?: string;
  status: 'Public' | 'Private' | 'Bundle-Only';
  color: string;
  payment_option: 'upfront' | 'split' | 'later';
  calendar_settings?: CalendarSettings;
  photos?: ServicePhoto[];
}

export interface CreateServiceResponse {
  success: boolean;
  message: string;
  service_id?: string;
}

export interface UpdateServiceResponse {
  success: boolean;
  message: string;
}

export interface DeleteServiceResponse {
  success: boolean;
  message: string;
}


export interface CreativeProfileSettingsRequest {
  display_name?: string;
  title?: string;
  custom_title?: string;
  availability_location?: string;
  primary_contact?: string;
  secondary_contact?: string;
  description?: string;
  selected_profile_highlights?: string[];
  profile_highlight_values?: Record<string, string>;
  primary_service_id?: string;
  secondary_service_id?: string;
  avatar_background_color?: string;
}

export interface CreativeProfileSettingsResponse {
  success: boolean;
  message: string;
}

export interface ProfilePhotoUploadResponse {
  success: boolean;
  message: string;
  profile_banner_url: string;
}

// Bundle interfaces
export interface CreateBundleRequest {
  title: string;
  description: string;
  color: string;
  status: 'Public' | 'Private';
  pricing_option: 'fixed' | 'discount';
  fixed_price?: number;
  discount_percentage?: number;
  service_ids: string[];
}

export interface CreateBundleResponse {
  success: boolean;
  message: string;
  bundle_id?: string;
}

export interface UpdateBundleRequest {
  title?: string;
  description?: string;
  color?: string;
  status?: 'Public' | 'Private';
  pricing_option?: 'fixed' | 'discount';
  fixed_price?: number;
  discount_percentage?: number;
  service_ids?: string[];
}

export interface UpdateBundleResponse {
  success: boolean;
  message: string;
}

export interface BundleService {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_time: string;
  status: string;
  color: string;
}

export interface CreativeBundle {
  id: string;
  title: string;
  description: string;
  color: string;
  status: string;
  pricing_option: string;
  fixed_price?: number;
  discount_percentage?: number;
  total_services_price: number;
  final_price: number;
  services: BundleService[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreativeBundlesListResponse {
  bundles: CreativeBundle[];
  total_count: number;
}

export interface DeleteBundleResponse {
  success: boolean;
  message: string;
}

export interface PublicServicesAndBundlesResponse {
  services: CreativeService[];
  bundles: CreativeBundle[];
  services_count: number;
  bundles_count: number;
}

export interface UserRoleProfiles {
  creative?: CreativeProfile;
  client?: ClientProfile;
  advocate?: AdvocateProfile;
}
export const userService = {
  /**
   * Get the current user's profile
   */
  async getUserProfile(): Promise<UserProfile> {
    const headers = await getAuthHeaders();
    const response = await axios.get<UserProfile>(`${API_BASE_URL}/users/profile`, {
      headers
    });
    return response.data;
  },

  /**
   * Update user roles and set first_login to false
   */
  async updateUserRoles(roles: string[]): Promise<UpdateRolesResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<UpdateRolesResponse>(
      `${API_BASE_URL}/users/update-roles`,
      { selected_roles: roles },
      { headers }
    );
    return response.data;
  },

  /**
   * Get all available subscription tiers
   */
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    const headers = await getAuthHeaders();
    const response = await axios.get<SubscriptionTier[]>(
      `${API_BASE_URL}/users/subscription-tiers`,
      { headers }
    );
    return response.data;
  },

  /**
   * Set up creative profile
   */
  async setupCreativeProfile(setupData: CreativeSetupRequest): Promise<CreativeSetupResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<CreativeSetupResponse>(
      `${API_BASE_URL}/creative/setup`,
      setupData,
      { headers }
    );
    return response.data;
  },

  /**
   * Set up client profile
   */
  async setupClientProfile(setupData: ClientSetupRequest): Promise<ClientSetupResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<ClientSetupResponse>(
      `${API_BASE_URL}/client/setup`,
      setupData,
      { headers }
    );
    return response.data;
  },

  /**
   * Set up advocate profile (demo mode with hardcoded values)
   */
  async setupAdvocateProfile(): Promise<AdvocateSetupResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<AdvocateSetupResponse>(
      `${API_BASE_URL}/advocate/setup`,
      {}, // No body needed, backend uses hardcoded values
      { headers }
    );
    return response.data;
  },

  /**
   * Check which role setups are incomplete
   */
  async getIncompleteSetups(): Promise<SetupStatusResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.get<SetupStatusResponse>(
      `${API_BASE_URL}/users/setup-status`,
      { headers }
    );
    return response.data;
  },

  /**
   * Create all profiles at once after all setups are completed
   */
  async batchSetupProfiles(setupData: BatchSetupRequest): Promise<BatchSetupResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<BatchSetupResponse>(
      `${API_BASE_URL}/users/batch-setup`,
      setupData,
      { headers }
    );
    return response.data;
  },
  /**
   * Get all role profiles for the current user
   */
  async getUserRoleProfiles(): Promise<UserRoleProfiles> {
    const headers = await getAuthHeaders();
    const response = await axios.get<UserRoleProfiles>(
      `${API_BASE_URL}/users/role-profiles`,
      { headers }
    );
    return response.data;
  },

  /**
   * Get the current user's creative profile
   */
  async getCreativeProfile(): Promise<CreativeProfile> {
    const headers = await getAuthHeaders();
    const response = await axios.get<CreativeProfile>(
      `${API_BASE_URL}/creative/profile`,
      { headers }
    );
    return response.data;
  },

  /**
   * Get a creative profile by user ID (for public viewing)
   */
  async getCreativeProfileById(userId: string): Promise<CreativeProfile> {
    const response = await axios.get<CreativeProfile>(
      `${API_BASE_URL}/creative/profile/${userId}`
    );
    return response.data;
  },

  /**
   * Get creative services and bundles by user ID (for public viewing)
   */
  async getCreativeServicesById(userId: string): Promise<PublicServicesAndBundlesResponse> {
    const response = await axios.get<PublicServicesAndBundlesResponse>(
      `${API_BASE_URL}/creative/services/${userId}`
    );
    return response.data;
  },

  /**
   * Update creative profile settings
   */
  async updateCreativeProfileSettings(settingsData: CreativeProfileSettingsRequest): Promise<CreativeProfileSettingsResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.put<CreativeProfileSettingsResponse>(
      `${API_BASE_URL}/creative/profile/settings`,
      settingsData,
      { headers }
    );
    return response.data;
  },

  /**
   * Get the current user's client profile
   */
  async getClientProfile(): Promise<ClientProfile> {
    const headers = await getAuthHeaders();
    const response = await axios.get<ClientProfile>(
      `${API_BASE_URL}/client/profile`,
      { headers }
    );
    return response.data;
  },

  /**
   * Get the current user's advocate profile
   */
  async getAdvocateProfile(): Promise<AdvocateProfile> {
    const headers = await getAuthHeaders();
    const response = await axios.get<AdvocateProfile>(
      `${API_BASE_URL}/advocate/profile`,
      { headers }
    );
    return response.data;
  },

  /**
   * Get all clients associated with the current creative
   */
  async getCreativeClients(): Promise<CreativeClientsListResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.get<CreativeClientsListResponse>(
      `${API_BASE_URL}/creative/clients`,
      { headers }
    );
    return response.data;
  },

  /**
   * Get all services associated with the current creative
   */
  async getCreativeServices(): Promise<PublicServicesAndBundlesResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.get<PublicServicesAndBundlesResponse>(
      `${API_BASE_URL}/creative/services`,
      { headers }
    );
    return response.data;
  },

  async createService(serviceData: CreateServiceRequest): Promise<CreateServiceResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<CreateServiceResponse>(
      `${API_BASE_URL}/creative/services`,
      serviceData,
      { headers }
    );
    return response.data;
  },

  async createServiceWithPhotos(serviceData: CreateServiceRequest, photos: File[], onProgress?: (progress: number) => void): Promise<CreateServiceResponse> {
    const { data } = await supabase.auth.getSession();
    const jwtToken = data.session?.access_token;
    
    const formData = new FormData();
    
    // Add service data
    formData.append('title', serviceData.title);
    formData.append('description', serviceData.description);
    formData.append('price', serviceData.price.toString());
    formData.append('delivery_time', serviceData.delivery_time || '');
    formData.append('status', serviceData.status);
    formData.append('color', serviceData.color);
    formData.append('payment_option', serviceData.payment_option);
    
    // Add calendar settings if provided
    if (serviceData.calendar_settings) {
      formData.append('calendar_settings', JSON.stringify(serviceData.calendar_settings));
    }
    
    // Add photos
    photos.forEach((photo) => {
      formData.append('photos', photo);
    });
    
    const response = await axios.post<CreateServiceResponse>(
      `${API_BASE_URL}/creative/services/with-photos`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for photo uploads
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      }
    );
    return response.data;
  },

  async updateService(serviceId: string, serviceData: CreateServiceRequest): Promise<UpdateServiceResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.put<UpdateServiceResponse>(
      `${API_BASE_URL}/creative/services/${serviceId}`,
      serviceData,
      { headers }
    );
    return response.data;
  },

  async updateServiceWithPhotos(serviceId: string, serviceData: CreateServiceRequest, photos: File[], existingPhotos: ServicePhoto[] = [], onProgress?: (progress: number) => void): Promise<UpdateServiceResponse> {
    const headers = await getAuthHeaders();
    
    // Create FormData for multipart upload
    const formData = new FormData();
    
    formData.append('title', serviceData.title);
    formData.append('description', serviceData.description);
    formData.append('price', serviceData.price.toString());
    formData.append('delivery_time', serviceData.delivery_time || '');
    formData.append('status', serviceData.status);
    formData.append('color', serviceData.color);
    formData.append('payment_option', serviceData.payment_option);
    
    if (serviceData.calendar_settings) {
      formData.append('calendar_settings', JSON.stringify(serviceData.calendar_settings));
    }
    
    // Add existing photos to keep (URLs)
    const existingPhotoUrls = existingPhotos.map(photo => photo.photo_url);
    formData.append('existing_photos', JSON.stringify(existingPhotoUrls));
    
    // Add photo files
    photos.forEach((photo, index) => {
      formData.append(`photo_${index}`, photo);
    });
    
    const response = await axios.put<UpdateServiceResponse>(
      `${API_BASE_URL}/creative/services/${serviceId}/photos`,
      formData,
      { 
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: onProgress ? (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          onProgress(progress);
        } : undefined
      }
    );
    return response.data;
  },

  async deleteService(serviceId: string): Promise<DeleteServiceResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.delete<DeleteServiceResponse>(
      `${API_BASE_URL}/creative/services/${serviceId}`,
      { headers }
    );
    return response.data;
  },


  /**
   * Upload profile photo for creative
   */
  async uploadCreativeProfilePhoto(file: File): Promise<ProfilePhotoUploadResponse> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post<ProfilePhotoUploadResponse>(
      `${API_BASE_URL}/creative/profile/upload-photo`,
      formData,
      { 
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        }
      }
    );
    return response.data;
  },

  /**
   * Delete creative role and all associated data
   */
  async deleteCreativeRole(): Promise<{ success: boolean; message: string; deleted_items: any }> {
    const headers = await getAuthHeaders();
    
    const response = await axios.delete(
      `${API_BASE_URL}/creative/role`,
      { headers }
    );
    return response.data;
  },

  /**
   * Upload service photo to Supabase Storage
   */
  async uploadServicePhoto(file: File, serviceId?: string): Promise<{ url: string; filename: string; size: number }> {
    const { supabase } = await import('../config/supabase');
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `service-photos/${serviceId || 'temp'}/${timestamp}-${randomString}.${fileExtension}`;
    
    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('creative-assets')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('creative-assets')
      .getPublicUrl(filename);
    
    return {
      url: urlData.publicUrl,
      filename: file.name,
      size: file.size
    };
  },

  /**
   * Create a new bundle
   */
  async createBundle(bundleData: CreateBundleRequest): Promise<CreateBundleResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<CreateBundleResponse>(
      `${API_BASE_URL}/creative/bundles`,
      bundleData,
      { headers }
    );
    return response.data;
  },

  /**
   * Update a bundle
   */
  async updateBundle(bundleId: string, bundleData: UpdateBundleRequest): Promise<UpdateBundleResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.put<UpdateBundleResponse>(
      `${API_BASE_URL}/creative/bundles/${bundleId}`,
      bundleData,
      { headers }
    );
    return response.data;
  },

  /**
   * Delete a bundle
   */
  async deleteBundle(bundleId: string): Promise<DeleteBundleResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.delete<DeleteBundleResponse>(
      `${API_BASE_URL}/creative/bundles/${bundleId}`,
      { headers }
    );
    return response.data;
  },

  /**
   * Get all creatives connected to the current client
   */
  async getClientCreatives(): Promise<ClientCreativesListResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.get<ClientCreativesListResponse>(
      `${API_BASE_URL}/client/creatives`,
      { headers }
    );
    return response.data;
  },

  /**
   * Get all services and bundles from creatives connected to the current client
   */
  async getClientConnectedServicesAndBundles(): Promise<{services: any[], bundles: any[], total_count: number}> {
    const headers = await getAuthHeaders();
    const response = await axios.get<{services: any[], bundles: any[], total_count: number}>(
      `${API_BASE_URL}/client/services`,
      { headers }
    );
    return response.data;
  },

  /**
   * Get calendar settings for a specific service
   */
  async getServiceCalendarSettings(serviceId: string): Promise<{success: boolean, calendar_settings: CalendarSettings | null}> {
    const headers = await getAuthHeaders();
    const response = await axios.get<{success: boolean, calendar_settings: CalendarSettings | null}>(
      `${API_BASE_URL}/creative/services/${serviceId}/calendar`,
      { headers }
    );
    return response.data;
  },

  /**
   * Create a Stripe Connect account for the creative
   */
  async createStripeConnectAccount(): Promise<{account_id: string; onboarding_url: string}> {
    const headers = await getAuthHeaders();
    const response = await axios.post<{account_id: string; onboarding_url: string}>(
      `${API_BASE_URL}/stripe/connect/create-account`,
      {},
      { headers }
    );
    return response.data;
  },

  /**
   * Get Stripe account status for the creative
   */
  async getStripeAccountStatus(): Promise<{
    connected: boolean;
    account_id?: string;
    payouts_enabled: boolean;
    onboarding_complete: boolean;
    account_type?: string;
    last_payout_date?: number;
    payout_disable_reason?: string;
    currently_due_requirements?: string[];
    error?: string;
  }> {
    const headers = await getAuthHeaders();
    const response = await axios.get<{
      connected: boolean;
      account_id?: string;
      payouts_enabled: boolean;
      onboarding_complete: boolean;
      account_type?: string;
      last_payout_date?: number;
      payout_disable_reason?: string;
      currently_due_requirements?: string[];
      error?: string;
    }>(
      `${API_BASE_URL}/stripe/connect/account-status`,
      { headers }
    );
    return response.data;
  },

  /**
   * Create a login link for the Stripe Express account dashboard
   */
  async createStripeLoginLink(): Promise<{login_url: string | null; needs_onboarding?: boolean; error?: string}> {
    const headers = await getAuthHeaders();
    const response = await axios.post<{login_url: string | null; needs_onboarding?: boolean; error?: string}>(
      `${API_BASE_URL}/stripe/connect/create-login-link`,
      {},
      { headers }
    );
    return response.data;
  },

  /**
   * Process a payment for a booking - creates a Stripe Checkout Session
   */
  async processPayment(bookingId: string, amount: number): Promise<{
    checkout_url: string;
    session_id: string;
    amount: number;
    platform_fee: number;
    creative_amount: number;
  }> {
    const headers = await getAuthHeaders();
    const response = await axios.post<{
      checkout_url: string;
      session_id: string;
      amount: number;
      platform_fee: number;
      creative_amount: number;
    }>(
      `${API_BASE_URL}/stripe/payment/process`,
      {
        booking_id: bookingId,
        amount: amount
      },
      { headers }
    );
    return response.data;
  },

  /**
   * Verify a payment session and update booking status
   */
  async verifyPayment(sessionId: string, bookingId: string): Promise<{
    success: boolean;
    message: string;
    booking_id: string;
    amount_paid: number;
    payment_status: string;
    client_status: string;
    creative_status: string;
  }> {
    const headers = await getAuthHeaders();
    const response = await axios.post<{
      success: boolean;
      message: string;
      booking_id: string;
      amount_paid: number;
      payment_status: string;
      client_status: string;
      creative_status: string;
    }>(
      `${API_BASE_URL}/stripe/payment/verify`,
      {
        session_id: sessionId,
        booking_id: bookingId
      },
      { headers }
    );
    return response.data;
  },

};
