import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Settings = {
  shakeSensitivity: number;        // 1-5 scale
  fallDetection: boolean;
  voiceKeyword: boolean;
  autoVideoRecord: boolean;
  smsAlerts: boolean;
  emailAlerts: boolean;
  autoCallOnSOS: boolean;          // auto-call 112
  autoCallGuardian: boolean;       // auto-call first guardian
  checkInInterval: number;         // minutes
  theme: 'dark';
  language: 'en' | 'hi';
  profileName: string;
  bloodGroup: string;
  medicalNotes: string;
  isOnboarded: boolean;
};

type SettingsStore = Settings & {
  update: (partial: Partial<Settings>) => void;
  load: () => Promise<void>;
  save: () => Promise<void>;
};

const DEFAULTS: Settings = {
  shakeSensitivity: 3,
  fallDetection: true,
  voiceKeyword: false,
  autoVideoRecord: true,
  smsAlerts: true,
  emailAlerts: true,
  autoCallOnSOS: true,
  autoCallGuardian: true,
  checkInInterval: 30,
  theme: 'dark',
  language: 'en',
  profileName: '',
  bloodGroup: '',
  medicalNotes: '',
  isOnboarded: false,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULTS,

  update: (partial) => {
    set(partial);
    get().save();
  },

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem('@safeher_settings');
      if (raw) set(JSON.parse(raw));
    } catch {}
  },

  save: async () => {
    try {
      const s = get();
      const { update, load, save, ...data } = s;
      await AsyncStorage.setItem('@safeher_settings', JSON.stringify(data));
    } catch {}
  },
}));
