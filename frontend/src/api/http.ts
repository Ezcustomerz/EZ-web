import axios, {
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
  } from 'axios';
  import { toast } from '../components/toast/toast';
  import { supabase } from '../config/supabase';
  import { API_BASE_URL } from '../config/api';
  
  export interface ApiResponse extends AxiosResponse {
    data: {
      error?: string;
      [key: string]: any;
    };
  }
  
  export const createApiClient = (baseURL: string): AxiosInstance => {
    const http: AxiosInstance = axios.create({ baseURL });
  
    // ✅ Request interceptor for auth
    http.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const { data } = await supabase.auth.getSession();
        const jwtToken = data.session?.access_token;
  
        if (config.headers && jwtToken) {
          config.headers.Authorization = `Bearer ${jwtToken}`;
          config.headers['Content-Type'] = 'application/json';
          config.headers.Accept = 'application/json';
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

  // Default API client using the configured base URL
  export const http = createApiClient(API_BASE_URL);
  