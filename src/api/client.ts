import type { ApiResponse } from '@app-types/index';
import { useToastStore } from '@store/toastStore';

class ApiClient {
  private baseURL = import.meta.env.VITE_API_URL || '/api';

  getBaseURL(): string {
    return this.baseURL;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('auth_token');

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

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = error.message || 'Request failed';

      // Don't show toasts for authentication errors (they'll redirect to login)
      if (response.status !== 401 && response.status !== 403) {
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

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
