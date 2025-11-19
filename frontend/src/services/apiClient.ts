import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { auth } from '../config/firebase';

// Prefer same-origin Vite proxy to ensure cookies are sent; fall back to backend URL if provided
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true, // Important for HTTP-only cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add Firebase ID token to Authorization header
        const user = auth.currentUser;
        if (user) {
          try {
            const idToken = await user.getIdToken();
            config.headers.Authorization = `Bearer ${idToken}`;
          } catch (error) {
            console.error('[API] Failed to get ID token:', error);
          }
        }

        // Add CSRF token if available
        const csrfToken = this.getCSRFToken();
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }

        return config;
      },
      (error) => {
        if (import.meta.env.DEV) {
          console.error('[API Request Error]', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url as string | undefined;

        // Suppress noisy console errors for expected unauthenticated checks
        const isAuthMe = typeof url === 'string' && url.includes('/auth/me');
        const isExpectedUnauthed = status === 401 && isAuthMe;

        if (import.meta.env.DEV && !isExpectedUnauthed) {
          console.error('[API Response Error]', {
            status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url,
          });
        }

        // Handle common error cases (avoid hard redirects to prevent reload loops)
        if (status === 401) {
          // Let PrivateRoute/Login handle unauthenticated state
          // No side-effects here to avoid reload loops.
        } else if (error.response?.status === 403) {
          // Forbidden - show error message
          if (import.meta.env.DEV) {
            console.warn('Access forbidden');
          }
        } else if (error.response?.status >= 500) {
          // Server error
          if (import.meta.env.DEV) {
            console.error('Server error occurred');
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private getCSRFToken(): string | null {
    // Try to get CSRF token from meta tag or cookie
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) return metaToken;

    // Fallback to cookie (if using cookie-based CSRF)
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf-token' || name === '_csrf') {
        return decodeURIComponent(value);
      }
    }

    return null;
  }

  private normalizeError(error: unknown): Error {
    const isObject = (val: unknown): val is Record<string, unknown> => typeof val === 'object' && val !== null;

    if (axios.isAxiosError(error)) {
      const data = error.response?.data as unknown;
      if (isObject(data)) {
        // Check for detailed validation errors first
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          const firstError = data.errors[0];
          if (isObject(firstError) && typeof firstError.message === 'string') {
            return new Error(firstError.message);
          }
        }
        // Then check for general message
        const message = typeof data.message === 'string' ? data.message : typeof data.error === 'string' ? data.error : undefined;
        if (message) return new Error(message);
      }
      if (typeof error.message === 'string' && error.message) {
        return new Error(error.message);
      }
    } else if (error instanceof Error) {
      return error;
    }
    return new Error('An unexpected error occurred');
  }

  // HTTP Methods
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  // File upload utility
  async uploadFile<T = unknown>(url: string, file: File, additionalData?: Record<string, unknown>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Download utility
  async downloadFile(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
