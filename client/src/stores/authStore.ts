import { create } from 'zustand';
import { api } from '../api/client';

export interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const STORAGE_KEY = 'kisisel_finans_auth_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(STORAGE_KEY),
  isAuthenticated: !!localStorage.getItem(STORAGE_KEY),
  isLoading: !!localStorage.getItem(STORAGE_KEY),

  login: async (email, password) => {
    const res = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem(STORAGE_KEY, res.token);
    set({
      token: res.token,
      user: res.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      if (get().token) {
        await api('/auth/logout', { method: 'POST' });
      }
    } catch {
      // Çıkış hatası olsa bile yerel durumu temizle
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await api<{ user: User }>('/auth/me');
      set({
        user: res.user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateProfile: async (name, email) => {
    const res = await api<{ user: User; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email }),
    });

    set({ user: res.user });
  },

  changePassword: async (currentPassword, newPassword) => {
    await api<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
}));
