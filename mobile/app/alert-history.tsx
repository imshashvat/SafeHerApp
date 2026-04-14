import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontSize, spacing, radius } from '../constants/theme';

const ALERTS_KEY = '@safeher_alert_history';

type AlertLog = {
  id: string;
  trigger: string;
  timestamp: number;
  location: string;
  status: 'sent' | 'cancelled';
  sentTo: number;
};

function timeAgo(ts: number) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString('en-IN');
}

const SAMPLE_HISTORY: AlertLog[] = [
  {
    id: '1', trigger: 'Shake Detected', timestamp: Date.now() - 86400000 * 2,
    location: '28.6139, 77.2090', status: 'sent', sentTo: 3,
  },
  {
    id: '2', trigger: 'SOS Button', timestamp: Date.now() - 86400000 * 5,
    location: '19.0760, 72.8777', status: 'cancelled', sentTo: 0,
  },
];

const TRIGGER_ICONS: Record<string, string> = {
  'SOS Button': '🆘',
  'Shake Detected': '📳',
  'Fall Detected': '📉',
  'Voice Keyword': '🎤',
};

export default function AlertHistoryScreen() {
  const router = useRouter();
  const [history] = useState<AlertLog[]>(SAMPLE_HISTORY);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Alert History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{history.length}</Text>
            <Text style={styles.statLabel}>Total Alerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {history.filter((a) => a.status === 'sent').length}
            </Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {history.filter((a) => a.status === 'cancelled').length}
            </Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>RECENT ALERTS</Text>

        {history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={64} color={colors.success} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySub}>No SOS alerts have been fired. Stay safe! 💚</Text>
          </View>
        ) : (
          history.map((log) => (
            <View key={log.id} style={[styles.logCard, log.status === 'cancelled' && styles.logCardCancelled]}>
              <View style={styles.logHeader}>
                <Text style={styles.logEmoji}>{TRIGGER_ICONS[log.trigger] ?? '🔔'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logTrigger}>{log.trigger}</Text>
                  <Text style={styles.logTime}>{timeAgo(log.timestamp)}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: log.status === 'sent' ? colors.successGlow : colors.dangerGlow }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: log.status === 'sent' ? colors.success : colors.danger }
                  ]}>
                    {log.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {log.status === 'sent' && (
                <>
                  <View style={styles.logDetail}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.logDetailText}>{log.location}</Text>
                  </View>
                  <View style={styles.logDetail}>
                    <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.logDetailText}>
                      Alerted {log.sentTo} guardian{log.sentTo !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </>
              )}
            </View>
          ))
        )}
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
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center',
  },
  statValue: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  sectionLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptyTitle: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800' },
  emptySub: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center' },
  logCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.xs,
  },
  logCardCancelled: { opacity: 0.65 },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logEmoji: { fontSize: 28 },
  logTrigger: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  logTime: { color: colors.textMuted, fontSize: fontSize.xs },
  statusBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  logDetail: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  logDetailText: { color: colors.textSecondary, fontSize: fontSize.xs },
});
