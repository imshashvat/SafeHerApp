import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../contexts/ThemeContext';
import { fontSize, spacing, radius } from '../constants/theme';
import { crimeDataService } from '../services/crimeDataService';

const CRIME_COLORS: Record<string, string> = {
  cruelty: '#2ecc71', assault: '#e74c3c', rape: '#e67e22',
  kidnapping: '#3498db', insult: '#9b59b6', dowry: '#1abc9c',
};
const CRIME_LABELS: Record<string, string> = {
  rape: 'Rape', kidnapping: 'Kidnapping', dowry: 'Dowry Deaths',
  assault: 'Assault on Women', insult: 'Insult to Modesty', cruelty: 'Cruelty by Husband',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const modelInfo = useMemo(() => crimeDataService.getModelInfo(), []);
  const stateRankings = useMemo(() => crimeDataService.getStateRankings(), []);
  const crimeTypes = useMemo(() => crimeDataService.getCrimeTypeBreakdown(), []);
  const riskDist = useMemo(() => crimeDataService.getRiskDistribution(), []);
  const topDistricts = useMemo(() => crimeDataService.getTopDangerousDistricts(10), []);
  const totalCrimes = useMemo(() => stateRankings.reduce((s, r) => s + r.total_crimes, 0), [stateRankings]);
  const crimeTypeData = useMemo(() =>
    Object.entries(crimeTypes)
      .map(([name, value]) => ({ name, label: CRIME_LABELS[name] || name, value, color: CRIME_COLORS[name] || '#888' }))
      .sort((a, b) => b.value - a.value), [crimeTypes]);
  const featureImportance = useMemo(() => {
    const fi = modelInfo?.models?.LightGBM?.feature_importance;
    if (!fi) return [];
    return Object.entries(fi).map(([name, score]) => ({ name, score: score as number }))
      .sort((a, b) => b.score - a.score).slice(0, 10);
  }, [modelInfo]);
  const maxFI = featureImportance.length ? featureImportance[0].score : 1;
  const modelComparison = useMemo(() => {
    if (!modelInfo?.models) return [];
    return Object.entries(modelInfo.models)
      .map(([name, data]) => ({ name, accuracy: (data as any).test_accuracy * 100 }))
      .sort((a, b) => b.accuracy - a.accuracy);
  }, [modelInfo]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Crime Intelligence</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            NCRB 2001–2015 · {crimeDataService.districtCount} Districts · LightGBM {(modelInfo.best_accuracy * 100).toFixed(1)}%
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          {[
            { label: 'Total Crimes', value: totalCrimes.toLocaleString('en-IN'), color: colors.primary, icon: 'bar-chart' },
            { label: 'Districts', value: crimeDataService.districtCount.toString(), color: colors.accent, icon: 'location' },
            { label: 'States & UTs', value: `${crimeDataService.stateCount} (28+8)`, color: colors.success, icon: 'globe' },
            { label: 'Highest Risk', value: stateRankings[0]?.state?.substring(0, 8) || '—', color: '#FF3366', icon: 'warning' },
          ].map((k, i) => (
            <View key={i} style={[styles.kpiCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Ionicons name={k.icon as any} size={16} color={k.color} />
              <Text style={[styles.kpiValue, { color: k.color }]} numberOfLines={1} adjustsFontSizeToFit>{k.value}</Text>
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* ML Model */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip-outline" size={16} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>ML Model Performance</Text>
            <View style={[styles.bestBadge, { backgroundColor: colors.accentGlow }]}>
              <Text style={[styles.bestBadgeText, { color: colors.accent }]}>Best: {modelInfo.best_model}</Text>
            </View>
          </View>
          <View style={styles.mlStatsRow}>
            {[
              { val: `${(modelInfo.best_accuracy * 100).toFixed(1)}%`, label: 'ACCURACY', color: colors.accent },
              { val: String(riskDist.safe), label: 'SAFE', color: '#00D4AA' },
              { val: String(riskDist.moderate), label: 'MODERATE', color: '#FFB800' },
              { val: String(riskDist.high_risk), label: 'HIGH RISK', color: '#FF3366' },
            ].map(s => (
              <View key={s.label} style={[styles.mlStatCard, { backgroundColor: colors.bgElevated }]}>
                <Text style={[styles.mlStatValue, { color: s.color }]}>{s.val}</Text>
                <Text style={[styles.mlStatLabel, { color: colors.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </View>
          {modelComparison.map(m => (
            <View key={m.name} style={[styles.modelRow, { borderTopColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.modelNameRow}>
                  {m.name === modelInfo.best_model && <Text style={{ color: colors.accent, fontSize: 12 }}>★ </Text>}
                  <Text style={[styles.modelName, { color: colors.textSecondary }]}>{m.name}</Text>
                  {m.name === modelInfo.best_model && (
                    <View style={[styles.bestTag, { backgroundColor: colors.accentGlow }]}>
                      <Text style={[styles.bestTagText, { color: colors.accent }]}>BEST</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.modelAccuracy, { color: m.name === modelInfo.best_model ? colors.accent : colors.textPrimary }]}>
                {m.accuracy.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
        {/* Feature Importance */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics-outline" size={16} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Feature Importance — LightGBM</Text>
          </View>
          {featureImportance.map((f, i) => (
            <View key={f.name} style={styles.fiRow}>
              <Text style={[styles.fiName, { color: colors.textMuted }]}>{f.name}</Text>
              <View style={[styles.fiBarBg, { backgroundColor: colors.bgElevated }]}>
                <View style={[styles.fiBarFill, { width: `${(f.score / maxFI) * 100}%` as any, backgroundColor: i < 2 ? '#e74c3c' : i < 5 ? '#e67e22' : '#3498db' }]} />
              </View>
              <Text style={[styles.fiScore, { color: colors.textSecondary }]}>{f.score}</Text>
            </View>
          ))}
        </View>
        {/* Crime Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="pie-chart-outline" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Crime Type Breakdown (NCRB)</Text>
          </View>
          {crimeTypeData.map(c => {
            const pct = totalCrimes > 0 ? Math.round((c.value / totalCrimes) * 100) : 0;
            return (
              <View key={c.name} style={styles.crimeTypeRow}>
                <View style={[styles.crimeTypeDot, { backgroundColor: c.color }]} />
                <Text style={[styles.crimeTypeLabel, { color: colors.textSecondary }]}>{c.label}</Text>
                <Text style={[styles.crimeTypeValue, { color: colors.textPrimary }]}>{c.value.toLocaleString()}</Text>
                <Text style={[styles.crimeTypePct, { color: colors.textMuted }]}>{pct}%</Text>
              </View>
            );
          })}
        </View>
        {/* State Rankings */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy-outline" size={16} color={colors.warning} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>State Rankings — Total Crimes</Text>
          </View>
          {stateRankings.slice(0, 15).map(s => (
            <View key={s.state} style={[styles.stateRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.stateRank, { color: colors.textMuted }]}>{s.rank}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stateName, { color: colors.textPrimary }]}>{s.state}</Text>
                <Text style={[styles.stateDistricts, { color: colors.textMuted }]}>{s.num_districts} districts</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.stateCrimes, { color: colors.textPrimary }]}>{s.total_crimes.toLocaleString()}</Text>
                <View style={[styles.stateRiskPill, { backgroundColor: `${s.color}20` }]}>
                  <Text style={[styles.stateRiskText, { color: s.color }]}>{s.risk_level}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        {/* Top Dangerous Districts */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Top 10 Dangerous Districts</Text>
          </View>
          {topDistricts.map((d, i) => (
            <View key={`${d.district}-${d.state}`} style={[styles.stateRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.stateRank, { color: colors.textMuted }]}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stateName, { color: colors.textPrimary }]}>{d.district}</Text>
                <Text style={[styles.stateDistricts, { color: colors.textMuted }]}>{d.state}</Text>
              </View>
              <Text style={[styles.stateCrimes, { color: d.color }]}>{d.total_crimes.toLocaleString()}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.sourceCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sourceText, { color: colors.textMuted }]}>
            📊 NCRB 2001–2015 · LightGBM 99.4% F1 · {crimeDataService.districtCount} districts · {crimeDataService.stateCount} states
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  title: { fontSize: fontSize.xl, fontWeight: '800' },
  subtitle: { fontSize: fontSize.xs, marginTop: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpiCard: { flex: 1, borderRadius: radius.md, borderWidth: 1, padding: spacing.sm, alignItems: 'center', gap: 3 },
  kpiValue: { fontSize: fontSize.lg, fontWeight: '900' },
  kpiLabel: { fontSize: 8, fontWeight: '600', letterSpacing: 1, textAlign: 'center' },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  cardTitle: { flex: 1, fontSize: fontSize.sm, fontWeight: '700' },
  bestBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  bestBadgeText: { fontSize: 9, fontWeight: '700' },
  mlStatsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  mlStatCard: { flex: 1, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', gap: 2 },
  mlStatValue: { fontSize: fontSize.lg, fontWeight: '900' },
  mlStatLabel: { fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  modelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, borderTopWidth: 1 },
  modelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modelName: { fontSize: fontSize.xs, fontWeight: '600' },
  bestTag: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, marginLeft: 4 },
  bestTagText: { fontSize: 7, fontWeight: '800' },
  modelAccuracy: { fontSize: fontSize.sm, fontWeight: '800' },
  fiRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 6 },
  fiName: { fontSize: fontSize.xs, width: 80 },
  fiBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fiBarFill: { height: 6, borderRadius: 3 },
  fiScore: { fontSize: 9, width: 36, textAlign: 'right', fontWeight: '700' },
  crimeTypeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 5 },
  crimeTypeDot: { width: 8, height: 8, borderRadius: 4 },
  crimeTypeLabel: { flex: 1, fontSize: fontSize.xs },
  crimeTypeValue: { fontSize: fontSize.xs, fontWeight: '700', width: 60, textAlign: 'right' },
  crimeTypePct: { fontSize: fontSize.xs, width: 30, textAlign: 'right' },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderTopWidth: 1 },
  stateRank: { fontSize: fontSize.xs, fontWeight: '700', width: 20 },
  stateName: { fontSize: fontSize.xs, fontWeight: '600' },
  stateDistricts: { fontSize: 9, marginTop: 1 },
  stateCrimes: { fontSize: fontSize.sm, fontWeight: '800' },
  stateRiskPill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.full, marginTop: 2 },
  stateRiskText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  sourceCard: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  sourceText: { fontSize: fontSize.xs, textAlign: 'center', lineHeight: 18 },
});
