import axios from 'axios';
import { supabase } from '../config/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const jwtToken = data.session?.access_token;
  
  return {
    'Accept': 'application/json',
    ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
  };
};

// Type definitions for file scanning
export type FileScanResult = {
  filename: string;
  is_safe: boolean;
  error_message?: string;
  scan_details?: {
    scanner?: string;
    connection_type?: string;
    file_size?: number;
    threat_detected?: boolean;
    threat_name?: string;
    available?: boolean;
    error?: string;
  };
};

export type FileScanResponse = {
  results: FileScanResult[];
  total_files: number;
  safe_files: number;
  unsafe_files: number;
  scanner_available: boolean;
};

export const fileScanningService = {
  /**
   * Scan multiple files for malware
   */
  async scanFiles(files: File[]): Promise<FileScanResponse> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await axios.post<FileScanResponse>(
      `${API_BASE_URL}/file-scanning/scan`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },

  /**
   * Scan a single file for malware
   */
  async scanSingleFile(file: File): Promise<FileScanResult> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post<FileScanResult>(
      `${API_BASE_URL}/file-scanning/scan/single`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },
};

