import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useSOSStore } from '../store/sosStore';
import { useSettingsStore } from '../store/settingsStore';

// Sensitivity map: 1=low → 5=very high
const THRESHOLDS = [4.0, 3.2, 2.5, 1.9, 1.4];

export function useShakeDetection() {
  const subRef = useRef<any>(null);
  const lastShakeRef = useRef<number>(0);
  const { startCountdown, status } = useSOSStore();
  const { shakeSensitivity } = useSettingsStore();

  const threshold = THRESHOLDS[Math.min(shakeSensitivity - 1, 4)];

  const start = useCallback(() => {
    Accelerometer.setUpdateInterval(100);
    subRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (
        magnitude > threshold &&
        now - lastShakeRef.current > 2000 &&
        status === 'idle'
      ) {
        lastShakeRef.current = now;
        startCountdown('shake');
      }
    });
  }, [threshold, status, startCountdown]);

  const stop = useCallback(() => {
    subRef.current?.remove();
    subRef.current = null;
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return { start, stop };
}
