import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { HELPLINES } from '../constants/helplines';
import { quickCall } from '../services/alertService';
import { fontSize, spacing, radius } from '../constants/theme';
import { useAppTheme } from '../contexts/ThemeContext';

interface Facility {
  name: string; type: string; icon: string;
  dist: number; lat: number; lng: number; phone: string;
}

const TIPS = [
  {
    category: 'Self Defense',
    icon: '🥋',
    items: [
      'Aim for eyes, nose, throat, and knees — most vulnerable points.',
      'Use your elbow — it\'s stronger than a punch in close range.',
      'A firm "STOP! FIRE! HELP!" shout attracts more attention than "Help!".',
      'Keep your keys between your fingers when walking alone at night.',
      'Trust your gut — leave any situation that feels unsafe immediately.',
    ],
  },
  {
    category: 'Travel Safety',
    icon: '🚗',
    items: [
      'Always share your live location with a trusted person before solo travel.',
      'Verify cab/auto details — screenshot and send to a guardian.',
      'Sit behind the driver, not the front seat.',
      'Keep at least 20% phone battery before stepping out.',
      'Know the nearest police station and hospital on your route.',
    ],
  },
  {
    category: 'Legal Rights',
    icon: '⚖️',
    items: [
      'You have the right to file FIR at any police station regardless of jurisdiction.',
      'Molestation in public is an offense under IPC 354 — file a complaint.',
      'Your name cannot be published in a rape case — you have the right to anonymity.',
      'Zero FIR: File at any station; it transfers to the relevant station.',
      'Domestic violence: Protection Orders under DV Act 2005 are your right.',
    ],
  },
  {
    category: 'Digital Safety',
    icon: '🔒',
    items: [
      'Regularly review which apps have access to your location.',
      'Use a strong PIN code, not a pattern lock.',
      'Report cyberstalking at cybercrime.gov.in or call 1930.',
      'Avoid sharing live location on social media publicly.',
      'Enable Find My Device to locate/wipe phone if stolen.',
    ],
  },
];

