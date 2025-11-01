/**
 * Utility functions for syncing authentication tokens to HttpOnly cookies
 * for enhanced security (XSS protection).
 * 
 * This module ensures that when tokens are stored in localStorage (for Supabase client),
 * they are also sent to the backend to be stored in HttpOnly cookies.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Sync authentication tokens to HttpOnly cookies via backend
 * This provides XSS protection by storing tokens in HttpOnly cookies
 * that JavaScript cannot access.
 */
export async function syncTokensToCookies(accessToken: string, refreshToken: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/set-cookies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: Include cookies in request
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.warn('[CookieAuth] Failed to sync tokens to cookies:', error);
      // Don't throw - this is a security enhancement, not critical for functionality
    } else {
      console.log('[CookieAuth] Successfully synced tokens to HttpOnly cookies');
    }
  } catch (error) {
    console.warn('[CookieAuth] Error syncing tokens to cookies:', error);
    // Don't throw - localStorage still works, cookies are just an enhancement
  }
}

/**
 * Clear authentication cookies via backend logout endpoint
 */
export async function clearAuthCookies(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies in request
    });
    console.log('[CookieAuth] Cleared authentication cookies');
  } catch (error) {
    console.warn('[CookieAuth] Error clearing cookies:', error);
    // Don't throw - not critical if cookie clearing fails
  }
}

