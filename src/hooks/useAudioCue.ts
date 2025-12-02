'use client';

import { useRef } from "react";

export function useAudioCue() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSadBlip = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
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
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  return { playSadBlip };
}
