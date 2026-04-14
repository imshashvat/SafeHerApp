import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import { useGuardianStore } from '../store/guardianStore';
import { useSOSStore } from '../store/sosStore';
import { useSettingsStore } from '../store/settingsStore';
import { SOS_NUMBER } from '../constants/helplines';

export async function dispatchSOS() {
  const { guardians } = useGuardianStore.getState();
  const { location, videoUri } = useSOSStore.getState();
  const { smsAlerts, autoCallOnSOS, autoCallGuardian } = useSettingsStore.getState();

  const lat = location?.latitude ?? 0;
  const lng = location?.longitude ?? 0;
  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;

  const message =
    `🆘 EMERGENCY ALERT from SafeHer!\n\n` +
    `I need help immediately. My current location:\n` +
    `📍 Google Maps: ${mapLink}\n` +
    `📍 OpenStreetMap: ${osmLink}\n\n` +
    `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n` +
    `Time: ${new Date().toLocaleString('en-IN')}\n\n` +
    `Please call me or contact emergency services (112) immediately.`;

  const phones = guardians.map((g) => g.phone).filter(Boolean);

  // 1. Send SMS to all guardians
  if (smsAlerts && phones.length > 0) {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync(phones, message);
    }
  }

  // 2. Auto-call emergency number 112
  if (autoCallOnSOS) {
    await autoCall(SOS_NUMBER);
  }

  // 3. Auto-call first guardian if enabled
  if (autoCallGuardian && guardians.length > 0 && !autoCallOnSOS) {
    const sorted = [...guardians].sort((a, b) => a.priority - b.priority);
    await autoCall(sorted[0].phone);
  }

  useSOSStore.getState().confirmSOS();
  return { success: true, sentTo: phones };
}

export async function autoCall(number: string) {
  const url = `tel:${number}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

export async function quickCall(number: string) {
  await Linking.openURL(`tel:${number}`);
}
