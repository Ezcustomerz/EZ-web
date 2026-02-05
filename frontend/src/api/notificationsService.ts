import axios from 'axios';
import { supabase } from '../config/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to check if user is authenticated
const checkAuth = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getSession();
  return !!data.session?.access_token;
};

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

export interface Notification {
  id: string;
  recipient_user_id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_user_id?: string;
  related_entity_id?: string;
  related_entity_type?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

/**
 * Get notifications for the current user
 * @param limit - Maximum number of notifications to return
 * @param offset - Number of notifications to skip
 * @param unreadOnly - If true, only return unread notifications
 * @param roleContext - Optional role context ('client', 'creative', 'advocate'). 
 *                      If provided, only returns notifications for this role context.
 */
export async function getNotifications(
  limit: number = 25,
  offset: number = 0,
  unreadOnly: boolean = false,
  roleContext?: 'client' | 'creative' | 'advocate'
): Promise<Notification[]> {
  // Check authentication before making API call
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    return [];
  }

  try {
    const headers = await getAuthHeaders();
    const params: Record<string, any> = {
      limit,
      offset,
      unread_only: unreadOnly
    };
    
    if (roleContext) {
      params.role_context = roleContext;
    }
    
    const response = await axios.get<Notification[]>(
      `${API_BASE_URL}/notifications`,
      {
        headers,
        params
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      return [];
    }
    const msg = typeof error.response?.data?.detail === 'string' ? error.response.data.detail : undefined;
    throw new Error(msg || 'Failed to fetch notifications');
  }
}

/**
 * Get count of unread notifications
 * @param roleContext - Optional role context ('client', 'creative', 'advocate'). 
 *                      If provided, only counts notifications for this role context.
 */
export async function getUnreadCount(roleContext?: 'client' | 'creative' | 'advocate'): Promise<number> {
  // Check authentication before making API call
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    return 0;
  }

  try {
    const headers = await getAuthHeaders();
    const params: Record<string, any> = {};
    
    if (roleContext) {
      params.role_context = roleContext;
    }
    
    const response = await axios.get<UnreadCountResponse>(
      `${API_BASE_URL}/notifications/unread-count`,
      { 
        headers,
        params
      }
    );
    return response.data.count;
  } catch (error: any) {
    if (error.response?.status === 401) {
      return 0;
    }
    const msg = typeof error.response?.data?.detail === 'string' ? error.response.data.detail : undefined;
    throw new Error(msg || 'Failed to fetch unread count');
  }
}

/**
 * Mark a notification as read
 * @param notificationId - The ID of the notification to mark as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  // Check authentication before making API call
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    throw new Error('User not authenticated');
  }

  try {
    const headers = await getAuthHeaders();
    const response = await axios.put<Notification>(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {},
      { headers }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    }
    const msg = typeof error.response?.data?.detail === 'string' ? error.response.data.detail : undefined;
    throw new Error(msg || 'Failed to mark notification as read');
  }
}

