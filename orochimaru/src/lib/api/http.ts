import axios, { AxiosError } from 'axios';
import type { ApiEnvelope } from './envelope';

export const API_BASE: string = (import.meta.env.VITE_BASE_URL as string) || '';
export const TOKEN_STORAGE_KEY = 'asset_hub_token' as const;
export const SUCCESS_STATUS = 'AP00000' as const;

// Custom error class for API business logic errors
export class ApiError extends Error {
  status: string;
  errors: Array<{ code: string; title: string; message: string }>;

  constructor(
    message: string,
    status: string,
    errors: Array<{ code: string; title: string; message: string }> = []
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Map of known API status codes to user-friendly messages
const STATUS_MESSAGES: Record<string, string> = {
  'AP00400': 'Data tidak valid',
  'AP00401': 'Sesi telah berakhir, silakan login kembali',
  'AP00403': 'Anda tidak memiliki akses untuk melakukan aksi ini',
  'AP00404': 'Data tidak ditemukan',
  'AP00409': 'Data sudah ada (duplikat)',
  'AP00422': 'Data tidak dapat diproses',
  'AP00500': 'Terjadi kesalahan pada server',
  'AP99999': 'Terjadi kesalahan tidak terduga',
};

// Helper to extract user-friendly error message from any error
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // If there are detailed errors, show the first one
    if (error.errors?.length > 0) {
      return error.errors[0].message || error.message;
    }

    // If message is generic (like "Conflict", "Bad Request"), use our mapping
    const genericMessages = ['Conflict', 'Bad Request', 'Not Found', 'Forbidden', 'Unauthorized', 'Internal Server Error'];
    if (genericMessages.includes(error.message) || error.message.length < 15) {
      const friendlyMessage = STATUS_MESSAGES[error.status];
      if (friendlyMessage) {
        return friendlyMessage;
      }
    }

    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Terjadi kesalahan";
}

export const http = axios.create({
  baseURL: API_BASE,
  // Do not set a default Content-Type so axios can choose
  // application/json for plain objects or multipart boundaries for FormData
  withCredentials: false,
});

// Request interceptor - add auth token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - check API status code
http.interceptors.response.use(
  (response) => {
    // Check if the response has our API envelope structure
    const data = response.data as ApiEnvelope<unknown> | undefined;

    if (data && typeof data === 'object' && 'status' in data) {
      // If status is not AP00000, treat as error
      if (data.status !== SUCCESS_STATUS) {
        const errorMessage = data.message || 'Terjadi kesalahan';
        throw new ApiError(errorMessage, data.status, data.errors || []);
      }
    }

    return response;
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    // Handle HTTP errors (4xx, 5xx)
    if (error.response?.data) {
      const data = error.response.data;
      const errorMessage = data.message || error.message || 'Terjadi kesalahan';
      throw new ApiError(errorMessage, data.status || 'AP99999', data.errors || []);
    }

    // Network error or other errors
    throw new ApiError(error.message || 'Koneksi gagal', 'AP99999', []);
  }
);
