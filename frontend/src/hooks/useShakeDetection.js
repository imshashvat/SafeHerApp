/**
 * useShakeDetection — Detects device shake via DeviceMotionEvent
 * Threshold: 15 m/s² (spec requirement)
 * Shake count: 5 shakes within 3 seconds triggers callback
 */
import { useEffect, useRef, useCallback } from 'react';

const SHAKE_THRESHOLD = 15;   // m/s²
const SHAKE_COUNT_NEEDED = 5; // consecutive shakes
const SHAKE_WINDOW_MS = 3000; // 3-second window

export default function useShakeDetection(onShake, enabled = true) {
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const shakeTimestamps = useRef([]);

  const handleMotion = useCallback((event) => {
    if (!enabled) return;
    const accel = event.accelerationIncludingGravity;
    if (!accel) return;

    const { x = 0, y = 0, z = 0 } = accel;
    const prev = lastAccel.current;

    const delta = Math.sqrt(
      Math.pow(x - prev.x, 2) +
      Math.pow(y - prev.y, 2) +
      Math.pow(z - prev.z, 2)
    );

    lastAccel.current = { x, y, z };

    if (delta > SHAKE_THRESHOLD) {
      const now = Date.now();
      // Remove old timestamps outside the window
      shakeTimestamps.current = shakeTimestamps.current.filter(
        t => now - t < SHAKE_WINDOW_MS
      );
      shakeTimestamps.current.push(now);

      if (shakeTimestamps.current.length >= SHAKE_COUNT_NEEDED) {
        shakeTimestamps.current = []; // reset counter
        onShake?.();
      }
    }
  }, [enabled, onShake]);

  useEffect(() => {
    if (!enabled) return;

    // Request iOS 13+ permission
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(state => {
        if (state === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
        }
      }).catch(() => {});
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [handleMotion, enabled]);
}
