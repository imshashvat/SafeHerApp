/**
 * alertService.ts — dispatches SOS alerts silently.
 *
 * Delivery pipeline (all happen without opening any external app):
 *  1. SMS  → Fast2SMS API (India, direct — no backend server needed)
 *  2. Email → EmailJS SDK  (client-side — no backend server needed)
 *  3. Call  → tel: URL with CALL_PHONE permission (auto-dials on Android)
 */

import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useGuardianStore }    from '../store/guardianStore';
import { useSOSStore }         from '../store/sosStore';
import { useSettingsStore }    from '../store/settingsStore';
import { useAlertHistoryStore }from '../store/alertHistoryStore';
import { useAuthStore }        from '../store/authStore';
import { SOS_NUMBER }          from '../constants/helplines';

type TriggerType = 'SOS Button' | 'Shake Detected' | 'Fall Detected' | 'Voice Keyword';

const TRIGGER_MAP: Record<string, TriggerType> = {
  button: 'SOS Button',
  shake:  'Shake Detected',
  fall:   'Fall Detected',
  voice:  'Voice Keyword',
};

// ─── API Keys (set these in mobile/.env) ─────────────────────────────────────
// Fast2SMS:  https://www.fast2sms.com → API key from dashboard
// EmailJS:   https://www.emailjs.com  → service_id / template_id / public_key

const FAST2SMS_KEY      = process.env.EXPO_PUBLIC_FAST2SMS_KEY      ?? '';
const EMAILJS_SERVICE   = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID ?? '';
const EMAILJS_TEMPLATE  = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID ?? '';
const EMAILJS_PUBLIC    = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY  ?? '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fetchWithTimeout = (url: string, options: RequestInit, ms = 10000): Promise<Response> =>
  Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms)
    ),
  ]);

function buildSMSMessage(lat: number, lng: number, name: string, trigger: string): string {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  return `🆘 EMERGENCY! ${name || 'Someone'} needs help! Triggered: ${trigger}. Location: ${mapsLink}. GPS: ${lat.toFixed(5)},${lng.toFixed(5)}. Please call 112 or reach them immediately!`;
}

function buildEmailBody(lat: number, lng: number, name: string, trigger: string): string {
  const osmLink   = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;
  const mapsLink  = `https://maps.google.com/?q=${lat},${lng}`;
  const time      = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return (
    `🆘 EMERGENCY ALERT from SafeHer!\n\n` +
    `${name || 'Someone'} needs help immediately!\n\n` +
    `📍 Live Location:\n  Google Maps: ${mapsLink}\n  OSM: ${osmLink}\n\n` +
    `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n` +
    `Time: ${time}\nTriggered: ${trigger}\n\n` +
    `⚠️ Please call them or dial 112 immediately!`
  );
}

// ─── SMS via Fast2SMS (India) — silent, no SMS app opened ────────────────────

async function sendSMSSilent(phones: string[], message: string): Promise<boolean> {
  if (!FAST2SMS_KEY) {
    console.warn('Fast2SMS key not set — SMS not sent');
    return false;
  }
  try {
    const numbers = phones.join(',');
    const res = await fetchWithTimeout(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        method: 'POST',
        headers: {
          authorization: FAST2SMS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route:    'q',
          message,
          numbers,
          flash:    0,
        }),
      },
      10000
    );
    const json = await res.json() as Record<string, unknown>;
    return json?.['return'] === true;
  } catch (err) {
    console.error('SMS send failed:', err);
    return false;
  }
}

// ─── Email via EmailJS — silent, no email app opened ─────────────────────────

async function sendEmailSilent(
  emails: string[],
  senderName: string,
  bodyText: string,
  mapsUrl: string
): Promise<boolean> {
  if (!EMAILJS_SERVICE || !EMAILJS_TEMPLATE || !EMAILJS_PUBLIC) {
    console.warn('EmailJS keys not set — email not sent');
    return false;
  }
  let allOk = true;
  for (const email of emails) {
    try {
      const res = await fetchWithTimeout(
        'https://api.emailjs.com/api/v1.0/email/send',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id:  EMAILJS_SERVICE,
            template_id: EMAILJS_TEMPLATE,
            user_id:     EMAILJS_PUBLIC,
            template_params: {
              to_email:    email,
              sender_name: senderName,
              message:     bodyText,
              maps_url:    mapsUrl,
            },
          }),
        },
        10000
      );
      if (!res.ok) allOk = false;
    } catch {
      allOk = false;
    }
  }
  return allOk;
}

