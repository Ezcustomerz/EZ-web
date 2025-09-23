import { apiClient } from './apiClient';

export interface InviteResponse {
  success: boolean;
  invite_link?: string;
  expires_at?: string;
  message: string;
}

export interface ValidateInviteResponse {
  success: boolean;
  valid: boolean;
  creative?: {
    user_id: string;
    display_name: string;
    title: string;
  };
  expires_at?: string;
  message?: string;
  user?: {
    user_id: string;
    roles: string[];
    has_client_role: boolean;
  };
}

export interface AcceptInviteResponse {
  success: boolean;
  needs_client_role?: boolean;
  message: string;
  creative_user_id?: string;
  relationship_exists?: boolean;
  relationship_id?: string;
}

export const inviteService = {
  /**
   * Generate an invite link for a creative
   */
  async generateInviteLink(): Promise<InviteResponse> {
    try {
      const response = await apiClient.post('/invite/generate');
      return response.data;
    } catch (error: any) {
      console.error('Error generating invite link:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to generate invite link'
      };
    }
  },

  /**
   * Validate an invite token
   */
  async validateInviteToken(inviteToken: string): Promise<ValidateInviteResponse> {
    try {
      const response = await apiClient.get(`/invite/validate/${inviteToken}`);
      return response.data;
    } catch (error: any) {
      console.error('Error validating invite token:', error);
      return {
        success: false,
        valid: false,
        message: error.response?.data?.detail || 'Failed to validate invite token'
      };
    }
  },

  /**
   * Accept an invite
   */
  async acceptInvite(inviteToken: string): Promise<AcceptInviteResponse> {
    try {
      const response = await apiClient.post(`/invite/accept/${inviteToken}`);
      return response.data;
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to accept invite'
      };
    }
  },

  /**
   * Accept an invite after completing client role setup
   */
  async acceptInviteAfterRoleSetup(inviteToken: string): Promise<AcceptInviteResponse> {
    try {
      const response = await apiClient.post(`/invite/accept-after-role-setup/${inviteToken}`);
      return response.data;
    } catch (error: any) {
      console.error('Error accepting invite after role setup:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to accept invite after role setup'
      };
    }
  }
};
