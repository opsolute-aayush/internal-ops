import jwt, { type VerifyOptions } from "jsonwebtoken";

const envSecret = process.env.JWT_SECRET;
if (!envSecret) {
  throw new Error("JWT_SECRET is not set. Copy .env.example to .env and configure it.");
}
const JWT_SECRET: string = envSecret;

export const TEAM_COOKIE = "glitchout_team_session";
export const ADMIN_COOKIE = "glitchout_admin_session";

export interface TeamTokenPayload {
  teamId: string;
  teamName: string;
  sessionId: string;
  memberName: string;
}

export interface AdminSession {
  sessionId: string;
}

interface AdminTokenPayload extends AdminSession {
  role: "admin";
}

export function signTeamToken(payload: TeamTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "16h" });
}

export function signAdminToken(sessionId: string): string {
  const payload: AdminTokenPayload = { role: "admin", sessionId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "16h" });
}

// Pinning the algorithm here (rather than trusting whatever `alg` a
// presented token's header claims) rules out algorithm-confusion attacks
// against jsonwebtoken outright, instead of relying on the library's
// current defaults to keep doing the right thing.
const VERIFY_OPTIONS: VerifyOptions = { algorithms: ["HS256"] };

export function verifyTeamToken(token: string): TeamTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, VERIFY_OPTIONS);
    if (typeof decoded === "object" && decoded && "teamId" in decoded && "sessionId" in decoded) {
      return decoded as unknown as TeamTokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, VERIFY_OPTIONS);
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      (decoded as { role?: string }).role === "admin" &&
      typeof (decoded as { sessionId?: unknown }).sessionId === "string"
    ) {
      return { sessionId: (decoded as unknown as AdminTokenPayload).sessionId };
    }
    return null;
  } catch {
    return null;
  }
}
