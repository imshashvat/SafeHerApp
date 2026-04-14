import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { colors, fontSize, spacing, radius } from '../constants/theme';

export default function LiveTrackingScreen() {
  const router = useRouter();
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const startTracking = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return setLoading(false);
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    setTracking(true);
    setLoading(false);
  };

  const stopTracking = () => {
    setTracking(false);
    setLocation(null);
  };

  const shareLocation = async () => {
    if (!location) return;
    const url = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    await Share.share({
      message: `📍 My current location (SafeHer):\n${url}\n\nLat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}`,
      url,
    });
  };

  const openInMaps = () => {
    if (!location) return;
    Linking.openURL(`https://maps.google.com/?q=${location.lat},${location.lng}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Live Tracking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status card */}
        <View style={[styles.statusCard, tracking && styles.statusCardActive]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: tracking ? colors.success : colors.textMuted }]} />
            <Text style={styles.statusLabel}>
              {tracking ? 'Location Active' : 'Tracking Off'}
            </Text>
          </View>
          {location && (
            <Text style={styles.coords}>
              {location.lat.toFixed(5)}°N, {location.lng.toFixed(5)}°E
            </Text>
          )}
        </View>

        {/* Map placeholder using OSM */}
        {tracking && location && (
          <TouchableOpacity style={styles.mapCard} onPress={openInMaps} activeOpacity={0.85}>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location" size={48} color={colors.primary} />
              <Text style={styles.mapLabel}>Tap to Open in Maps</Text>
              <Text style={styles.mapSub}>
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Actions */}
        {!tracking ? (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={startTracking}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={22} color="#fff" />
            <Text style={styles.startBtnText}>
              {loading ? 'Getting Location...' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeActions}>
            <TouchableOpacity style={styles.shareBtn} onPress={shareLocation}>
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>Share My Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapsBtn} onPress={openInMaps}>
              <Ionicons name="map-outline" size={20} color={colors.accent} />
              <Text style={styles.mapsBtnText}>Open in Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopBtn} onPress={stopTracking}>
              <Ionicons name="stop-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.stopBtnText}>Stop Tracking</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          {[
            'Your GPS coordinates are captured from your device.',
            'Share a Google Maps link with your guardians instantly.',
            'Tap "Open in Maps" to see your location on a full map.',
            'During SOS, your location is auto-sent to all guardians.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipNum}>
                <Text style={styles.tipNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  statusCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.xs,
  },
  statusCardActive: { borderColor: colors.success },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700' },
  coords: { color: colors.textMuted, fontSize: fontSize.sm, fontFamily: 'monospace' },
  mapCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    height: 200,
  },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  mapLabel: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700' },
  mapSub: { color: colors.textMuted, fontSize: fontSize.sm },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.success,
    borderRadius: radius.lg, padding: spacing.lg,
  },
  startBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '800' },
  activeActions: { gap: spacing.sm },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md,
  },
  shareBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.bgCard,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.accent + '55',
  },
  mapsBtnText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '700' },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.bgCard,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.danger + '55',
  },
  stopBtnText: { color: colors.danger, fontSize: fontSize.md, fontWeight: '700' },
  infoCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md,
  },
  infoTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tipNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.accentGlow, alignItems: 'center', justifyContent: 'center',
  },
  tipNumText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '800' },
  tipText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
});
