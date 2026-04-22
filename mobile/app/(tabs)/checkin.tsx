import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontSize, spacing, radius } from '../../constants/theme';
import { useGuardianStore } from '../../store/guardianStore';
import { quickCall } from '../../services/alertService';

const CHECKIN_KEY = '@safeher_checkins';

type CheckIn = {
  id: string;
  label: string;
  intervalMinutes: number;
  active: boolean;
  lastCheckin: number | null;
  nextDeadline: number | null;
};

const DEFAULT_INTERVALS = [15, 30, 60, 120];

function getTimeLeft(deadline: number | null): { text: string; overdue: boolean; ms: number } {
  if (!deadline) return { text: 'Not set', overdue: false, ms: 0 };
  const diff = deadline - Date.now();
  if (diff <= 0) return { text: '⚠️ OVERDUE', overdue: true, ms: diff };
  const totalSeconds = Math.floor(diff / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const text = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  return { text, overdue: false, ms: diff };
}

export default function CheckInScreen() {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [selectedInterval, setSelectedInterval] = useState(30);
  const [tick, setTick] = useState(0); // force re-render every second
  const { guardians } = useGuardianStore();
  const overdueAlertedRef = useRef<Set<string>>(new Set());

  // Load from storage
  useEffect(() => {
    AsyncStorage.getItem(CHECKIN_KEY).then((raw) => {
      if (raw) setCheckins(JSON.parse(raw));
    });
  }, []);

  // ── Live countdown: tick every second ──────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Overdue detection: check every second for overdue check-ins ────
  useEffect(() => {
    checkins.forEach((ci) => {
      if (!ci.active || !ci.nextDeadline) return;
      const isOverdue = Date.now() > ci.nextDeadline;
      if (isOverdue && !overdueAlertedRef.current.has(ci.id)) {
        overdueAlertedRef.current.add(ci.id);

        Alert.alert(
          '⚠️ Check-in Overdue!',
          `Your "${ci.label}" check-in is overdue.\n\nAre you safe?`,
          [
            {
              text: "✅ I'm Safe",
              onPress: () => {
                overdueAlertedRef.current.delete(ci.id); // allow future alerts
                save(checkins.map((c) =>
                  c.id === ci.id
                    ? { ...c, lastCheckin: Date.now(), nextDeadline: Date.now() + c.intervalMinutes * 60000 }
                    : c
                ));
              },
            },
            {
              text: '📞 Call Guardian',
              onPress: () => {
                if (guardians.length > 0) {
                  const top = [...guardians].sort((a, b) => a.priority - b.priority)[0];
                  quickCall(top.phone);
                }
              },
            },
          ],
          { cancelable: false }
        );
      }

      // If it became un-overdue (they checked in), remove from alerted
      if (!isOverdue && overdueAlertedRef.current.has(ci.id)) {
        overdueAlertedRef.current.delete(ci.id);
      }
    });
  }, [tick, checkins]);

  const save = async (list: CheckIn[]) => {
    setCheckins(list);
    await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify(list));
  };

  const createCheckIn = () => {
    const newCI: CheckIn = {
      id: Date.now().toString(),
      label: `Check-in every ${selectedInterval >= 60 ? `${selectedInterval / 60}h` : `${selectedInterval}m`}`,
      intervalMinutes: selectedInterval,
      active: true,
      lastCheckin: Date.now(),
      nextDeadline: Date.now() + selectedInterval * 60000,
    };
    save([...checkins, newCI]);
  };

  const markSafe = (id: string) => {
    overdueAlertedRef.current.delete(id);
    save(checkins.map((c) =>
      c.id === id
        ? { ...c, lastCheckin: Date.now(), nextDeadline: Date.now() + c.intervalMinutes * 60000 }
        : c
    ));
    Alert.alert('✅ Checked In', "Your guardians know you're safe!");
  };

  const toggleActive = (id: string) => {
    overdueAlertedRef.current.delete(id);
    save(checkins.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  };

  const remove = (id: string) => {
    overdueAlertedRef.current.delete(id);
    save(checkins.filter((c) => c.id !== id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Safety Check-ins</Text>
        <Text style={styles.subtitle}>Auto-alert if you miss a check-in</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create new */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>New Check-in Schedule</Text>
          <Text style={styles.cardSub}>How often should you check in?</Text>
          <View style={styles.intervalRow}>
            {DEFAULT_INTERVALS.map((i) => (
              <TouchableOpacity
                key={i}
                style={[styles.intervalChip, selectedInterval === i && styles.intervalChipActive]}
                onPress={() => setSelectedInterval(i)}
              >
                <Text style={[styles.intervalText, selectedInterval === i && styles.intervalTextActive]}>
                  {i >= 60 ? `${i / 60}h` : `${i}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={createCheckIn}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Start Check-in</Text>
          </TouchableOpacity>
        </View>

        {/* Active check-ins */}
        {checkins.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyText}>No check-ins active</Text>
            <Text style={styles.emptySub}>
              Set a schedule and tap "I'm Safe" periodically.{'\n'}
              Guardians are alerted if you miss one.
            </Text>
          </View>
        ) : (
          checkins.map((ci) => {
            const { text: timeText, overdue } = getTimeLeft(ci.nextDeadline);
            return (
              <View key={ci.id} style={[styles.ciCard, overdue && styles.ciCardOverdue]}>
                <View style={styles.ciHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ciLabel}>{ci.label}</Text>
                    {ci.lastCheckin ? (
                      <Text style={styles.ciLastIn}>
                        Last: {new Date(ci.lastCheckin).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    ) : null}
                  </View>
                  <Switch
                    value={ci.active}
                    onValueChange={() => toggleActive(ci.id)}
                    trackColor={{ false: colors.border, true: colors.primaryDark }}
                    thumbColor={ci.active ? colors.primary : colors.textMuted}
                  />
                </View>

                {ci.active && (
                  <>
                    {/* Live countdown */}
                    <View style={[styles.timerBox, overdue && styles.timerBoxOverdue]}>
                      <Ionicons
                        name={overdue ? "warning" : "timer-outline"}
                        size={16}
                        color={overdue ? colors.danger : colors.warning}
                      />
                      <Text style={[styles.ciTimer, overdue && { color: colors.danger }]}>
                        {overdue ? 'OVERDUE — Are you safe?' : `Next check-in: ${timeText}`}
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.safeBtn} onPress={() => markSafe(ci.id)}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.safeBtnText}>I'm Safe ✓</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity style={styles.removeBtn} onPress={() => remove(ci.id)}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
          <Text style={styles.infoText}>
            Keep the app open or in background for live countdown. When overdue, SafeHer will alert you immediately with an option to call your guardian.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm,
  },
  cardTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700' },
  cardSub: { color: colors.textMuted, fontSize: fontSize.sm },
  intervalRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  intervalChip: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border,
  },
  intervalChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  intervalText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '700' },
  intervalTextActive: { color: colors.primary },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.success,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xs,
  },
  createBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.xl, fontWeight: '700' },
  emptySub: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22 },
  ciCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm,
  },
  ciCardOverdue: { borderColor: colors.danger, borderWidth: 2 },
  ciHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ciLabel: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  ciLastIn: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  timerBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: 'rgba(255,184,0,0.1)', borderRadius: radius.md,
    padding: spacing.sm, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)',
  },
  timerBoxOverdue: {
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderColor: 'rgba(255,51,102,0.4)',
  },
  ciTimer: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
  safeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.success,
    borderRadius: radius.md, padding: spacing.sm,
  },
  safeBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },
  removeBtn: { position: 'absolute', top: spacing.md, right: spacing.md },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.accentGlow, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.accent + '33', padding: spacing.md,
  },
  infoText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.xs, lineHeight: 18 },
});
