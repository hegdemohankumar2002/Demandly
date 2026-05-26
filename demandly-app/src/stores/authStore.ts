'use client';

import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

// Helper to get initial state safely (SSR friendly)
const getInitialState = () => {
  if (typeof window === 'undefined') return { user: null, token: null, isAuthenticated: false };
  const storedUser = localStorage.getItem('demandly_user');
  const storedToken = localStorage.getItem('demandly_token');
  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    isAuthenticated: !!storedToken,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  isLoading: false,
  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('demandly_user', JSON.stringify(user));
      if (token) localStorage.setItem('demandly_token', token);
    }
    set({ user, token: token || null, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demandly_user');
      localStorage.removeItem('demandly_token');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));

/* Demo users for development */
export const demoConsumer: User = {
  id: 'u1',
  name: 'Aarav Sharma',
  email: 'aarav@example.com',
  role: 'consumer',
  pincode: '400001',
  city: 'Mumbai',
  phone: '+91 98765 43210',
  createdAt: '2026-01-15T00:00:00Z',
};

export const demoManufacturer: User = {
  id: 'm1',
  name: 'Rajesh Nair',
  email: 'rajesh@keralanaturals.com',
  role: 'manufacturer',
  pincode: '682001',
  city: 'Kochi',
  phone: '+91 94567 89012',
  createdAt: '2026-01-10T00:00:00Z',
};

export const demoAdmin: User = {
  id: 'a1',
  name: 'Platform Admin',
  email: 'admin@demandly.com',
  role: 'admin',
  pincode: '000000',
  city: 'HQ',
  phone: '0000000000',
  createdAt: '2026-01-01T00:00:00Z',
};
