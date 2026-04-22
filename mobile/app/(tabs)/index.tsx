import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SOSButton from '../../components/SOSButton';
import CountdownTimer from '../../components/CountdownTimer';
import { useGuardianStore } from '../../store/guardianStore';
import { useSOSStore } from '../../store/sosStore';
import { useSettingsStore } from '../../store/settingsStore';
import { quickCall } from '../../services/alertService';
import { HELPLINES } from '../../constants/helplines';
import { colors, fontSize, spacing, radius } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { guardians } = useGuardianStore();
  const { status } = useSOSStore();
  const { shakeSensitivity, fallDetection, isOnboarded, loaded } = useSettingsStore();

  useEffect(() => {
    // Only redirect AFTER user-specific settings have been loaded from SQLite
    // Without this guard, isOnboarded is always false on first render → crash
    if (loaded && !isOnboarded) {
      router.replace('/onboarding');
    }
  }, [loaded, isOnboarded]);

  const quickActions = [
    {
      label: 'Fake Call',
      icon: 'call-outline' as const,
      color: colors.accent,
      onPress: () => router.push('/fake-call'),
    },
    {
      label: 'Guardians',
      icon: 'people-outline' as const,
      color: colors.primary,
      onPress: () => router.push('/guardians'),
    },
    {
      label: 'Track Me',
      icon: 'location-outline' as const,
      color: colors.success,
      onPress: () => router.push('/live-tracking'),
    },
    {
      label: 'Safety Hub',
      icon: 'shield-checkmark-outline' as const,
      color: colors.warning,
      onPress: () => router.push('/safety-hub'),
    },
  ];

  const intelligenceActions = [
    {
      label: 'Crime Dashboard',
      desc: 'NCRB stats, state rankings, ML model insights',
      icon: 'bar-chart-outline' as const,
      color: '#e67e22',
      onPress: () => router.push('/dashboard'),
    },
    {
      label: 'Route Safety',
      desc: 'Analyze any route for crime risk',
      icon: 'navigate-outline' as const,
      color: '#3498db',
      onPress: () => router.push('/route-safety'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>SafeHer</Text>
            <Text style={styles.tagline}>Your safety, always on</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Status chips */}
        <View style={styles.statusRow}>
          <View style={styles.statusChip}>
            <View style={[styles.dot, { backgroundColor: guardians.length > 0 ? colors.success : colors.danger }]} />
            <Text style={styles.statusText}>{guardians.length} Guardian{guardians.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.statusChip}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.statusText}>Shake active</Text>
          </View>
          <View style={styles.statusChip}>
            <View style={[styles.dot, { backgroundColor: fallDetection ? colors.success : colors.textMuted }]} />
            <Text style={styles.statusText}>Fall detect</Text>
          </View>
        </View>

        {/* MAIN SOS BUTTON */}
        <View style={styles.sosArea}>
          <SOSButton />
          <Text style={styles.sosHint}>
            Tap · Shake phone · Say "help"
          </Text>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.quickCard, { borderColor: a.color + '44' }]}
              onPress={a.onPress}
              activeOpacity={0.75}
            >
              <Ionicons name={a.icon} size={26} color={a.color} />
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Intelligence Section */}
        <Text style={styles.sectionTitle}>INTELLIGENCE</Text>
        <View style={styles.intelCards}>
          {intelligenceActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.intelCard}
              onPress={a.onPress}
              activeOpacity={0.75}
            >
              <View style={[styles.intelIconBg, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.intelLabel}>{a.label}</Text>
                <Text style={styles.intelDesc}>{a.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency helplines */}
        <Text style={styles.sectionTitle}>EMERGENCY HELPLINES</Text>
        <View style={styles.helplinesCard}>
          {HELPLINES.slice(0, 4).map((h) => (
            <TouchableOpacity
              key={h.number}
              style={styles.helplineRow}
              onPress={() => quickCall(h.number)}
              activeOpacity={0.7}
            >
              <View style={styles.helplineLeft}>
                <View style={styles.helplineIconBg}>
                  <Ionicons name="call" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.helplineName}>{h.name}</Text>
                  <Text style={styles.helplineNumber}>{h.number}</Text>
                </View>
              </View>
              <View style={styles.callBtn}>
                <Text style={styles.callBtnText}>CALL</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Alerts teaser */}
        <TouchableOpacity
          style={styles.historyCard}
          onPress={() => router.push('/alert-history')}
        >
          <Ionicons name="time-outline" size={20} color={colors.textMuted} />
          <Text style={styles.historyText}>View Alert History</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Full-screen countdown overlay */}
      <CountdownTimer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  appName: {
    color: colors.primary,
    fontSize: fontSize.xxl,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  settingsBtn: {
    padding: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  sosArea: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  sosHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  quickCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: 4,
  },
  helplinesCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  helplineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  helplineLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  helplineIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineName: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '600' },
  helplineNumber: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  callBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  callBtnText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  historyText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  intelCards: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  intelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  intelIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intelLabel: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  intelDesc: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
});
