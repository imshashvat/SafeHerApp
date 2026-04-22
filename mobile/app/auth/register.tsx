import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { colors, fontSize, spacing, radius } from '../../constants/theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, error, isLoading, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleRegister = async () => {
    setLocalError('');
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    const result = await register(name.trim(), phone.trim(), password, email.trim(), bloodGroup);
    // If registration succeeds, the _layout.tsx auth check will redirect
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.brand}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join SafeHer for your safety</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {displayError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={(t) => { setName(t); clearError(); setLocalError(''); }}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="10-digit phone number"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={(t) => { setPhone(t); clearError(); setLocalError(''); }}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email (optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (optional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Blood Group */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Group (optional)</Text>
              <View style={styles.bloodRow}>
                {BLOOD_GROUPS.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodChip, bloodGroup === bg && styles.bloodChipActive]}
                    onPress={() => setBloodGroup(bloodGroup === bg ? '' : bg)}
                  >
                    <Text style={[styles.bloodText, bloodGroup === bg && styles.bloodTextActive]}>
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Min 4 characters"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError(); setLocalError(''); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setLocalError(''); }}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, isLoading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', marginBottom: spacing.md },
  backBtn: { padding: 4 },
  brand: { marginBottom: spacing.lg },
  title: { color: colors.textPrimary, fontSize: fontSize.xxxl, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 },
  formCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, gap: spacing.md,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.dangerGlow, borderRadius: radius.md,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.danger + '44',
  },
  errorText: { color: colors.danger, fontSize: fontSize.sm, flex: 1 },
  inputGroup: { gap: spacing.xs },
  label: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 2,
  },
  input: {
    flex: 1, color: colors.textPrimary, fontSize: fontSize.md,
    paddingVertical: 12,
  },
  bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  bloodChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border,
  },
  bloodChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  bloodText: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.sm },
  bloodTextActive: { color: colors.primary },
  registerBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  registerBtnText: { color: '#fff', fontWeight: '800', fontSize: fontSize.lg, letterSpacing: 0.5 },
  loginRow: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: { color: colors.textMuted, fontSize: fontSize.sm },
  loginLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
});
