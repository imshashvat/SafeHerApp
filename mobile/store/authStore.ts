/**
 * Auth Store — Manages user authentication state.
 *
 * Auto-login is DISABLED. The app always shows the login screen on launch.
 * The saved phone number is stored only for convenience pre-fill.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type DbUser,
  loginUser,
  registerUser,
  getUserById,
  updateUserProfile,
} from '../services/database';

const PHONE_KEY = '@safeher_phone'; // phone pre-fill only — NOT used for auto-login

type AuthStore = {
  currentUser: DbUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string;
  savedPhone: string; // pre-fills the login screen

  restoreSession: () => Promise<void>;
  register: (
    name: string,
    phone: string,
    password: string,
    email?: string,
    bloodGroup?: string
  ) => Promise<{ success: boolean; error?: string }>;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    email?: string;
    blood_group?: string;
    medical_notes?: string;
  }) => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  isLoggedIn: false,
  isLoading: true,
  error: '',
  savedPhone: '',

  restoreSession: async () => {
    try {
      // Load saved phone for login screen pre-fill only — never auto-login
      const phone = await AsyncStorage.getItem(PHONE_KEY);
      if (phone) set({ savedPhone: phone });
    } catch { /* ignore */ }
    // Always require a fresh login
    set({ isLoading: false, isLoggedIn: false });
  },

  register: async (name, phone, password, email = '', bloodGroup = '') => {
    set({ error: '', isLoading: true });
    try {
      if (!name.trim() || !phone.trim() || !password.trim()) {
        set({ error: 'All fields are required', isLoading: false });
        return { success: false, error: 'All fields are required' };
      }
      if (password.length < 4) {
        set({ error: 'Password must be at least 4 characters', isLoading: false });
        return { success: false, error: 'Password must be at least 4 characters' };
      }

      const user = await registerUser(name, phone, password, email, bloodGroup);
      if (!user) {
        set({ error: 'Phone number already registered', isLoading: false });
        return { success: false, error: 'Phone number already registered' };
      }

      await AsyncStorage.setItem(PHONE_KEY, phone);
      set({ currentUser: user, isLoggedIn: true, isLoading: false, error: '', savedPhone: phone });
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  login: async (phone, password) => {
    set({ error: '', isLoading: true });
    try {
      if (!phone.trim() || !password.trim()) {
        set({ error: 'Phone and password required', isLoading: false });
        return { success: false, error: 'Phone and password required' };
      }

      const user = await loginUser(phone, password);
      if (!user) {
        set({ error: 'Invalid phone number or password', isLoading: false });
        return { success: false, error: 'Invalid phone number or password' };
      }

      // Save phone for convenience pre-fill only (NOT for auto-login)
      await AsyncStorage.setItem(PHONE_KEY, phone);
      set({ currentUser: user, isLoggedIn: true, isLoading: false, error: '', savedPhone: phone });
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    // Keep savedPhone so login screen still pre-fills the number
    set({ currentUser: null, isLoggedIn: false, error: '' });
  },

  updateProfile: async (updates) => {
    const { currentUser } = get();
    if (!currentUser) return;
    await updateUserProfile(currentUser.id, updates);
    const refreshed = await getUserById(currentUser.id);
    if (refreshed) set({ currentUser: refreshed });
  },

  clearError: () => set({ error: '' }),
}));
