import { create } from 'zustand';

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
  addGuardian: (g: Guardian) => void;
  removeGuardian: (id: string) => void;
  updateGuardian: (id: string, updates: Partial<Guardian>) => void;
  reorder: (list: Guardian[]) => void;
};

export const useGuardianStore = create<GuardianStore>((set) => ({
  guardians: [],
  addGuardian: (g) => set((s) => ({ guardians: [...s.guardians, g] })),
  removeGuardian: (id) =>
    set((s) => ({ guardians: s.guardians.filter((x) => x.id !== id) })),
  updateGuardian: (id, updates) =>
    set((s) => ({
      guardians: s.guardians.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    })),
  reorder: (list) => set({ guardians: list }),
}));
