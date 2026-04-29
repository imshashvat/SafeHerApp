/**
 * alertService.ts — dispatches SOS alerts silently.
 *
 * Delivery pipeline (all happen without opening any external app):
 *  1. Backend SMS  → POST /api/sos/sms  (Fast2SMS silent delivery)
 *  2. Backend email → POST /api/sos/email (SMTP silent delivery)
 *  3. Direct call  → tel: URL scheme (most reliable across Expo builds)
 *
 * SOS Live Location: If location is null at dispatch time, does an emergency
 * 5-second GPS fetch before sending alerts.
 */

import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useGuardianStore } from '../store/guardianStore';
import { useSOSStore } from '../store/sosStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAlertHistoryStore } from '../store/alertHistoryStore';
import { SOS_NUMBER } from '../constants/helplines';

// Try to import react-native-send-intent (Android only)
let SendIntentAndroid: any = null;
try {
  SendIntentAndroid = require('react-native-send-intent').default;
} catch {
  // Not available in Expo Go — will fall back to Linking
}

type TriggerType = 'SOS Button' | 'Shake Detected' | 'Fall Detected' | 'Voice Keyword';

const TRIGGER_MAP: Record<string, TriggerType> = {
  button: 'SOS Button',
  shake: 'Shake Detected',
  fall: 'Fall Detected',
  voice: 'Voice Keyword',
};

// Backend base URL — update to your machine's WiFi IP
const BACKEND_URL = 'http://192.168.1.54:5000/api';

// Timeout helper
const fetchWithTimeout = (url: string, options: RequestInit, ms = 8000): Promise<Response> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  );
  return Promise.race([fetch(url, options), timeout]);
};

function buildMessage(
  lat: number,
  lng: number,
  profileName: string,
  triggerLabel: string
): string {
  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;
  const gMapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  return (
    `🆘 EMERGENCY ALERT from SafeHer!\n\n` +
    `${profileName || 'Someone'} needs help immediately!\n\n` +
    `📍 Live Location:\n` +
    `  OSM: ${osmLink}\n` +
    `  Maps: ${gMapsLink}\n\n` +
    `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n` +
    `Time: ${time}\n` +
    `Triggered: ${triggerLabel}\n\n` +
    `⚠️ Please call them or dial 112 immediately!`
  );
}

// ─── Silent SMS via backend ───────────────────────────────────────────────────

async function sendSMSViaBackend(phones: string[], message: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${BACKEND_URL}/sos/sms`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones, message }),
      },
      8000
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Direct call — most reliable method ──────────────────────────────────────

export async function makeDirectCall(number: string): Promise<void> {
  const cleanNumber = number.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  const telUrl = `tel:${cleanNumber}`;

  // Try SendIntentAndroid first (auto-dials without pressing Call button)
  if (Platform.OS === 'android' && SendIntentAndroid) {
    try {
      SendIntentAndroid.makeCall(cleanNumber);
      return;
    } catch {
      // Fall through to Linking
    }
  }

  // Universal fallback: tel: URL — works on all platforms, opens phone dialer
  try {
    const canOpen = await Linking.canOpenURL(telUrl);
    if (canOpen) {
      await Linking.openURL(telUrl);
    }
  } catch {
    // Silently ignore
  }
}

// ─── Emergency GPS fetch (fallback when location not yet available) ───────────

async function fetchEmergencyLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);

    if (!loc) return null;
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return null;
  }
}

// ─── Main dispatch ────────────────────────────────────────────────────────────

export async function dispatchSOS() {
  const { guardians } = useGuardianStore.getState();
  let { location } = useSOSStore.getState();
  const { trigger } = useSOSStore.getState();
  const { smsAlerts, emailAlerts, autoCallOnSOS, autoCallGuardian, profileName } =
    useSettingsStore.getState();

  // ── Emergency GPS fallback if location not yet available ──────────────────
  if (!location || (location.latitude === 0 && location.longitude === 0)) {
    const emergencyLoc = await fetchEmergencyLocation();
    if (emergencyLoc) {
      useSOSStore.getState().setLocation(emergencyLoc);
      location = emergencyLoc;
    }
  }

  const lat = location?.latitude ?? 0;
  const lng = location?.longitude ?? 0;
  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;
  const gMapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const triggerLabel = TRIGGER_MAP[trigger ?? 'button'] ?? 'SOS Button';
  const message = buildMessage(lat, lng, profileName || 'SafeHer User', triggerLabel);

  const phones = guardians.map((g) => g.phone).filter(Boolean);
  const emails = guardians.map((g) => g.email).filter(Boolean);
  const dispatchErrors: string[] = [];

  // ── 1. Silent SMS via backend ─────────────────────────────────────────────
  if (smsAlerts && phones.length > 0) {
    const backendOk = await sendSMSViaBackend(phones, message);
    if (!backendOk) {
      dispatchErrors.push('sms-backend-offline');
    }
  }

  // ── 2. Silent email via backend ───────────────────────────────────────────
  if (emailAlerts && emails.length > 0) {
    try {
      await fetchWithTimeout(
        `${BACKEND_URL}/sos/email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emails,
            location_url: gMapsLink,
            osm_url: osmLink,
            time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            sender_name: profileName || 'SafeHer User',
          }),
        },
        8000
      );
    } catch {
      dispatchErrors.push('email');
    }
  }

  // ── 3. Auto-call emergency number (112) ───────────────────────────────────
  let callMade = false;
  if (autoCallOnSOS) {
    try {
      await makeDirectCall(SOS_NUMBER);
      callMade = true;
    } catch {
      dispatchErrors.push('call-112');
    }
  }

  // ── 4. Auto-call first priority guardian ─────────────────────────────────
  if (autoCallGuardian && guardians.length > 0) {
    const sorted = [...guardians].sort((a, b) => a.priority - b.priority);
    try {
      // Small delay so 112 call has time to connect before guardian call
      if (autoCallOnSOS) {
        await new Promise(r => setTimeout(r, 3000));
      }
      await makeDirectCall(sorted[0].phone);
      callMade = true;
    } catch {
      dispatchErrors.push('call-guardian');
    }
  }

  // ── 5. Log to alert history ───────────────────────────────────────────────
  useAlertHistoryStore.getState().addAlert({
    trigger: triggerLabel,
    timestamp: Date.now(),
    latitude: lat || null,
    longitude: lng || null,
    location: lat ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Unknown',
    status: 'sent',
    sentTo: phones.length + emails.length,
    guardianNames: guardians.map((g) => g.name),
  });

  useSOSStore.getState().confirmSOS();

  const noGuardians = guardians.length === 0;

  return {
    success: true,
    noGuardians,
    smsTo: phones,
    emailedTo: emails,
    callMade,
    errors: dispatchErrors,
  };
}

/** Convenience wrapper for quick in-app calls (helpline buttons etc.) */
export async function quickCall(number: string): Promise<void> {
  await makeDirectCall(number);
}

/** Legacy alias */
export const autoCall = makeDirectCall;
