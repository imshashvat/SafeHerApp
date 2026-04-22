/**
 * useVoiceDetection — Spike-above-baseline detection
 *
 * Keeps a rolling average of ambient noise and triggers when the
 * current reading is SPIKE_DB above that baseline.
 *
 * Uses refs for all reactive store values to prevent effect re-fires
 * that would restart the recording and reset baseline.
 */

import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { useSOSStore } from '../store/sosStore';
import { useSettingsStore } from '../store/settingsStore';

// Must be SPIKE_DB above the rolling ambient baseline to trigger
const SPIKE_DB = 18;

// Also must be above this absolute floor (rules out true silence noise)
const MIN_ABSOLUTE_DB = -35;

// Rolling baseline window size (samples)
const BASELINE_WINDOW = 8;

// Polling interval (ms)
const POLL_INTERVAL_MS = 200;

// Cooldown after trigger (ms)
const COOLDOWN_MS = 8000;

// Minimum number of consecutive spikes to confirm trigger
const MIN_CONSECUTIVE_SPIKES = 2;

export function useVoiceDetection() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baselineRef = useRef<number[]>([]);
  const lastTriggerRef = useRef<number>(0);
  const consecutiveSpikesRef = useRef<number>(0);
  const mountedRef = useRef(true);

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

  const stopRecording = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch { /* ignore */ }
      recordingRef.current = null;
    }
    baselineRef.current = [];
    consecutiveSpikesRef.current = 0;
  };

  const startRecording = async () => {
    if (!voiceKeywordRef.current) return;
    try {
      const { status: perm } = await Audio.requestPermissionsAsync();
      if (perm !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.LOW_QUALITY,
        isMeteringEnabled: true,
      });
      recordingRef.current = recording;

      intervalRef.current = setInterval(async () => {
        if (!recordingRef.current) return;
        if (!mountedRef.current) return;
        if (statusRef.current !== 'idle') return;

        const now = Date.now();
        if (now - lastTriggerRef.current < COOLDOWN_MS) return;

        try {
          const recStatus = await recordingRef.current.getStatusAsync();
          if (!recStatus.isRecording) return;

          const db: number = (recStatus as any).metering ?? -160;

          // Update rolling baseline
          const baseline = baselineRef.current;
          if (baseline.length >= BASELINE_WINDOW) baseline.shift();
          baseline.push(db);

          // Need enough samples for a reliable baseline
          if (baseline.length < 4) return;

          const avgBaseline = baseline.reduce((a, b) => a + b, 0) / baseline.length;
          const spikeAboveBaseline = db - avgBaseline;

          if (db > MIN_ABSOLUTE_DB && spikeAboveBaseline >= SPIKE_DB) {
            consecutiveSpikesRef.current += 1;
            if (consecutiveSpikesRef.current >= MIN_CONSECUTIVE_SPIKES) {
              consecutiveSpikesRef.current = 0;
              lastTriggerRef.current = now;
              baselineRef.current = [];
              startCountdownRef.current('voice');
            }
          } else {
            consecutiveSpikesRef.current = 0;
          }
        } catch { /* ignore */ }
      }, POLL_INTERVAL_MS);
    } catch { /* Microphone unavailable or denied */ }
  };

  // Single effect — start/stop based on voiceKeyword
  // Uses a subscription to react to voiceKeyword changes without re-running the effect
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
