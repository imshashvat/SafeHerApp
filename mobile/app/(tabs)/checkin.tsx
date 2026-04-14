import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontSize, spacing, radius } from '../../constants/theme';

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

export default function CheckInScreen() {
  const router = useRouter();
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [selectedInterval, setSelectedInterval] = useState(30);

  useEffect(() => {
    AsyncStorage.getItem(CHECKIN_KEY).then((raw) => {
      if (raw) setCheckins(JSON.parse(raw));
    });
  }, []);

  const save = async (list: CheckIn[]) => {
    setCheckins(list);
    await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify(list));
  };

  const createCheckIn = () => {
    const newCI: CheckIn = {
      id: Date.now().toString(),
      label: `Check-in every ${selectedInterval}m`,
      intervalMinutes: selectedInterval,
      active: true,
      lastCheckin: Date.now(),
      nextDeadline: Date.now() + selectedInterval * 60000,
    };
    save([...checkins, newCI]);
  };

  const markSafe = (id: string) => {
    save(checkins.map((c) =>
      c.id === id
        ? { ...c, lastCheckin: Date.now(), nextDeadline: Date.now() + c.intervalMinutes * 60000 }
        : c
    ));
    Alert.alert('✅ Checked In', 'Your guardians know you\'re safe!');
  };

  const toggleActive = (id: string) => {
    save(checkins.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  };

  const remove = (id: string) => {
    save(checkins.filter((c) => c.id !== id));
  };

  const getTimeUntil = (deadline: number | null) => {
    if (!deadline) return 'Not set';
    const diff = deadline - Date.now();
    if (diff <= 0) return '⚠️ OVERDUE';
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
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
            const overdue = ci.nextDeadline && Date.now() > ci.nextDeadline;
            return (
              <View key={ci.id} style={[styles.ciCard, overdue && styles.ciCardOverdue]}>
                <View style={styles.ciHeader}>
                  <Text style={styles.ciLabel}>{ci.label}</Text>
                  <Switch
                    value={ci.active}
                    onValueChange={() => toggleActive(ci.id)}
                    trackColor={{ false: colors.border, true: colors.primaryDark }}
                    thumbColor={ci.active ? colors.primary : colors.textMuted}
                  />
                </View>
                {ci.active && (
                  <>
                    <Text style={[styles.ciTimer, overdue && { color: colors.danger }]}>
                      Next: {getTimeUntil(ci.nextDeadline)}
                    </Text>
                    <TouchableOpacity style={styles.safeBtn} onPress={() => markSafe(ci.id)}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.safeBtnText}>I'm Safe</Text>
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
  ciCardOverdue: { borderColor: colors.danger },
  ciHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ciLabel: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  ciTimer: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '600' },
  safeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.success,
    borderRadius: radius.md, padding: spacing.sm,
  },
  safeBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },
  removeBtn: { position: 'absolute', top: spacing.md, right: spacing.md },
});
