/**
 * Auth Store — Manages user authentication state.
 *
 * Uses expo-sqlite for local auth (no server needed).
 * On login, loads user-specific data into other stores.
 * On logout, clears stores and shows login screen.
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

const SESSION_KEY = '@safeher_session';

type AuthStore = {
  currentUser: DbUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string;

  /** Try to restore session from persisted userId */
  restoreSession: () => Promise<void>;

  /** Register a new user */
  register: (
    name: string,
    phone: string,
    password: string,
    email?: string,
    bloodGroup?: string
  ) => Promise<{ success: boolean; error?: string }>;

  /** Login with phone + password */
  login: (
    phone: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;

  /** Logout and clear session */
  logout: () => Promise<void>;

  /** Update profile fields on current user */
  updateProfile: (updates: {
    name?: string;
    email?: string;
    blood_group?: string;
    medical_notes?: string;
  }) => Promise<void>;

  /** Clear error */
  clearError: () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  isLoggedIn: false,
  isLoading: true,
  error: '',

  restoreSession: async () => {
    try {
      const userIdStr = await AsyncStorage.getItem(SESSION_KEY);
      if (userIdStr) {
        const userId = parseInt(userIdStr, 10);
        const user = await getUserById(userId);
        if (user) {
          set({ currentUser: user, isLoggedIn: true, isLoading: false });
          return;
        }
      }
    } catch (err) {
      console.error('Auth: Failed to restore session', err);
    }
    set({ isLoading: false });
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

      await AsyncStorage.setItem(SESSION_KEY, user.id.toString());
      set({ currentUser: user, isLoggedIn: true, isLoading: false, error: '' });
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

      await AsyncStorage.setItem(SESSION_KEY, user.id.toString());
      set({ currentUser: user, isLoggedIn: true, isLoading: false, error: '' });
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
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
