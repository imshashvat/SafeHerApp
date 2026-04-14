import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/theme';

type Props = {
  visible: boolean;
  callerName: string;
  onDecline: () => void;
  onAccept: () => void;
};

export default function FakeCallOverlay({
  visible,
  callerName,
  onDecline,
  onAccept,
}: Props) {
  React.useEffect(() => {
    if (visible) {
      Vibration.vibrate([0, 600, 400, 600, 400, 600], true);
    } else {
      Vibration.cancel();
    }
    return () => Vibration.cancel();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <StatusBar backgroundColor="#0d0d1a" barStyle="light-content" />
      <View style={styles.container}>
        {/* Top area */}
        <View style={styles.topSection}>
          <Text style={styles.incomingLabel}>INCOMING CALL</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {callerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callerSub}>Mobile · India</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Decline */}
          <View style={styles.actionWrapper}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
              <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Decline</Text>
          </View>

          {/* Accept */}
          <View style={styles.actionWrapper}>
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
              <Ionicons name="call" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Accept</Text>
          </View>
        </View>

        <Text style={styles.note}>
          🔒 Emergency contacts are being alerted silently
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 40 : 60,
    paddingBottom: 60,
    paddingHorizontal: spacing.xl,
  },
  topSection: {
    alignItems: 'center',
  },
  incomingLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarText: {
    color: '#fff',
    fontSize: fontSize.xxxl,
    fontWeight: '800',
  },
  callerName: {
    color: colors.textPrimary,
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  callerSub: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  actionWrapper: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  declineBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  note: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});
