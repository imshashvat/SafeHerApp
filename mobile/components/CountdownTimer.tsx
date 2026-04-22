import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, Vibration,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSOSStore } from '../store/sosStore';
import { colors, fontSize, spacing, radius } from '../constants/theme';

export default function CountdownTimer() {
  const { status, countdownSeconds, trigger, cancelSOS, reset, dispatchResult } = useSOSStore();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'countdown') {
      Vibration.vibrate([0, 200, 100, 200]);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [countdownSeconds, status]);

  const isVisible = status === 'countdown' || status === 'active';
  if (!isVisible) return null;

  const triggerLabel = {
    button: '🆘 SOS Button',
    shake: '📳 Shake Detected',
    fall: '📉 Fall Detected',
    voice: '🎤 Voice Detected',
  }[trigger ?? 'button'];

  // ── ALERT SENT screen ──────────────────────────────────────────────────────
  if (status === 'active') {
    const r = dispatchResult;
    const dispatching = !r;

    return (
      <View style={styles.activeContainer}>
        <Text style={styles.activeEmoji}>{dispatching ? '⏳' : '🚨'}</Text>
        <Text style={styles.activeTitle}>
          {dispatching ? 'SENDING…' : 'ALERT SENT'}
        </Text>

        {dispatching ? (
          <Text style={styles.activeSubtitle}>Dispatching to all emergency contacts…</Text>
        ) : (
          <View style={styles.resultBox}>
            {/* No guardians warning */}
            {r!.noGuardians && (
              <View style={styles.resultRow}>
                <Text style={styles.resultIcon}>⚠️</Text>
                <Text style={[styles.resultText, { color: '#FFB800' }]}>
                  No guardians added! Go to Guardians tab.
                </Text>
              </View>
            )}

            {/* Email result */}
            {r!.emailedTo.length > 0 ? (
              <View style={styles.resultRow}>
                <Text style={styles.resultIcon}>✅</Text>
                <Text style={styles.resultText}>
                  Email → {r!.emailedTo.join(', ')}
                </Text>
              </View>
            ) : !r!.noGuardians ? (
              <View style={styles.resultRow}>
                <Text style={styles.resultIcon}>⚠️</Text>
                <Text style={[styles.resultText, { color: '#FFB800' }]}>No guardian emails set</Text>
              </View>
            ) : null}

            {/* SMS result */}
            {r!.smsTo.length > 0 ? (
              <View style={styles.resultRow}>
                <Text style={styles.resultIcon}>
                  {r!.errors.includes('sms-backend-offline') ? '⚠️' : '✅'}
                </Text>
                <Text style={[styles.resultText, r!.errors.includes('sms-backend-offline') && { color: '#FFB800' }]}>
                  {r!.errors.includes('sms-backend-offline')
                    ? `SMS offline — start backend on laptop`
                    : `SMS → ${r!.smsTo.length} number(s)`}
                </Text>
              </View>
            ) : !r!.noGuardians ? (
              <View style={styles.resultRow}>
                <Text style={styles.resultIcon}>⚠️</Text>
                <Text style={[styles.resultText, { color: '#FFB800' }]}>No guardian phones set</Text>
              </View>
            ) : null}

            {/* Call result */}
            <View style={styles.resultRow}>
              <Text style={styles.resultIcon}>{r!.callMade ? '✅' : 'ℹ️'}</Text>
              <Text style={styles.resultText}>
                {r!.callMade ? 'Dialing 112…' : 'Auto-call off (enable in Settings)'}
              </Text>
            </View>

            {/* Backend errors */}
            {r!.errors.filter(e => e !== 'sms-backend-offline').map((e) => (
              <View key={e} style={styles.resultRow}>
                <Text style={styles.resultIcon}>❌</Text>
                <Text style={[styles.resultText, { color: '#FF3366' }]}>{e}</Text>
              </View>
            ))}
          </View>
        )}

        {/* DISMISS button */}
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            reset();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.dismissText}>✓  DISMISS</Text>
        </TouchableOpacity>
        {!dispatching && (
          <Text style={styles.dismissHint}>Auto-dismisses in 8 seconds</Text>
        )}
      </View>
    );
  }

  // ── COUNTDOWN screen ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={styles.triggerLabel}>{triggerLabel}</Text>
      <Text style={styles.title}>SOS in</Text>
      <Animated.Text
        style={[styles.countdown, { transform: [{ scale: scaleAnim }] }]}
      >
        {countdownSeconds}
      </Animated.Text>
      <Text style={styles.subtitle}>Alerting all emergency contacts</Text>
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          cancelSOS();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.cancelText}>✕  CANCEL SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,10,30,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  triggerLabel: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textSecondary,
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  countdown: {
    color: colors.sosRed,
    fontSize: 120,
    fontWeight: '900',
    lineHeight: 130,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.bgElevated,
    borderWidth: 2,
    borderColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  cancelText: {
    color: colors.success,
    fontSize: fontSize.lg,
    fontWeight: '800',
    letterSpacing: 2,
  },
  // ── ACTIVE / SENT ──────────────────────────────────────────────────────────
  activeContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,10,30,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    paddingHorizontal: spacing.lg,
  },
  activeEmoji: { fontSize: 70 },
  activeTitle: {
    color: colors.sosRed,
    fontSize: fontSize.xxxl,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  activeSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  resultBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  resultIcon: { fontSize: 16, marginTop: 1 },
  resultText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  dismissBtn: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(0,212,170,0.15)',
    borderWidth: 2,
    borderColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  dismissText: {
    color: colors.success,
    fontSize: fontSize.lg,
    fontWeight: '800',
    letterSpacing: 2,
  },
  dismissHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
  },
});
