/**
 * alertService.ts — dispatches SOS alerts silently.
 *
 * Delivery pipeline:
 *  1. SMS  → Fast2SMS API (silent, no SMS app)
 *  2. Email → EmailJS SDK (silent, no email app)
 *  3. Call  → react-native-send-intent makeCall (no dialer app on Android)
 */

import { Platform, Linking, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';
import { useGuardianStore }     from '../store/guardianStore';
import { useSOSStore }          from '../store/sosStore';
import { useSettingsStore }     from '../store/settingsStore';
import { useAlertHistoryStore } from '../store/alertHistoryStore';
import { useAuthStore }         from '../store/authStore';
import { SOS_NUMBER }           from '../constants/helplines';

// react-native-send-intent: makes direct calls without opening the Phone app
let SendIntentAndroid: any = null;
try { SendIntentAndroid = require('react-native-send-intent').default; } catch { /* not in Expo Go */ }

type TriggerType = 'SOS Button' | 'Shake Detected' | 'Fall Detected' | 'Voice Keyword';
const TRIGGER_MAP: Record<string, TriggerType> = {
  button: 'SOS Button', shake: 'Shake Detected',
  fall: 'Fall Detected', voice: 'Voice Keyword',
};

const FAST2SMS_KEY     = process.env.EXPO_PUBLIC_FAST2SMS_KEY      ?? '';
const EMAILJS_SERVICE  = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID ?? '';
const EMAILJS_TEMPLATE = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID ?? '';
const EMAILJS_PUBLIC   = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY  ?? '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fetchWithTimeout = (url: string, options: RequestInit, ms = 10000): Promise<Response> =>
  Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

function normalizeIndianNumber(phone: string): string {
  let n = phone.replace(/[\s\-().]/g, '');
  if (n.startsWith('+91'))  n = n.slice(3);
  if (n.startsWith('0091')) n = n.slice(4);
  if (n.startsWith('0') && n.length === 11) n = n.slice(1);
  return n; // 10-digit
}

function buildSMSMessage(lat: number, lng: number, name: string, trigger: string): string {
  const link = `https://maps.google.com/?q=${lat},${lng}`;
  return `🆘 EMERGENCY! ${name} needs help! Triggered: ${trigger}. Location: ${link}. GPS: ${lat.toFixed(5)},${lng.toFixed(5)}. Please call 112 immediately!`;
}

function buildEmailBody(lat: number, lng: number, name: string, trigger: string): string {
  const osmLink  = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const time     = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return `🆘 EMERGENCY ALERT from SafeHer!\n\n${name} needs help immediately!\n\n📍 Location:\n  Google Maps: ${mapsLink}\n  OSM: ${osmLink}\n\nGPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}\nTime: ${time}\nTriggered: ${trigger}\n\n⚠️ Please call them or dial 112!`;
}

// ─── SMS via Fast2SMS ─────────────────────────────────────────────────────────

async function sendSMSSilent(phones: string[], message: string): Promise<boolean> {
  if (!FAST2SMS_KEY) { console.warn('[SafeHer] Fast2SMS key not set'); return false; }
  try {
    const numbers = phones.map(normalizeIndianNumber).filter(n => n.length === 10).join(',');
    if (!numbers) return false;
    const res  = await fetchWithTimeout('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: FAST2SMS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'q', message, numbers, flash: 0 }),
    });
    const json = await res.json() as Record<string, unknown>;
    return json['return'] === true;
  } catch (e) { console.error('[SafeHer] SMS error:', e); return false; }
}

// ─── Email via EmailJS ────────────────────────────────────────────────────────

async function sendEmailSilent(emails: string[], name: string, body: string, mapsUrl: string): Promise<boolean> {
  if (!EMAILJS_SERVICE || !EMAILJS_TEMPLATE || !EMAILJS_PUBLIC) {
    console.warn('[SafeHer] EmailJS keys not set'); return false;
  }
  let ok = true;
  for (const email of emails) {
    try {
      const res = await fetchWithTimeout('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE, template_id: EMAILJS_TEMPLATE, user_id: EMAILJS_PUBLIC,
          template_params: { to_email: email, sender_name: name, message: body, maps_url: mapsUrl },
        }),
      });
      if (!res.ok) ok = false;
    } catch { ok = false; }
  }
  return ok;
}

// ─── Direct call — no Phone app opened ───────────────────────────────────────
// Uses react-native-send-intent on Android (makeCall = direct, no dialer)
// Falls back to Linking only on iOS

export async function makeDirectCall(number: string): Promise<void> {
  const clean = number.replace(/[\s\-().]/g, '').replace(/[^0-9+]/g, '');

  if (Platform.OS === 'android') {
    // Request CALL_PHONE permission at runtime — required even if declared in manifest
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        {
          title: 'Emergency Call Permission',
          message: 'SafeHer needs this to auto-dial emergency contacts',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED && SendIntentAndroid) {
        SendIntentAndroid.makeCall(clean); // Direct call — no Phone app opened
        return;
      }
    } catch (e) {
      console.error('[SafeHer] Call error:', e);
    }
  }

  // iOS fallback
  try {
    const url = `tel:${clean}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  } catch { /* ignore */ }
}


// ─── Emergency GPS ────────────────────────────────────────────────────────────

async function fetchEmergencyLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>(r => setTimeout(() => r(null), 5000)),
    ]);
    if (!loc) return null;
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch { return null; }
}

// ─── Main SOS Dispatch ────────────────────────────────────────────────────────

export async function dispatchSOS() {
  const { guardians }   = useGuardianStore.getState();
  let   { location }    = useSOSStore.getState();
  const { trigger }     = useSOSStore.getState();
  const { smsAlerts, emailAlerts, autoCallOnSOS, autoCallGuardian } = useSettingsStore.getState();
  const { currentUser } = useAuthStore.getState();
  const senderName      = currentUser?.name || 'SafeHer User';

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

  const phones = guardians.map(g => g.phone).filter(Boolean);
  const emails = guardians.map(g => g.email).filter(Boolean);
  const errors: string[] = [];

  if (smsAlerts   && phones.length > 0) { const ok = await sendSMSSilent(phones, smsMsg);                             if (!ok) errors.push('sms');   }
  if (emailAlerts && emails.length > 0) { const ok = await sendEmailSilent(emails, senderName, emailBody, mapsLink);  if (!ok) errors.push('email'); }

  let callMade = false;
  if (autoCallOnSOS) { await makeDirectCall(SOS_NUMBER); callMade = true; }
  if (autoCallGuardian && guardians.length > 0) {
    const sorted = [...guardians].sort((a, b) => a.priority - b.priority);
    if (autoCallOnSOS) await new Promise(r => setTimeout(r, 3000));
    await makeDirectCall(sorted[0].phone);
    callMade = true;
  }

  useAlertHistoryStore.getState().addAlert({
    trigger: triggerLabel, timestamp: Date.now(),
    latitude: lat || null, longitude: lng || null,
    location: lat ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Unknown',
    status: 'sent', sentTo: phones.length + emails.length,
    guardianNames: guardians.map(g => g.name),
  });

  useSOSStore.getState().confirmSOS();
  return { success: true, noGuardians: guardians.length === 0, smsTo: phones, emailedTo: emails, callMade, errors };
}

export async function quickCall(number: string): Promise<void> { await makeDirectCall(number); }
export const autoCall = makeDirectCall;
