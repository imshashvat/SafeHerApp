import { create } from 'zustand';
import {
  getUserSettings,
  saveUserSettings,
  updateUserProfile,
  getUserById,
} from '../services/database';

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
  mapTheme: 'light' | 'dark';
  appTheme: 'light' | 'dark';     // app-wide UI theme
  language: 'en' | 'hi';
  profileName: string;
  bloodGroup: string;
  medicalNotes: string;
  isOnboarded: boolean;
};

type SettingsStore = Settings & {
  loaded: boolean;
  userId: number | null;
  update: (partial: Partial<Settings>) => void;
  load: (userId?: number) => Promise<void>;
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
  mapTheme: 'light',
  appTheme: 'dark',
  language: 'en',
  profileName: '',
  bloodGroup: '',
  medicalNotes: '',
  isOnboarded: false,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULTS,
  loaded: false,
  userId: null,

  update: (partial) => {
    set(partial);
    get().save();
  },

  load: async (userId?: number) => {
    const uid = userId ?? get().userId;
    if (!uid) {
      set({ loaded: true });
      return;
    }

    try {
      const dbSettings = await getUserSettings(uid);
      const user = await getUserById(uid);

      if (dbSettings) {
        set({
          userId: uid,
          shakeSensitivity: dbSettings.shake_sensitivity,
          fallDetection: !!dbSettings.fall_detection,
          voiceKeyword: !!dbSettings.voice_keyword,
          autoVideoRecord: !!dbSettings.auto_video_record,
          smsAlerts: !!dbSettings.sms_alerts,
          emailAlerts: !!dbSettings.email_alerts,
          autoCallOnSOS: !!dbSettings.auto_call_sos,
          autoCallGuardian: !!dbSettings.auto_call_guardian,
          checkInInterval: dbSettings.check_in_interval,
          mapTheme: (dbSettings.map_theme as 'light' | 'dark') || 'light',
          appTheme: ((dbSettings as any).app_theme as 'light' | 'dark') || 'dark',
          language: (dbSettings.language as 'en' | 'hi') || 'en',
          isOnboarded: !!dbSettings.is_onboarded,
          profileName: user?.name ?? '',
          bloodGroup: user?.blood_group ?? '',
          medicalNotes: user?.medical_notes ?? '',
          loaded: true,
        });
      } else {
        set({
          userId: uid,
          profileName: user?.name ?? '',
          bloodGroup: user?.blood_group ?? '',
          medicalNotes: user?.medical_notes ?? '',
          loaded: true,
        });
      }
    } catch (err) {
      console.error('SettingsStore: Failed to load', err);
      set({ loaded: true, userId: uid });
    }
  },

  save: async () => {
    const s = get();
    if (!s.userId) return;

    try {
      await saveUserSettings(s.userId, {
        shake_sensitivity: s.shakeSensitivity,
        fall_detection: s.fallDetection ? 1 : 0,
        voice_keyword: s.voiceKeyword ? 1 : 0,
        auto_video_record: s.autoVideoRecord ? 1 : 0,
        sms_alerts: s.smsAlerts ? 1 : 0,
        email_alerts: s.emailAlerts ? 1 : 0,
        auto_call_sos: s.autoCallOnSOS ? 1 : 0,
        auto_call_guardian: s.autoCallGuardian ? 1 : 0,
        check_in_interval: s.checkInInterval,
        map_theme: s.mapTheme,
        app_theme: s.appTheme,
        language: s.language,
        is_onboarded: s.isOnboarded ? 1 : 0,
      });

      // Also update profile fields on user record
      await updateUserProfile(s.userId, {
        name: s.profileName,
        blood_group: s.bloodGroup,
        medical_notes: s.medicalNotes,
      });
    } catch (err) {
      console.error('SettingsStore: Failed to save', err);
    }
  },
}));
