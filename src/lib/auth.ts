import { cookies } from "next/headers";
import {
  TEAM_COOKIE,
  ADMIN_COOKIE,
  signTeamToken,
  signAdminToken,
  verifyTeamToken,
  verifyAdminToken,
  type TeamTokenPayload,
  type AdminSession,
} from "@/lib/jwt";

export { TEAM_COOKIE, ADMIN_COOKIE, signTeamToken, signAdminToken, verifyTeamToken, verifyAdminToken };

// The venue-wifi LAN deployment (see docker/docker-compose.yml) runs over
// plain http:// — there's no TLS cert for a LAN IP or a local-only domain,
// so a `Secure` cookie would just get silently dropped by every player's
// phone. They'd still show as joined server-side, but every following
// request would come back 401 and bounce them straight back to /register,
// which looks exactly like the join never worked. The VM deployment (see
// docker/docker-compose.prod.yml + docker/nginx/app.conf) DOES terminate
// real TLS though, and cookies there should be Secure — an active
// on-path/SSL-stripping attacker shouldn't be able to force the browser to
// ever hand this cookie over in cleartext. Both images set
// NODE_ENV=production, so that alone can't tell the two apart; COOKIE_SECURE
// is the explicit per-deployment switch (set to "true" only in
// docker-compose.prod.yml).
const SECURE_COOKIES = process.env.COOKIE_SECURE === "true";

export async function setTeamCookie(token: string) {
  const store = await cookies();
  store.set(TEAM_COOKIE, token, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 16,
  });
}

export async function setAdminCookie(token: string) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 16,
  });
}

export async function clearTeamCookie() {
  const store = await cookies();
  store.delete(TEAM_COOKIE);
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function getTeamFromCookies(): Promise<TeamTokenPayload | null> {
  const store = await cookies();
  const token = store.get(TEAM_COOKIE)?.value;
  if (!token) return null;
  return verifyTeamToken(token);
}

/** Returns the session the admin cookie is authenticated against, or null. */
export async function getAdminSessionFromCookies(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
