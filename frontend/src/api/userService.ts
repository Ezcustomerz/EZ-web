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
      `${API_BASE_URL}/users/creative-setup`,
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
      `${API_BASE_URL}/users/client-setup`,
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
      `${API_BASE_URL}/users/advocate-setup`,
      {}, // No body needed, backend uses hardcoded values
      { headers }
    );
    return response.data;
  },
};
