/**
 * useVoiceDetection — Rebuilt spike-above-baseline detection
 *
 * Improvements over previous version:
 * - Explicit user-facing permission alert if mic denied
 * - Lower spike threshold (15 dB vs 18 dB)
 * - Longer baseline warmup (10 samples min vs 4)
 * - 3 consecutive spikes required (vs 2) — reduces false positives
 * - Better error recovery (auto-restarts recording after failure)
 * - Debug logging in __DEV__ mode
 */

import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { useSOSStore } from '../store/sosStore';
import { useSettingsStore } from '../store/settingsStore';

// Must be SPIKE_DB above the rolling ambient baseline to trigger
const SPIKE_DB = 15;

// Also must be above this absolute floor (rules out true silence noise)
const MIN_ABSOLUTE_DB = -30;

// Rolling baseline window size (samples)
const BASELINE_WINDOW = 12;

// Polling interval (ms)
const POLL_INTERVAL_MS = 200;

// Cooldown after trigger (ms) — prevents rapid re-triggering
const COOLDOWN_MS = 10000;

// Minimum consecutive spikes before trigger
const MIN_CONSECUTIVE_SPIKES = 3;

// Warmup samples before we start evaluating
const WARMUP_SAMPLES = 10;

// Max restart attempts on recording error
const MAX_RESTART_ATTEMPTS = 3;

