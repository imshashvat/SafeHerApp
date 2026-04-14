import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFakeCall } from '../hooks/useFakeCall';
import FakeCallOverlay from '../components/FakeCallOverlay';
import { dispatchSOS } from '../services/alertService';
import { useSOSStore } from '../store/sosStore';
import { useLocation } from '../hooks/useLocation';
import { colors, fontSize, spacing, radius } from '../constants/theme';

const DELAY_OPTIONS = [
  { label: 'Immediate', value: 0 },
  { label: '3 seconds', value: 3000 },
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
];

export default function FakeCallScreen() {
  const router = useRouter();
  const { isActive, triggerFakeCall, dismissFakeCall, callerName } = useFakeCall();
  const [selectedDelay, setSelectedDelay] = useState(3000);
  const [silentAlert, setSilentAlert] = useState(true);
  const { getCurrentLocation } = useLocation();
  const { setLocation } = useSOSStore();

  const handleTrigger = async () => {
    if (silentAlert) {
      const loc = await getCurrentLocation();
      if (loc) setLocation(loc);
      await dispatchSOS();
    }
    triggerFakeCall(selectedDelay);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Fake Call</Text>
      </View>

      <View style={styles.content}>
        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={22} color={colors.accent} />
          <Text style={styles.infoText}>
            A realistic incoming call screen will appear. Use it to excuse yourself from unsafe situations.
          </Text>
        </View>

        {/* Caller name */}
        <View style={styles.previewCard}>
          <View style={styles.callerAvatar}>
            <Text style={styles.callerAvatarText}>{callerName.charAt(0)}</Text>
          </View>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callerSub}>Incoming call preview</Text>
        </View>

        {/* Delay */}
        <Text style={styles.label}>Call Delay</Text>
        <View style={styles.delayGrid}>
          {DELAY_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[styles.delayChip, selectedDelay === d.value && styles.delayChipActive]}
              onPress={() => setSelectedDelay(d.value)}
            >
              <Text style={[styles.delayText, selectedDelay === d.value && styles.delayTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Silent alert toggle */}
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setSilentAlert(!silentAlert)}
        >
          <View>
            <Text style={styles.toggleLabel}>Silent SOS Alert</Text>
            <Text style={styles.toggleSub}>Notify guardians while fake call shows</Text>
          </View>
          <View style={[styles.toggle, silentAlert && styles.toggleOn]}>
            <View style={[styles.toggleThumb, silentAlert && styles.toggleThumbOn]} />
          </View>
        </TouchableOpacity>

        {/* Trigger button */}
        <TouchableOpacity style={styles.triggerBtn} onPress={handleTrigger} activeOpacity={0.8}>
          <Ionicons name="call" size={22} color="#fff" />
          <Text style={styles.triggerText}>
            {selectedDelay === 0 ? 'Show Fake Call Now' : `Fake Call in ${selectedDelay / 1000}s`}
          </Text>
        </TouchableOpacity>
      </View>

      <FakeCallOverlay
        visible={isActive}
        callerName={callerName}
        onAccept={dismissFakeCall}
        onDecline={dismissFakeCall}
      />
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
  content: { padding: spacing.lg, gap: spacing.md },
  infoCard: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.accentGlow, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.accent + '44', padding: spacing.md,
  },
  infoText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  previewCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
  },
  callerAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  callerAvatarText: { color: '#fff', fontSize: fontSize.xxxl, fontWeight: '800' },
  callerName: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '700' },
  callerSub: { color: colors.textMuted, fontSize: fontSize.sm },
  label: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  delayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  delayChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  delayChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  delayText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  delayTextActive: { color: colors.primary },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  toggleLabel: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600' },
  toggleSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  toggle: {
    width: 50, height: 28, borderRadius: 14,
    backgroundColor: colors.bgElevated, padding: 3,
    borderWidth: 1, borderColor: colors.border,
  },
  toggleOn: { backgroundColor: colors.primaryDark },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: colors.textMuted,
  },
  toggleThumbOn: { backgroundColor: '#fff', marginLeft: 22 },
  triggerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent,
    borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.sm,
  },
  triggerText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '800' },
});
