"use client";

// Every effect here is synthesized with the Web Audio API rather than played from an audio file -
// no assets to host/license, and these are short enough (under 400ms) that synthesis is cheap and
// instant. Browsers require a user gesture before audio can play, which is naturally satisfied
// since every call site here is triggered directly from a tap/click handler.

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  if (sharedContext.state === "suspended") sharedContext.resume().catch(() => {});
  return sharedContext;
}

function tone(ctx: AudioContext, freq: number, startOffset: number, duration: number, peakGain: number, type: OscillatorType) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const startTime = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/** A soft, short tick for a normal card flip. */
export function playFlipSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  tone(ctx, 420, 0, 0.08, 0.08, "triangle");
  tone(ctx, 280, 0.03, 0.09, 0.06, "triangle");
}

/** A brighter ascending sparkle chime for a rare pull (non-Standard special form, or SIR art type). */
export function playRareChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  tone(ctx, 660, 0, 0.18, 0.12, "sine");
  tone(ctx, 880, 0.08, 0.2, 0.12, "sine");
  tone(ctx, 1320, 0.16, 0.28, 0.14, "sine");
}

/** A light double-click for a reroll. */
export function playRerollSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  tone(ctx, 340, 0, 0.05, 0.07, "square");
  tone(ctx, 480, 0.05, 0.06, 0.07, "square");
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration can throw in some embedded/iframe contexts - never worth surfacing to the player.
  }
}
