"use client";

/**
 * The app's sound: looping menu music, and a click on every button.
 *
 * Deliberately a module singleton rather than React state. Audio elements have to
 * outlive the components that trigger them - the music keeps playing across a route
 * change that unmounts every screen on the page - and a click sound must never wait
 * on a render to be heard. Components only ever call into this; the one thing that
 * flows back out is the mute flag, via `subscribe`.
 */

const MUSIC_SRC = "/audio/menu-music.mp3";
const CLICK_SRC = "/audio/click.mp3";

const MUSIC_VOLUME = 0.32;
const CLICK_VOLUME = 0.45;
const FADE_OUT_MS = 700;
const FADE_IN_MS = 400;
/** Enough that a fast run of taps overlaps instead of cutting itself off. */
const SFX_VOICES = 4;

const MUTE_KEY = "pokegen:muted";

let music: HTMLAudioElement | null = null;
let voices: HTMLAudioElement[] = [];
let voiceIndex = 0;
let fadeFrame: number | null = null;
/** Whether the screen we're on wants music - kept so a deferred autoplay unlock
 *  doesn't start the music after the user has already walked into a game. */
let wantsMusic = false;
let unlockArmed = false;
let muted = false;
let hydrated = false;

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function ensureElements() {
  if (typeof window === "undefined") return;
  if (!hydrated) {
    hydrated = true;
    muted = window.localStorage.getItem(MUTE_KEY) === "1";
  }
  if (!music) {
    music = new Audio(MUSIC_SRC);
    music.loop = true;
    music.preload = "auto";
    music.volume = MUSIC_VOLUME;
    music.muted = muted;
  }
  if (voices.length === 0) {
    voices = Array.from({ length: SFX_VOICES }, () => {
      const a = new Audio(CLICK_SRC);
      a.preload = "auto";
      a.volume = CLICK_VOLUME;
      return a;
    });
  }
}

function cancelFade() {
  if (fadeFrame !== null) {
    cancelAnimationFrame(fadeFrame);
    fadeFrame = null;
  }
}

function fadeTo(target: number, ms: number, onDone?: () => void) {
  const el = music;
  if (!el) return;
  cancelFade();
  const from = el.volume;
  if (from === target) {
    onDone?.();
    return;
  }
  const start = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - start) / ms);
    el.volume = Math.min(1, Math.max(0, from + (target - from) * k));
    if (k < 1) {
      fadeFrame = requestAnimationFrame(step);
    } else {
      fadeFrame = null;
      onDone?.();
    }
  };
  fadeFrame = requestAnimationFrame(step);
}

/**
 * Browsers refuse to start audio until the user has interacted with the page, so a
 * first visit's `play()` is rejected - there is no way around that and no point
 * treating it as an error. Instead we wait for the first real interaction and start
 * then, which is also the first button click, so the music comes in with its sound.
 */
function armUnlock() {
  if (unlockArmed || typeof window === "undefined") return;
  unlockArmed = true;
  const unlock = () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    unlockArmed = false;
    if (wantsMusic) startMusic(false);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function startMusic(restart: boolean) {
  ensureElements();
  const el = music;
  if (!el) return;
  if (restart) el.currentTime = 0;
  // Fading in from wherever the volume currently sits means an interrupted fade-out
  // (leave a game, come straight back) picks up smoothly instead of clipping.
  if (el.paused) el.volume = 0;
  el.play().then(
    () => fadeTo(MUSIC_VOLUME, FADE_IN_MS),
    () => armUnlock()
  );
}

/**
 * Tells the audio layer whether the current screen is a menu.
 *
 * `restart` replays from the top - the home screen asks for that, so arriving at it
 * always opens on the theme's first bar, while moving between other menu screens
 * just lets the loop keep running.
 */
export function setMenuMusic(on: boolean, restart = false) {
  wantsMusic = on;
  if (typeof window === "undefined") return;
  ensureElements();
  const el = music;
  if (!el) return;

  if (on) {
    if (el.paused || restart) startMusic(restart);
    else fadeTo(MUSIC_VOLUME, FADE_IN_MS);
    return;
  }

  if (!el.paused) {
    fadeTo(0, FADE_OUT_MS, () => {
      // Guard against a fast bounce back into a menu mid-fade: `wantsMusic` may have
      // flipped back to true while this ramp was still running, and pausing then
      // would kill music the new screen has already asked to keep.
      if (!wantsMusic && music) music.pause();
    });
  }
}

/** The UI click. No-ops while muted, and silently ignores a blocked `play()`. */
export function playClick() {
  if (typeof window === "undefined" || muted) return;
  ensureElements();
  if (voices.length === 0) return;
  const voice = voices[voiceIndex];
  voiceIndex = (voiceIndex + 1) % voices.length;
  voice.currentTime = 0;
  voice.play().catch(() => {});
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMuted(): boolean {
  ensureElements();
  muted = !muted;
  if (music) music.muted = muted;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  }
  emit();
  return muted;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Server snapshot for `useSyncExternalStore` - nothing is muted before hydration. */
export function getServerMuted(): boolean {
  return false;
}
