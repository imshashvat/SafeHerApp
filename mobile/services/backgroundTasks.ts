/**
 * backgroundTasks.ts — Background monitoring using expo-task-manager
 *
 * What runs in background (even with screen off, app minimized):
 *  1. CHECK_IN task: runs every ~15 min, detects missed check-ins → sends SOS
 *  2. LOCATION task: continuous background GPS for route safety
 *
 * Shake detection while app is OPEN (screen off but app in memory): ✅ Works
 * Shake detection while app is FULLY CLOSED: ❌ Not possible in managed Expo
 *   → The foreground service notification in backgroundService.ts keeps the app
 *     alive when screen is off (not killed). As long as the notification is
 *     visible, shake/voice detection hooks continue running.
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export const CHECKIN_TASK   = 'SAFEHER_CHECKIN_MONITOR';
export const LOCATION_TASK  = 'SAFEHER_BACKGROUND_LOCATION';

// ─── Check-in Monitor Task ────────────────────────────────────────────────────
// Fires every 15 minutes in background. Checks if check-in timer has expired.

TaskManager.defineTask(CHECKIN_TASK, async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    // Read check-in state from storage
    const raw = await AsyncStorage.getItem('SAFEHER_CHECKIN');
    if (!raw) return BackgroundFetch.BackgroundFetchResult.NoData;

    const { enabled, deadlineMs, triggered } = JSON.parse(raw);
    if (!enabled || triggered) return BackgroundFetch.BackgroundFetchResult.NoData;

    const now = Date.now();
    if (now >= deadlineMs) {
      // Check-in MISSED — send vibration notification immediately
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ SafeHer Check-In MISSED',
          body: 'You missed your safety check-in. Sending emergency alert to guardians...',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 200, 500, 200, 500],
          sound: true,
        } as any,
        trigger: null,
      });

      // Mark as triggered so we don't spam
      await AsyncStorage.setItem('SAFEHER_CHECKIN', JSON.stringify({ enabled, deadlineMs, triggered: true }));

      // Dispatch SOS silently (imported dynamically to avoid circular deps)
      const { dispatchSOS } = require('./alertService');
      await dispatchSOS();

      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.error('[SafeHer Background] Check-in task error:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Background Location Task ─────────────────────────────────────────────────

TaskManager.defineTask(LOCATION_TASK, ({ data, error }: any) => {
  if (error) { console.error('[SafeHer] Background location error:', error); return; }
  if (data) {
    const { locations } = data;
    const latest = locations?.[0];
    if (latest) {
      // Update SOS store location so SOS always has fresh coords
      const { useSOSStore } = require('../store/sosStore');
      useSOSStore.getState().setLocation({
        latitude:  latest.coords.latitude,
        longitude: latest.coords.longitude,
      });
    }
  }
});

// ─── Registration ─────────────────────────────────────────────────────────────

/** Call this once on app start (after permissions granted) */
export async function registerBackgroundTasks(): Promise<void> {
  // 1. Register check-in background fetch (15 min minimum on Android)
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
      await BackgroundFetch.registerTaskAsync(CHECKIN_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,   // Keep running after app is closed
        startOnBoot: true,        // Restart after phone reboots
      });
      console.log('[SafeHer] Check-in background task registered');
    }
  } catch (err) {
    console.warn('[SafeHer] BackgroundFetch registration failed:', err);
  }

  // 2. Register background location (for SOS GPS accuracy)
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status === 'granted') {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
      if (!isRegistered) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK, {
          accuracy:           Location.Accuracy.Balanced,
          timeInterval:       30_000, // every 30 seconds
          distanceInterval:   50,     // or every 50m movement
          showsBackgroundLocationIndicator: false,
          foregroundService: {
            notificationTitle: '🛡️ SafeHer is protecting you',
            notificationBody:  'Location active for emergency alerts',
            notificationColor: '#FF3366',
          },
        });
        console.log('[SafeHer] Background location task registered');
      }
    }
  } catch (err) {
    console.warn('[SafeHer] Background location registration failed:', err);
  }
}

/** Save check-in state to AsyncStorage so background task can read it */
export async function saveCheckinState(enabled: boolean, deadlineMs: number): Promise<void> {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.setItem('SAFEHER_CHECKIN', JSON.stringify({ enabled, deadlineMs, triggered: false }));
}

/** Clear check-in state when user checks in */
export async function clearCheckinState(): Promise<void> {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.removeItem('SAFEHER_CHECKIN');
}
