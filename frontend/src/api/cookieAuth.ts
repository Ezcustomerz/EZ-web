import { apiClient } from './apiClient';

/**
 * Utility functions for syncing authentication tokens to HttpOnly cookies
 * for enhanced security (XSS protection).
 * 
 * This module ensures that when tokens are stored in localStorage (for Supabase client),
 * they are also sent to the backend to be stored in HttpOnly cookies.
 */

/**
 * Sync authentication tokens to HttpOnly cookies via backend
 * This provides XSS protection by storing tokens in HttpOnly cookies
 * that JavaScript cannot access.
 */
export async function syncTokensToCookies(accessToken: string, refreshToken: string): Promise<void> {
  try {
    await apiClient.post('/auth/set-cookies', {
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    console.log('[CookieAuth] Successfully synced tokens to HttpOnly cookies');
  } catch (error: any) {
    console.warn('[CookieAuth] Failed to sync tokens to cookies:', error);
    // Don't throw - this is a security enhancement, not critical for functionality
    // The apiClient interceptor will handle toast notifications, but we swallow the error
    // to prevent breaking the auth flow
  }
}

/**
 * Clear authentication cookies via backend logout endpoint
 */
export async function clearAuthCookies(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
    console.log('[CookieAuth] Cleared authentication cookies');
  } catch (error: any) {
    console.warn('[CookieAuth] Error clearing cookies:', error);
    // Don't throw - not critical if cookie clearing fails
    // The apiClient interceptor will handle toast notifications, but we swallow the error
  }
}


