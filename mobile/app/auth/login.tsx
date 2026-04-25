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

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, isLoading, clearError, savedPhone } = useAuthStore();
  const [phone, setPhone] = useState(savedPhone);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const result = await login(phone.trim(), password);
    // If login succeeds, the _layout.tsx auth check will redirect to (tabs)
  };

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
          {/* Logo & Branding */}
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>🛡️</Text>
            </View>
            <Text style={styles.appName}>SafeHer</Text>
            <Text style={styles.tagline}>Your safety, always on</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to access your safety network</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={(t) => { setPhone(t); clearError(); }}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError(); }}
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

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register' as any)}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  logoText: { fontSize: 42 },
  appName: {
    color: colors.primary, fontSize: fontSize.xxxl,
    fontWeight: '900', letterSpacing: 2,
  },
  tagline: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 },
  formCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, gap: spacing.md,
  },
  formTitle: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800' },
  formSubtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.xs },
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
  loginBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: fontSize.lg, letterSpacing: 0.5 },
  registerRow: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerText: { color: colors.textMuted, fontSize: fontSize.sm },
  registerLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
});
