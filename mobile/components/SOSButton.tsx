import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSOSStore } from '../store/sosStore';
import { colors, fontSize } from '../constants/theme';

export default function SOSButton() {
  const { status, startCountdown } = useSOSStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 950,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 950,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    glow.start();
    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);

  const handlePress = async () => {
    if (status !== 'idle') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    startCountdown('button');
  };

  const isActive = status !== 'idle';

  return (
    <View style={styles.wrapper}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          { opacity: glowAnim, transform: [{ scale: pulseAnim }] },
        ]}
      />
      {/* Mid ring */}
      <Animated.View
        style={[
          styles.midRing,
          { transform: [{ scale: pulseAnim }] },
        ]}
      />
      {/* Main button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[styles.button, isActive && styles.buttonActive]}
          onPress={handlePress}
          activeOpacity={0.85}
          disabled={isActive}
          accessibilityLabel="SOS Emergency Button"
          accessibilityRole="button"
        >
          <Text style={styles.label}>SOS</Text>
          <Text style={styles.subLabel}>
            {isActive ? 'ALERTING...' : 'HOLD FOR HELP'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const SIZE = 200;
const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE + 80,
    height: SIZE + 80,
  },
  glowRing: {
    position: 'absolute',
    width: SIZE + 70,
    height: SIZE + 70,
    borderRadius: (SIZE + 70) / 2,
    backgroundColor: colors.sosRedGlow,
  },
  midRing: {
    position: 'absolute',
    width: SIZE + 34,
    height: SIZE + 34,
    borderRadius: (SIZE + 34) / 2,
    borderWidth: 2,
    borderColor: colors.sosRed,
    backgroundColor: 'transparent',
    opacity: 0.4,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.sosRed,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.sosRed,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  buttonActive: {
    backgroundColor: colors.sosRedDark,
  },
  label: {
    fontSize: fontSize.huge,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  subLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 2,
    marginTop: 4,
    fontWeight: '600',
  },
});
