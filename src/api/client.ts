import type { ApiResponse } from '@types';
import { useToastStore } from '@store/toastStore';

class ApiClient {
  private baseURL = import.meta.env.VITE_API_URL || '/api';
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      if (data.success && data.data.accessToken && data.data.refreshToken) {
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private async request<T>(
    url: string,
    options?: RequestInit,
    retry = true
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && retry && !url.includes('/auth/')) {
      // If already refreshing, wait for that promise
      if (this.isRefreshing && this.refreshPromise) {
        const refreshed = await this.refreshPromise;
        if (refreshed) {
          return this.request<T>(url, options, false);
        }
      }

      // Start refresh process
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        this.refreshPromise = this.refreshAccessToken();

        const refreshed = await this.refreshPromise;
        this.isRefreshing = false;
        this.refreshPromise = null;

        if (refreshed) {
          // Retry the original request with new token
          return this.request<T>(url, options, false);
        }

        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = error.error || error.message || 'Request failed';

      // Don't show toasts for authentication errors (they'll redirect to login)
      // Also don't show toasts for 400 errors - let the calling code handle them
      if (response.status !== 401 && response.status !== 403 && response.status !== 400) {
        // Show user-friendly error messages
        const friendlyMessage = this.getFriendlyErrorMessage(response.status, errorMessage);
        useToastStore.getState().error(friendlyMessage);
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  private getFriendlyErrorMessage(status: number, message: string): string {
    // Map common HTTP status codes to user-friendly messages
    const statusMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      404: 'Resource not found.',
      500: 'Server error. Please try again later.',
      503: 'Service unavailable. Please try again later.',
    };

    // Return status-specific message or the original message
    return statusMessages[status] || message || 'Something went wrong. Please try again.';
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
