/**
 * Alert History Store — Real SOS dispatch log
 * Persisted to SQLite so history survives app restarts.
 * Per-user isolation via userId.
 */

import { create } from 'zustand';
import {
  getAlertHistory,
  addAlertLog,
  clearAlertHistory as dbClearHistory,
  type DbAlertLog,
} from '../services/database';

export type AlertLog = {
  id: string;
  trigger: 'SOS Button' | 'Shake Detected' | 'Fall Detected' | 'Voice Keyword';
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  location: string;
  status: 'sent' | 'cancelled';
  sentTo: number;
  guardianNames: string[];
};

type AlertHistoryState = {
  alerts: AlertLog[];
  loaded: boolean;
  userId: number | null;
  load: (userId?: number) => Promise<void>;
  addAlert: (alert: Omit<AlertLog, 'id'>) => void;
  clearHistory: () => void;
};

function dbToAlert(row: DbAlertLog): AlertLog {
  let guardianNames: string[] = [];
  try {
    guardianNames = JSON.parse(row.guardian_names);
  } catch { /* empty */ }

  return {
    id: row.id.toString(),
    trigger: row.trigger_type as AlertLog['trigger'],
    timestamp: row.timestamp,
    latitude: row.latitude,
    longitude: row.longitude,
    location: row.location,
    status: row.status as 'sent' | 'cancelled',
    sentTo: row.sent_to,
    guardianNames,
  };
}

export const useAlertHistoryStore = create<AlertHistoryState>((set, get) => ({
  alerts: [],
  loaded: false,
  userId: null,

  load: async (userId?: number) => {
    const uid = userId ?? get().userId;
    if (!uid) {
      set({ loaded: true });
      return;
    }

    try {
      const rows = await getAlertHistory(uid);
      set({ alerts: rows.map(dbToAlert), loaded: true, userId: uid });
    } catch (err) {
      console.error('AlertHistory: Failed to load', err);
      set({ loaded: true, userId: uid });
    }
  },

  addAlert: async (alertData) => {
    const uid = get().userId;
    if (!uid) return;

    try {
      const newId = await addAlertLog(uid, {
        trigger: alertData.trigger,
        timestamp: alertData.timestamp,
        latitude: alertData.latitude,
        longitude: alertData.longitude,
        location: alertData.location,
        status: alertData.status,
        sentTo: alertData.sentTo,
        guardianNames: alertData.guardianNames,
      });

      const newAlert: AlertLog = {
        ...alertData,
        id: newId.toString(),
      };
      set({ alerts: [newAlert, ...get().alerts].slice(0, 100) });
    } catch (err) {
      console.error('AlertHistory: Failed to add', err);
    }
  },

  clearHistory: async () => {
    const uid = get().userId;
    if (!uid) return;

    try {
      await dbClearHistory(uid);
      set({ alerts: [] });
    } catch (err) {
      console.error('AlertHistory: Failed to clear', err);
    }
  },
}));
