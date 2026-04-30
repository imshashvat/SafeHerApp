/**
 * backgroundTasks.ts — Background monitoring
 *
 * Uses only expo-task-manager (already installed) for background location.
 * Check-in monitoring runs via an interval inside the foreground service
 * (works while app is in memory / screen off with notification visible).
 *
 * Note: expo-background-fetch (for truly-closed-app monitoring) requires
 * a new APK build. Current implementation covers screen-off + background.
 */

import * as TaskManager from 'expo-task-manager';
import * as Location    from 'expo-location';
import AsyncStorage     from '@react-native-async-storage/async-storage';

export const LOCATION_TASK = 'SAFEHER_BACKGROUND_LOCATION';

// ─── Background Location Task ─────────────────────────────────────────────────
// Keeps GPS fresh for SOS even when screen is off

TaskManager.defineTask(LOCATION_TASK, ({ data, error }: any) => {
  if (error) { console.error('[SafeHer] BG location error:', error.message); return; }
  if (data?.locations?.length) {
    const { latitude, longitude } = data.locations[0].coords;
    try {
      const { useSOSStore } = require('../store/sosStore');
      useSOSStore.getState().setLocation({ latitude, longitude });
    } catch { /* ignore */ }
  }
});

// ─── Check-in State Helpers ───────────────────────────────────────────────────

const CHECKIN_KEY = 'SAFEHER_CHECKIN';

export async function saveCheckinState(enabled: boolean, deadlineMs: number): Promise<void> {
  await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify({ enabled, deadlineMs, triggered: false }));
}

export async function clearCheckinState(): Promise<void> {
  await AsyncStorage.removeItem(CHECKIN_KEY);
}

export async function getCheckinState(): Promise<{ enabled: boolean; deadlineMs: number; triggered: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(CHECKIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Mark check-in as triggered so we don't spam SOS */
export async function markCheckinTriggered(): Promise<void> {
  const state = await getCheckinState();
  if (state) {
    await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify({ ...state, triggered: true }));
  }
}

// ─── Registration ─────────────────────────────────────────────────────────────

/** Register background location updates. Call once after permissions granted. */
export async function registerBackgroundTasks(): Promise<void> {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[SafeHer] Background location permission denied');
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy:              Location.Accuracy.Balanced,
        timeInterval:          30_000,   // every 30 seconds
        distanceInterval:      30,       // or every 30m movement
        showsBackgroundLocationIndicator: false,
        foregroundService: {
          notificationTitle: '🛡️ SafeHer is protecting you',
          notificationBody:  'Shake detection active. Tap to open.',
          notificationColor: '#FF3366',
        },
      });
      console.log('[SafeHer] Background location registered');
    }
  } catch (err) {
    console.warn('[SafeHer] Background task registration failed:', err);
  }
}

/** Stop background location updates */
export async function unregisterBackgroundTasks(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (isRegistered) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  } catch { /* ignore */ }
}
