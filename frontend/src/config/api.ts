/**
 * API Configuration
 * 
 * Handles the API base URL configuration based on environment variables.
 * Falls back to local development server if VITE_API_BASE_URL is not set.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export { API_BASE_URL };

export default {
  baseURL: API_BASE_URL,
};
