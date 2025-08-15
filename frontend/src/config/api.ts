/**
 * API Configuration
 * 
 * Handles the API base URL and frontend URL configuration based on environment variables.
 * Falls back to local development server if environment variables are not set.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

export { API_BASE_URL, FRONTEND_URL };

export default {
  baseURL: API_BASE_URL,
  frontendURL: FRONTEND_URL,
};
