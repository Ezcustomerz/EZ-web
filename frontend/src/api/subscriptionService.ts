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

export interface CreateCheckoutSessionRequest {
  subscription_tier_id: string;
}

export interface CreateCheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

export interface SubscriptionStatusResponse {
  has_subscription: boolean;
  subscription_tier_id?: string;
  subscription_tier_name?: string;
  status?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  stripe_customer_id?: string;
}

export interface VerifySubscriptionRequest {
  session_id: string;
}

export interface VerifySubscriptionResponse {
  success: boolean;
  message: string;
  subscription_tier_id?: string;
  subscription_status?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  canceled_at_period_end: boolean;
}

export const subscriptionService = {
  /**
   * Create a Stripe Checkout session for subscription payment
   */
  async createCheckoutSession(subscriptionTierId: string): Promise<CreateCheckoutSessionResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<CreateCheckoutSessionResponse>(
      `${API_BASE_URL}/api/subscriptions/create-checkout-session`,
      { subscription_tier_id: subscriptionTierId },
      { headers }
    );
    return response.data;
  },

  /**
   * Verify subscription payment after checkout
   */
  async verifySubscription(sessionId: string): Promise<VerifySubscriptionResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<VerifySubscriptionResponse>(
      `${API_BASE_URL}/api/subscriptions/verify`,
      { session_id: sessionId },
      { headers }
    );
    return response.data;
  },

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.get<SubscriptionStatusResponse>(
      `${API_BASE_URL}/api/subscriptions/status`,
      { headers }
    );
    return response.data;
  },

  /**
   * Cancel active subscription (at end of billing period)
   */
  async cancelSubscription(): Promise<CancelSubscriptionResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<CancelSubscriptionResponse>(
      `${API_BASE_URL}/api/subscriptions/cancel`,
      {},
      { headers }
    );
    return response.data;
  },
};
