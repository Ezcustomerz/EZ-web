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

export interface PaymentMethodDetails {
  id: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
}

export interface InvoiceDetails {
  id: string;
  number?: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  created: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  period_start?: string;
  period_end?: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  storage_amount_bytes: number;
  storage_display: string;
  description?: string;
  fee_percentage: number;
  is_active: boolean;
  tier_level: number;
  stripe_product_id?: string;
  stripe_price_id?: string;
}

export interface BillingDetailsResponse {
  has_subscription: boolean;
  subscription_tier?: SubscriptionTier;
  subscription_status?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
  payment_method?: PaymentMethodDetails;
  invoices: InvoiceDetails[];
  is_top_tier: boolean;
  stripe_customer_id?: string;
}

export interface CreateBillingPortalRequest {
  return_url: string;
}

export interface CreateBillingPortalResponse {
  portal_url: string;
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

  /**
   * Get complete billing details including payment method and invoices
   */
  async getBillingDetails(): Promise<BillingDetailsResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.get<BillingDetailsResponse>(
      `${API_BASE_URL}/api/subscriptions/billing-details`,
      { headers }
    );
    return response.data;
  },

  /**
   * Create a billing portal session to manage payment methods
   */
  async createBillingPortal(returnUrl: string): Promise<CreateBillingPortalResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<CreateBillingPortalResponse>(
      `${API_BASE_URL}/api/subscriptions/create-billing-portal`,
      { return_url: returnUrl },
      { headers }
    );
    return response.data;
  },
};
