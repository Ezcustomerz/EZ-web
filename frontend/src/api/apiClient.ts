import { createApiClient } from './http';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = createApiClient(API_BASE_URL);