// ─── Direct call — Android with CALL_PHONE permission auto-dials ──────────────

export async function makeDirectCall(number: string): Promise<void> {
  const clean  = number.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  const telUrl = `tel:${clean}`;
  try {
    const canOpen = await Linking.canOpenURL(telUrl);
    if (canOpen) await Linking.openURL(telUrl);
  } catch { /* ignore */ }
}

// ─── Emergency GPS fetch ──────────────────────────────────────────────────────

async function fetchEmergencyLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((r) => setTimeout(() => r(null), 5000)),
    ]);
    if (!loc) return null;
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return null;
  }
}

// ─── Main SOS dispatch ────────────────────────────────────────────────────────

export async function dispatchSOS() {
  const { guardians }  = useGuardianStore.getState();
  let   { location }   = useSOSStore.getState();
  const { trigger }    = useSOSStore.getState();
  const { smsAlerts, emailAlerts, autoCallOnSOS, autoCallGuardian } = useSettingsStore.getState();
  const { currentUser } = useAuthStore.getState();
  const senderName = currentUser?.name || 'SafeHer User';

  // Emergency GPS fallback
  if (!location || (location.latitude === 0 && location.longitude === 0)) {
    const loc = await fetchEmergencyLocation();
    if (loc) { useSOSStore.getState().setLocation(loc); location = loc; }
  }

  const lat          = location?.latitude  ?? 0;
  const lng          = location?.longitude ?? 0;
  const triggerLabel = TRIGGER_MAP[trigger ?? 'button'] ?? 'SOS Button';
  const mapsLink     = `https://maps.google.com/?q=${lat},${lng}`;
  const smsMsg       = buildSMSMessage(lat, lng, senderName, triggerLabel);
  const emailBody    = buildEmailBody(lat, lng, senderName, triggerLabel);

  const phones = guardians.map((g) => g.phone).filter(Boolean);
  const emails = guardians.map((g) => g.email).filter(Boolean);
  const errors: string[] = [];

  // 1. Silent SMS via Fast2SMS
  if (smsAlerts && phones.length > 0) {
    const ok = await sendSMSSilent(phones, smsMsg);
    if (!ok) errors.push('sms');
  }

  // 2. Silent email via EmailJS
  if (emailAlerts && emails.length > 0) {
    const ok = await sendEmailSilent(emails, senderName, emailBody, mapsLink);
    if (!ok) errors.push('email');
  }

  // 3. Auto-call 112
  let callMade = false;
  if (autoCallOnSOS) {
    await makeDirectCall(SOS_NUMBER);
    callMade = true;
  }

  // 4. Auto-call first guardian
  if (autoCallGuardian && guardians.length > 0) {
    const sorted = [...guardians].sort((a, b) => a.priority - b.priority);
    if (autoCallOnSOS) await new Promise((r) => setTimeout(r, 3000));
    await makeDirectCall(sorted[0].phone);
    callMade = true;
  }

  // 5. Log alert
  useAlertHistoryStore.getState().addAlert({
    trigger:       triggerLabel,
    timestamp:     Date.now(),
    latitude:      lat || null,
    longitude:     lng || null,
    location:      lat ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Unknown',
    status:        'sent',
    sentTo:        phones.length + emails.length,
    guardianNames: guardians.map((g) => g.name),
  });

  useSOSStore.getState().confirmSOS();

  return { success: true, noGuardians: guardians.length === 0, smsTo: phones, emailedTo: emails, callMade, errors };
}

export async function quickCall(number: string): Promise<void> {
  await makeDirectCall(number);
}

export const autoCall = makeDirectCall;
