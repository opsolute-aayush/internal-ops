import crypto from "crypto";

// Proof that a device is the same one that originally claimed a given
// member name on a team, so /api/auth/join-team can tell "the real player's
// phone died, let them back in" apart from "a stranger read this name off
// the public team list and typed it in to steal the session." The raw
// token is handed to the client once (stored in localStorage, never
// logged) and only its hash lives in the DB, same shape as a password reset
// token.

export function generateRejoinToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function hashRejoinToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyRejoinToken(token: string, hash: string): boolean {
  const candidate = Buffer.from(hashRejoinToken(token), "hex");
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}
