import { useEffect, useRef } from 'react';
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

  // Use refs for reactive values to avoid effect re-fires
  const statusRef = useRef(useSOSStore.getState().status);
  const startCountdownRef = useRef(useSOSStore.getState().startCountdown);
  const fallDetectionRef = useRef(useSettingsStore.getState().fallDetection);

  // Sync refs with store changes
  useEffect(() => {
    const unsub1 = useSOSStore.subscribe((state) => {
      statusRef.current = state.status;
      startCountdownRef.current = state.startCountdown;
    });
    const unsub2 = useSettingsStore.subscribe((state) => {
      fallDetectionRef.current = state.fallDetection;
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    Accelerometer.setUpdateInterval(50);
    Gyroscope.setUpdateInterval(50);

    accelSubRef.current = Accelerometer.addListener((data) => {
      accelRef.current = data;

      if (!fallDetectionRef.current) return;

      const { x, y, z } = data;
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
        statusRef.current === 'idle'
      ) {
        freeFallTimeRef.current = 0;
        startCountdownRef.current('fall');
      }
    });

    gyroSubRef.current = Gyroscope.addListener((data) => {
      gyroRef.current = data;
    });

    return () => {
      accelSubRef.current?.remove();
      gyroSubRef.current?.remove();
    };
  }, []); // Empty deps — refs handle all reactive values
}