export function useVoiceDetection() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baselineRef = useRef<number[]>([]);
  const lastTriggerRef = useRef<number>(0);
  const consecutiveSpikesRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const sampleCountRef = useRef(0);
  const restartAttemptsRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for reactive store values — avoids effect re-fires
  const statusRef = useRef(useSOSStore.getState().status);
  const startCountdownRef = useRef(useSOSStore.getState().startCountdown);
  const voiceKeywordRef = useRef(useSettingsStore.getState().voiceKeyword);

  // Sync refs with store changes
  useEffect(() => {
    const unsub1 = useSOSStore.subscribe((state) => {
      statusRef.current = state.status;
      startCountdownRef.current = state.startCountdown;
    });
    const unsub2 = useSettingsStore.subscribe((state) => {
      voiceKeywordRef.current = state.voiceKeyword;
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const clearPollInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const stopRecording = async () => {
    clearPollInterval();
    clearRestartTimer();
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // ignore
      }
      recordingRef.current = null;
    }
    baselineRef.current = [];
    consecutiveSpikesRef.current = 0;
    sampleCountRef.current = 0;
  };

  const startRecording = async () => {
    if (!mountedRef.current) return;
    if (!voiceKeywordRef.current) return;
    if (recordingRef.current) return; // Already running

    try {
      // Check + request permission
      const { status: existingStatus } = await Audio.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status: newStatus } = await Audio.requestPermissionsAsync();
        finalStatus = newStatus;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) {
          console.warn('[VoiceDetection] Microphone permission denied');
        }
        // Show alert once if user explicitly enabled voice SOS
        Alert.alert(
          'Microphone Permission Required',
          'Voice SOS needs microphone access to detect distress sounds. Please grant permission in device Settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.LOW_QUALITY,
        isMeteringEnabled: true,
      });

      if (!mountedRef.current) {
        try { await recording.stopAndUnloadAsync(); } catch { /* ignore */ }
        return;
      }

      recordingRef.current = recording;
      restartAttemptsRef.current = 0;
      baselineRef.current = [];
      consecutiveSpikesRef.current = 0;
      sampleCountRef.current = 0;

      if (__DEV__) {
        console.log('[VoiceDetection] Recording started, warming up baseline...');
      }

      clearPollInterval();
      intervalRef.current = setInterval(async () => {
        if (!recordingRef.current) return;
        if (!mountedRef.current) return;
        if (!voiceKeywordRef.current) return;
        if (statusRef.current !== 'idle') return;

        const now = Date.now();
        if (now - lastTriggerRef.current < COOLDOWN_MS) return;

        try {
          const recStatus = await recordingRef.current.getStatusAsync();
          if (!recStatus.isRecording) {
            // Recording stopped unexpectedly — schedule restart
            scheduleRestart();
            return;
          }

          const db: number = (recStatus as any).metering ?? -160;
          sampleCountRef.current += 1;

          // Update rolling baseline
          const baseline = baselineRef.current;
          if (baseline.length >= BASELINE_WINDOW) baseline.shift();
          baseline.push(db);

          // Need warmup samples for a reliable baseline
          if (sampleCountRef.current < WARMUP_SAMPLES) return;
          if (baseline.length < 6) return;

          const avgBaseline = baseline.reduce((a, b) => a + b, 0) / baseline.length;
          const spikeAboveBaseline = db - avgBaseline;

          if (__DEV__ && sampleCountRef.current % 25 === 0) {
            console.log(`[VoiceDetection] dB: ${db.toFixed(1)}, baseline: ${avgBaseline.toFixed(1)}, spike: ${spikeAboveBaseline.toFixed(1)}`);
          }

          if (db > MIN_ABSOLUTE_DB && spikeAboveBaseline >= SPIKE_DB) {
            consecutiveSpikesRef.current += 1;
            if (__DEV__) {
              console.log(`[VoiceDetection] Spike detected! Consecutive: ${consecutiveSpikesRef.current}/${MIN_CONSECUTIVE_SPIKES}`);
            }
            if (consecutiveSpikesRef.current >= MIN_CONSECUTIVE_SPIKES) {
              consecutiveSpikesRef.current = 0;
              lastTriggerRef.current = now;
              baselineRef.current = [];
              sampleCountRef.current = 0;
              if (__DEV__) {
                console.log('[VoiceDetection] 🚨 TRIGGER! Starting SOS countdown...');
              }
              startCountdownRef.current('voice');
            }
          } else {
            consecutiveSpikesRef.current = 0;
          }
        } catch (err) {
          // Polling error — schedule restart
          if (__DEV__) {
            console.warn('[VoiceDetection] Poll error:', err);
          }
          scheduleRestart();
        }
      }, POLL_INTERVAL_MS);

    } catch (err) {
      if (__DEV__) {
        console.warn('[VoiceDetection] Failed to start recording:', err);
      }
      scheduleRestart();
    }
  };

  const scheduleRestart = () => {
    if (!mountedRef.current || !voiceKeywordRef.current) return;
    if (restartAttemptsRef.current >= MAX_RESTART_ATTEMPTS) return;

    restartAttemptsRef.current += 1;
    clearPollInterval();

    if (recordingRef.current) {
      const rec = recordingRef.current;
      recordingRef.current = null;
      rec.stopAndUnloadAsync().catch(() => {});
    }

    const delay = 2000 * restartAttemptsRef.current; // back-off: 2s, 4s, 6s
    if (__DEV__) {
      console.log(`[VoiceDetection] Scheduling restart attempt ${restartAttemptsRef.current} in ${delay}ms`);
    }

    clearRestartTimer();
    restartTimerRef.current = setTimeout(() => {
      if (mountedRef.current && voiceKeywordRef.current) {
        startRecording();
      }
    }, delay);
  };

  // Single effect — start/stop based on voiceKeyword
  useEffect(() => {
    mountedRef.current = true;

    // Start if enabled at mount
    if (voiceKeywordRef.current) {
      startRecording();
    }

    // Listen for voiceKeyword changes
    const unsub = useSettingsStore.subscribe((state, prevState) => {
      if (state.voiceKeyword !== (prevState as any).voiceKeyword) {
        if (state.voiceKeyword) {
          restartAttemptsRef.current = 0;
          startRecording();
        } else {
          stopRecording();
        }
      }
    });

    return () => {
      mountedRef.current = false;
      unsub();
      stopRecording();
    };
  }, []); // Empty deps — refs + subscription handle reactivity
}
