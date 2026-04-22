import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useGuardianStore } from '../store/guardianStore';
import { useAlertHistoryStore } from '../store/alertHistoryStore';
import { useShakeDetection } from '../hooks/useShakeDetection';
import { useFallDetection } from '../hooks/useFallDetection';
import { useVoiceDetection } from '../hooks/useVoiceDetection';
import { useSOSDispatch } from '../hooks/useSOSDispatch';
import { crimeDataService } from '../services/crimeDataService';
import { initDatabase } from '../services/database';
import {
  startForegroundService,
  configureSilentNotifications,
} from '../services/backgroundService';
import { colors } from '../constants/theme';

// Configure notification display behavior immediately (module-level)
configureSilentNotifications();

export default function RootLayout() {
  const { currentUser, isLoggedIn, isLoading: authLoading, restoreSession } = useAuthStore();
  const { load: loadSettings } = useSettingsStore();
  const { load: loadGuardians } = useGuardianStore();
  const { load: loadAlertHistory } = useAlertHistoryStore();

  // Initialize database and restore session
  useEffect(() => {
    (async () => {
      await initDatabase();
      await restoreSession();
    })();

    // Load ML crime data (bundled, no network needed)
    crimeDataService.load();

    // Start foreground service so Android keeps app alive when screen is off.
    startForegroundService().catch(() => {});
  }, []);

  // Load user-specific data when user logs in
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadSettings(currentUser.id);
      loadGuardians(currentUser.id);
      loadAlertHistory(currentUser.id);
    }
  }, [isLoggedIn, currentUser?.id]);

  // ── Global sensor & dispatch hooks ─────────────────────────────────
  // These run across ALL screens. With the foreground service active,
  // they continue to run even when the screen is off (native build only).
  useShakeDetection();   // shake → SOS countdown
  useFallDetection();    // fall detected → SOS countdown
  useVoiceDetection();   // loud shout spike → SOS countdown
  useSOSDispatch();      // countdown → dispatch alerts + reset

  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor="#0f0a1e" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>SafeHer</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor="#0f0a1e" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0a1e' },
          animation: 'fade_from_bottom',
        }}
      >
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="auth/login" options={{ gestureEnabled: false }} />
            <Stack.Screen name="auth/register" />
          </>
        ) : (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/index" options={{ gestureEnabled: false }} />
            <Stack.Screen name="guardians" />
            <Stack.Screen name="live-tracking" />
            <Stack.Screen name="companion" />
            <Stack.Screen name="fake-call" />
            <Stack.Screen name="safety-hub" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="alert-history" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="route-safety" />
          </>
        )}
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: {
    flex: 1, backgroundColor: '#0f0a1e',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: {
    color: colors.primary, fontSize: 24,
    fontWeight: '900', letterSpacing: 2,
  },
});
