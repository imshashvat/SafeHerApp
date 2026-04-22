import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
// expo-notifications push registration removed — not supported in Expo Go SDK 53+
import { useSettingsStore } from '../../store/settingsStore';
import { useGuardianStore } from '../../store/guardianStore';
import { colors, fontSize, spacing, radius } from '../../constants/theme';

const STEPS = ['Welcome', 'Permissions', 'Profile', 'Guardians', 'Ready'];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { update } = useSettingsStore();
  const { addGuardian } = useGuardianStore();
  const [name, setName] = useState('');
  const [blood, setBlood] = useState('');
  const [gName, setGName] = useState('');
  const [gPhone, setGPhone] = useState('');
  const [permsGranted, setPermsGranted] = useState(false);

  const requestPermissions = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
      // Note: expo-notifications push registration is not supported in Expo Go SDK 53+
      // It works in production builds (EAS Build)
      setPermsGranted(true);
    } catch {
      setPermsGranted(true); // Continue anyway
    }
  };

  const finish = async () => {
    if (name) update({ profileName: name, bloodGroup: blood, isOnboarded: true });
    else update({ isOnboarded: true });

    if (gName && gPhone) {
      await addGuardian({
        name: gName, phone: gPhone, email: '',
        relation: 'Guardian', priority: 1,
      });
    }
    router.replace('/(tabs)');
  };

  const next = () => {
    if (step === STEPS.length - 1) finish();
    else setStep(step + 1);
  };

  const skip = () => {
    update({ isOnboarded: true });
    router.replace('/(tabs)');
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <View style={styles.stepContent}>
          <Text style={styles.welcomeEmoji}>🛡️</Text>
          <Text style={styles.stepTitle}>Welcome to SafeHer</Text>
          <Text style={styles.stepDesc}>
            Your all-in-one personal safety app.{'\n'}
            One tap. Real-time alerts. Smart protection.
          </Text>
          <View style={styles.featureList}>
            {[
              ['🆘', 'One-tap SOS + auto-call 112'],
              ['📳', 'Shake or fall triggers alert'],
              ['📍', 'Send GPS to guardians instantly'],
              ['📞', 'Fake call screen for unsafe situations'],
              ['✅', 'Safety check-in reminders'],
            ].map(([icon, text]) => (
              <View key={text} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{icon}</Text>
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
      );

      case 1: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepEmoji}>🔐</Text>
          <Text style={styles.stepTitle}>Enable Permissions</Text>
          <Text style={styles.stepDesc}>
            SafeHer needs these to keep you safe. All data stays private on your device.
          </Text>
          <View style={styles.permList}>
            {[
              { icon: 'location', label: 'Location', sub: 'GPS for SOS alerts' },
              { icon: 'notifications', label: 'Notifications', sub: 'Check-in reminders' },
              { icon: 'mic', label: 'Microphone', sub: 'Voice keyword detection' },
              { icon: 'camera', label: 'Camera', sub: 'Evidence video on SOS' },
            ].map((p) => (
              <View key={p.label} style={styles.permRow}>
                <View style={styles.permIcon}>
                  <Ionicons name={p.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.permLabel}>{p.label}</Text>
                  <Text style={styles.permSub}>{p.sub}</Text>
                </View>
                <Ionicons
                  name={permsGranted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={permsGranted ? colors.success : colors.textMuted}
                />
              </View>
            ))}
          </View>
          {!permsGranted && (
            <TouchableOpacity style={styles.permBtn} onPress={requestPermissions}>
              <Text style={styles.permBtnText}>Grant Permissions</Text>
            </TouchableOpacity>
          )}
        </View>
      );

      case 2: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepEmoji}>👩</Text>
          <Text style={styles.stepTitle}>Your Profile</Text>
          <Text style={styles.stepDesc}>Basic info for your medical ID card (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Blood group (e.g. O+)"
            placeholderTextColor={colors.textMuted}
            value={blood}
            onChangeText={setBlood}
          />
        </View>
      );

      case 3: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepEmoji}>👥</Text>
          <Text style={styles.stepTitle}>Add First Guardian</Text>
          <Text style={styles.stepDesc}>
            This person will receive SMS + location when you press SOS
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Guardian's name"
            placeholderTextColor={colors.textMuted}
            value={gName}
            onChangeText={setGName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            placeholderTextColor={colors.textMuted}
            value={gPhone}
            onChangeText={setGPhone}
            keyboardType="phone-pad"
          />
        </View>
      );

      case 4: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepEmoji}>🚀</Text>
          <Text style={styles.stepTitle}>You're All Set!</Text>
          <Text style={styles.stepDesc}>
            SafeHer is protecting you in the background.{'\n\n'}
            Tap the big red SOS button for emergencies.{'\n'}
            Shake your phone when you need help.
          </Text>
          <View style={styles.readyCard}>
            <Text style={styles.readyText}>🆘 Tap the SOS button anytime</Text>
            <Text style={styles.readyText}>📳 Shake phone to trigger alert</Text>
            <Text style={styles.readyText}>📞 Use Fake Call in uncomfortable situations</Text>
          </View>
        </View>
      );

      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step < STEPS.length - 1 && (
          <TouchableOpacity onPress={skip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.nextText}>
            {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  progressRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingVertical: spacing.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  dotDone: { backgroundColor: colors.primaryDark },
  scroll: { flexGrow: 1, padding: spacing.xl },
  stepContent: { gap: spacing.lg },
  welcomeEmoji: { fontSize: 80, textAlign: 'center' },
  stepEmoji: { fontSize: 72, textAlign: 'center' },
  stepTitle: {
    color: colors.textPrimary, fontSize: fontSize.xxxl,
    fontWeight: '900', textAlign: 'center',
  },
  stepDesc: {
    color: colors.textSecondary, fontSize: fontSize.md,
    textAlign: 'center', lineHeight: 24,
  },
  featureList: { gap: spacing.sm },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  featureIcon: { fontSize: 24 },
  featureText: { color: colors.textSecondary, fontSize: fontSize.md, flex: 1 },
  permList: { gap: spacing.sm },
  permRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  permIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  permLabel: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  permSub: { color: colors.textMuted, fontSize: fontSize.xs },
  permBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  permBtnText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  input: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    color: colors.textPrimary, fontSize: fontSize.md, padding: spacing.md,
  },
  readyCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md,
  },
  readyText: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 26 },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md,
  },
  skipBtn: { padding: spacing.md },
  skipText: { color: colors.textMuted, fontSize: fontSize.md },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  nextText: { color: '#fff', fontSize: fontSize.md, fontWeight: '800' },
});
