import { create } from 'zustand';
import type { User } from '@app-types/index';
import { authService } from '@api/services';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchUser: async () => {
    try {
      set({ isLoading: true });

      // Check if token exists in localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      const response = await authService.me();

      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      // Error calling API, clear token
      localStorage.removeItem('auth_token');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    // Clear token from localStorage (no API call needed)
    localStorage.removeItem('auth_token');
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
    });
  },
}));
