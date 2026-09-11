import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TEAM_COOKIE, verifyTeamToken } from "@/lib/jwt";

// UX-level route guarding only. Every API route re-validates the team/admin
// session and game state server-side. This just avoids flashing protected
// pages to a browser with no session before the client redirects.
const PROTECTED_PREFIXES = ["/glitch-out/play", "/glitch-out/final", "/glitch-out/winner"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TEAM_COOKIE)?.value;
  const team = token ? verifyTeamToken(token) : null;

  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!team) {
      return NextResponse.redirect(new URL("/glitch-out/register", request.url));
    }
  }

  if (pathname === "/glitch-out/register" && team) {
    return NextResponse.redirect(new URL("/glitch-out/play", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/glitch-out/play/:path*", "/glitch-out/final/:path*", "/glitch-out/winner/:path*", "/glitch-out/register"],
};
