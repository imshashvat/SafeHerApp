import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useSOSStore } from '../store/sosStore';
import { useSettingsStore } from '../store/settingsStore';

// Sensitivity map: 1=very low → 5=very high
// These are G-force magnitudes. Normal walking ≈ 1.5G, hard shake ≈ 4-6G.
// Raised all values to prevent false triggers from table vibrations/walking.
const THRESHOLDS = [6.5, 5.5, 4.5, 3.5, 2.8];

// How many consecutive readings above threshold needed
// Increased from 3→5 to require sustained shaking, not a single jolt
const CONSECUTIVE_NEEDED = 5;

// How long (ms) those readings must happen within
// Tightened from 600→400ms — real panic shake is rapid and intense
const WINDOW_MS = 400;

// Cooldown after a shake triggers (ms)
const COOLDOWN_MS = 6000;

export function useShakeDetection() {
  const subRef = useRef<any>(null);
  const lastShakeRef = useRef<number>(0);
  const hitTimesRef = useRef<number[]>([]); // timestamps of threshold-exceeding readings
  const { startCountdown, status } = useSOSStore();
  const { shakeSensitivity } = useSettingsStore();

  const threshold = THRESHOLDS[Math.min(shakeSensitivity - 1, 4)];

  const start = useCallback(() => {
    // 200ms polling → less battery drain than 100ms, still responsive
    Accelerometer.setUpdateInterval(150);

    subRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      // Only check when idle and cooldown has passed
      if (status !== 'idle') return;
      if (now - lastShakeRef.current < COOLDOWN_MS) return;

      if (magnitude > threshold) {
        // Record this hit
        hitTimesRef.current.push(now);

        // Remove hits outside our time window
        hitTimesRef.current = hitTimesRef.current.filter(
          (t) => now - t <= WINDOW_MS
        );

        // Only fire if we've had enough consecutive hits
        if (hitTimesRef.current.length >= CONSECUTIVE_NEEDED) {
          hitTimesRef.current = [];
          lastShakeRef.current = now;
          startCountdown('shake');
        }
      } else {
        // Below threshold — clear the window if too much time has passed
        if (
          hitTimesRef.current.length > 0 &&
          now - hitTimesRef.current[hitTimesRef.current.length - 1] > WINDOW_MS
        ) {
          hitTimesRef.current = [];
        }
      }
    });
  }, [threshold, status, startCountdown]);

  const stop = useCallback(() => {
    subRef.current?.remove();
    subRef.current = null;
    hitTimesRef.current = [];
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return { start, stop };
}
