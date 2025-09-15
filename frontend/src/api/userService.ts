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

export interface CreativeSetupRequest {
  display_name: string;
  title: string;
  custom_title?: string;
  primary_contact?: string;
  secondary_contact?: string;
  bio?: string;
  subscription_tier: string;
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
  subscription_tier: string;
  primary_contact?: string;
  secondary_contact?: string;
  profile_banner_url?: string;
  profile_source: string;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  created_at: string;
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
}

export interface CreativeClientsListResponse {
  clients: CreativeClient[];
  total_count: number;
}

export interface CreativeService {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_time: string;
  status: 'Public' | 'Private';
  color: string;
  is_active: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
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
  use_time_slots: boolean;
  session_durations: number[]; // Duration in minutes
  default_session_length: number;
  min_notice_amount: number;
  min_notice_unit: 'hours' | 'days';
  max_advance_amount: number;
  max_advance_unit: 'days' | 'weeks' | 'months';
  buffer_time_amount: number;
  buffer_time_unit: 'minutes' | 'hours';
  weekly_schedule: WeeklySchedule[];
}

export interface CreateServiceRequest {
  title: string;
  description: string;
  price: number;
  delivery_time: string;
  status: 'Public' | 'Private';
  color: string;
  calendar_settings?: CalendarSettings;
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

export interface ToggleServiceStatusRequest {
  enabled: boolean;
}

export interface ToggleServiceStatusResponse {
  success: boolean;
  message: string;
  enabled: boolean;
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
  async getCreativeServices(): Promise<CreativeServicesListResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.get<CreativeServicesListResponse>(
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

  async updateService(serviceId: string, serviceData: CreateServiceRequest): Promise<UpdateServiceResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.put<UpdateServiceResponse>(
      `${API_BASE_URL}/creative/services/${serviceId}`,
      serviceData,
      { headers }
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

  async toggleServiceStatus(serviceId: string, enabled: boolean): Promise<ToggleServiceStatusResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.patch<ToggleServiceStatusResponse>(
      `${API_BASE_URL}/creative/services/${serviceId}/status`,
      { enabled },
      { headers }
    );
    return response.data;
  },
};
