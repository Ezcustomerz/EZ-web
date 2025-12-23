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

  async getClientUpcomingBookings(): Promise<Order[]> {
    // Check authentication before making API call
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      console.log('User not authenticated, skipping client upcoming bookings fetch');
      return [];
    }

    try {
      const response = await apiClient.get(`${this.bookingsUrl}/client/upcoming`);
      return response.data.orders || [];
    } catch (error: any) {
      console.error('Error fetching client upcoming bookings:', error);
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

  async uploadDeliverables(bookingId: string, files: File[]): Promise<{ success: boolean; files: Array<{ file_url: string; file_name: string; file_size: number; file_type: string; storage_path: string }>; total_files: number }> {
    const formData = new FormData();
    // FastAPI expects files parameter name to match the function parameter
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Don't set Content-Type header - let the browser set it automatically with boundary
    const response = await apiClient.post(
      `${this.bookingsUrl}/upload-deliverables?booking_id=${bookingId}`,
      formData
    );
    return response.data;
  }

  /**
   * Upload files directly to Supabase Storage (faster for large files)
   * Uses resumable uploads for files > 50MB for better reliability
   * This bypasses the backend for the actual upload, improving speed
   * 
   * @param onProgress - Optional callback for progress updates (percent: number, currentFile: number, totalFiles: number, currentFileName: string)
   * @param abortSignal - Optional AbortSignal to cancel the upload
   */
  async uploadDeliverablesDirect(
    bookingId: string, 
    files: File[],
    onProgress?: (percent: number, currentFile: number, totalFiles: number, currentFileName: string) => void,
    abortSignal?: AbortSignal
  ): Promise<{ success: boolean; files: Array<{ file_url: string; file_name: string; file_size: number; file_type: string; storage_path: string }>; total_files: number }> {
    // Step 0: Ensure we have a valid, fresh session before uploading
    // Refresh the session to prevent "exp" claim timestamp check failed errors
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Not authenticated. Please sign in again.');
    }
    
    // Refresh the session to get a new token if needed
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('Session refresh failed, continuing with current session:', refreshError);
    }
    
    // Step 1: Get upload paths from backend (with permission validation)
    const pathsResponse = await apiClient.post(
      `${this.bookingsUrl}/get-upload-paths?booking_id=${bookingId}`,
      files.length
    );
    
    const { upload_paths, bucket_name } = pathsResponse.data;
    
    if (upload_paths.length !== files.length) {
      throw new Error('Mismatch between file count and upload paths');
    }
    
    // Step 2: Upload files directly to Supabase Storage
    // Upload files sequentially to track progress and allow cancellation
    const uploadedFiles: Array<{ file_name: string; file_size: number; file_type: string; storage_path: string }> = [];
    
    // Calculate total size for progress estimation
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    let uploadedSize = 0;
    
    for (let index = 0; index < files.length; index++) {
      // Check if upload was cancelled
      if (abortSignal?.aborted) {
        throw new Error('Upload cancelled by user');
      }
      
      const file = files[index];
      
      // Calculate progress based on completed files and current file
      // Show 10% progress when starting a file, will update to 90% when file completes
      const completedFilesProgress = (index / files.length) * 100;
      const currentFileWeight = (file.size / totalSize) * 100;
      
      // Update progress - starting current file (10% of this file's weight)
      if (onProgress) {
        const startProgress = completedFilesProgress + (currentFileWeight * 0.1);
        onProgress(Math.min(startProgress, 90), index + 1, files.length, file.name);
      }
      
      // Check for cancellation before session operations
      if (abortSignal?.aborted) {
        throw new Error('Upload cancelled by user');
      }
      
      // Refresh session before each upload to prevent token expiration
      const { data: currentSession } = await supabase.auth.getSession();
      if (!currentSession.session) {
        throw new Error('Session expired. Please sign in again.');
      }
      
      // Check for cancellation after session check
      if (abortSignal?.aborted) {
        throw new Error('Upload cancelled by user');
      }
      
      // Check if token is about to expire (within 5 minutes)
      const tokenExpiry = currentSession.session.expires_at;
      if (tokenExpiry) {
        const expiresIn = tokenExpiry - Math.floor(Date.now() / 1000);
        if (expiresIn < 300) { // Less than 5 minutes
          // Check for cancellation before refresh
          if (abortSignal?.aborted) {
            throw new Error('Upload cancelled by user');
          }
          // Refresh the session
          await supabase.auth.refreshSession();
          // Check again after refresh
          if (abortSignal?.aborted) {
            throw new Error('Upload cancelled by user');
          }
        }
      }
      
      const { storage_path } = upload_paths[index];
      
      // Get file extension
      const extension = file.name.split('.').pop() || '';
      const finalPath = extension ? `${storage_path}.${extension}` : storage_path;
      
      // Upload directly to Supabase Storage
      // Note: For very large files (>500MB), consider implementing TUS resumable uploads
      // For now, standard uploads should work with the increased bucket limits
      // Check for cancellation before starting upload
      if (abortSignal?.aborted) {
        throw new Error('Upload cancelled by user');
      }
      
      const uploadStartTime = Date.now();
      const { data, error } = await supabase.storage
        .from(bucket_name)
        .upload(finalPath, file, {
          contentType: file.type || 'application/octet-stream',
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });
      
      // Check for cancellation immediately after upload attempt
      if (abortSignal?.aborted) {
        throw new Error('Upload cancelled by user');
      }
      
      if (error) {
        // Check if cancelled
        if (abortSignal?.aborted) {
          throw new Error('Upload cancelled by user');
        }
        
        // If token expired, try refreshing and retry once
        if (error.message.includes('exp') || error.message.includes('timestamp')) {
          console.log('Token expired during upload, refreshing and retrying...');
          await supabase.auth.refreshSession();
          
          // Retry the upload with fresh token
          const { data: retryData, error: retryError } = await supabase.storage
            .from(bucket_name)
            .upload(finalPath, file, {
              contentType: file.type || 'application/octet-stream',
              cacheControl: '3600',
              upsert: false
            });
          
          if (retryError) {
            throw new Error(`Upload failed for ${file.name}: ${retryError.message}`);
          }
        } else {
          throw new Error(`Upload failed for ${file.name}: ${error.message}`);
        }
      }
      
      // File uploaded successfully
      uploadedSize += file.size;
      const fileProgress = (uploadedSize / totalSize) * 100;
      
      // Update progress - file completed (90% max, finalization will take it to 100%)
      if (onProgress) {
        onProgress(Math.min(fileProgress, 90), index + 1, files.length, file.name);
      }
      
      uploadedFiles.push({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
        storage_path: finalPath
      });
    }
    
    // Step 3: Register files in database
    const registerResponse = await apiClient.post(
      `${this.bookingsUrl}/register-uploaded-files`,
      {
        booking_id: bookingId,
        files: uploadedFiles
      }
    );
    
    return registerResponse.data;
  }

  async uploadDeliverable(bookingId: string, file: File): Promise<{ success: boolean; file_url: string; file_name: string; file_size: number; file_type: string; storage_path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Don't set Content-Type header - let the browser set it automatically with boundary
    const response = await apiClient.post(
      `${this.bookingsUrl}/upload-deliverable?booking_id=${bookingId}`,
      formData
    );
    return response.data;
  }

  async deleteDeliverable(deliverableId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`${this.bookingsUrl}/deliverable/${deliverableId}`);
    return response.data;
  }

  async downloadDeliverable(deliverableId: string): Promise<{ success: boolean; signed_url: string; file_name: string; expires_in: number }> {
    const response = await apiClient.get(`${this.bookingsUrl}/download-deliverable/${deliverableId}`);
    return response.data;
  }

  async downloadDeliverablesBatch(bookingId: string): Promise<{ success: boolean; files: Array<{ deliverable_id: string; file_name: string; signed_url: string; expires_in: number }>; total_files: number }> {
    const response = await apiClient.get(`${this.bookingsUrl}/download-deliverables/${bookingId}`);
    return response.data;
  }

  async finalizeService(bookingId: string, files?: Array<{ url: string; name: string; size: number; type: string }>): Promise<{ success: boolean; message: string; booking_id: string }> {
    const response = await apiClient.post(`${this.bookingsUrl}/finalize`, {
      booking_id: bookingId,
      files: files || []
    });
    return response.data;
  }

  async downloadComplianceSheet(bookingId: string): Promise<Blob> {
    const response = await apiClient.get(`/api/bookings/compliance-sheet/${bookingId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getInvoices(bookingId: string): Promise<{ success: boolean; booking_id: string; invoices: Array<{ type: string; name: string; download_url: string; session_id?: string }> }> {
    const response = await apiClient.get(`/api/bookings/invoices/${bookingId}`);
    return response.data;
  }

  async downloadEzInvoice(bookingId: string): Promise<Blob> {
    const response = await apiClient.get(`/api/bookings/invoice/ez/${bookingId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getStripeReceipt(bookingId: string, sessionId: string): Promise<{ success: boolean; receipt_url: string; session_id: string }> {
    const response = await apiClient.get(`/api/bookings/invoice/stripe/${bookingId}`, {
      params: { session_id: sessionId }
    });
    return response.data;
  }

  async markDownloadComplete(bookingId: string): Promise<{ success: boolean; message: string; booking_id: string; client_status: string }> {
    const response = await apiClient.post(`${this.bookingsUrl}/mark-download-complete`, {
      booking_id: bookingId
    });
    return response.data;
  }

  async sendPaymentReminder(bookingId: string): Promise<{ success: boolean; message: string; notification_id?: string }> {
    const response = await apiClient.post(`${this.bookingsUrl}/send-payment-reminder`, {
      booking_id: bookingId
    });
    return response.data;
  }
}

export interface OrderFile {
  id: string;
  name: string;
  type: string;
  size: string;
  downloaded_at?: string | null;
}

export interface Invoice {
  type: string; // 'ez_invoice' | 'stripe_receipt'
  name: string;
  download_url: string;
  session_id?: string;
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
  split_deposit_amount?: number;
  amount_paid?: number;
  description?: string;
  status: string;
  client_status?: string;
  creative_status?: string;
  files?: OrderFile[];
  invoices?: Invoice[];
}

export const bookingService = new BookingService();
