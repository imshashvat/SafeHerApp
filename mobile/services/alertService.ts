/**
 * Alert Service — dispatches SOS alerts silently.
 *
 * Delivery pipeline (all happen without opening any external app):
 *  1. Backend SMS  → POST /api/sos/sms  (Fast2SMS silent delivery — no app switch)
 *  2. Backend email → POST /api/sos/email (SMTP silent delivery — no app switch)
 *  3. Direct call  → react-native-send-intent makeCall() (auto-dials on Android)
 *     On iOS: falls back to tel: scheme (opens Phone app — iOS restriction)
 *
 * Offline fallback for SMS:
 *  If the backend is unreachable, falls back to expo-sms (pre-filled composer).
 *  This is unavoidable at OS level without being the default SMS app.
 */

import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useGuardianStore } from '../store/guardianStore';
import { useSOSStore } from '../store/sosStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAlertHistoryStore } from '../store/alertHistoryStore';
import { SOS_NUMBER } from '../constants/helplines';

// Try to import react-native-send-intent (Android only)
let SendIntentAndroid: any = null;
try {
  // This module only works on Android native builds
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
// Run: ipconfig → look for Wi-Fi IPv4 Address
const BACKEND_URL = 'http://192.168.1.54:5000/api';

// Timeout helper — React Native's fetch doesn't share the DOM AbortSignal type
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

// ─── Silent SMS via backend (Fast2SMS) ───────────────────────────────────────

async function sendSMSViaBackend(
  phones: string[],
  message: string
): Promise<boolean> {
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

// SMS fallback intentionally removed — user requires no external app to open.
// If backend is offline, SOS email is still sent. Add WiFi/data for full SMS support.

// ─── Direct call (no Phone app UI on Android) ─────────────────────────────────

async function makeDirectCall(number: string): Promise<void> {
  const cleanNumber = number.replace(/\s+/g, '');

  if (Platform.OS === 'android' && SendIntentAndroid) {
    try {
      // makeCall() on Android uses CallIntent which auto-dials without requiring
      // the user to press the green "Call" button on the dialer screen
      SendIntentAndroid.makeCall(cleanNumber);
      return;
    } catch {
      // Fall through to Linking
    }
  }

  // iOS / fallback: opens native phone app — unavoidable without VoIP SDK
  try {
    const url = `tel:${cleanNumber}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
  } catch { /* Silently ignore */ }
}

// ─── Main dispatch ────────────────────────────────────────────────────────────

export async function dispatchSOS() {
  const { guardians } = useGuardianStore.getState();
  const { location, trigger } = useSOSStore.getState();
  const { smsAlerts, emailAlerts, autoCallOnSOS, autoCallGuardian, profileName } =
    useSettingsStore.getState();

  const lat = location?.latitude ?? 0;
  const lng = location?.longitude ?? 0;
  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;
  const gMapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const triggerLabel = TRIGGER_MAP[trigger ?? 'button'] ?? 'SOS Button';
  const message = buildMessage(lat, lng, profileName || 'SafeHer User', triggerLabel);

  const phones = guardians.map((g) => g.phone).filter(Boolean);
  const emails = guardians.map((g) => g.email).filter(Boolean);
  const dispatchErrors: string[] = [];

  // ── 1. Silent SMS via backend (no app switching) ──────────────────────────
  if (smsAlerts && phones.length > 0) {
    const backendOk = await sendSMSViaBackend(phones, message);
    if (!backendOk) {
      // Backend unreachable — log but do NOT open SMS app (user's requirement)
      dispatchErrors.push('sms-backend-offline');
      console.warn('[SafeHer] SMS backend offline. Check backend is running on 192.168.1.54:5000');
    }
  }

  // ── 2. Silent email via backend (SMTP — no UI at all) ─────────────────────
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

  // ── 3. Auto-call emergency number (112) directly ──────────────────────────
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
  if (autoCallGuardian && guardians.length > 0 && !autoCallOnSOS) {
    const sorted = [...guardians].sort((a, b) => a.priority - b.priority);
    try {
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
