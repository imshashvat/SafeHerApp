/**
 * useSiren — Web Audio API siren/alarm sound
 * Generates an 880Hz oscillator tone with FM sweep (no audio file needed)
 * Spec: OscillatorNode at 880Hz
 */
import { useRef, useCallback } from 'react';

export default function useSiren() {
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const lfoRef = useRef(null);
  const playingRef = useRef(false);

  const playSiren = useCallback(() => {
    if (playingRef.current) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Main oscillator at 880Hz
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      // LFO for pitch sweep (siren wail effect)
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(2, ctx.currentTime); // 2 sweeps/sec

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(200, ctx.currentTime); // ±200Hz sweep

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Master gain
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      lfo.start();

      oscillatorRef.current = osc;
      gainRef.current = gain;
      lfoRef.current = lfo;
      playingRef.current = true;
    } catch (err) {
      console.error('Siren audio error:', err);
    }
  }, []);

  const stopSiren = useCallback(() => {
    if (!playingRef.current) return;
    try {
      oscillatorRef.current?.stop();
      lfoRef.current?.stop();
      audioCtxRef.current?.close();
    } catch {}
    oscillatorRef.current = null;
    gainRef.current = null;
    lfoRef.current = null;
    audioCtxRef.current = null;
    playingRef.current = false;
  }, []);

  // Play for a fixed duration then stop
  const playBurst = useCallback((durationMs = 3000) => {
    playSiren();
    setTimeout(stopSiren, durationMs);
  }, [playSiren, stopSiren]);

  return { playSiren, stopSiren, playBurst };
}
