/**
 * backgroundService.ts — Foreground Service Keep-Alive
 *
 * How it works on Android (native build only):
 *  1. Shows a persistent LOW-priority notification in the status bar
 *  2. This upgrades the app process to "foreground service" priority
 *  3. Android will NOT kill foreground services (unlike background apps)
 *  4. The React Native JS thread stays alive → all our hooks keep running:
 *     - useShakeDetection: accelerometer still fires
 *     - useVoiceDetection: microphone polling still runs
 *     - useSOSDispatch:    SOS is dispatched silently (no UI needed)
 *
 * Result: even with screen OFF, SafeHer detects shake/voice and sends SOS.
 *
 * NOTE: This does NOT work in Expo Go (SDK 53+).
 *       Requires a development build: npx expo run:android
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'safeher_background';
const NOTIFICATION_ID = 'safeher-foreground-service';

/**
 * Creates the notification channel and shows the persistent foreground
 * service notification. Call this once on app start.
 */
export async function startForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // 1. Request notification permission
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[SafeHer] Notification permission denied — background detection may be killed by OS');
      return;
    }

    // 2. Create a LOW priority notification channel
    //    LOW = no sound/vibration, but persists in status bar
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'SafeHer Background Guard',
      importance: Notifications.AndroidImportance.LOW,
      showBadge: false,
      sound: null,
      vibrationPattern: null,
    });

    // 3. Show the sticky foreground notification
    //    This is what keeps Android from killing the app when screen is off
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: '🛡️ SafeHer is guarding you',
        body: 'Shake detection & voice alert active. Tap to open.',
        // Android-specific: make it sticky and non-dismissible
        sticky: true,
        autoDismiss: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
        // Use the background channel
        data: { type: 'foreground-service' },
      } as any,
      trigger: null, // Show immediately, no schedule
    });

    console.log('[SafeHer] Foreground service notification started');
  } catch (err) {
    console.warn('[SafeHer] Could not start foreground service:', err);
  }
}

/**
 * Removes the foreground service notification.
 * Call this if the user explicitly quits SafeHer.
 */
export async function stopForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
  } catch { /* already gone */ }
}

/**
 * Sets the notification handler to suppress all notification sounds/alerts
 * that we trigger (we only want silent foreground service behavior).
 */
export function configureSilentNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Only suppress our own foreground service notification
      if (notification.request.content.data?.type === 'foreground-service') {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }
      // Other notifications (if any) show normally
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
}
