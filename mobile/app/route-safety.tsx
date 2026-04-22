import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { colors, fontSize, spacing, radius } from '../constants/theme';
import { crimeDataService } from '../services/crimeDataService';
import { useSettingsStore } from '../store/settingsStore';
import LeafletMapView, { LeafletPolyline, LeafletMarker } from '../components/LeafletMapView';

// ─── API Response Types ───────────────────────────────────────────────────────

interface NominatimReverseAddress {
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  city?: string;
  town?: string;
  state?: string;
  county?: string;
  state_district?: string;
}

interface NominatimReverseResult {
  address?: NominatimReverseAddress;
  display_name?: string;
  lat?: string;
  lon?: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimReverseAddress;
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: number[][];
  };
}

interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
}

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    'name:en'?: string;
    phone?: string;
    'contact:phone'?: string;
  };
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CRIME_LABELS: Record<string, string> = {
  rape: 'Rape', kidnapping: 'Kidnapping', dowry: 'Dowry Deaths',
  assault: 'Assault on Women', insult: 'Insult to Modesty', cruelty: 'Cruelty by Husband',
};

const STATE_ALIASES: Record<string, string> = {
  UTTARANCHAL: 'UTTARAKHAND', ORISSA: 'ODISHA', PONDICHERRY: 'PUDUCHERRY',
  'NCT OF DELHI': 'DELHI', 'JAMMU AND KASHMIR': 'JAMMU & KASHMIR',
};

function normalizeState(raw: string): string {
  const u = raw.toUpperCase().trim();
  return STATE_ALIASES[u] || u;
}

function cleanDistrict(raw: string): string {
  return raw
    .replace(/\s+(district|tehsil|taluk|mandal|block|municipality|cantonment)$/i, '')
    .replace(/\s+/g, ' ').trim().toUpperCase();
}

