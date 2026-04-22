import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useSOSStore } from '../store/sosStore';
import { useSettingsStore } from '../store/settingsStore';

// Sensitivity map: 1=very low → 5=very high
// Lower values = harder to trigger. Walking ≈ 1.2G, vigorous shake ≈ 3-5G.
const THRESHOLDS = [5.0, 4.0, 3.0, 2.5, 2.0];

// How many readings above threshold needed within the time window
const CONSECUTIVE_NEEDED = 3;

// Time window (ms) — 3 readings at 100ms intervals fits comfortably
const WINDOW_MS = 800;

// Cooldown after a shake triggers (ms)
const COOLDOWN_MS = 6000;

export function useShakeDetection() {
  const subRef = useRef<any>(null);
  const lastShakeRef = useRef<number>(0);
  const hitTimesRef = useRef<number[]>([]);

  // Use refs for values that change frequently to avoid effect re-fires
  const statusRef = useRef(useSOSStore.getState().status);
  const startCountdownRef = useRef(useSOSStore.getState().startCountdown);
  const thresholdRef = useRef(THRESHOLDS[2]); // default medium

  // Sync refs with store changes (no effect re-fire needed)
  useEffect(() => {
    const unsub1 = useSOSStore.subscribe((state) => {
      statusRef.current = state.status;
      startCountdownRef.current = state.startCountdown;
    });
    const unsub2 = useSettingsStore.subscribe((state) => {
      thresholdRef.current = THRESHOLDS[Math.min(state.shakeSensitivity - 1, 4)];
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    // 100ms polling — fast enough to catch 3 readings in 800ms
    Accelerometer.setUpdateInterval(100);

    subRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      // Only check when idle and cooldown has passed
      if (statusRef.current !== 'idle') return;
      if (now - lastShakeRef.current < COOLDOWN_MS) return;

      if (magnitude > thresholdRef.current) {
        // Record this hit
        hitTimesRef.current.push(now);

        // Remove hits outside our time window
        hitTimesRef.current = hitTimesRef.current.filter(
          (t) => now - t <= WINDOW_MS
        );

        // Fire if we've had enough hits within the window
        if (hitTimesRef.current.length >= CONSECUTIVE_NEEDED) {
          hitTimesRef.current = [];
          lastShakeRef.current = now;
          startCountdownRef.current('shake');
        }
      } else {
        // Below threshold — clear if too much time has passed
        if (
          hitTimesRef.current.length > 0 &&
          now - hitTimesRef.current[hitTimesRef.current.length - 1] > WINDOW_MS
        ) {
          hitTimesRef.current = [];
        }
      }
    });

    return () => {
      subRef.current?.remove();
      subRef.current = null;
      hitTimesRef.current = [];
    };
  }, []); // Empty deps — refs handle all reactive values
}
