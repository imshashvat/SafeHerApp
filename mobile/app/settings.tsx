import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Switch, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useAppTheme } from '../contexts/ThemeContext';
import { fontSize, spacing, radius } from '../constants/theme';

const SENSITIVITY_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function SettingRow({
  label, sublabel, value, onToggle, colors,
}: { label: string; sublabel?: string; value: boolean; onToggle: () => void; colors: any }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSub, { color: colors.textMuted }]}>{sublabel}</Text> : null}
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
    mapTheme,
    update,
  } = useSettingsStore();
  const { logout, currentUser } = useAuthStore();
  const { appTheme, colors, toggleAppTheme } = useAppTheme();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User info */}
        {currentUser && (
          <View style={[styles.userCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.userAvatarText}>
                {currentUser.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{currentUser.name}</Text>
              <Text style={[styles.userPhone, { color: colors.textMuted }]}>{currentUser.phone}</Text>
            </View>
          </View>
        )}

        {/* App Theme */}
        <Section title="🎨 APP THEME" colors={colors}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Appearance</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                {appTheme === 'dark' ? 'Dark Mode (Default)' : 'Light Mode'}
              </Text>
            </View>
            <View style={styles.themeToggleRow}>
              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  { backgroundColor: colors.bgElevated, borderColor: colors.border },
                  appTheme === 'light' && { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
                ]}
                onPress={() => appTheme !== 'light' && toggleAppTheme()}
              >
                <Ionicons name="sunny" size={16} color={appTheme === 'light' ? '#FFD700' : colors.textMuted} />
                <Text style={[
                  styles.themeBtnText,
                  { color: colors.textMuted },
                  appTheme === 'light' && { color: colors.primary },
                ]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  { backgroundColor: colors.bgElevated, borderColor: colors.border },
                  appTheme === 'dark' && { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
                ]}
                onPress={() => appTheme !== 'dark' && toggleAppTheme()}
              >
                <Ionicons name="moon" size={14} color={appTheme === 'dark' ? '#B0A8C8' : colors.textMuted} />
                <Text style={[
                  styles.themeBtnText,
                  { color: colors.textMuted },
                  appTheme === 'dark' && { color: colors.primary },
                ]}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        {/* Map Theme */}
        <Section title="🗺️ MAP" colors={colors}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Map Theme</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                {mapTheme === 'light' ? 'Light (Default OSM)' : 'Dark (CartoDB Dark)'}
              </Text>
            </View>
            <View style={styles.themeToggleRow}>
              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  { backgroundColor: colors.bgElevated, borderColor: colors.border },
                  mapTheme === 'light' && { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
                ]}
                onPress={() => update({ mapTheme: 'light' })}
              >
                <Ionicons name="sunny" size={16} color={mapTheme === 'light' ? '#FFD700' : colors.textMuted} />
                <Text style={[
                  styles.themeBtnText,
                  { color: colors.textMuted },
                  mapTheme === 'light' && { color: colors.primary },
                ]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  { backgroundColor: colors.bgElevated, borderColor: colors.border },
                  mapTheme === 'dark' && { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
                ]}
                onPress={() => update({ mapTheme: 'dark' })}
              >
                <Ionicons name="moon" size={14} color={mapTheme === 'dark' ? '#B0A8C8' : colors.textMuted} />
                <Text style={[
                  styles.themeBtnText,
                  { color: colors.textMuted },
                  mapTheme === 'dark' && { color: colors.primary },
                ]}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        {/* SOS Detection */}
        <Section title="🆘 SOS DETECTION" colors={colors}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Shake Sensitivity</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>{SENSITIVITY_LABELS[shakeSensitivity - 1]}</Text>
            </View>
            <View style={styles.sensitivityBtns}>
              <TouchableOpacity
                onPress={() => update({ shakeSensitivity: Math.max(1, shakeSensitivity - 1) })}
                style={[styles.stepBtn, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
              >
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.sensitivityValue, { color: colors.textPrimary }]}>{shakeSensitivity}</Text>
              <TouchableOpacity
                onPress={() => update({ shakeSensitivity: Math.min(5, shakeSensitivity + 1) })}
                style={[styles.stepBtn, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
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
            colors={colors}
          />
          <SettingRow
            label="Voice Keyword Detection"
            sublabel='Listen for "help", "bachao"…'
            value={voiceKeyword}
            onToggle={() => update({ voiceKeyword: !voiceKeyword })}
            colors={colors}
          />
          <SettingRow
            label="Auto Video Evidence"
            sublabel="Record 60s video on SOS"
            value={autoVideoRecord}
            onToggle={() => update({ autoVideoRecord: !autoVideoRecord })}
            colors={colors}
          />
        </Section>

        {/* Alerts */}
        <Section title="📢 ALERT METHODS" colors={colors}>
          <SettingRow
            label="SMS Alerts"
            sublabel="Text guardians on SOS"
            value={smsAlerts}
            onToggle={() => update({ smsAlerts: !smsAlerts })}
            colors={colors}
          />
          <SettingRow
            label="Email Alerts"
            sublabel="Email guardians with map link"
            value={emailAlerts}
            onToggle={() => update({ emailAlerts: !emailAlerts })}
            colors={colors}
          />
        </Section>

        {/* Auto-Call */}
        <Section title="📞 AUTO-CALL" colors={colors}>
          <SettingRow
            label="Auto-Call 112 on SOS"
            sublabel="Immediately dials emergency services"
            value={autoCallOnSOS}
            onToggle={() => update({ autoCallOnSOS: !autoCallOnSOS })}
            colors={colors}
          />
          <SettingRow
            label="Auto-Call First Guardian"
            sublabel="Calls your top-priority contact"
            value={autoCallGuardian}
            onToggle={() => update({ autoCallGuardian: !autoCallGuardian })}
            colors={colors}
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
            style={[styles.navRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => router.push(item.path as any)}
          >
            <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
            <Text style={[styles.navLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Logout button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.dangerGlow, borderColor: colors.danger + '44' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textMuted }]}>SafeHer v1.0.0 · Built for safety</Text>
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
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1, padding: spacing.md,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontSize: fontSize.xl, fontWeight: '900' },
  userName: { fontSize: fontSize.lg, fontWeight: '700' },
  userPhone: { fontSize: fontSize.sm, marginTop: 2 },
  section: { gap: spacing.xs },
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700',
    letterSpacing: 2, marginBottom: spacing.xs,
  },
  sectionBody: {
    borderRadius: radius.lg,
    borderWidth: 1, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1,
  },
  rowLabel: { fontSize: fontSize.md, fontWeight: '600' },
  rowSub: { fontSize: fontSize.xs, marginTop: 2 },
  sensitivityBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  sensitivityValue: { fontSize: fontSize.lg, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  themeToggleRow: { flexDirection: 'row', gap: spacing.xs },
  themeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full,
    borderWidth: 1,
  },
  themeBtnText: { fontSize: fontSize.xs, fontWeight: '700' },
  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1, padding: spacing.md,
  },
  navLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1, padding: spacing.md,
    justifyContent: 'center',
  },
  logoutText: { fontSize: fontSize.md, fontWeight: '700' },
  version: {
    fontSize: fontSize.xs,
    textAlign: 'center', marginTop: spacing.lg,
  },
});
