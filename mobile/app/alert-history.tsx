import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlertHistoryStore } from '../store/alertHistoryStore';
import { fontSize, spacing, radius } from '../constants/theme';
import { useAppTheme } from '../contexts/ThemeContext';

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
  const { colors } = useAppTheme();
  const { alerts, clearHistory } = useAlertHistoryStore();

  const sentCount = alerts.filter(a => a.status === 'sent').length;
  const cancelledCount = alerts.filter(a => a.status === 'cancelled').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Alert History</Text>
        {alerts.length > 0 && (
          <TouchableOpacity onPress={() => clearHistory()} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          {[
            { val: alerts.length, label: 'Total Alerts', color: colors.textPrimary },
            { val: sentCount, label: 'Sent', color: colors.success },
            { val: cancelledCount, label: 'Cancelled', color: colors.warning },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.val}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>RECENT ALERTS</Text>

        {alerts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={64} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All Clear!</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>No SOS alerts have been fired yet.{`\n`}Stay safe! 💚</Text>
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
              Alerts will appear here when you use the SOS button,{`\n`}or when shake/fall detection triggers an emergency.
            </Text>
          </View>
        ) : (
          alerts.map((log) => (
            <View key={log.id} style={[styles.logCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, log.status === 'cancelled' && styles.logCardCancelled]}>
              <View style={styles.logHeader}>
                <Text style={styles.logEmoji}>{TRIGGER_ICONS[log.trigger] ?? '🔔'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logTrigger, { color: colors.textPrimary }]}>{log.trigger}</Text>
                  <Text style={[styles.logTime, { color: colors.textMuted }]}>{timeAgo(log.timestamp)}</Text>
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
                    <Text style={[styles.logDetailText, { color: colors.textSecondary }]}>{log.location}</Text>
                  </View>
                  <View style={styles.logDetail}>
                    <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.logDetailText, { color: colors.textSecondary }]}>
                      Alerted {log.sentTo} guardian{log.sentTo !== 1 ? 's' : ''}
                      {log.guardianNames.length > 0 ? ` (${log.guardianNames.join(', ')})` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.logTimestamp, { color: colors.textMuted }]}>
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
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: '700' },
  clearBtn: { padding: 4 },
  clearText: { fontSize: fontSize.sm, fontWeight: '600' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: fontSize.xxl, fontWeight: '900' },
  statLabel: { fontSize: fontSize.xs, marginTop: 2 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptyTitle: { fontSize: fontSize.xxl, fontWeight: '800' },
  emptySub: { fontSize: fontSize.md, textAlign: 'center' },
  emptyHint: { fontSize: fontSize.xs, textAlign: 'center', lineHeight: 18, marginTop: spacing.md },
  logCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.xs },
  logCardCancelled: { opacity: 0.65 },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logEmoji: { fontSize: 28 },
  logTrigger: { fontSize: fontSize.md, fontWeight: '700' },
  logTime: { fontSize: fontSize.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  statusText: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  logDetail: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  logDetailText: { fontSize: fontSize.xs, flex: 1 },
  logTimestamp: { fontSize: 9, marginTop: spacing.xs },
});
