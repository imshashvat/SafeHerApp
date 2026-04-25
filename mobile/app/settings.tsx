import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Switch, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useAppTheme } from '../contexts/ThemeContext';
import { fontSize, spacing, radius } from '../constants/theme';

const SENSITIVITY_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// ─── Sub-components ──────────────────────────────────────────────────────────

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
  label, sublabel, value, onToggle, colors, isLast,
}: { label: string; sublabel?: string; value: boolean; onToggle: () => void; colors: any; isLast?: boolean }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }, isLast && styles.rowLast]}>
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

function StatusBadge({ label, active, colors }: { label: string; active: boolean; colors: any }) {
  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: active ? colors.primaryGlow : colors.bgElevated,
        borderColor: active ? colors.primary + '88' : colors.border,
      },
    ]}>
      <View style={[styles.badgeDot, { backgroundColor: active ? '#22c55e' : '#ef4444' }]} />
      <Text style={[styles.badgeText, { color: active ? colors.primary : colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const {
    shakeSensitivity, fallDetection, voiceKeyword, autoVideoRecord,
    smsAlerts, emailAlerts, autoCallOnSOS, autoCallGuardian,
    mapTheme,
    update,
  } = useSettingsStore();
  const { logout, currentUser, updateProfile } = useAuthStore();
  const { appTheme, colors, toggleAppTheme } = useAppTheme();

  // ── Profile edit state ────────────────────────────────────────────
  const [editName, setEditName] = useState(currentUser?.name ?? '');
  const [editEmail, setEditEmail] = useState(currentUser?.email ?? '');
  const [editBloodGroup, setEditBloodGroup] = useState(currentUser?.blood_group ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync when currentUser is refreshed (after profile update)
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditEmail(currentUser.email ?? '');
      setEditBloodGroup(currentUser.blood_group ?? '');
    }
  }, [currentUser?.id]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setSavingProfile(true);
    await updateProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      blood_group: editBloodGroup,
    });
    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => { await logout(); },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── 🛡️ Background Protection Status Card ──────────────────── */}
        <View style={[styles.protectionCard, { backgroundColor: colors.bgCard, borderColor: colors.primary + '55' }]}>
          <View style={styles.protectionHeader}>
            <Text style={styles.protectionIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.protectionTitle, { color: colors.textPrimary }]}>Background Protection</Text>
              <Text style={[styles.protectionSub, { color: colors.textMuted }]}>Active even when screen is off</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <StatusBadge label="Shake" active={true} colors={colors} />
            <StatusBadge label="Voice" active={voiceKeyword} colors={colors} />
            <StatusBadge label="Fall" active={fallDetection} colors={colors} />
            <StatusBadge label="Guard" active={true} colors={colors} />
          </View>
        </View>

        {/* ── 📳 Shake to SOS Feature Card ───────────────────────────── */}
        <View style={[styles.featureCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.featureCardTop}>
            <View style={[styles.featureIconCircle, { backgroundColor: colors.primaryGlow }]}>
              <Text style={styles.featureIconEmoji}>📳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.featureTitleRow}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Shake to SOS</Text>
                <View style={[styles.alwaysOnPill, { backgroundColor: '#16a34a22', borderColor: '#22c55e66' }]}>
                  <View style={[styles.badgeDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={[styles.alwaysOnText, { color: '#22c55e' }]}>ALWAYS ON</Text>
                </View>
              </View>
              <Text style={[styles.featureSub, { color: colors.textMuted }]}>
                Shake 3× quickly → SOS triggers even with screen off
              </Text>
            </View>
          </View>
          <View style={[styles.sensitivityStrip, { borderTopColor: colors.border, backgroundColor: colors.bgElevated }]}>
            <Text style={[styles.sensitivityStripLabel, { color: colors.textMuted }]}>Sensitivity</Text>
            <Text style={[styles.sensitivityStripName, { color: colors.textSecondary }]}>{SENSITIVITY_LABELS[shakeSensitivity - 1]}</Text>
            <View style={styles.sensitivityBtns}>
              <TouchableOpacity
                onPress={() => update({ shakeSensitivity: Math.max(1, shakeSensitivity - 1) })}
                style={[styles.stepBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              >
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.sensitivityValue, { color: colors.textPrimary }]}>{shakeSensitivity}</Text>
              <TouchableOpacity
                onPress={() => update({ shakeSensitivity: Math.min(5, shakeSensitivity + 1) })}
                style={[styles.stepBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              >
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── 🎙️ Voice SOS Feature Card ──────────────────────────────── */}
        <View style={[
          styles.featureCard,
          { backgroundColor: colors.bgCard, borderColor: voiceKeyword ? colors.primary + '66' : colors.border },
        ]}>
          <View style={styles.featureCardTop}>
            <View style={[styles.featureIconCircle, { backgroundColor: voiceKeyword ? colors.primaryGlow : colors.bgElevated }]}>
              <Text style={styles.featureIconEmoji}>🎙️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.featureTitleRow}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Voice SOS</Text>
                <Switch
                  value={voiceKeyword}
                  onValueChange={() => update({ voiceKeyword: !voiceKeyword })}
                  trackColor={{ false: colors.border, true: colors.primaryDark }}
                  thumbColor={voiceKeyword ? colors.primary : colors.textMuted}
                />
              </View>
              <Text style={[styles.featureSub, { color: colors.textMuted }]}>
                Loud scream/shout triggers SOS automatically
              </Text>
            </View>
          </View>
          {/* Status strip */}
          <View style={[
            styles.voiceStatusStrip,
            {
              borderTopColor: colors.border,
              backgroundColor: voiceKeyword ? colors.primaryGlow : colors.bgElevated,
            },
          ]}>
            <Ionicons
              name={voiceKeyword ? 'mic' : 'mic-off'}
              size={14}
              color={voiceKeyword ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.voiceStatusText, { color: voiceKeyword ? colors.primary : colors.textMuted }]}>
              {voiceKeyword
                ? 'Microphone active · Listening in background'
                : 'Detection disabled · Tap toggle to enable'}
            </Text>
          </View>
        </View>

        {/* ── 👤 Edit Profile ────────────────────────────────────────── */}
        <Section title="👤 PROFILE" colors={colors}>
          {/* Avatar row (read-only identity) */}
          <View style={[styles.avatarRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.userAvatarText}>
                {(editName || currentUser?.name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                {editName || currentUser?.name}
              </Text>
              <Text style={[styles.userPhone, { color: colors.textMuted }]}>
                {currentUser?.phone}
              </Text>
            </View>
          </View>

          {/* Name */}
          <View style={[styles.editField, { borderBottomColor: colors.border }]}>
            <Text style={[styles.editLabel, { color: colors.textMuted }]}>FULL NAME</Text>
            <View style={[styles.editInputWrap, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.editInput, { color: colors.textPrimary }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your full name"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Email */}
          <View style={[styles.editField, { borderBottomColor: colors.border }]}>
            <Text style={[styles.editLabel, { color: colors.textMuted }]}>EMAIL</Text>
            <View style={[styles.editInputWrap, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.editInput, { color: colors.textPrimary }]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Blood Group chips */}
          <View style={[styles.editField, { borderBottomColor: colors.border }]}>
            <Text style={[styles.editLabel, { color: colors.textMuted }]}>BLOOD GROUP</Text>
            <View style={styles.bloodRow}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[
                    styles.bloodChip,
                    { backgroundColor: colors.bgElevated, borderColor: colors.border },
                    editBloodGroup === bg && { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
                  ]}
                  onPress={() => setEditBloodGroup(editBloodGroup === bg ? '' : bg)}
                >
                  <Text style={[
                    styles.bloodText,
                    { color: colors.textMuted },
                    editBloodGroup === bg && { color: colors.primary },
                  ]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: profileSaved ? '#16a34a' : colors.primary },
              savingProfile && { opacity: 0.7 },
            ]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={profileSaved ? 'checkmark-circle' : 'save-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.saveBtnText}>
                  {profileSaved ? 'Saved!' : 'Save Profile'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Section>

        {/* ── 🎨 App Theme ───────────────────────────────────────────── */}
        <Section title="🎨 APP THEME" colors={colors}>
          <View style={[styles.row, styles.rowLast, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Appearance</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                {appTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
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
                <Text style={[styles.themeBtnText, { color: colors.textMuted }, appTheme === 'light' && { color: colors.primary }]}>Light</Text>
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
                <Text style={[styles.themeBtnText, { color: colors.textMuted }, appTheme === 'dark' && { color: colors.primary }]}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        {/* ── 🗺️ Map ─────────────────────────────────────────────────── */}
        <Section title="🗺️ MAP" colors={colors}>
          <View style={[styles.row, styles.rowLast, { borderBottomColor: colors.border }]}>
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
                <Text style={[styles.themeBtnText, { color: colors.textMuted }, mapTheme === 'light' && { color: colors.primary }]}>Light</Text>
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
                <Text style={[styles.themeBtnText, { color: colors.textMuted }, mapTheme === 'dark' && { color: colors.primary }]}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        {/* ── 🆘 Other SOS Settings ──────────────────────────────────── */}
        <Section title="🆘 OTHER SOS SETTINGS" colors={colors}>
          <SettingRow
            label="Fall Detection"
            sublabel="Gyro + accelerometer fusion"
            value={fallDetection}
            onToggle={() => update({ fallDetection: !fallDetection })}
            colors={colors}
          />
          <SettingRow
            label="Auto Video Evidence"
            sublabel="Record 60s video on SOS"
            value={autoVideoRecord}
            onToggle={() => update({ autoVideoRecord: !autoVideoRecord })}
            colors={colors}
            isLast
          />
        </Section>

        {/* ── 📢 Alert Methods ────────────────────────────────────────── */}
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
            isLast
          />
        </Section>

        {/* ── 📞 Auto-Call ────────────────────────────────────────────── */}
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
            isLast
          />
        </Section>

        {/* ── Navigation shortcuts ────────────────────────────────────── */}
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

        {/* ── Logout ─────────────────────────────────────────────────── */}
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

// ─── Styles ──────────────────────────────────────────────────────────────────

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

  // Protection card
  protectionCard: {
    borderRadius: radius.lg, borderWidth: 1,
    padding: spacing.md, gap: spacing.sm,
  },
  protectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  protectionIcon: { fontSize: 28 },
  protectionTitle: { fontSize: fontSize.md, fontWeight: '700' },
  protectionSub: { fontSize: fontSize.xs, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.sm, paddingVertical: 5,
    borderRadius: radius.full, borderWidth: 1,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },

  // Profile / avatar
  avatarRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderBottomWidth: 1,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontSize: fontSize.xl, fontWeight: '900' },
  userName: { fontSize: fontSize.lg, fontWeight: '700' },
  userPhone: { fontSize: fontSize.sm, marginTop: 2 },

  // Edit fields
  editField: { padding: spacing.md, gap: spacing.xs, borderBottomWidth: 1 },
  editLabel: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1 },
  editInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md, borderWidth: 1,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  editInput: {
    flex: 1, fontSize: fontSize.md, paddingVertical: 10,
  },
  bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingTop: 2 },
  bloodChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1,
  },
  bloodText: { fontWeight: '700', fontSize: fontSize.sm },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, margin: spacing.md, marginTop: spacing.sm,
    borderRadius: radius.md, paddingVertical: spacing.sm,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },

  // Section
  section: { gap: spacing.xs },
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700',
    letterSpacing: 2, marginBottom: spacing.xs,
  },
  sectionBody: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: fontSize.md, fontWeight: '600' },
  rowSub: { fontSize: fontSize.xs, marginTop: 2 },

  sensitivityBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  sensitivityValue: { fontSize: fontSize.lg, fontWeight: '800', minWidth: 24, textAlign: 'center' },

  themeToggleRow: { flexDirection: 'row', gap: spacing.xs },
  themeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1,
  },
  themeBtnText: { fontSize: fontSize.xs, fontWeight: '700' },

  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md,
  },
  navLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md,
    justifyContent: 'center',
  },
  logoutText: { fontSize: fontSize.md, fontWeight: '700' },
  version: { fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.lg },

  // Feature cards (Shake / Voice)
  featureCard: {
    borderRadius: radius.lg, borderWidth: 1.5,
    overflow: 'hidden',
  },
  featureCardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing.md, padding: spacing.md,
  },
  featureIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  featureIconEmoji: { fontSize: 22 },
  featureTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 3,
  },
  featureTitle: { fontSize: fontSize.lg, fontWeight: '800' },
  featureSub: { fontSize: fontSize.xs, lineHeight: 17 },
  alwaysOnPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full, borderWidth: 1,
  },
  alwaysOnText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Shake sensitivity strip
  sensitivityStrip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderTopWidth: 1, gap: spacing.sm,
  },
  sensitivityStripLabel: { fontSize: fontSize.xs, fontWeight: '700', flex: 1 },
  sensitivityStripName: { fontSize: fontSize.xs, fontWeight: '600' },

  // Voice status strip
  voiceStatusStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 9,
    borderTopWidth: 1,
  },
  voiceStatusText: { fontSize: fontSize.xs, fontWeight: '600', flex: 1 },
});
