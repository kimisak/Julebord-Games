'use client';

import { useRef } from "react";

export function useAudioCue() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureCtx = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
    } catch (e) {
      console.error("Audio error", e);
    }
    return audioCtxRef.current;
  };

  const playSadBlip = () => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.4);
    gain.gain.value = 0.16;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc.stop(now + 0.45);
  };

  const playCountdownBeep = (frequency = 900) => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.1, now + 0.18);
    gain.gain.setValueAtTime(0.26, now);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.stop(now + 0.3);
  };

  const playFinalAlarm = () => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.9);
    gain.gain.setValueAtTime(0.28, now);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
    osc.stop(now + 1.1);
  };

  return { playSadBlip, playCountdownBeep, playFinalAlarm };
}
