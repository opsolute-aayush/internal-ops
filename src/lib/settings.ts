"use client";

// Per-device audio/video preferences, persisted to localStorage. sfx.ts and
// videofx.ts read this before playing anything, so changes apply immediately.

export interface GlitchOutSettings {
  sfxEnabled: boolean;
  sfxVolume: number; // 0..1 multiplier applied on top of each sound's own base volume
  videoEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number; // 0..1 multiplier for intro/outro background music
}

const STORAGE_KEY = "glitchout:settings";
const SETTINGS_EVENT = "glitchout:settings-changed";

export const DEFAULT_SETTINGS: GlitchOutSettings = Object.freeze({
  sfxEnabled: true,
  sfxVolume: 1,
  videoEnabled: true,
  musicEnabled: true,
  musicVolume: 1,
});

function readFromStorage(): GlitchOutSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Stable object reference so getSettings() can double as a
// useSyncExternalStore snapshot. Identity only changes on setSettings().
let cached: GlitchOutSettings = readFromStorage();

export function getSettings(): GlitchOutSettings {
  return cached;
}

export function setSettings(patch: Partial<GlitchOutSettings>): GlitchOutSettings {
  cached = { ...cached, ...patch };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    window.dispatchEvent(new CustomEvent<GlitchOutSettings>(SETTINGS_EVENT, { detail: cached }));
  }
  return cached;
}

export function subscribeToSettings(handler: (settings: GlitchOutSettings) => void): () => void {
  function listener(e: Event) {
    handler((e as CustomEvent<GlitchOutSettings>).detail);
  }
  window.addEventListener(SETTINGS_EVENT, listener);
  return () => window.removeEventListener(SETTINGS_EVENT, listener);
}

/** Subscribe form expected by useSyncExternalStore: no value needed, just re-read getSettings(). */
export function subscribeToSettingsStore(callback: () => void): () => void {
  window.addEventListener(SETTINGS_EVENT, callback);
  return () => window.removeEventListener(SETTINGS_EVENT, callback);
}
