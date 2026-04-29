import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import LeafletMapView from '../components/LeafletMapView';
import { useAppTheme } from '../contexts/ThemeContext';
import { fontSize, spacing, radius } from '../constants/theme';
import { crimeDataService } from '../services/crimeDataService';

export default function LiveTrackingScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
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
    fetchDistrictRisk(coords.lat, coords.lng);
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 100 },
      (newLoc) => {
        const nc = { lat: newLoc.coords.latitude, lng: newLoc.coords.longitude };
        setLocation(nc);
        fetchDistrictRisk(nc.lat, nc.lng);
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
        setDistrictInfo({ name: districtName, state: stateName, risk: risk.risk_level, color: risk.color, crimes: risk.total_crimes });
      }
    } catch { /* Silently fail */ }
  };

  const stopTracking = () => {
    if (watchRef.current) { watchRef.current.remove(); watchRef.current = null; }
    setTracking(false); setLocation(null); setDistrictInfo(null);
  };

  useEffect(() => () => { if (watchRef.current) watchRef.current.remove(); }, []);

  const shareLocation = async () => {
    if (!location) return;
    const osmLink = `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}&zoom=16`;
    const gMapsLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    await Share.share({
      message: `📍 My live location (SafeHer):\n🗺️ OSM: ${osmLink}\n📌 Google: ${gMapsLink}\n\nGPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\n⚡ Sent via SafeHer Safety App`,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Live Tracking</Text>
          {tracking && districtInfo && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{districtInfo.name}, {districtInfo.state}</Text>
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
              lat: location.lat, lng: location.lng,
              color: districtInfo?.color || colors.primary,
              popup: districtInfo ? `${districtInfo.name} — ${districtInfo.risk}` : 'You are here',
            }]}
          />
          {districtInfo && (
            <View style={[styles.infoOverlay, { backgroundColor: colors.bgCard + 'F0', borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoDistrict, { color: colors.textPrimary }]}>{districtInfo.name}</Text>
                <Text style={[styles.infoState, { color: colors.textMuted }]}>{districtInfo.state} · {districtInfo.crimes.toLocaleString()} crimes (NCRB)</Text>
              </View>
              <View style={[styles.scoreCircle, { borderColor: districtInfo.color }]}>
                <Text style={styles.scoreText}>
                  {districtInfo.risk === 'SAFE' ? '🟢' : districtInfo.risk === 'MODERATE' ? '🟡' : '🔴'}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.primary }]} onPress={shareLocation}>
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>Share Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.stopBtn, { backgroundColor: colors.bgCard, borderColor: colors.danger + '55' }]} onPress={stopTracking}>
              <Ionicons name="stop-circle-outline" size={20} color={colors.danger} />
              <Text style={[styles.stopBtnText, { color: colors.danger }]}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.startContainer}>
          <View style={[styles.startIcon, { backgroundColor: colors.primaryGlow }]}>
            <Ionicons name="locate" size={60} color={colors.primary} />
          </View>
          <Text style={[styles.startTitle, { color: colors.textPrimary }]}>Real-Time Location Tracking</Text>
          <Text style={[styles.startDesc, { color: colors.textSecondary }]}>
            Track your location live on the map.{'\n'}
            See your district's safety risk from NCRB data.{'\n'}
            Share your GPS with guardians instantly.
          </Text>
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.success }]} onPress={startTracking} disabled={loading}>
            <Ionicons name="navigate" size={22} color="#fff" />
            <Text style={styles.startBtnText}>{loading ? 'Getting Location…' : 'Start Tracking'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  subtitle: { fontSize: fontSize.xs, marginTop: 1 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  riskBadgeText: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  map: { flex: 1 },
  infoOverlay: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md, borderWidth: 1 },
  infoDistrict: { fontSize: fontSize.md, fontWeight: '700' },
  infoState: { fontSize: fontSize.xs, marginTop: 2 },
  scoreCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 20 },
  bottomActions: { position: 'absolute', bottom: 30, left: 16, right: 16, flexDirection: 'row', gap: spacing.sm },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  stopBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, paddingHorizontal: spacing.lg },
  stopBtnText: { fontWeight: '700', fontSize: fontSize.md },
  startContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  startIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  startTitle: { fontSize: fontSize.xxl, fontWeight: '900', textAlign: 'center' },
  startDesc: { fontSize: fontSize.md, textAlign: 'center', lineHeight: 24 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.lg, paddingHorizontal: spacing.xl },
  startBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '800' },
});
