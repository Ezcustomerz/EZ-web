import axios from 'axios';
import { supabase } from '../config/supabase';
import type { 
  OnboardingStatus, 
  UpdateProgressRequest, 
  SkipSectionRequest,
  CompleteMiniTourRequest,
  RestartMiniTourRequest
} from '../types/onboarding';

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

/**
 * Get the current onboarding status for the user
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    console.log('User not authenticated, skipping onboarding status fetch');
    return null;
  }

  try {
    const headers = await getAuthHeaders();
    const response = await axios.get<OnboardingStatus>(
      `${API_BASE_URL}/api/onboarding/status`,
      { headers, withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching onboarding status:', error);
    if (error.response?.status === 401) {
      return null;
    }
    throw new Error(error.response?.data?.detail || 'Failed to fetch onboarding status');
  }
}

/**
 * Update the main tour progress
 */
export async function updateMainTourProgress(step: number): Promise<OnboardingStatus> {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    throw new Error('User not authenticated');
  }

  try {
    const headers = await getAuthHeaders();
    const body: UpdateProgressRequest = { step };
    const response = await axios.post<OnboardingStatus>(
      `${API_BASE_URL}/api/onboarding/main-tour/progress`,
      body,
      { headers, withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating main tour progress:', error);
    if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    }
    throw new Error(error.response?.data?.detail || 'Failed to update main tour progress');
  }
}

/**
 * Mark the main tour as completed
 */
export async function completeMainTour(): Promise<OnboardingStatus> {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    throw new Error('User not authenticated');
  }

  try {
    const headers = await getAuthHeaders();
    const response = await axios.post<OnboardingStatus>(
      `${API_BASE_URL}/api/onboarding/main-tour/complete`,
      {},
      { headers, withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error completing main tour:', error);
    if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    }
    throw new Error(error.response?.data?.detail || 'Failed to complete main tour');
  }
}

/**
 * Skip a section of the main tour
 */
export async function skipSection(section: string): Promise<OnboardingStatus> {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    throw new Error('User not authenticated');
  }

  try {
    const headers = await getAuthHeaders();
    const body: SkipSectionRequest = { section };
    const response = await axios.post<OnboardingStatus>(
      `${API_BASE_URL}/api/onboarding/main-tour/skip-section`,
      body,
      { headers, withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error skipping section:', error);
    if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    }
    throw new Error(error.response?.data?.detail || 'Failed to skip section');
  }
}

/**
 * Restart the main tour from the beginning
 */
export async function restartMainTour(): Promise<OnboardingStatus> {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    throw new Error('User not authenticated');
  }

  try {
    const headers = await getAuthHeaders();
    const response = await axios.post<OnboardingStatus>(
      `${API_BASE_URL}/api/onboarding/main-tour/restart`,
      {},
      { headers, withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error restarting main tour:', error);
    if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    }
    throw new Error(error.response?.data?.detail || 'Failed to restart main tour');
  }
}

/**
 * Mark a mini-tour as completed
 */
export async function completeMiniTour(tourId: string): Promise<OnboardingStatus> {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    throw new Error('User not authenticated');
  }

  try {
    const headers = await getAuthHeaders();
    const body: CompleteMiniTourRequest = { tour_id: tourId };
    const response = await axios.post<OnboardingStatus>(
      `${API_BASE_URL}/api/onboarding/mini-tour/complete`,
      body,
      { headers, withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error completing mini-tour:', error);
    if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    }
    throw new Error(error.response?.data?.detail || 'Failed to complete mini-tour');
  }
}

/**
 * Restart a specific mini-tour
 */
export async function restartMiniTour(tourId: string): Promise<OnboardingStatus> {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    throw new Error('User not authenticated');
  }

  try {
    const headers = await getAuthHeaders();
    const body: RestartMiniTourRequest = { tour_id: tourId };
    const response = await axios.post<OnboardingStatus>(
      `${API_BASE_URL}/api/onboarding/mini-tour/restart`,
      body,
      { headers, withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error restarting mini-tour:', error);
    if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    }
    throw new Error(error.response?.data?.detail || 'Failed to restart mini-tour');
  }
}
