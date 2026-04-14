import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Switch, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../store/settingsStore';
import { colors, fontSize, spacing, radius } from '../constants/theme';

const SENSITIVITY_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SettingRow({
  label, sublabel, value, onToggle,
}: { label: string; sublabel?: string; value: boolean; onToggle: () => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primaryDark }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const {
    shakeSensitivity, fallDetection, voiceKeyword, autoVideoRecord,
    smsAlerts, emailAlerts, autoCallOnSOS, autoCallGuardian,
    update,
  } = useSettingsStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SOS Detection */}
        <Section title="🆘 SOS Detection">
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Shake Sensitivity</Text>
              <Text style={styles.rowSub}>{SENSITIVITY_LABELS[shakeSensitivity - 1]}</Text>
            </View>
            <View style={styles.sensitivityBtns}>
              <TouchableOpacity
                onPress={() => update({ shakeSensitivity: Math.max(1, shakeSensitivity - 1) })}
                style={styles.stepBtn}
              >
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.sensitivityValue}>{shakeSensitivity}</Text>
              <TouchableOpacity
                onPress={() => update({ shakeSensitivity: Math.min(5, shakeSensitivity + 1) })}
                style={styles.stepBtn}
              >
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
          <SettingRow
            label="Fall Detection"
            sublabel="Gyro + accelerometer fusion"
            value={fallDetection}
            onToggle={() => update({ fallDetection: !fallDetection })}
          />
          <SettingRow
            label="Voice Keyword Detection"
            sublabel='Listen for "help", "bachao"…'
            value={voiceKeyword}
            onToggle={() => update({ voiceKeyword: !voiceKeyword })}
          />
          <SettingRow
            label="Auto Video Evidence"
            sublabel="Record 60s video on SOS"
            value={autoVideoRecord}
            onToggle={() => update({ autoVideoRecord: !autoVideoRecord })}
          />
        </Section>

        {/* Alerts */}
        <Section title="📢 Alert Methods">
          <SettingRow
            label="SMS Alerts"
            sublabel="Text guardians on SOS"
            value={smsAlerts}
            onToggle={() => update({ smsAlerts: !smsAlerts })}
          />
          <SettingRow
            label="Email Alerts"
            sublabel="Email guardians with map link"
            value={emailAlerts}
            onToggle={() => update({ emailAlerts: !emailAlerts })}
          />
        </Section>

        {/* Auto-Call */}
        <Section title="📞 Auto-Call">
          <SettingRow
            label="Auto-Call 112 on SOS"
            sublabel="Immediately dials emergency services"
            value={autoCallOnSOS}
            onToggle={() => update({ autoCallOnSOS: !autoCallOnSOS })}
          />
          <SettingRow
            label="Auto-Call First Guardian"
            sublabel="Calls your top-priority contact"
            value={autoCallGuardian}
            onToggle={() => update({ autoCallGuardian: !autoCallGuardian })}
          />
        </Section>

        {/* Navigate to other sections */}
        {[
          { label: 'Manage Guardians', icon: 'people-outline', path: '/guardians' },
          { label: 'Alert History', icon: 'time-outline', path: '/alert-history' },
          { label: 'Safety Hub', icon: 'shield-checkmark-outline', path: '/safety-hub' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.navRow}
            onPress={() => router.push(item.path as any)}
          >
            <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
            <Text style={styles.navLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <Text style={styles.version}>SafeHer v1.0.0 · Built for safety</Text>
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
  section: { gap: spacing.xs },
  sectionTitle: {
    color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700',
    letterSpacing: 2, marginBottom: spacing.xs,
  },
  sectionBody: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600' },
  rowSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  sensitivityBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  sensitivityValue: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  navLabel: { flex: 1, color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  version: {
    color: colors.textMuted, fontSize: fontSize.xs,
    textAlign: 'center', marginTop: spacing.lg,
  },
});
