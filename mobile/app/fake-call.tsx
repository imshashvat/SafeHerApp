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
import { fontSize, spacing, radius } from '../constants/theme';
import { useAppTheme } from '../contexts/ThemeContext';

const DELAY_OPTIONS = [
  { label: 'Immediate', value: 0 },
  { label: '3 seconds', value: 3000 },
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
];

export default function FakeCallScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Fake Call</Text>
      </View>

      <View style={styles.content}>
        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.accentGlow, borderColor: colors.accent + '44' }]}>
          <Ionicons name="information-circle" size={22} color={colors.accent} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            A realistic incoming call screen will appear. Use it to excuse yourself from unsafe situations.
          </Text>
        </View>

        {/* Caller name */}
        <View style={[styles.previewCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.callerAvatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.callerAvatarText}>{callerName.charAt(0)}</Text>
          </View>
          <Text style={[styles.callerName, { color: colors.textPrimary }]}>{callerName}</Text>
          <Text style={[styles.callerSub, { color: colors.textMuted }]}>Incoming call preview</Text>
        </View>

        {/* Delay */}
        <Text style={[styles.label, { color: colors.textMuted }]}>Call Delay</Text>
        <View style={styles.delayGrid}>
          {DELAY_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[styles.delayChip, { backgroundColor: colors.bgCard, borderColor: colors.border }, selectedDelay === d.value && { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}
              onPress={() => setSelectedDelay(d.value)}
            >
              <Text style={[styles.delayText, { color: selectedDelay === d.value ? colors.primary : colors.textMuted }]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Silent alert toggle */}
        <TouchableOpacity style={[styles.toggleRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={() => setSilentAlert(!silentAlert)}>
          <View>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Silent SOS Alert</Text>
            <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Notify guardians while fake call shows</Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: colors.bgElevated, borderColor: colors.border }, silentAlert && { backgroundColor: colors.primaryDark }]}>
            <View style={[styles.toggleThumb, { backgroundColor: colors.textMuted }, silentAlert && { backgroundColor: '#fff', marginLeft: 22 }]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.triggerBtn, { backgroundColor: colors.accent }]} onPress={handleTrigger} activeOpacity={0.8}>
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
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.md },
  infoCard: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  infoText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  previewCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  callerAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  callerAvatarText: { color: '#fff', fontSize: fontSize.xxxl, fontWeight: '800' },
  callerName: { fontSize: fontSize.xxl, fontWeight: '700' },
  callerSub: { fontSize: fontSize.sm },
  label: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  delayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  delayChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1 },
  delayChipActive: {},
  delayText: { fontSize: fontSize.sm, fontWeight: '600' },
  delayTextActive: {},
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  toggleLabel: { fontSize: fontSize.md, fontWeight: '600' },
  toggleSub: { fontSize: fontSize.xs, marginTop: 2 },
  toggle: { width: 50, height: 28, borderRadius: 14, padding: 3, borderWidth: 1 },
  toggleOn: {},
  toggleThumb: { width: 20, height: 20, borderRadius: 10 },
  toggleThumbOn: {},
  triggerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.sm },
  triggerText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '800' },
});
