import { apiClient } from './apiClient';
import { supabase } from '../config/supabase';

export interface CalendarSettings {
  id: string;
  service_id: string;
  is_scheduling_enabled: boolean;
  session_duration: number;
  default_session_length: number;
  min_notice_amount: number;
  min_notice_unit: 'minutes' | 'hours' | 'days';
  max_advance_amount: number;
  max_advance_unit: 'hours' | 'days' | 'weeks' | 'months';
  buffer_time_amount: number;
  buffer_time_unit: 'minutes' | 'hours';
  is_active: boolean;
}

export interface WeeklySchedule {
  id: string;
  day_of_week: string;
  is_enabled: boolean;
  start_time?: string;
  end_time?: string;
}

export interface TimeSlot {
  id: string;
  slot_time: string;
  is_enabled: boolean;
  day_of_week: string;
  is_template?: boolean;
  current_bookings?: number;
  max_bookings?: number;
}

export interface AvailableDate {
  date: string;
  day_of_week: string;
  is_available: boolean;
}

export interface ServiceBookingData {
  calendar_settings: CalendarSettings;
  weekly_schedule: WeeklySchedule[];
  time_slots: TimeSlot[];
}

export interface CreateBookingRequest {
  service_id: string;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  session_duration?: number;
  notes?: string;
}

export interface CreateBookingResponse {
  success: boolean;
  message: string;
  booking_id?: string;
  booking?: any;
}

export interface CalendarSession {
  id: string;
  date: string; // yyyy-MM-dd format
  time: string; // HH:MM format
  endTime: string; // HH:MM format
  client: string;
  type: string; // service name
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
}

class BookingService {
  private baseUrl = '/api/booking';
  private bookingsUrl = '/api/bookings';

  async getCalendarSettings(serviceId: string): Promise<CalendarSettings> {
    const response = await apiClient.get(`${this.baseUrl}/service/${serviceId}/calendar-settings`);
    return response.data.data;
  }

  async getWeeklySchedule(serviceId: string): Promise<WeeklySchedule[]> {
    const response = await apiClient.get(`${this.baseUrl}/service/${serviceId}/weekly-schedule`);
    return response.data.data;
  }

  async getTimeSlots(serviceId: string): Promise<TimeSlot[]> {
    const response = await apiClient.get(`${this.baseUrl}/service/${serviceId}/time-slots`);
    return response.data.data;
  }

  async getAvailableDates(
    serviceId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<AvailableDate[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/service/${serviceId}/available-dates${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data.data;
  }

  async getAvailableTimeSlots(serviceId: string, bookingDate: string): Promise<TimeSlot[]> {
    const response = await apiClient.get(
      `${this.baseUrl}/service/${serviceId}/available-time-slots?booking_date=${bookingDate}`
    );
    return response.data.data;
  }

  async getServiceBookingData(serviceId: string): Promise<ServiceBookingData> {
    const response = await apiClient.get(`${this.baseUrl}/service/${serviceId}/booking-data`);
    return response.data.data;
  }

  async createBooking(bookingData: CreateBookingRequest): Promise<CreateBookingResponse> {
    const response = await apiClient.post(`${this.bookingsUrl}/create`, bookingData);
    return response.data;
  }

  async getClientOrders(): Promise<Order[]> {
    // Check authentication before making API call
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      console.log('User not authenticated, skipping client orders fetch');
      return [];
    }

    try {
      const response = await apiClient.get(`${this.bookingsUrl}/client`);
      return response.data.orders || [];
    } catch (error: any) {
      console.error('Error fetching client orders:', error);
      if (error.response?.status === 401) {
        // User is no longer authenticated, return empty array
        return [];
      }
      throw error;
    }
  }

  async getClientInProgressOrders(): Promise<Order[]> {
    // Check authentication before making API call
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      console.log('User not authenticated, skipping client in-progress orders fetch');
      return [];
    }

    try {
      const response = await apiClient.get(`${this.bookingsUrl}/client/in-progress`);
      return response.data.orders || [];
    } catch (error: any) {
      console.error('Error fetching client in-progress orders:', error);
      if (error.response?.status === 401) {
        // User is no longer authenticated, return empty array
        return [];
      }
      throw error;
    }
  }

  async getClientActionNeededOrders(): Promise<Order[]> {
    // Check authentication before making API call
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      console.log('User not authenticated, skipping client action-needed orders fetch');
      return [];
    }

