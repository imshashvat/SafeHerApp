import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing, radius } from '../../constants/theme';

type Zone = {
  id: string;
  area: string;
  type: string;
  time: string;
  reportedBy: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
};

const SAMPLE_ZONES: Zone[] = [
  {
    id: '1', area: 'Sector 18 Underpass', type: 'Poor Lighting',
    time: 'After 9 PM', reportedBy: '5 users', severity: 'high',
    description: 'Very dark underpass with no CCTV. Multiple incidents reported at night.',
  },
  {
    id: '2', area: 'Old Bus Stand Parking', type: 'Stalking / Harassment',
    time: 'Evening', reportedBy: '3 users', severity: 'high',
    description: 'Groups of men repeatedly reported for verbal harassment.',
  },
  {
    id: '3', area: 'Market Lane, MG Road', type: 'Pickpocketing',
    time: 'Bus hours', reportedBy: '8 users', severity: 'medium',
    description: 'Crowded lane with frequent pickpocketing near bus stops.',
  },
  {
    id: '4', area: 'Park near Metro Station', type: 'Unsafe at Night',
    time: 'Post-10 PM', reportedBy: '2 users', severity: 'low',
    description: 'Park becomes desolate after 10pm — avoid walking alone.',
  },
];

const SEV_COLORS = {
  high: colors.danger,
  medium: colors.warning,
  low: colors.success,
};

const INCIDENT_TYPES = [
  'Poor Lighting', 'Stalking / Harassment', 'Assault', 'Pickpocketing',
  'Unsafe at Night', 'Vehicle Trouble', 'Other',
];

export default function MapScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'zones' | 'report'>('zones');
  const [reportType, setReportType] = useState(INCIDENT_TYPES[0]);
  const [zones] = useState<Zone[]>(SAMPLE_ZONES);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Safe Map</Text>
        <Text style={styles.subtitle}>Community safety reports</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'zones' && styles.tabActive]}
          onPress={() => setActiveTab('zones')}
        >
          <Ionicons name="warning-outline" size={16} color={activeTab === 'zones' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'zones' && styles.tabTextActive]}>Unsafe Zones</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'report' && styles.tabActive]}
          onPress={() => setActiveTab('report')}
        >
          <Ionicons name="flag-outline" size={16} color={activeTab === 'report' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}>Report Zone</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'zones' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Open in Maps button */}
          <TouchableOpacity
            style={styles.openMapBtn}
            onPress={() => Linking.openURL('https://www.openstreetmap.org/')}
          >
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.openMapText}>Open OpenStreetMap</Text>
            <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>REPORTED UNSAFE AREAS</Text>

          {zones.map((zone) => (
            <View key={zone.id} style={[styles.zoneCard, { borderLeftColor: SEV_COLORS[zone.severity] }]}>
              <View style={styles.zoneHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.zoneName}>{zone.area}</Text>
                  <View style={styles.zoneMeta}>
                    <View style={[styles.sevBadge, { backgroundColor: SEV_COLORS[zone.severity] + '22', borderColor: SEV_COLORS[zone.severity] + '55' }]}>
                      <Text style={[styles.sevText, { color: SEV_COLORS[zone.severity] }]}>
                        {zone.severity.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.zoneType}>{zone.type}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.directionsBtn}
                  onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(zone.area)}`)}
                >
                  <Ionicons name="navigate-outline" size={18} color={colors.accent} />
                </TouchableOpacity>
              </View>
              <Text style={styles.zoneDesc}>{zone.description}</Text>
              <View style={styles.zoneFooter}>
                <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                <Text style={styles.zoneFooterText}>{zone.time}</Text>
                <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                <Text style={styles.zoneFooterText}>{zone.reportedBy}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Report an Unsafe Area</Text>
            <Text style={styles.reportSub}>Help fellow women by tagging dangerous spots</Text>

            <Text style={styles.fieldLabel}>INCIDENT TYPE</Text>
            <View style={styles.typeGrid}>
              {INCIDENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, reportType === t && styles.typeChipActive]}
                  onPress={() => setReportType(t)}
                >
                  <Text style={[styles.typeText, reportType === t && styles.typeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() => Linking.openURL('https://maps.google.com/')}
            >
              <Ionicons name="location" size={20} color="#fff" />
              <Text style={styles.reportBtnText}>Pick Location on Map</Text>
            </TouchableOpacity>

            <View style={styles.reportInfo}>
              <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
              <Text style={styles.reportInfoText}>
                Reports are anonymous and shared only with the local SafeHer community.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm },
  tabs: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 4,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: spacing.sm, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primaryGlow },
  tabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 60, gap: spacing.md },
  openMapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
  },
  openMapText: { flex: 1, color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  sectionLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  zoneCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4,
    padding: spacing.md, gap: spacing.xs,
  },
  zoneHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  zoneName: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  zoneMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 3 },
  sevBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1 },
  sevText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  zoneType: { color: colors.textMuted, fontSize: fontSize.xs },
  directionsBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.accent + '44',
  },
  zoneDesc: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  zoneFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  zoneFooterText: { color: colors.textMuted, fontSize: fontSize.xs, marginRight: spacing.sm },
  reportCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md,
  },
  reportTitle: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '800' },
  reportSub: { color: colors.textMuted, fontSize: fontSize.sm },
  fieldLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  typeChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  typeText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  typeTextActive: { color: colors.primary },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md,
  },
  reportBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  reportInfo: {
    flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start',
    backgroundColor: colors.accentGlow, borderRadius: radius.md, padding: spacing.sm,
  },
  reportInfoText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.xs, lineHeight: 18 },
});
