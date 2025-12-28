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

export interface PaymentRequest {
  id: string;
  creative_user_id: string;
  client_user_id: string;
  booking_id: string | null;
  amount: number;
  notes: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  stripe_session_id: string | null;
  // Related data (for client view)
  creative_name?: string;
  creative_display_name?: string;
  creative_avatar_url?: string;
  // Related data (for creative view)
  client_name?: string;
  client_display_name?: string;
  service_name?: string;
  booking_order_date?: string;
}

export interface PaymentRequestCount {
  pending: number;
  total: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedPaymentRequests {
  data: PaymentRequest[];
  pagination: PaginationInfo;
}

class PaymentRequestsService {
  /**
   * Get payment requests for the current creative with pagination
   */
  async getCreativePaymentRequests(page: number = 1, pageSize: number = 10): Promise<PaginatedPaymentRequests> {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<PaginatedPaymentRequests>(
        `${API_BASE_URL}/api/payment-requests/creative`,
        { 
          headers,
          params: { page, page_size: pageSize }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching creative payment requests:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication failed');
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch payment requests');
    }
  }

  /**
   * Get payment requests for the current client with pagination
   */
  async getClientPaymentRequests(page: number = 1, pageSize: number = 10): Promise<PaginatedPaymentRequests> {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<PaginatedPaymentRequests>(
        `${API_BASE_URL}/api/payment-requests/client`,
        { 
          headers,
          params: { page, page_size: pageSize }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment requests:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication failed');
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch payment requests');
    }
  }

  /**
   * Get pending payment requests count for the current client
   */
  async getPendingPaymentRequestsCount(): Promise<number> {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return 0;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<PaymentRequestCount>(
        `${API_BASE_URL}/api/payment-requests/client/count`,
        { headers }
      );
      return response.data.pending || 0;
    } catch (error: any) {
      console.error('Error fetching payment requests count:', error);
      if (error.response?.status === 401) {
        return 0;
      }
      return 0; // Return 0 on error to avoid breaking UI
    }
  }

  /**
   * Create a new payment request
   */
  async createPaymentRequest(data: {
    client_user_id?: string;
    amount: number;
    notes?: string;
    booking_id?: string;
  }): Promise<PaymentRequest> {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post<PaymentRequest>(
        `${API_BASE_URL}/api/payment-requests`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating payment request:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication failed');
      }
      throw new Error(error.response?.data?.detail || 'Failed to create payment request');
    }
  }

  /**
   * Process payment for a payment request - creates a Stripe Checkout Session
   */
  async processPaymentRequest(paymentRequestId: string): Promise<{
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
      `${API_BASE_URL}/api/payment-requests/${paymentRequestId}/process`,
      {},
      { headers }
    );
    return response.data;
  }

  /**
   * Verify a payment session and update payment request status
   */
  async verifyPaymentRequest(sessionId: string, paymentRequestId: string): Promise<{
    success: boolean;
    message: string;
    payment_request_id: string;
    amount: number;
    status: string;
  }> {
    const headers = await getAuthHeaders();
    const response = await axios.post<{
      success: boolean;
      message: string;
      payment_request_id: string;
      amount: number;
      status: string;
    }>(
      `${API_BASE_URL}/api/payment-requests/verify`,
      {
        session_id: sessionId,
        payment_request_id: paymentRequestId
      },
      { headers }
    );
    return response.data;
  }
}

export const paymentRequestsService = new PaymentRequestsService();

