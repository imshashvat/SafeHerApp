import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useGuardianStore } from '../store/guardianStore';
import { useAlertHistoryStore } from '../store/alertHistoryStore';
import { useShakeDetection } from '../hooks/useShakeDetection';
import { useFallDetection } from '../hooks/useFallDetection';
import { useVoiceDetection } from '../hooks/useVoiceDetection';
import { useSOSDispatch } from '../hooks/useSOSDispatch';
import { useLocation } from '../hooks/useLocation';
import { crimeDataService } from '../services/crimeDataService';
import { initDatabase } from '../services/database';
import { Audio } from 'expo-av';
import { ThemeProvider, useAppTheme } from '../contexts/ThemeContext';
import {
  startForegroundService,
  configureSilentNotifications,
} from '../services/backgroundService';

// Configure notification display behavior immediately (module-level)
configureSilentNotifications();

function InnerLayout() {
  const { currentUser, isLoggedIn, isLoading: authLoading, restoreSession } = useAuthStore();
  const { load: loadSettings } = useSettingsStore();
  const { load: loadGuardians } = useGuardianStore();
  const { load: loadAlertHistory } = useAlertHistoryStore();
  const { appTheme, colors } = useAppTheme();
  const { startBackgroundWatch, stopBackgroundWatch } = useLocation();
  const locationWatchStarted = useRef(false);
  const router = useRouter();

  // Navigate to login whenever session ends (logout or expired)
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoggedIn, authLoading]);

  // Initialize database and restore session
  useEffect(() => {
    (async () => {
      await initDatabase();
      await restoreSession();

      // Request microphone permission up-front
      Audio.requestPermissionsAsync().catch(() => {});

      // Request location permission up-front (so SOS always has coords)
      // Note: CALL_PHONE on Android is declared in AndroidManifest.xml
      // expo-location handles the runtime request
    })();

    // Load ML crime data (bundled, no network needed)
    crimeDataService.load();

    // Start foreground service so Android keeps app alive when screen is off
    startForegroundService().catch(() => {});
  }, []);

  // Load user-specific data when user logs in + start location watch
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadSettings(currentUser.id);
      loadGuardians(currentUser.id);
      loadAlertHistory(currentUser.id);

      // Start continuous background location watch so SOS always has fresh coords
      if (!locationWatchStarted.current) {
        locationWatchStarted.current = true;
        startBackgroundWatch();
      }
    }

    // Stop watching on logout
    if (!isLoggedIn && locationWatchStarted.current) {
      locationWatchStarted.current = false;
      stopBackgroundWatch();
    }
  }, [isLoggedIn, currentUser?.id]);

  // ── Global sensor & dispatch hooks ─────────────────────────────────
  useShakeDetection();
  useFallDetection();
  useVoiceDetection();
  useSOSDispatch();

  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <StatusBar style={appTheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.primary }]}>SafeHer</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={appTheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
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
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <InnerLayout />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '900', letterSpacing: 2,
  },
});
