/**
 * Guardian Store — with SQLite persistence (per-user).
 * Guardians are isolated per user and survive app restarts.
 */

import { create } from 'zustand';
import {
  getGuardians,
  addGuardian as dbAddGuardian,
  removeGuardian as dbRemoveGuardian,
  updateGuardian as dbUpdateGuardian,
  type DbGuardian,
} from '../services/database';

export type Guardian = {
  id: string;
  name: string;
  phone: string;
  email: string;
  relation: string;
  priority: number;
};

type GuardianStore = {
  guardians: Guardian[];
  loaded: boolean;
  userId: number | null;
  load: (userId?: number) => Promise<void>;
  addGuardian: (g: Omit<Guardian, 'id'>) => Promise<void>;
  removeGuardian: (id: string) => void;
  updateGuardian: (id: string, updates: Partial<Guardian>) => void;
  reorder: (list: Guardian[]) => void;
};

function dbToGuardian(row: DbGuardian): Guardian {
  return {
    id: row.id.toString(),
    name: row.name,
    phone: row.phone,
    email: row.email,
    relation: row.relation,
    priority: row.priority,
  };
}

export const useGuardianStore = create<GuardianStore>((set, get) => ({
  guardians: [],
  loaded: false,
  userId: null,

  load: async (userId?: number) => {
    const uid = userId ?? get().userId;
    if (!uid) {
      set({ loaded: true });
      return;
    }

    try {
      const rows = await getGuardians(uid);
      set({ guardians: rows.map(dbToGuardian), loaded: true, userId: uid });
    } catch (err) {
      console.error('GuardianStore: Failed to load', err);
      set({ loaded: true, userId: uid });
    }
  },

  addGuardian: async (g) => {
    const uid = get().userId;
    if (!uid) return;

    try {
      const newId = await dbAddGuardian(uid, g);
      const guardian: Guardian = { ...g, id: newId.toString() };
      set({ guardians: [...get().guardians, guardian] });
    } catch (err) {
      console.error('GuardianStore: Failed to add', err);
    }
  },

  removeGuardian: async (id) => {
    try {
      await dbRemoveGuardian(parseInt(id, 10));
      set({ guardians: get().guardians.filter((x) => x.id !== id) });
    } catch (err) {
      console.error('GuardianStore: Failed to remove', err);
    }
  },

  updateGuardian: async (id, updates) => {
    try {
      await dbUpdateGuardian(parseInt(id, 10), updates);
      const updated = get().guardians.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      );
      set({ guardians: updated });
    } catch (err) {
      console.error('GuardianStore: Failed to update', err);
    }
  },

  reorder: (list) => {
    set({ guardians: list });
    // Priority reorder is in-memory only for performance
  },
}));
