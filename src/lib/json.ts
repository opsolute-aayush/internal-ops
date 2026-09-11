export function parseIntArray(json: string): number[] {
  try {
    const val = JSON.parse(json);
    return Array.isArray(val) ? val.filter((v) => typeof v === "number") : [];
  } catch {
    return [];
  }
}

export interface TeamMember {
  name: string;
  lastSeenAt: string; // ISO timestamp, refreshed on every /api/team/status poll
  // sha256 of this member's device-bound rejoin secret (see lib/rejoinToken.ts).
  // Undefined for rows created before this existed, or if it somehow never
  // got set — treated as "no proof required yet" so an in-flight game isn't
  // broken, but a value here must match before /api/auth/join-team will
  // reissue a session cookie for this name instead of rejecting the claim.
  rejoinTokenHash?: string;
}

// A member counts as "active" if we've heard from their browser recently.
// Refreshed on every status poll from /play or /winner (3-5s intervals), so
// 15s tolerates a couple of missed polls without flickering.
const ACTIVE_WINDOW_MS = 15_000;

export function isMemberActive(lastSeenAt: string, now = Date.now()): boolean {
  return now - new Date(lastSeenAt).getTime() < ACTIVE_WINDOW_MS;
}

// Team.members stores this as a JSON string. Older rows may still hold a
// plain string[] (pre-presence-tracking), treated as members who joined
// but have never been seen active.
export function parseMembers(json: string): TeamMember[] {
  try {
    const val = JSON.parse(json);
    if (!Array.isArray(val)) return [];
    return val
      .map((entry): TeamMember | null => {
        if (typeof entry === "string") return { name: entry, lastSeenAt: new Date(0).toISOString() };
        if (entry && typeof entry === "object" && typeof entry.name === "string") {
          return {
            name: entry.name,
            lastSeenAt: typeof entry.lastSeenAt === "string" ? entry.lastSeenAt : new Date(0).toISOString(),
            rejoinTokenHash: typeof entry.rejoinTokenHash === "string" ? entry.rejoinTokenHash : undefined,
          };
        }
        return null;
      })
      .filter((m): m is TeamMember => m !== null);
  } catch {
    return [];
  }
}
