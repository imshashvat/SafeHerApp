import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useShakeDetection } from '../hooks/useShakeDetection';
import { useFallDetection } from '../hooks/useFallDetection';

export default function RootLayout() {
  const { load, isOnboarded } = useSettingsStore();

  useEffect(() => {
    load();
  }, []);

  // Global background sensor hooks
  useShakeDetection();
  useFallDetection();

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="guardians" />
        <Stack.Screen name="live-tracking" />
        <Stack.Screen name="companion" />
        <Stack.Screen name="report-zone" />
        <Stack.Screen name="fake-call" />
        <Stack.Screen name="safety-hub" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="alert-history" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