function haversine([lat1, lon1]: number[], [lat2, lon2]: number[]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export default function RouteSafetyScreen() {
  const router = useRouter();
  const { mapTheme } = useSettingsStore();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hour, setHour] = useState(new Date().getHours());
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [policeStations, setPoliceStations] = useState<any[]>([]);
  // OSM map state
  const [routePolyline, setRoutePolyline] = useState<LeafletPolyline | null>(null);
  const [routeMarkers, setRouteMarkers] = useState<LeafletMarker[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5, 78.5]);
  const scrollRef = useRef<ScrollView>(null);

  const handleGPSFill = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission denied'); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&addressdetails=1&zoom=16`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'SafeHer/1.0' } }
      );
      const data = await res.json() as NominatimReverseResult;
      const addr = data.address ?? {};
      const name = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
      setFrom(name);
    } catch {
      setFrom(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
    }
  };

  const analyze = async () => {
    if (!from || !to) return;
    setAnalyzing(true);
    setError('');
    setResult(null);
    setPoliceStations([]);

    try {
      // 1. Geocode
      setStage('📍 Locating addresses…');
      const [fRes, tRes] = await Promise.all([
        fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(from + ', India')}`, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'SafeHer/1.0' },
        }),
        fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(to + ', India')}`, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'SafeHer/1.0' },
        }),
      ]);
      const fData = await fRes.json() as NominatimSearchResult[];
      const tData = await tRes.json() as NominatimSearchResult[];
      if (!fData.length || !tData.length) throw new Error('Could not geocode locations');

      const startLat = parseFloat(fData[0].lat);
      const startLon = parseFloat(fData[0].lon);
      const endLat = parseFloat(tData[0].lat);
      const endLon = parseFloat(tData[0].lon);

      // 2. OSRM route
      setStage('🗺️ Computing route…');
      const osrmRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`
      );
      const osrmData = await osrmRes.json() as OsrmResponse;
      if (osrmData.code !== 'Ok') throw new Error('No route found');
      const route = osrmData.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

      // 3. Sample 5 waypoints
      setStage('🔍 Analyzing safety…');
      const NUM = 5;
      const waypointIndices = Array.from({ length: NUM }, (_, i) =>
        Math.floor((i / (NUM - 1)) * (coords.length - 1))
      );

      // 4. Reverse-geocode all waypoints
      const geoResults = await Promise.all(
        waypointIndices.map(async (idx) => {
          const [lat, lon] = coords[idx];
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=10`,
              { headers: { 'Accept-Language': 'en', 'User-Agent': 'SafeHer/1.0' } }
            );
            const geo = await res.json() as NominatimReverseResult;
            return {
              state: normalizeState(geo?.address?.state ?? ''),
              district: cleanDistrict(geo?.address?.county ?? geo?.address?.state_district ?? geo?.address?.city ?? ''),
            };
          } catch { return { state: '', district: '' }; }
        })
      );

      // 5. ML predictions for each waypoint
      const seenKeys = new Set<string>();
      const segments: any[] = [];

      geoResults.forEach((geo, i) => {
        const key = `${geo.state}|${geo.district}`;
        if (seenKeys.has(key) || !geo.district) return;
        seenKeys.add(key);

        const ml = crimeDataService.getDistrictRisk(geo.state, geo.district, hour);
        const mapRisk = (r: string) => {
          if (r === 'HIGH RISK') return 'HIGH';
          if (r === 'MODERATE') return 'MEDIUM';
          return 'LOW';
        };

        segments.push({
          id: i + 1,
          name: geo.district,
          state: geo.state,
          risk: mapRisk(ml.risk_level),
          risk_code: ml.risk_code,
          total_crimes: ml.total_crimes,
          confidence: ml.confidence,
          breakdown: ml.breakdown,
          color: ml.color,
          note: ml.note,
        });
      });

      // 6. Overall score
      const riskCodes = segments.map(s => s.risk_code).filter(c => c >= 0);
      const maxCode = riskCodes.length ? Math.max(...riskCodes) : 1;
      const avgCode = riskCodes.length ? riskCodes.reduce((a, b) => a + b, 0) / riskCodes.length : 1;
      const overallScore = Math.round(10 + ((maxCode * 0.6 + avgCode * 0.4) / 2) * 75);

      setResult({
        segments,
        overallScore,
        distance: route.distance,
        duration: route.duration,
        from: fData[0].display_name?.split(',')[0] ?? from,
        to: tData[0].display_name?.split(',')[0] ?? to,
      });

      // Build OSM map data
      const routeColor = maxCode === 2 ? '#FF3366' : maxCode === 1 ? '#FFB800' : '#00D4AA';
      setRoutePolyline({ coords, color: routeColor, weight: 5 });
      setMapCenter(coords[Math.floor(coords.length / 2)]);
      setRouteMarkers([
        { lat: startLat, lng: startLon, color: '#00D4AA', popup: `Start: ${from}` },
        { lat: endLat,   lng: endLon,   color: '#FF3366', popup: `End: ${to}` },
        ...segments.map(s => ({
          lat: coords[waypointIndices[s.id - 1] ?? 0][0],
          lng: coords[waypointIndices[s.id - 1] ?? 0][1],
          color: s.color ?? routeColor,
          popup: `${s.name} — ${s.risk}`,
        })),
      ]);

      // 7. Police stations
      setStage('👮 Finding police stations…');
      const mid = coords[Math.floor(coords.length / 2)];
      try {
        const q = `[out:json][timeout:15];(node["amenity"="police"](around:${Math.min(route.distance / 2, 8000)},${mid[0]},${mid[1]}););out body;`;
        const psRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
        const psData = await psRes.json() as OverpassResponse;
        setPoliceStations(
          (psData.elements ?? []).filter((e) => e.lat && e.lon).slice(0, 8).map((e) => ({
            id: e.id, lat: e.lat, lon: e.lon,
            name: e.tags?.name ?? e.tags?.['name:en'] ?? 'Police Station',
            phone: e.tags?.phone ?? e.tags?.['contact:phone'] ?? null,
          }))
        );
      } catch { /* Police stations are optional */ }

    } catch (err: any) {
      setError(err.message || 'Error analyzing route');
    } finally {
      setAnalyzing(false);
      setStage('');
    }
  };

  const riskColor = (risk: string) => risk === 'HIGH' ? '#FF3366' : risk === 'MEDIUM' ? '#FFB800' : '#00D4AA';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Route Safety Analysis</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Input form */}
        <View style={styles.formCard}>
          <View style={styles.inputRow}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <TextInput
              style={styles.input}
              placeholder="From (e.g. Noida Sector 18)"
              placeholderTextColor={colors.textMuted}
              value={from}
              onChangeText={setFrom}
            />
            <TouchableOpacity onPress={handleGPSFill} style={styles.gpsBtn}>
              <Text style={styles.gpsBtnText}>GPS</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="flag" size={18} color={colors.accent} />
            <TextInput
              style={styles.input}
              placeholder="To (e.g. Lucknow)"
              placeholderTextColor={colors.textMuted}
              value={to}
              onChangeText={setTo}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.analyzeBtn, (!from || !to || analyzing) && { opacity: 0.5 }]}
            onPress={analyze}
            disabled={!from || !to || analyzing}
          >
            {analyzing ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.analyzeBtnText}>{stage || 'Analyzing…'}</Text>
              </View>
            ) : (
              <Text style={styles.analyzeBtnText}>Analyze Route Safety</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {result && (
          <>
            {/* ── OSM ROUTE MAP ── */}
            <LeafletMapView
              style={styles.routeMap}
              center={mapCenter}
              zoom={7}
              theme={mapTheme}
              polylines={routePolyline ? [routePolyline] : []}
              markers={routeMarkers}
            />

            {/* Distance + Duration */}
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{formatDist(result.distance)}</Text>
                <Text style={styles.metricLabel}>DISTANCE</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{formatDuration(result.duration)}</Text>
                <Text style={styles.metricLabel}>DURATION</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, {
                  color: result.overallScore > 60 ? '#FF3366' : result.overallScore > 35 ? '#FFB800' : '#00D4AA'
                }]}>
                  {result.overallScore}
                </Text>
                <Text style={styles.metricLabel}>RISK SCORE</Text>
              </View>
            </View>

            {/* Segments */}
            <Text style={styles.sectionLabel}>DISTRICTS ON ROUTE</Text>
            {result.segments.map((seg: any) => (
              <View key={seg.id} style={[styles.segmentCard, { borderLeftColor: riskColor(seg.risk), borderLeftWidth: 3 }]}>
                <View style={styles.segHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.segName}>{seg.name}</Text>
                    <Text style={styles.segState}>{seg.state}{seg.note ? ' · (estimated)' : ''}</Text>
                  </View>
                  <View style={[styles.riskPill, { backgroundColor: `${riskColor(seg.risk)}20` }]}>
                    <Text style={[styles.riskPillText, { color: riskColor(seg.risk) }]}>{seg.risk}</Text>
                  </View>
                </View>

                {seg.total_crimes > 0 && (
                  <Text style={styles.segCrimes}>
                    Total crimes: {seg.total_crimes.toLocaleString()} · Confidence: {(seg.confidence * 100).toFixed(0)}%
                  </Text>
                )}

                {/* Crime breakdown */}
                {seg.breakdown && Object.keys(seg.breakdown).length > 0 && (
                  <View style={styles.breakdownContainer}>
                    {Object.entries(seg.breakdown)
                      .filter(([, v]) => (v as number) > 0)
                      .map(([type, count]) => {
                        const total = Object.values(seg.breakdown).reduce((s: number, v: any) => s + (v ?? 0), 0) as number;
                        const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                        return (
                          <View key={type} style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>{CRIME_LABELS[type] || type}</Text>
                            <View style={styles.breakdownBarBg}>
                              <View style={[styles.breakdownBarFill, {
                                width: `${pct}%`,
                                backgroundColor: riskColor(seg.risk),
                              }]} />
                            </View>
                            <Text style={styles.breakdownValue}>{(count as number).toLocaleString()}</Text>
                          </View>
                        );
                      })}
                  </View>
                )}
              </View>
            ))}

            {/* Police Stations */}
            {policeStations.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>👮 NEARBY POLICE STATIONS</Text>
                {policeStations.map((ps) => (
                  <View key={ps.id} style={styles.policeCard}>
                    <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.policeName}>{ps.name}</Text>
                      {ps.phone && <Text style={styles.policePhone}>📞 {ps.phone}</Text>}
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Safety tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>🛡️ SAFETY TIPS</Text>
              <Text style={styles.tipText}>• Share live location with trusted contacts</Text>
              <Text style={styles.tipText}>• Keep 112 (Police) / 1091 (Women Helpline) ready</Text>
              <Text style={styles.tipText}>• Avoid isolated stretches after dark</Text>
              <Text style={styles.tipText}>• Use SafeHer SOS button if you feel unsafe</Text>
            </View>
          </>
        )}
      </ScrollView>
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
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '800' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  routeMap: {
    height: 260,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  formCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 2,
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: fontSize.md, paddingVertical: 10 },
  gpsBtn: { backgroundColor: colors.accentGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  gpsBtnText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '800' },
  errorBox: {
    backgroundColor: 'rgba(255,59,59,0.1)', borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(255,59,59,0.3)', padding: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: fontSize.sm },
  analyzeBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  analyzingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  analyzeBtnText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  metricRow: { flexDirection: 'row', gap: spacing.sm },
  metricCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center',
  },
  metricValue: { color: colors.accent, fontSize: fontSize.xl, fontWeight: '900' },
  metricLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  sectionLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  segmentCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  segHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  segName: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  segState: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  riskPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  riskPillText: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  segCrimes: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  breakdownContainer: { marginTop: spacing.sm, gap: 5 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  breakdownLabel: { color: colors.textMuted, fontSize: 10, width: 80 },
  breakdownBarBg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  breakdownBarFill: { height: 4, borderRadius: 2 },
  breakdownValue: { color: colors.textSecondary, fontSize: 10, width: 40, textAlign: 'right' },
  policeCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  policeName: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '600' },
  policePhone: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  tipsCard: {
    backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', padding: spacing.md, gap: spacing.xs,
  },
  tipsTitle: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  tipText: { color: colors.textSecondary, fontSize: fontSize.xs, lineHeight: 18 },
});
