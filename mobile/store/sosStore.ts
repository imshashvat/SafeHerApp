import { create } from 'zustand';

export type SOSStatus =
  | 'idle'
  | 'countdown'
  | 'active'
  | 'cancelled'
  | 'sent';

type SOSLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type DispatchResult = {
  emailedTo: string[];
  smsTo: string[];
  callMade: boolean;
  errors: string[];
  noGuardians: boolean;
};

type SOSStore = {
  status: SOSStatus;
  trigger: 'button' | 'shake' | 'fall' | 'voice' | null;
  location: SOSLocation | null;
  countdownSeconds: number;
  videoUri: string | null;
  dispatchResult: DispatchResult | null;

  startCountdown: (trigger: SOSStore['trigger']) => void;
  cancelSOS: () => void;
  confirmSOS: () => void;
  setLocation: (loc: SOSLocation) => void;
  setVideoUri: (uri: string) => void;
  tickCountdown: () => void;
  setDispatchResult: (result: DispatchResult) => void;
  reset: () => void;
};

export const useSOSStore = create<SOSStore>((set, get) => ({
  status: 'idle',
  trigger: null,
  location: null,
  countdownSeconds: 10,
  videoUri: null,
  dispatchResult: null,

  startCountdown: (trigger) =>
    set({ status: 'countdown', trigger, countdownSeconds: 10, dispatchResult: null }),

  cancelSOS: () => set({ status: 'cancelled', countdownSeconds: 10 }),

  confirmSOS: () => set({ status: 'active' }),

  setLocation: (location) => set({ location }),

  setVideoUri: (uri) => set({ videoUri: uri }),

  setDispatchResult: (result) => set({ dispatchResult: result }),

  tickCountdown: () => {
    const { countdownSeconds } = get();
    if (countdownSeconds <= 1) {
      set({ status: 'active', countdownSeconds: 0 });
    } else {
      set({ countdownSeconds: countdownSeconds - 1 });
    }
  },

  reset: () =>
    set({
      status: 'idle',
      trigger: null,
      location: null,
      countdownSeconds: 10,
      videoUri: null,
      dispatchResult: null,
    }),
}));
