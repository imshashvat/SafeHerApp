import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../store/settingsStore';
import { useGuardianStore } from '../../store/guardianStore';
import { quickCall } from '../../services/alertService';
import { HELPLINES } from '../../constants/helplines';
import { colors, fontSize, spacing, radius } from '../../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { profileName, bloodGroup, medicalNotes, update } = useSettingsStore();
  const { guardians } = useGuardianStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profileName);
  const [blood, setBlood] = useState(bloodGroup);
  const [notes, setNotes] = useState(medicalNotes);

  const saveProfile = () => {
    update({ profileName: name, bloodGroup: blood, medicalNotes: notes });
    setEditing(false);
  };

  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profileName || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profileName || 'Your Name'}</Text>
          <View style={[styles.verifiedBadge]}>
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            <Text style={styles.verifiedText}>SafeHer User</Text>
          </View>
        </View>

        {/* Medical card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🩺 Medical Info</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Ionicons name={editing ? 'close-circle' : 'pencil'} size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.fieldLabel}>Blood Group</Text>
              <View style={styles.bloodRow}>
                {BLOOD_GROUPS.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodChip, blood === bg && styles.bloodChipActive]}
                    onPress={() => setBlood(bg)}
                  >
                    <Text style={[styles.bloodText, blood === bg && styles.bloodTextActive]}>{bg}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Allergies, conditions, medications..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                <Text style={styles.saveBtnText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.medRow}>
              <View style={styles.medItem}>
                <Text style={styles.medLabel}>Blood Group</Text>
                <Text style={styles.medValue}>{bloodGroup || '—'}</Text>
              </View>
              <View style={styles.medItem}>
                <Text style={styles.medLabel}>Guardians</Text>
                <Text style={styles.medValue}>{guardians.length}</Text>
              </View>
            </View>
          )}

          {!editing && medicalNotes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Medical Notes</Text>
              <Text style={styles.notesText}>{medicalNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Guardians preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 Guardians</Text>
            <TouchableOpacity onPress={() => router.push('/guardians')}>
              <Text style={styles.manageLink}>Manage</Text>
            </TouchableOpacity>
          </View>
          {guardians.slice(0, 3).map((g) => (
            <View key={g.id} style={styles.guardianRow}>
              <View style={styles.gAvatar}>
                <Text style={styles.gAvatarText}>{g.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gName}>{g.name}</Text>
                <Text style={styles.gSub}>{g.relation}</Text>
              </View>
              <TouchableOpacity onPress={() => quickCall(g.phone)}>
                <Ionicons name="call" size={20} color={colors.success} />
              </TouchableOpacity>
            </View>
          ))}
          {guardians.length === 0 && (
            <TouchableOpacity style={styles.addGuardianBtn} onPress={() => router.push('/guardians')}>
              <Ionicons name="person-add-outline" size={18} color={colors.primary} />
              <Text style={styles.addGuardianText}>Add Emergency Contacts</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* All helplines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 All Helplines</Text>
          {HELPLINES.map((h) => (
            <TouchableOpacity
              key={h.number}
              style={styles.helplineRow}
              onPress={() => quickCall(h.number)}
            >
              <Text style={styles.helplineName}>{h.name}</Text>
              <Text style={styles.helplineNumber}>{h.number}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alert history */}
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push('/alert-history')}
        >
          <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.historyBtnText}>View Alert History</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.historyBtnText}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  heroCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: 'center', gap: spacing.md,
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: fontSize.xxxl, fontWeight: '900' },
  name: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.successGlow, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.success + '44',
  },
  verifiedText: { color: colors.success, fontSize: fontSize.xs, fontWeight: '700' },
  section: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700' },
  manageLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  editForm: { gap: spacing.sm },
  input: {
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    color: colors.textPrimary, fontSize: fontSize.md, padding: spacing.md,
  },
  fieldLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1 },
  bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  bloodChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border,
  },
  bloodChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  bloodText: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.sm },
  bloodTextActive: { color: colors.primary },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  medRow: { flexDirection: 'row', gap: spacing.md },
  medItem: {
    flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  medLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  medValue: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '900', marginTop: 4 },
  notesBox: {
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  notesLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', marginBottom: 4 },
  notesText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  guardianRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  gAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accentGlow, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.accent + '44',
  },
  gAvatarText: { color: colors.accent, fontWeight: '800', fontSize: fontSize.md },
  gName: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '700' },
  gSub: { color: colors.textMuted, fontSize: fontSize.xs },
  addGuardianBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary + '55',
    backgroundColor: colors.primaryGlow, justifyContent: 'center',
  },
  addGuardianText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm },
  helplineRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  helplineName: { color: colors.textSecondary, fontSize: fontSize.sm },
  helplineNumber: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  historyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  historyBtnText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
});