    try {
      const response = await apiClient.get(`${this.bookingsUrl}/client/action-needed`);
      return response.data.orders || [];
    } catch (error: any) {
      console.error('Error fetching client action-needed orders:', error);
      if (error.response?.status === 401) {
        // User is no longer authenticated, return empty array
        return [];
      }
      throw error;
    }
  }

  async getClientHistoryOrders(): Promise<Order[]> {
    // Check authentication before making API call
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      console.log('User not authenticated, skipping client history orders fetch');
      return [];
    }

    try {
      const response = await apiClient.get(`${this.bookingsUrl}/client/history`);
      return response.data.orders || [];
    } catch (error: any) {
      console.error('Error fetching client history orders:', error);
      if (error.response?.status === 401) {
        // User is no longer authenticated, return empty array
        return [];
      }
      throw error;
    }
  }

  async getCreativeOrders(): Promise<Order[]> {
    const response = await apiClient.get(`${this.bookingsUrl}/creative`);
    return response.data.orders || [];
  }

  async getCreativeCurrentOrders(): Promise<Order[]> {
    // Check authentication before making API call
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      console.log('User not authenticated, skipping current orders fetch');
      return [];
    }

    try {
      const response = await apiClient.get(`${this.bookingsUrl}/creative/current`);
      return response.data.orders || [];
    } catch (error: any) {
      console.error('Error fetching current orders:', error);
      if (error.response?.status === 401) {
        // User is no longer authenticated, return empty array
        return [];
      }
      throw error;
    }
  }

  async getCreativePastOrders(): Promise<Order[]> {
    // Check authentication before making API call
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      console.log('User not authenticated, skipping past orders fetch');
      return [];
    }

    try {
      const response = await apiClient.get(`${this.bookingsUrl}/creative/past`);
      return response.data.orders || [];
    } catch (error: any) {
      console.error('Error fetching past orders:', error);
      if (error.response?.status === 401) {
        // User is no longer authenticated, return empty array
        return [];
      }
      throw error;
    }
  }

  async getCreativeCalendarSessions(year: number, month: number): Promise<CalendarSession[]> {
    // Check authentication before making API call
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      console.log('User not authenticated, skipping calendar sessions fetch');
      return [];
    }

    try {
      const response = await apiClient.get(`${this.bookingsUrl}/creative/calendar`, {
        params: { year, month }
      });
      return response.data.sessions || [];
    } catch (error: any) {
      console.error('Error fetching calendar sessions:', error);
      if (error.response?.status === 401) {
        // User is no longer authenticated, return empty array
        return [];
      }
      throw error;
    }
  }

  async getCreativeCalendarSessionsWeek(startDate: string, endDate: string): Promise<CalendarSession[]> {
    // Check authentication before making API call
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      console.log('User not authenticated, skipping calendar sessions fetch');
      return [];
    }

    try {
      const response = await apiClient.get(`${this.bookingsUrl}/creative/calendar/week`, {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data.sessions || [];
    } catch (error: any) {
      console.error('Error fetching calendar sessions for week:', error);
      if (error.response?.status === 401) {
        // User is no longer authenticated, return empty array
        return [];
      }
      throw error;
    }
  }

  async rejectOrder(bookingId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`${this.bookingsUrl}/reject`, {
      booking_id: bookingId
    });
    return response.data;
  }

  async approveOrder(bookingId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`${this.bookingsUrl}/approve`, {
      booking_id: bookingId
    });
    return response.data;
  }

  async cancelOrder(bookingId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`${this.bookingsUrl}/cancel`, {
      booking_id: bookingId
    });
    return response.data;
  }

  async finalizeService(bookingId: string, files?: Array<{ url: string; name: string; size: number; type: string }>): Promise<{ success: boolean; message: string; booking_id: string }> {
    const response = await apiClient.post(`${this.bookingsUrl}/finalize`, {
      booking_id: bookingId,
      files: files || []
    });
    return response.data;
  }
}

export interface OrderFile {
  id: string;
  name: string;
  type: string;
  size: string;
}

export interface Order {
  id: string;
  service_id: string;
  service_name: string;
  service_description?: string;
  service_delivery_time?: string;
  service_color?: string;
  creative_id: string;
  creative_name: string;
  creative_display_name?: string;
  creative_title?: string;
  creative_avatar_url?: string;
  creative_email?: string;
  creative_rating?: number;
  creative_review_count?: number;
  creative_services_count?: number;
  creative_color?: string;
  order_date: string;
  booking_date?: string;
  canceled_date?: string;
  approved_at?: string;
  price: number;
  payment_option?: string;
  amount_paid?: number;
  description?: string;
  status: string;
  client_status?: string;
  creative_status?: string;
  files?: OrderFile[];
}

export const bookingService = new BookingService();
