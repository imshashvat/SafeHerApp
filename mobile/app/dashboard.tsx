import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing, radius } from '../constants/theme';
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

  const modelInfo = useMemo(() => crimeDataService.getModelInfo(), []);
  const stateRankings = useMemo(() => crimeDataService.getStateRankings(), []);
  const crimeTypes = useMemo(() => crimeDataService.getCrimeTypeBreakdown(), []);
  const riskDist = useMemo(() => crimeDataService.getRiskDistribution(), []);
  const topDistricts = useMemo(() => crimeDataService.getTopDangerousDistricts(10), []);

  const totalCrimes = useMemo(() =>
    stateRankings.reduce((s, r) => s + r.total_crimes, 0), [stateRankings]);

  const crimeTypeData = useMemo(() =>
    Object.entries(crimeTypes)
      .map(([name, value]) => ({ name, label: CRIME_LABELS[name] || name, value, color: CRIME_COLORS[name] || '#888' }))
      .sort((a, b) => b.value - a.value),
    [crimeTypes]);

  // Feature importance from LightGBM
  const featureImportance = useMemo(() => {
    const fi = modelInfo?.models?.LightGBM?.feature_importance;
    if (!fi) return [];
    return Object.entries(fi)
      .map(([name, score]) => ({ name, score: score as number }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [modelInfo]);

  const maxFI = featureImportance.length ? featureImportance[0].score : 1;

  // Model comparison
  const modelComparison = useMemo(() => {
    if (!modelInfo?.models) return [];
    return Object.entries(modelInfo.models)
      .map(([name, data]) => ({ name, accuracy: (data as any).test_accuracy * 100, cv: (data as any).cv_mean * 100 }))
      .sort((a, b) => b.accuracy - a.accuracy);
  }, [modelInfo]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Crime Intelligence</Text>
          <Text style={styles.subtitle}>
            NCRB 2001–2015 · {crimeDataService.districtCount} Districts · LightGBM {(modelInfo.best_accuracy * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          {[
            { label: 'Total Crimes', value: `${Math.round(totalCrimes / 100000)}L+`, color: colors.primary, icon: 'bar-chart' },
            { label: 'Districts', value: crimeDataService.districtCount.toString(), color: colors.accent, icon: 'location' },
            { label: 'States & UTs', value: crimeDataService.stateCount.toString(), color: colors.success, icon: 'globe' },
            { label: 'Highest Risk', value: stateRankings[0]?.state?.substring(0, 8) || '—', color: '#FF3366', icon: 'warning' },
          ].map((k, i) => (
            <View key={i} style={styles.kpiCard}>
              <Ionicons name={k.icon as any} size={16} color={k.color} />
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* ML Model Performance */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip-outline" size={16} color={colors.accent} />
            <Text style={styles.cardTitle}>ML Model Performance</Text>
            <View style={styles.bestBadge}>
              <Text style={styles.bestBadgeText}>Best: {modelInfo.best_model}</Text>
            </View>
          </View>

          <View style={styles.mlStatsRow}>
            <View style={styles.mlStatCard}>
              <Text style={[styles.mlStatValue, { color: colors.accent }]}>
                {(modelInfo.best_accuracy * 100).toFixed(1)}%
              </Text>
              <Text style={styles.mlStatLabel}>ACCURACY</Text>
            </View>
            <View style={styles.mlStatCard}>
              <Text style={[styles.mlStatValue, { color: '#00D4AA' }]}>{riskDist.safe}</Text>
              <Text style={styles.mlStatLabel}>SAFE</Text>
            </View>
            <View style={styles.mlStatCard}>
              <Text style={[styles.mlStatValue, { color: '#FFB800' }]}>{riskDist.moderate}</Text>
              <Text style={styles.mlStatLabel}>MODERATE</Text>
            </View>
            <View style={styles.mlStatCard}>
              <Text style={[styles.mlStatValue, { color: '#FF3366' }]}>{riskDist.high_risk}</Text>
              <Text style={styles.mlStatLabel}>HIGH RISK</Text>
            </View>
          </View>

          {/* Model comparison table */}
          {modelComparison.map((m, i) => (
            <View key={m.name} style={styles.modelRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.modelNameRow}>
                  {m.name === modelInfo.best_model && <Text style={styles.starIcon}>★</Text>}
                  <Text style={styles.modelName}>{m.name}</Text>
                  {m.name === modelInfo.best_model && (
                    <View style={styles.bestTag}><Text style={styles.bestTagText}>BEST</Text></View>
                  )}
                </View>
              </View>
              <Text style={[styles.modelAccuracy, m.name === modelInfo.best_model && { color: colors.accent }]}>
                {m.accuracy.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Feature Importance */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics-outline" size={16} color={colors.accent} />
            <Text style={styles.cardTitle}>Feature Importance — LightGBM</Text>
          </View>
          {featureImportance.map((f, i) => (
            <View key={f.name} style={styles.fiRow}>
              <Text style={styles.fiName}>{f.name}</Text>
              <View style={styles.fiBarBg}>
                <View style={[styles.fiBarFill, {
                  width: `${(f.score / maxFI) * 100}%`,
                  backgroundColor: i < 2 ? '#e74c3c' : i < 5 ? '#e67e22' : '#3498db',
                }]} />
              </View>
              <Text style={styles.fiScore}>{f.score}</Text>
            </View>
          ))}
        </View>

        {/* Crime Type Breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pie-chart-outline" size={16} color={colors.primary} />
            <Text style={styles.cardTitle}>Crime Type Breakdown (NCRB)</Text>
          </View>
          {crimeTypeData.map((c) => {
            const pct = totalCrimes > 0 ? Math.round((c.value / totalCrimes) * 100) : 0;
            return (
              <View key={c.name} style={styles.crimeTypeRow}>
                <View style={[styles.crimeTypeDot, { backgroundColor: c.color }]} />
                <Text style={styles.crimeTypeLabel}>{c.label}</Text>
                <Text style={styles.crimeTypeValue}>{c.value.toLocaleString()}</Text>
                <Text style={styles.crimeTypePct}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* Top 15 States */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy-outline" size={16} color={colors.warning} />
            <Text style={styles.cardTitle}>State Rankings — Total Crimes</Text>
          </View>
          {stateRankings.slice(0, 15).map((s, i) => (
            <View key={s.state} style={styles.stateRow}>
              <Text style={styles.stateRank}>{s.rank}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stateName}>{s.state}</Text>
                <Text style={styles.stateDistricts}>{s.num_districts} districts</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.stateCrimes}>{s.total_crimes.toLocaleString()}</Text>
                <View style={[styles.stateRiskPill, { backgroundColor: `${s.color}20` }]}>
                  <Text style={[styles.stateRiskText, { color: s.color }]}>{s.risk_level}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Top 10 Dangerous Districts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={styles.cardTitle}>Top 10 Dangerous Districts</Text>
          </View>
          {topDistricts.map((d, i) => (
            <View key={`${d.district}-${d.state}`} style={styles.stateRow}>
              <Text style={styles.stateRank}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stateName}>{d.district}</Text>
                <Text style={styles.stateDistricts}>{d.state}</Text>
              </View>
              <Text style={[styles.stateCrimes, { color: d.color }]}>
                {d.total_crimes.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Data source */}
        <View style={styles.sourceCard}>
          <Text style={styles.sourceText}>
            📊 Data: National Crime Records Bureau (NCRB), Ministry of Home Affairs, GOI{'\n'}
            Dataset: District-wise Crimes Against Women (2001–2015){'\n'}
            Model: LightGBM 99.4% F1 · {crimeDataService.districtCount} districts · {crimeDataService.stateCount} states
          </Text>
        </View>
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
  subtitle: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpiCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: 'center', gap: 3,
  },
  kpiValue: { fontSize: fontSize.lg, fontWeight: '900' },
  kpiLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '600', letterSpacing: 1, textAlign: 'center' },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  cardTitle: { flex: 1, color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '700' },
  bestBadge: { backgroundColor: 'rgba(124,58,237,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  bestBadgeText: { color: colors.accent, fontSize: 9, fontWeight: '700' },
  mlStatsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  mlStatCard: {
    flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.md,
    padding: spacing.sm, alignItems: 'center', gap: 2,
  },
  mlStatValue: { fontSize: fontSize.lg, fontWeight: '900' },
  mlStatLabel: { color: colors.textMuted, fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  modelRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  modelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starIcon: { color: colors.accent, fontSize: 12 },
  modelName: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '600' },
  bestTag: { backgroundColor: 'rgba(124,58,237,0.2)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  bestTagText: { color: colors.accent, fontSize: 7, fontWeight: '800' },
  modelAccuracy: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '800' },
  fiRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 6 },
  fiName: { color: colors.textMuted, fontSize: fontSize.xs, width: 80 },
  fiBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  fiBarFill: { height: 6, borderRadius: 3 },
  fiScore: { color: colors.textSecondary, fontSize: 9, width: 36, textAlign: 'right', fontWeight: '700' },
  crimeTypeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 5 },
  crimeTypeDot: { width: 8, height: 8, borderRadius: 4 },
  crimeTypeLabel: { flex: 1, color: colors.textSecondary, fontSize: fontSize.xs },
  crimeTypeValue: { color: colors.textPrimary, fontSize: fontSize.xs, fontWeight: '700', width: 60, textAlign: 'right' },
  crimeTypePct: { color: colors.textMuted, fontSize: fontSize.xs, width: 30, textAlign: 'right' },
  stateRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border,
  },
  stateRank: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', width: 20 },
  stateName: { color: colors.textPrimary, fontSize: fontSize.xs, fontWeight: '600' },
  stateDistricts: { color: colors.textMuted, fontSize: 9, marginTop: 1 },
  stateCrimes: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '800' },
  stateRiskPill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.full, marginTop: 2 },
  stateRiskText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  sourceCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  sourceText: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', lineHeight: 18 },
});
