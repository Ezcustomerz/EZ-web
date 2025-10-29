import { apiClient } from './apiClient';

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

class BookingService {
  private baseUrl = '/api/booking';

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
}

export const bookingService = new BookingService();
