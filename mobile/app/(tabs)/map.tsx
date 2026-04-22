import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import LeafletMapView, { LeafletCircle } from '../../components/LeafletMapView';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useCrimeData } from '../../hooks/useCrimeData';
import { crimeDataService, STATE_COORDS } from '../../services/crimeDataService';
import type { DistrictRisk } from '../../services/crimeDataService';
import { useSettingsStore } from '../../store/settingsStore';
import { colors, fontSize, spacing, radius } from '../../constants/theme';

export default function SafeMapScreen() {
  const { loaded } = useCrimeData();
  const { mapTheme, update: updateSettings } = useSettingsStore();
  const [selectedState, setSelectedState] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState<(DistrictRisk & { lat: number; lng: number }) | null>(null);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [tab, setTab] = useState<'map' | 'states' | 'districts'>('map');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  // Only computed once data is loaded
  const allDistrictsWithCoords = useMemo(
    () => (loaded ? crimeDataService.getAllDistrictsWithCoords() : []),
    [loaded]
  );
  const stateRankings = useMemo(
    () => (loaded ? crimeDataService.getStateRankings() : []),
    [loaded]
  );
  const riskDist = useMemo(
    () => (loaded ? crimeDataService.getRiskDistribution() : { safe: 0, moderate: 0, high_risk: 0 }),
    [loaded]
  );

  const filteredDistricts = useMemo(() => {
    if (selectedState === 'All') return allDistrictsWithCoords;
    return allDistrictsWithCoords.filter(d => d.state.toUpperCase() === selectedState);
  }, [selectedState, allDistrictsWithCoords]);

  const topDistricts = useMemo(
    () => [...filteredDistricts].sort((a, b) => b.total_crimes - a.total_crimes).slice(0, 50),
    [filteredDistricts]
  );

  const mapRegion = useMemo(() => {
    if (selectedState !== 'All' && STATE_COORDS[selectedState]) {
      const [lat, lng] = STATE_COORDS[selectedState];
      return { latitude: lat, longitude: lng, latitudeDelta: 4, longitudeDelta: 4 };
    }
    return { latitude: 22.5, longitude: 78.5, latitudeDelta: 22, longitudeDelta: 22 };
  }, [selectedState]);

  const maxCrimes = useMemo(
    () => filteredDistricts.reduce((max, d) => Math.max(max, d.total_crimes), 1),
    [filteredDistricts]
  );

  // Build Leaflet circle data from district list
  const leafletCircles = useMemo((): LeafletCircle[] =>
    filteredDistricts.slice(0, 500).map((d, i) => ({
      lat: d.lat,
      lng: d.lng,
      radius: 8000 + Math.sqrt(d.total_crimes / maxCrimes) * 72000,
      fillColor:
        d.risk_code === 2 ? '#FF3366' :
        d.risk_code === 1 ? '#FFB800' : '#00D4AA',
      strokeColor:
        d.risk_code === 2 ? '#FF3366' :
        d.risk_code === 1 ? '#FFB800' : '#00D4AA',
      index: i,
    })),
    [filteredDistricts, maxCrimes]
  );

  const leafletCenter: [number, number] = useMemo(() => {
    if (selectedState !== 'All' && STATE_COORDS[selectedState]) {
      return STATE_COORDS[selectedState] as [number, number];
    }
    return [22.5, 78.5];
  }, [selectedState]);

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading ML Crime Data…</Text>
          <Text style={styles.loadingSubtext}>1032 districts · NCRB 2001–2015</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Crime Heatmap</Text>
          <Text style={styles.subtitle}>
            LightGBM 99.4% · {filteredDistricts.length} districts
          </Text>
        </View>
        {/* Risk counts */}
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: 'rgba(0,212,170,0.15)' }]}>
            <View style={[styles.chipDot, { backgroundColor: '#00D4AA' }]} />
            <Text style={[styles.chipTxt, { color: '#00D4AA' }]}>{riskDist.safe}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: 'rgba(255,184,0,0.15)' }]}>
            <View style={[styles.chipDot, { backgroundColor: '#FFB800' }]} />
            <Text style={[styles.chipTxt, { color: '#FFB800' }]}>{riskDist.moderate}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: 'rgba(255,51,102,0.15)' }]}>
            <View style={[styles.chipDot, { backgroundColor: '#FF3366' }]} />
            <Text style={[styles.chipTxt, { color: '#FF3366' }]}>{riskDist.high_risk}</Text>
          </View>
        </View>
      </View>

      {/* State filter */}
      <TouchableOpacity style={styles.stateFilter} onPress={() => setShowStatePicker(true)}>
        <Ionicons name="funnel-outline" size={14} color={colors.primary} />
        <Text style={styles.stateFilterText}>
          {selectedState === 'All' ? `All States & UTs (${stateRankings.length})` : selectedState}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        {selectedState !== 'All' && (
          <TouchableOpacity onPress={() => setSelectedState('All')} style={styles.clearFilter}>
            <Ionicons name="close-circle" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['map', 'states', 'districts'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
              {t === 'map' ? '🗺 Map' : t === 'states' ? '🏛 States' : '📍 Districts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── MAP VIEW (OpenStreetMap via Leaflet — free, no billing) ── */}
      {tab === 'map' && (
        <View style={{ flex: 1 }}>
          <LeafletMapView
            style={styles.map}
            circles={leafletCircles}
            center={leafletCenter}
            zoom={selectedState === 'All' ? 5 : 7}
            theme={mapTheme}
            userLat={userLocation?.lat}
            userLng={userLocation?.lng}
            onPress={({ index }) => {
              const d = filteredDistricts[index];
              if (d) setSelectedDistrict(d as any);
            }}
          />

          {/* Map theme toggle */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={() => updateSettings({ mapTheme: mapTheme === 'light' ? 'dark' : 'light' })}
            activeOpacity={0.8}
          >
            <Ionicons
              name={mapTheme === 'light' ? 'moon-outline' : 'sunny-outline'}
              size={18}
              color={mapTheme === 'light' ? '#333' : '#FFD700'}
            />
          </TouchableOpacity>

          {/* Legend overlay */}
          <View style={[styles.legend, mapTheme === 'light' && styles.legendLight]}>
            <Text style={[styles.legendTitle, mapTheme === 'light' && { color: '#333' }]}>Risk Level</Text>
            {([['HIGH RISK', '#FF3366'], ['MODERATE', '#FFB800'], ['SAFE', '#00D4AA']] as const).map(([label, c]) => (
              <View key={label} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: c }]} />
                <Text style={[styles.legendLabel, mapTheme === 'light' && { color: '#555' }]}>{label}</Text>
              </View>
            ))}
            <Text style={[styles.legendLabel, { marginTop: 4, color: mapTheme === 'light' ? '#888' : colors.textMuted }]}>
              Circle size ∝ crime count
            </Text>
          </View>
        </View>
      )}

      {/* ── STATES LIST ── */}
      {tab === 'states' && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>STATE RANKINGS — MOST TO LEAST DANGEROUS</Text>
          {stateRankings.map((s) => (
            <TouchableOpacity
              key={s.state}
              style={styles.stateCard}
              onPress={() => { setSelectedState(s.state); setTab('map'); }}
            >
              <View style={[styles.rankBadge, { backgroundColor: `${s.color}22` }]}>
                <Text style={[styles.rankNum, { color: s.color }]}>{s.rank}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stateName}>{s.state}</Text>
                <Text style={styles.stateMeta}>{s.num_districts} districts · avg {s.avg_crime_rate} crimes/district</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.stateCrimes, { color: s.color }]}>
                  {(s.total_crimes / 1000).toFixed(1)}K
                </Text>
                <View style={[styles.riskPill, { backgroundColor: `${s.color}22` }]}>
                  <Text style={[styles.riskPillText, { color: s.color }]}>{s.risk_level}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── DISTRICTS LIST ── */}
      {tab === 'districts' && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>
            {selectedState === 'All' ? 'TOP DANGEROUS DISTRICTS (ALL INDIA)' : `${selectedState} — DISTRICTS`}
          </Text>
          {topDistricts.map((d, i) => (
            <TouchableOpacity
              key={`${d.state}-${d.district}-${i}`}
              style={styles.districtCard}
              onPress={() => setSelectedDistrict(d)}
            >
              <Text style={styles.distRank}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.distName}>{d.district}</Text>
                <Text style={styles.distState}>{d.state}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.distCrimes, { color: d.color }]}>
                  {d.total_crimes.toLocaleString()}
                </Text>
                <View style={[styles.riskPill, { backgroundColor: `${d.color}22` }]}>
                  <Text style={[styles.riskPillText, { color: d.color }]}>{d.risk_level}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {selectedState === 'All' && (
            <Text style={styles.dataSource}>
              Showing top 50 · Total {allDistrictsWithCoords.length} districts · LightGBM 99.43%
            </Text>
          )}
        </ScrollView>
      )}

      {/* ── DISTRICT DETAIL MODAL ── */}
      <Modal visible={!!selectedDistrict} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {selectedDistrict && (
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedDistrict(null)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>{selectedDistrict.district}</Text>
              <Text style={styles.modalState}>{selectedDistrict.state}</Text>

              {/* Probability bars */}
              <View style={styles.probRow}>
                {[
                  ['SAFE', '#00D4AA', selectedDistrict.prob_safe],
                  ['MODERATE', '#FFB800', selectedDistrict.prob_moderate],
                  ['HIGH RISK', '#FF3366', selectedDistrict.prob_high],
                ].map(([label, c, prob]) => (
                  <View key={String(label)} style={styles.probCard}>
                    <Text style={[styles.probPct, { color: c as string }]}>
                      {((prob as number) * 100).toFixed(0)}%
                    </Text>
                    <View style={[styles.probBar, { height: 4 + ((prob as number) * 32), backgroundColor: c as string }]} />
                    <Text style={styles.probLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Text style={[styles.modalStatVal, { color: selectedDistrict.color }]}>
                    {selectedDistrict.total_crimes.toLocaleString()}
                  </Text>
                  <Text style={styles.modalStatLabel}>TOTAL CRIMES</Text>
                </View>
                <View style={styles.modalStat}>
                  <Text style={[styles.modalStatVal, { color: colors.accent }]}>
                    {(selectedDistrict.confidence * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.modalStatLabel}>CONFIDENCE</Text>
                </View>
                <View style={styles.modalStat}>
                  <View style={[styles.riskPill, { backgroundColor: `${selectedDistrict.color}22` }]}>
                    <Text style={[styles.riskPillText, { color: selectedDistrict.color }]}>
                      {selectedDistrict.risk_level}
                    </Text>
                  </View>
                  <Text style={styles.modalStatLabel}>ML PREDICTION</Text>
                </View>
              </View>

              {/* Crime breakdown bars */}
              <Text style={styles.breakdownTitle}>NCRB CRIME BREAKDOWN</Text>
              {(Object.entries(selectedDistrict.breakdown) as [string, number][])
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const total = Object.values(selectedDistrict.breakdown).reduce((s, v) => s + (v ?? 0), 0) as number;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const LABELS: Record<string, string> = {
                    cruelty: 'Cruelty by Husband', assault: 'Assault on Women',
                    rape: 'Rape', kidnapping: 'Kidnapping', insult: 'Insult to Modesty', dowry: 'Dowry Deaths',
                  };
                  return (
                    <View key={type} style={styles.bdRow}>
                      <Text style={styles.bdLabel}>{LABELS[type] ?? type}</Text>
                      <View style={styles.bdBarBg}>
                        <View style={[styles.bdBarFill, {
                          width: `${pct}%`,
                          backgroundColor: selectedDistrict.color,
                        }]} />
                      </View>
                      <Text style={styles.bdVal}>{count.toLocaleString()} ({pct}%)</Text>
                    </View>
                  );
                })}

              {selectedDistrict.note && (
                <Text style={styles.noteText}>ℹ️ {selectedDistrict.note}</Text>
              )}
              <Text style={styles.sourceText}>
                Source: NCRB 2001–2015 · LightGBM prediction
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* ── STATE PICKER MODAL ── */}
      <Modal visible={showStatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerBox}>
            <Text style={styles.pickerTitle}>Filter by State / UT</Text>
            <ScrollView>
              <TouchableOpacity
                style={[styles.pickerItem, selectedState === 'All' && styles.pickerItemActive]}
                onPress={() => { setSelectedState('All'); setShowStatePicker(false); }}
              >
                <Text style={styles.pickerItemText}>All States & UTs</Text>
                <Text style={styles.pickerItemMeta}>{allDistrictsWithCoords.length} districts</Text>
              </TouchableOpacity>
              {stateRankings.map(s => {
                const cnt = allDistrictsWithCoords.filter(d => d.state.toUpperCase() === s.state).length;
                return (
                  <TouchableOpacity
                    key={s.state}
                    style={[styles.pickerItem, selectedState === s.state && styles.pickerItemActive]}
                    onPress={() => { setSelectedState(s.state); setShowStatePicker(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerItemText}>{s.state}</Text>
                      <Text style={styles.pickerItemMeta}>#{s.rank} · {cnt} districts</Text>
                    </View>
                    <View style={[styles.riskPill, { backgroundColor: `${s.color}22` }]}>
                      <Text style={[styles.riskPillText, { color: s.color }]}>{s.risk_level}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.pickerClose} onPress={() => setShowStatePicker(false)}>
              <Text style={styles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700' },
  loadingSubtext: { color: colors.textMuted, fontSize: fontSize.sm },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  chips: { flexDirection: 'row', gap: 5 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  chipTxt: { fontSize: 10, fontWeight: '800' },
  stateFilter: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm, paddingVertical: 7,
  },
  stateFilterText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '600' },
  clearFilter: { padding: 2 },
  tabBar: {
    flexDirection: 'row', marginHorizontal: spacing.md, marginBottom: spacing.xs,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 3,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: radius.sm },
  tabBtnActive: { backgroundColor: colors.primaryGlow },
  tabTxt: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  tabTxtActive: { color: colors.primary },
  map: { flex: 1 },
  markerPill: {
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6,
    maxWidth: 70,
  },
  markerText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  legend: {
    position: 'absolute', bottom: 20, left: 14,
    backgroundColor: 'rgba(15,10,30,0.92)', borderRadius: radius.md,
    padding: spacing.sm, gap: 3, borderWidth: 1, borderColor: colors.border,
  },
  legendLight: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: '#ddd',
  },
  themeToggle: {
    position: 'absolute', top: 14, right: 14,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ddd',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  legendTitle: { color: colors.textPrimary, fontSize: 9, fontWeight: '800', marginBottom: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: colors.textSecondary, fontSize: 9 },
  listContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: 80 },
  sectionLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1.5 },
  stateCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  rankBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: fontSize.sm, fontWeight: '900' },
  stateName: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '700' },
  stateMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  stateCrimes: { fontSize: fontSize.lg, fontWeight: '900' },
  districtCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  distRank: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '800', width: 22 },
  distName: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '700' },
  distState: { color: colors.textMuted, fontSize: fontSize.xs },
  distCrimes: { fontSize: fontSize.md, fontWeight: '900' },
  riskPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  riskPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  dataSource: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: 40, maxHeight: '85%',
  },
  modalClose: { position: 'absolute', top: spacing.md, right: spacing.md, zIndex: 10, padding: 4 },
  modalTitle: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '900', marginRight: 32 },
  modalState: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.md },
  probRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, alignItems: 'flex-end' },
  probCard: { flex: 1, alignItems: 'center', gap: 4 },
  probPct: { fontSize: fontSize.lg, fontWeight: '900' },
  probBar: { width: '100%', borderRadius: 3, minHeight: 4 },
  probLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  modalStats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modalStat: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: 'center', gap: 4 },
  modalStatVal: { fontSize: fontSize.xl, fontWeight: '900' },
  modalStatLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  breakdownTitle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.sm },
  bdRow: { marginBottom: spacing.xs },
  bdLabel: { color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 2 },
  bdBarBg: { height: 5, borderRadius: 3, backgroundColor: colors.bgElevated, overflow: 'hidden', marginBottom: 2 },
  bdBarFill: { height: 5, borderRadius: 3 },
  bdVal: { color: colors.textMuted, fontSize: 9 },
  noteText: { color: colors.warning, fontSize: fontSize.xs, marginTop: spacing.sm },
  sourceText: { color: colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: spacing.sm },
  pickerBox: { backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '75%' },
  pickerTitle: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '800', marginBottom: spacing.md },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, marginBottom: 2 },
  pickerItemActive: { backgroundColor: colors.primaryGlow },
  pickerItemText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  pickerItemMeta: { color: colors.textMuted, fontSize: fontSize.xs },
  pickerClose: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  pickerCloseText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
});
