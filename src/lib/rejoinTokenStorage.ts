"use client";

// This device's proof that it's the same one that originally joined as a
// given (team, name) pair, so /api/auth/join-team can let it reclaim that
// spot after e.g. the cookie gets cleared. Only ever set from a successful
// join-team response — never guessable, never shown in the UI. See
// lib/rejoinToken.ts for the server side this pairs with.

const STORAGE_KEY = "glitchout:rejoin-identity";

interface StoredIdentity {
  teamId: string;
  name: string;
  token: string;
}

function read(): StoredIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.teamId === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.token === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** The rejoin token to present, only if it was minted for this exact team + name. */
export function getRejoinToken(teamId: string, name: string): string | undefined {
  const stored = read();
  if (!stored) return undefined;
  if (stored.teamId !== teamId || stored.name.toLowerCase() !== name.toLowerCase()) return undefined;
  return stored.token;
}

export function setRejoinIdentity(teamId: string, name: string, token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ teamId, name, token }));
  } catch {
    // localStorage unavailable (private browsing, etc.) — this device just
    // won't be able to silently reclaim the name if it loses its cookie.
  }
}

/** Keeps the stored identity's name in sync after a member renames themselves. */
export function renameRejoinIdentity(newName: string): void {
  const stored = read();
  if (!stored) return;
  setRejoinIdentity(stored.teamId, newName, stored.token);
}
