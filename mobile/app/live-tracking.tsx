import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Share, Linking as RNLinking, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import LeafletMapView from '../components/LeafletMapView';
import { colors, fontSize, spacing, radius } from '../constants/theme';
import { crimeDataService } from '../services/crimeDataService';

export default function LiveTrackingScreen() {
  const router = useRouter();
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [districtInfo, setDistrictInfo] = useState<{ name: string; state: string; risk: string; color: string; crimes: number } | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setLoading(false); return; }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
    setLocation(coords);
    setTracking(true);
    setLoading(false);

    // Reverse geocode to get district name
    fetchDistrictRisk(coords.lat, coords.lng);

    // Watch position updates
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 100 },
      (newLoc) => {
        const newCoords = { lat: newLoc.coords.latitude, lng: newLoc.coords.longitude };
        setLocation(newCoords);
        fetchDistrictRisk(newCoords.lat, newCoords.lng);
      }
    );
  };

  const fetchDistrictRisk = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=10`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'SafeHer/1.0' } }
      );
      const data = await res.json() as { address?: Record<string, string> };
      const addr = data.address ?? {};
      const stateName = addr.state ?? '';
      const districtName = addr.county ?? addr.state_district ?? addr.city ?? '';

      if (stateName && districtName) {
        const risk = crimeDataService.getDistrictRisk(stateName, districtName, new Date().getHours());
        setDistrictInfo({
          name: districtName,
          state: stateName,
          risk: risk.risk_level,
          color: risk.color,
          crimes: risk.total_crimes,
        });
      }
    } catch { /* Silently fail */ }
  };

  const stopTracking = () => {
    if (watchRef.current) { watchRef.current.remove(); watchRef.current = null; }
    setTracking(false);
    setLocation(null);
    setDistrictInfo(null);
  };

  useEffect(() => { return () => { if (watchRef.current) watchRef.current.remove(); }; }, []);

  const shareLocation = async () => {
    if (!location) return;
    const osmLink = `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}&zoom=16`;
    const gMapsLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    await Share.share({
      message: `📍 My live location (SafeHer):\n🗺️ OSM: ${osmLink}\n📌 Google: ${gMapsLink}\n\nGPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\n⚡ Sent via SafeHer Safety App`,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Live Tracking</Text>
          {tracking && districtInfo && (
            <Text style={styles.subtitle}>{districtInfo.name}, {districtInfo.state}</Text>
          )}
        </View>
        {tracking && districtInfo && (
          <View style={[styles.riskBadge, { backgroundColor: `${districtInfo.color}20` }]}>
            <Text style={[styles.riskBadgeText, { color: districtInfo.color }]}>{districtInfo.risk}</Text>
          </View>
        )}
      </View>

      {tracking && location ? (
        <View style={{ flex: 1 }}>
          <LeafletMapView
            style={styles.map}
            center={[location.lat, location.lng]}
            zoom={15}
            userLat={location.lat}
            userLng={location.lng}
            markers={[{
              lat: location.lat,
              lng: location.lng,
              color: districtInfo?.color || colors.primary,
              popup: districtInfo ? `${districtInfo.name} — ${districtInfo.risk}` : 'You are here',
            }]}
          />

          {/* Info overlay */}
          {districtInfo && (
            <View style={styles.infoOverlay}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoDistrict}>{districtInfo.name}</Text>
                <Text style={styles.infoState}>{districtInfo.state} · {districtInfo.crimes.toLocaleString()} crimes (NCRB)</Text>
              </View>
              <View style={[styles.scoreCircle, { borderColor: districtInfo.color }]}>
                <Text style={[styles.scoreText, { color: districtInfo.color }]}>
                  {districtInfo.risk === 'SAFE' ? '🟢' : districtInfo.risk === 'MODERATE' ? '🟡' : '🔴'}
                </Text>
              </View>
            </View>
          )}

          {/* Bottom actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.shareBtn} onPress={shareLocation}>
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>Share Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopBtn} onPress={stopTracking}>
              <Ionicons name="stop-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.stopBtnText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.startContainer}>
          <View style={styles.startIcon}>
            <Ionicons name="locate" size={60} color={colors.primary} />
          </View>
          <Text style={styles.startTitle}>Real-Time Location Tracking</Text>
          <Text style={styles.startDesc}>
            Track your location live on the map.{'\n'}
            See your district's safety risk from NCRB data.{'\n'}
            Share your GPS with guardians instantly.
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={startTracking} disabled={loading}>
            <Ionicons name="navigate" size={22} color="#fff" />
            <Text style={styles.startBtnText}>{loading ? 'Getting Location…' : 'Start Tracking'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  riskBadgeText: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  map: { flex: 1 },
  markerOuter: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  markerInner: { width: 14, height: 14, borderRadius: 7 },
  infoOverlay: {
    position: 'absolute', top: 16, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(15,10,30,0.9)', borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  infoDistrict: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  infoState: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  scoreCircle: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(15,10,30,0.8)',
  },
  scoreText: { fontSize: 20 },
  bottomActions: {
    position: 'absolute', bottom: 30, left: 16, right: 16,
    flexDirection: 'row', gap: spacing.sm,
  },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: 'rgba(15,10,30,0.9)', borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.danger + '55',
    paddingHorizontal: spacing.lg,
  },
  stopBtnText: { color: colors.danger, fontWeight: '700', fontSize: fontSize.md },
  startContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  startIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
  },
  startTitle: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '900', textAlign: 'center' },
  startDesc: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center', lineHeight: 24 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.success,
    borderRadius: radius.lg, padding: spacing.lg, paddingHorizontal: spacing.xl,
  },
  startBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '800' },
});
