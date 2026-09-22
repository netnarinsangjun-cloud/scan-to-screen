"use client";

/**
 * Haptic + audio feedback for the phone scanner.
 * The AudioContext must be created/resumed inside a user gesture (iOS Safari),
 * so call `unlockAudio()` from the "START CAMERA" tap handler.
 */
let ctx: AudioContext | null = null;

type AudioContextCtor = typeof AudioContext;

export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(frequency: number, durationMs: number, startOffsetMs = 0): void {
  if (!ctx) return;
  const start = ctx.currentTime + startOffsetMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000 + 0.02);
}

export function successFeedback(): void {
  navigator.vibrate?.(80);
  tone(1760, 90);
}

export function errorFeedback(): void {
  navigator.vibrate?.([70, 60, 70]);
  tone(320, 140);
  tone(220, 180, 160);
}
