import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSOSStore } from '../store/sosStore';
import { useSOSDispatch } from '../hooks/useSOSDispatch';
import { colors, fontSize, spacing, radius } from '../constants/theme';

export default function CountdownTimer() {
  const { status, countdownSeconds, trigger } = useSOSStore();
  const { cancelSOS } = useSOSDispatch();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const isVisible = status === 'countdown' || status === 'active';

  useEffect(() => {
    if (status === 'countdown') {
      Vibration.vibrate([0, 200, 100, 200]);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [countdownSeconds, status]);

  if (!isVisible) return null;

  const triggerLabel = {
    button: '🆘 SOS Button',
    shake: '📳 Shake Detected',
    fall: '📉 Fall Detected',
    voice: '🎤 Voice Keyword',
  }[trigger ?? 'button'];

  if (status === 'active') {
    return (
      <View style={styles.activeContainer}>
        <Text style={styles.activeEmoji}>🚨</Text>
        <Text style={styles.activeTitle}>ALERT SENT</Text>
        <Text style={styles.activeSubtitle}>
          Emergency contacts notified{'\n'}Auto-calling 112...
        </Text>
      </View>
    );
  }

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
  activeContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,23,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  activeEmoji: { fontSize: 80 },
  activeTitle: {
    color: colors.sosRed,
    fontSize: fontSize.xxxl,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: spacing.md,
  },
  activeSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 26,
  },
});
