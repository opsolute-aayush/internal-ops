// The mission-select home screen's roster (see app/page.tsx). Only one game
// is actually playable today — the rest are shown as in-development/locked
// so the board doesn't look empty and reads honestly ("not built yet"),
// never as broken links. Add a new game here (with `href` and
// `status: "live"`) once it's actually ready to play.
export type GameStatus = "live" | "locked";

export interface Game {
  id: string;
  title: string;
  status: GameStatus;
  /** Where "Play now" sends you. Only set for live games. */
  href?: string;
  /** Chip row: format/duration/etc, shown on the featured carousel slide. */
  meta: string[];
  /** Longer copy for the featured carousel slide. */
  description: string;
  /** Shorter copy for its tile in the Games grid below. */
  cardDescription: string;
  /** This game's own accent color, used for its icon/pill/progress fill. */
  tileColor: string;
  /** 0-100, locked games only. */
  progress?: number;
  /** Live games only: the short "how a run starts" steps shown beside it. */
  briefing?: string[];
  /** True for the one entry whose name/details are deliberately withheld. */
  redacted?: boolean;
}

export const GAMES: Game[] = [
  {
    id: "glitch-out",
    title: "Glitch Out",
    status: "live",
    href: "/glitch-out",
    meta: ["Team hunt", "60–90 min", "3+ squads", "Adjustable difficulty"],
    description:
      "Crack a cipher, chase down word cards hidden around the venue, and out-race every other squad to the final sentence — equal parts detective work and dead sprint.",
    cardDescription: "Cipher-hunting scavenger hunt for 3+ squads. Decode, find, sprint.",
    tileColor: "#ff8a5b",
    briefing: [
      "Game Master issues a 6-digit session code",
      "Squads register and pick a call sign",
      "Decode, locate, collect — first sentence wins",
    ],
  },
  {
    id: "black-signal",
    title: "Black Signal",
    status: "locked",
    meta: ["Radio hunt", "Live jammer clock"],
    description:
      "Scan the dial for a buried transmission, decode it before static swallows the signal again, and triangulate where it's coming from.",
    cardDescription: "Radio-intercept hunt — tune, decode, beat the jammer's clock.",
    tileColor: "#35e0c9",
    progress: 62,
  },
  {
    id: "dead-drop",
    title: "Dead Drop",
    status: "locked",
    meta: ["Field exchange", "Whole venue"],
    description:
      "Carry a sealed package across the venue, swap it with the right contact, and make sure nobody's tailing the handoff.",
    cardDescription: "Venue-wide exchange hunt — swap packages, verify contacts.",
    tileColor: "#8b7cff",
    progress: 38,
  },
  {
    id: "classified",
    title: "Redacted Op",
    status: "locked",
    meta: ["??? players", "??? min"],
    description:
      "This file is sealed pending clearance. What we can say: it's unlike anything on this board so far.",
    cardDescription: "Clearance required. Surfaces closer to the next event.",
    tileColor: "#ffc24b",
    progress: 8,
    redacted: true,
  },
];
