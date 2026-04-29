import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../store/settingsStore';
import { useGuardianStore } from '../../store/guardianStore';
import { useAuthStore } from '../../store/authStore';
import { quickCall } from '../../services/alertService';
import { HELPLINES } from '../../constants/helplines';
import { fontSize, spacing, radius } from '../../constants/theme';
import { useAppTheme } from '../../contexts/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { bloodGroup, medicalNotes, update } = useSettingsStore();
  const { guardians } = useGuardianStore();
  const { currentUser, logout, updateProfile } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name ?? '');
  const [blood, setBlood] = useState(currentUser?.blood_group ?? bloodGroup);
  const [notes, setNotes] = useState(currentUser?.medical_notes ?? medicalNotes);
  const [saving, setSaving] = useState(false);

  const displayName = currentUser?.name || 'Your Name';

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      // Save ALL profile fields to DB via authStore (single source of truth)
      await updateProfile({
        name: name.trim(),
        blood_group: blood,
        medical_notes: notes,
      });
      // Keep settingsStore in sync for immediate display
      update({ bloodGroup: blood, medicalNotes: notes });
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(currentUser?.name ?? '');
    setBlood(bloodGroup);
    setNotes(medicalNotes);
    setEditing(false);
  };

  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
          {currentUser?.phone && (
            <Text style={[styles.phone, { color: colors.textMuted }]}>{currentUser.phone}</Text>
          )}
          <View style={[styles.verifiedBadge, { backgroundColor: colors.successGlow }]}>
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            <Text style={[styles.verifiedText, { color: colors.success }]}>SafeHer User</Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}
            onPress={() => setEditing(true)}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Edit form */}
        {editing && (
          <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Edit Profile</Text>

            <Text style={[styles.label, { color: colors.textMuted }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgElevated, borderColor: colors.primary, color: colors.textPrimary }]}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>Blood Group</Text>
            <View style={styles.bloodGrid}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[
                    styles.bloodChip,
                    { backgroundColor: colors.bgElevated, borderColor: colors.border },
                    blood === bg && { backgroundColor: colors.dangerGlow, borderColor: colors.danger },
                  ]}
                  onPress={() => setBlood(bg)}
                >
                  <Text style={[styles.bloodChipText, { color: blood === bg ? colors.danger : colors.textMuted }]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>Medical Notes</Text>
            <TextInput
              style={[styles.inputMulti, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Allergies, conditions, medications..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.editActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={cancelEdit}>
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={saveProfile}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Medical Info */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart" size={18} color={colors.danger} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Medical Information</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Blood Group</Text>
            <View style={[styles.bloodBadge, { backgroundColor: blood ? colors.dangerGlow : colors.bgElevated }]}>
              <Text style={[styles.bloodBadgeText, { color: blood ? colors.danger : colors.textMuted }]}>
                {blood || 'Not set'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Medical Notes</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
              {notes || 'No medical notes added'}
            </Text>
          </View>
        </View>

        {/* Guardians summary */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={18} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Emergency Contacts</Text>
            <TouchableOpacity onPress={() => router.push('/guardians')} style={styles.seeAllBtn}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Manage</Text>
            </TouchableOpacity>
          </View>
          {guardians.length === 0 ? (
            <TouchableOpacity
              style={[styles.addGuardianPrompt, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}
              onPress={() => router.push('/guardians')}
            >
              <Ionicons name="person-add" size={20} color={colors.primary} />
              <Text style={[styles.addGuardianText, { color: colors.primary }]}>Add emergency contacts for SOS alerts</Text>
            </TouchableOpacity>
          ) : (
            guardians.map((g) => (
              <View key={g.id} style={[styles.guardianRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.guardianAvatar, { backgroundColor: colors.accent }]}>
                  <Text style={styles.guardianAvatarText}>{g.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.guardianName, { color: colors.textPrimary }]}>{g.name}</Text>
                  <Text style={[styles.guardianSub, { color: colors.textMuted }]}>{g.relation} · {g.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => quickCall(g.phone)} style={[styles.callBtn, { backgroundColor: colors.successGlow }]}>
                  <Ionicons name="call" size={18} color={colors.success} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Quick helplines */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Emergency Helplines</Text>
          </View>
          <View style={styles.helplinesGrid}>
            {HELPLINES.slice(0, 4).map((h) => (
              <TouchableOpacity
                key={h.number}
                style={[styles.helplineChip, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
                onPress={() => quickCall(h.number)}
              >
                <Text style={[styles.helplineNum, { color: colors.primary }]}>{h.number}</Text>
                <Text style={[styles.helplineName, { color: colors.textMuted }]}>{h.name.split(' ').slice(0, 2).join(' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings */}
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.settingsBtnText, { color: colors.textSecondary }]}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.bgCard, borderColor: colors.danger }]}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 80 },
  heroCard: {
    borderRadius: radius.xl, borderWidth: 1, padding: spacing.xl,
    alignItems: 'center', gap: spacing.sm,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#fff' },
  name: { fontSize: fontSize.xxl, fontWeight: '900' },
  phone: { fontSize: fontSize.sm, marginTop: -4 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.full,
  },
  verifiedText: { fontSize: fontSize.xs, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.full, borderWidth: 1, marginTop: spacing.xs,
  },
  editBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  section: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  sectionTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '700' },
  seeAllBtn: { padding: 4 },
  seeAll: { fontSize: fontSize.sm, fontWeight: '600' },
  label: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  input: {
    borderRadius: radius.md, borderWidth: 1.5,
    padding: spacing.md, fontSize: fontSize.md, marginBottom: spacing.sm,
  },
  inputMulti: {
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, fontSize: fontSize.sm,
    height: 80, textAlignVertical: 'top',
  },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  bloodChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.md, borderWidth: 1,
  },
  bloodChipText: { fontSize: fontSize.sm, fontWeight: '700' },
  editActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1, borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, alignItems: 'center',
  },
  cancelBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  saveBtn: { flex: 2, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '800' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: fontSize.sm },
  infoValue: { fontSize: fontSize.sm, flex: 1, textAlign: 'right' },
  bloodBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  bloodBadgeText: { fontSize: fontSize.sm, fontWeight: '800' },
  addGuardianPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1,
  },
  addGuardianText: { flex: 1, fontSize: fontSize.sm, fontWeight: '600' },
  guardianRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  guardianAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  guardianAvatarText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  guardianName: { fontSize: fontSize.sm, fontWeight: '700' },
  guardianSub: { fontSize: fontSize.xs },
  callBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  helplinesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  helplineChip: {
    width: '47%', borderRadius: radius.md, borderWidth: 1,
    padding: spacing.sm, alignItems: 'center', gap: 2,
  },
  helplineNum: { fontSize: fontSize.xl, fontWeight: '900' },
  helplineName: { fontSize: 9, textAlign: 'center' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1.5,
    padding: spacing.md,
  },
  logoutText: { fontSize: fontSize.md, fontWeight: '700' },
  settingsBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1,
    padding: spacing.md,
  },
  settingsBtnText: { flex: 1, fontSize: fontSize.md, fontWeight: '600' },
});
