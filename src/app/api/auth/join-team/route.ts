import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signTeamToken, setTeamCookie } from "@/lib/auth";
import { logActivity, buildTeamStatus, getSessionByCode } from "@/lib/game";
import { parseMembers } from "@/lib/json";
import { withKeyLock } from "@/lib/mutex";
import { generateRejoinToken, hashRejoinToken, verifyRejoinToken } from "@/lib/rejoinToken";

// Teams are pre-created by the Game Master (see /api/admin/teams), so the
// team count always matches the physical groups at the event. Players can
// only join an existing team, never mint a new one from the app. `code` is
// required and re-validated server-side against the team's own session.
// Even though teamId alone would resolve a team, requiring the code too
// stops a client from joining a team it only reached by guessing or reusing
// an ID from a different session.
//
// `code` + `teamId` + a member's exact display name are ALL visible to
// anyone who can call the public GET /api/game/teams?code=... (every player
// can, by design — it's the join screen). So a bare name match can never be
// enough proof to reissue that member's session cookie, or anyone at the
// venue could type in a rival's name and hijack their spot. rejoinToken is
// the device-bound secret that closes that gap: see lib/rejoinToken.ts.
const schema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit session code"),
  teamId: z.string().min(1),
  memberName: z.string().trim().min(1, "Enter your name").max(40),
  teamName: z.string().trim().min(1).max(60).optional(),
  teamColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex color")
    .optional(),
  rejoinToken: z.string().min(1).max(200).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const session = await getSessionByCode(parsed.data.code);
  if (!session) {
    return NextResponse.json({ error: "No session found for that code." }, { status: 404 });
  }
  if (session.isFinished) {
    return NextResponse.json({ error: "This Glitch Out CTF has already finished." }, { status: 409 });
  }

  const team = await prisma.team.findUnique({ where: { id: parsed.data.teamId } });
  if (!team || team.sessionId !== session.id) {
    return NextResponse.json({ error: "That team doesn't exist. Ask the Game Master." }, { status: 404 });
  }

  // Two teammates can submit within milliseconds of each other (e.g. both
  // tapping "Join" right after scanning the same QR code). Without a lock,
  // both requests read the same members list before either write lands, and
  // whichever write finishes last silently erases the other's entry. Locking
  // per team serializes the read-modify-write so nobody gets dropped.
  const result = await withKeyLock(`team-members:${team.id}`, async () => {
    const fresh = await prisma.team.findUniqueOrThrow({ where: { id: team.id }, select: { members: true } });
    const members = parseMembers(fresh.members);
    const now = new Date().toISOString();
    const existing = members.find((m) => m.name.toLowerCase() === parsed.data.memberName.toLowerCase());

    let name: string;
    let rejoinToken: string | undefined;

    if (existing) {
      // Reclaiming an existing name. If this name was already proven-for
      // (has a hash on file), the caller must present the matching secret —
      // a plain name match is public knowledge, not proof of identity. Rows
      // from before this existed have no hash yet; let those through once
      // and mint one now so the name is protected from here on.
      if (existing.rejoinTokenHash) {
        const presented = parsed.data.rejoinToken;
        if (!presented || !verifyRejoinToken(presented, existing.rejoinTokenHash)) {
          return { ok: false as const };
        }
        rejoinToken = presented;
      } else {
        rejoinToken = generateRejoinToken();
        existing.rejoinTokenHash = hashRejoinToken(rejoinToken);
      }
      // Rejoining reuses the stored name's original casing and just
      // refreshes presence.
      name = existing.name;
      existing.lastSeenAt = now;
    } else {
      name = parsed.data.memberName;
      rejoinToken = generateRejoinToken();
      members.push({ name, lastSeenAt: now, rejoinTokenHash: hashRejoinToken(rejoinToken) });
    }

    const data: { members: string; name?: string; color?: string } = { members: JSON.stringify(members) };
    if (parsed.data.teamName && parsed.data.teamName !== team.name) {
      data.name = parsed.data.teamName;
    }
    if (parsed.data.teamColor && parsed.data.teamColor.toUpperCase() !== team.color) {
      data.color = parsed.data.teamColor.toUpperCase();
    }
    await prisma.team.update({ where: { id: team.id }, data });
    return { ok: true as const, name, rejoinToken };
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          "That name is already active on this team from another device. If that's you, use the same device you first joined with, or ask the Game Master to reset your spot.",
      },
      { status: 409 }
    );
  }

  await logActivity(session.id, team.id, "MEMBER_JOINED", { memberName: result.name });

  const token = signTeamToken({ teamId: team.id, teamName: team.name, sessionId: session.id, memberName: result.name });
  await setTeamCookie(token);

  const status = await buildTeamStatus(team.id);
  return NextResponse.json({ status, rejoinToken: result.rejoinToken });
}
