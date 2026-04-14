import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { useSOSStore } from '../store/sosStore';
import { useSettingsStore } from '../store/settingsStore';

const FREE_FALL_THRESHOLD = 0.4;   // near 0G = falling
const IMPACT_THRESHOLD = 3.5;      // sudden high G = impact after fall
const GYRO_THRESHOLD = 6.0;        // rapid rotation during fall

export function useFallDetection() {
  const accelRef = useRef({ x: 0, y: 0, z: 0 });
  const gyroRef = useRef({ x: 0, y: 0, z: 0 });
  const freeFallTimeRef = useRef<number>(0);
  const accelSubRef = useRef<any>(null);
  const gyroSubRef = useRef<any>(null);
  const { startCountdown, status } = useSOSStore();
  const { fallDetection } = useSettingsStore();

  const checkFall = useCallback(() => {
    const { x, y, z } = accelRef.current;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    if (magnitude < FREE_FALL_THRESHOLD) {
      freeFallTimeRef.current = now;
    }

    const timeSinceFall = now - freeFallTimeRef.current;
    const { x: gx, y: gy, z: gz } = gyroRef.current;
    const gyroMag = Math.sqrt(gx * gx + gy * gy + gz * gz);

    if (
      timeSinceFall > 100 &&
      timeSinceFall < 1500 &&
      (magnitude > IMPACT_THRESHOLD || gyroMag > GYRO_THRESHOLD) &&
      status === 'idle'
    ) {
      freeFallTimeRef.current = 0;
      startCountdown('fall');
    }
  }, [status, startCountdown]);

  const start = useCallback(() => {
    if (!fallDetection) return;

    Accelerometer.setUpdateInterval(50);
    Gyroscope.setUpdateInterval(50);

    accelSubRef.current = Accelerometer.addListener((data) => {
      accelRef.current = data;
      checkFall();
    });
    gyroSubRef.current = Gyroscope.addListener((data) => {
      gyroRef.current = data;
    });
  }, [fallDetection, checkFall]);

  const stop = useCallback(() => {
    accelSubRef.current?.remove();
    gyroSubRef.current?.remove();
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);
}