export default function SafetyHubScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [facilityLoading, setFacilityLoading] = React.useState(false);
  const [facilityError, setFacilityError] = React.useState('');

  const fetchNearbyFacilities = async () => {
    setFacilityLoading(true);
    setFacilityError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setFacilityError('Location permission needed'); setFacilityLoading(false); return; }

      // Use cached location first for speed
      let loc = await Location.getLastKnownPositionAsync({ maxAge: 300_000 });
      if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      if (!loc) { setFacilityError('Could not get your location'); setFacilityLoading(false); return; }

      const { latitude: lat, longitude: lng } = loc.coords;
      const radius = 3000; // 3km radius

      // Overpass API query — police stations, hospitals, pharmacies, women shelters
      const query = `[out:json][timeout:15];
(
  node["amenity"="police"](around:${radius},${lat},${lng});
  node["amenity"="hospital"](around:${radius},${lat},${lng});
  node["amenity"="pharmacy"](around:${radius},${lat},${lng});
  node["social_facility"="shelter"]["social_facility:for"="women"](around:${radius},${lat},${lng});
  node["amenity"="clinic"](around:${radius},${lat},${lng});
);
out body;`;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'text/plain' },
      });
      const data = await res.json();
      const elements: any[] = data.elements ?? [];

      const TYPE_MAP: Record<string, { icon: string; label: string }> = {
        police:   { icon: '🚓', label: 'Police Station' },
        hospital: { icon: '🏥', label: 'Hospital' },
        pharmacy: { icon: '💊', label: 'Pharmacy' },
        shelter:  { icon: '🏠', label: "Women's Shelter" },
        clinic:   { icon: '🩺', label: 'Clinic' },
      };

      const parsed: Facility[] = elements
        .filter(e => e.lat && e.lon && (e.tags?.name || e.tags?.['name:en']))
        .map(e => {
          const type = e.tags?.amenity || e.tags?.social_facility || 'place';
          const cfg = TYPE_MAP[type] ?? { icon: '📍', label: type };
          const dlat = e.lat - lat; const dlng = e.lon - lng;
          const dist = Math.round(Math.sqrt(dlat * dlat + dlng * dlng) * 111000);
          return {
            name: e.tags?.['name:en'] || e.tags?.name || cfg.label,
            type: cfg.label, icon: cfg.icon,
            dist, lat: e.lat, lng: e.lon,
            phone: e.tags?.phone || e.tags?.['contact:phone'] || '',
          };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 10);

      setFacilities(parsed);
      if (!parsed.length) setFacilityError('No facilities found within 3km. Try in a city area.');
    } catch {
      setFacilityError('Could not fetch facilities. Check internet connection.');
    }
    setFacilityLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Safety Hub</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency strip */}
        <TouchableOpacity style={styles.emergencyStrip} onPress={() => quickCall('112')}>
          <Ionicons name="alert-circle" size={24} color="#fff" />
          <Text style={styles.emergencyText}>Emergency? Call 112 Now</Text>
          <Ionicons name="call" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Helplines */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>HELPLINES</Text>
        <View style={styles.helplinesGrid}>
          {HELPLINES.map((h) => (
            <TouchableOpacity
              key={h.number}
              style={[styles.helplineCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => quickCall(h.number)}
              activeOpacity={0.75}
            >
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text style={[styles.helplineNum, { color: colors.primary }]}>{h.number}</Text>
              <Text style={[styles.helplineName, { color: colors.textMuted }]}>{h.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* NEARBY RESOURCES — Live Overpass API */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>NEARBY FACILITIES (LIVE)</Text>
        <View style={[styles.resourcesCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {facilityLoading ? (
            <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Finding nearby police stations, hospitals…</Text>
            </View>
          ) : facilities.length > 0 ? (
            facilities.map((f, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.resourceRow, { borderBottomColor: colors.border }]}
                onPress={() => f.phone ? quickCall(f.phone) : Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}`)}
              >
                <View style={[styles.resourceIcon, { backgroundColor: colors.accentGlow }]}>
                  <Text style={{ fontSize: 20 }}>{f.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resourceLabel, { color: colors.textSecondary }]} numberOfLines={1}>{f.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{f.type} · {f.dist < 1000 ? `${f.dist}m` : `${(f.dist/1000).toFixed(1)}km`} away</Text>
                </View>
                <Ionicons name={f.phone ? 'call-outline' : 'map-outline'} size={16} color={colors.primary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ padding: 20, gap: 12, alignItems: 'center' }}>
              {facilityError ? (
                <Text style={{ color: colors.danger, fontSize: 13, textAlign: 'center' }}>{facilityError}</Text>
              ) : (
                <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                  Tap below to find nearest police stations, hospitals & shelters using your GPS.
                </Text>
              )}
              <TouchableOpacity
                style={[styles.fetchBtn, { backgroundColor: colors.primary }]}
                onPress={fetchNearbyFacilities}
              >
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Find Nearby Facilities</Text>
              </TouchableOpacity>
            </View>
          )}
          {facilities.length > 0 && (
            <TouchableOpacity style={[styles.refreshRow, { borderTopColor: colors.border }]} onPress={fetchNearbyFacilities}>
              <Ionicons name="refresh" size={14} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Safety tips accordion */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SAFETY TIPS & LEGAL RIGHTS</Text>
        {TIPS.map((section) => (
          <View key={section.category} style={[styles.accordion, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpanded(expanded === section.category ? null : section.category)}
              activeOpacity={0.8}
            >
              <Text style={styles.accordionEmoji}>{section.icon}</Text>
              <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>{section.category}</Text>
              <Ionicons name={expanded === section.category ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
            {expanded === section.category && (
              <View style={styles.accordionBody}>
                {section.items.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Text style={[styles.tipBullet, { color: colors.primary }]}>{i + 1}</Text>
                    <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  emergencyStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ff1744', borderRadius: radius.lg, padding: spacing.md + 4,
  },
  emergencyText: { flex: 1, color: '#fff', fontSize: fontSize.lg, fontWeight: '800', marginLeft: spacing.sm },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  helplinesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  helplineCard: {
    width: '47%', borderRadius: radius.lg,
    borderWidth: 1, padding: spacing.md, alignItems: 'center', gap: 4,
  },
  helplineNum: { fontSize: fontSize.xl, fontWeight: '900' },
  helplineName: { fontSize: 10, textAlign: 'center' },
  accordion: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  accordionEmoji: { fontSize: 22 },
  accordionTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '700' },
  accordionBody: { padding: spacing.md, paddingTop: 0, gap: spacing.sm },
  tipRow: { flexDirection: 'row', gap: spacing.sm },
  tipBullet: { fontWeight: '800', fontSize: fontSize.sm, minWidth: 18 },
  tipText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  resourcesCard: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1 },
  resourceIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  resourceLabel: { flex: 1, fontSize: fontSize.sm, fontWeight: '600' },
  fetchBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
  refreshRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: spacing.sm, borderTopWidth: 1 },
});
