import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlertHistoryStore } from '../store/alertHistoryStore';
import { colors, fontSize, spacing, radius } from '../constants/theme';

const TRIGGER_ICONS: Record<string, string> = {
  'SOS Button': '🆘',
  'Shake Detected': '📳',
  'Fall Detected': '📉',
  'Voice Keyword': '🎤',
};

function timeAgo(ts: number) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AlertHistoryScreen() {
  const router = useRouter();
  const { alerts, clearHistory } = useAlertHistoryStore();

  const sentCount = alerts.filter(a => a.status === 'sent').length;
  const cancelledCount = alerts.filter(a => a.status === 'cancelled').length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Alert History</Text>
        {alerts.length > 0 && (
          <TouchableOpacity onPress={() => clearHistory()} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Total Alerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>{sentCount}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{cancelledCount}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>RECENT ALERTS</Text>

        {alerts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={64} color={colors.success} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySub}>No SOS alerts have been fired yet.{'\n'}Stay safe! 💚</Text>
            <Text style={styles.emptyHint}>
              Alerts will appear here when you use the SOS button,{'\n'}or when shake/fall detection triggers an emergency.
            </Text>
          </View>
        ) : (
          alerts.map((log) => (
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
                      {log.guardianNames.length > 0 ? ` (${log.guardianNames.join(', ')})` : ''}
                    </Text>
                  </View>
                  <Text style={styles.logTimestamp}>
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </Text>
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
  title: { flex: 1, color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  clearBtn: { padding: 4 },
  clearText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },
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
  emptyHint: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', lineHeight: 18, marginTop: spacing.md },
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
  logDetailText: { color: colors.textSecondary, fontSize: fontSize.xs, flex: 1 },
  logTimestamp: { color: colors.textMuted, fontSize: 9, marginTop: spacing.xs },
});
