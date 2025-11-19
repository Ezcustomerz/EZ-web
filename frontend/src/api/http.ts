import axios, {
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
  } from 'axios';
  import { toast } from '../components/toast/toast';
  import { supabase } from '../config/supabase';
  import { getUserTimezone } from '../utils/timezoneUtils';
  
  export interface ApiResponse extends AxiosResponse {
    data: {
      error?: string;
      [key: string]: any;
    };
  }
  
  export const createApiClient = (baseURL: string): AxiosInstance => {
    const http: AxiosInstance = axios.create({ 
      baseURL,
      withCredentials: true, // Include cookies (HttpOnly cookies) in requests
    });
  
    // ✅ Request interceptor for auth
    http.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const { data } = await supabase.auth.getSession();
        const jwtToken = data.session?.access_token;

        if (config.headers && jwtToken) {
          config.headers.Authorization = `Bearer ${jwtToken}`;
          // Only set Content-Type if it's not FormData (FormData needs browser to set boundary)
          if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
          }
          config.headers.Accept = 'application/json';
          config.headers['x-user-timezone'] = getUserTimezone();
        }

        return config;
      },
      (error) => Promise.reject(error)
    );
  
    http.interceptors.response.use(
      (response) => response as ApiResponse,
      (error) => {
        const status = error.response?.status;
  
        if (status === 401) {
          toast({
            variant: 'error',
            title: 'Unauthorized',
            description: 'Your session has expired. Please log in again.',
          });
        } else if (status === 403) {
          toast({
            variant: 'error',
            title: 'Forbidden',
            description: 'You do not have permission to perform this action.',
          });
        } else {
          toast({
            variant: 'error',
            title: 'Server Error',
            description: 'An unexpected error occurred. Please try again.',
          });
        }
  
        return Promise.reject({
          ...error.response,
          data: {
            ...error.response?.data,
            error: error.message,
          },
        });
      }
    );
  
    return http;
  };
  