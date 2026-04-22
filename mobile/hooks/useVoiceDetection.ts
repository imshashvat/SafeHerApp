/**
 * useVoiceDetection — Spike-above-baseline detection
 *
 * Problem with fixed threshold:
 *   - Android mic AGC boosts ambient noise to -30 dBFS → false triggers in quiet rooms
 *   - "hello" at conversational volume may be at -25 to -20 dBFS
 *
 * Solution — Rolling baseline + spike detection:
 *   - Keep a rolling average of the last N amplitude readings (ambient baseline)
 *   - Only trigger when current reading is SPIKE_DB above that baseline
 *   - Also require minimum absolute level (-35 dBFS) to filter off-mic noise
 *
 * This means: if a quiet room sits at -45 dBFS, a shout at -15 dBFS
 * is 30 dB above baseline → triggers. Normal breathing at -40 dBFS
 * is only 5 dB above baseline → ignored.
 */

import { useEffect, useRef, useCallback } from 'react';
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

// Cooldown after trigger (ms) — prevent rapid re-triggering
const COOLDOWN_MS = 8000;

// Minimum number of consecutive spikes to confirm trigger (debounce)
const MIN_CONSECUTIVE_SPIKES = 2;

export function useVoiceDetection() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baselineRef = useRef<number[]>([]);     // rolling baseline ring buffer
  const lastTriggerRef = useRef<number>(0);
  const consecutiveSpikesRef = useRef<number>(0);
  const { startCountdown, status } = useSOSStore();
  const { voiceKeyword } = useSettingsStore();

  const stop = useCallback(async () => {
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
  }, []);

  const start = useCallback(async () => {
    if (!voiceKeyword) return;
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
        if (status !== 'idle') return;

        const now = Date.now();
        if (now - lastTriggerRef.current < COOLDOWN_MS) return;

        try {
          const recStatus = await recordingRef.current.getStatusAsync();
          if (!recStatus.isRecording) return;

          const db: number = (recStatus as any).metering ?? -160;

          // Update rolling baseline with this sample
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
              // Confirmed sudden loud sound — trigger SOS
              consecutiveSpikesRef.current = 0;
              lastTriggerRef.current = now;
              // Reset baseline so next detection starts fresh
              baselineRef.current = [];
              startCountdown('voice');
            }
          } else {
            // Not a spike — reset consecutive counter
            consecutiveSpikesRef.current = 0;
          }
        } catch { /* ignore */ }
      }, POLL_INTERVAL_MS);
    } catch { /* Microphone unavailable or denied */ }
  }, [voiceKeyword, status, startCountdown]);

  useEffect(() => {
    if (voiceKeyword) {
      start();
    } else {
      stop();
    }
    return () => { stop(); };
  }, [voiceKeyword, start, stop]);
}
