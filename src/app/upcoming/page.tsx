import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GlitchTitle from "@/components/GlitchTitle";
import TerminalPanel from "@/components/TerminalPanel";
import ReportIssueButton from "@/components/ReportIssueButton";

// Placeholder landing for a game that's been announced on the mission-select
// home screen (see data/games.ts) but doesn't have its own folder yet. Not
// linked from anywhere today — the locked cards on "/" aren't clickable —
// but reserved so a game in progress has somewhere to point `href` at
// before its real app/<game-id>/ folder exists.
export default function UpcomingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-neon-100/40 hover:text-cyan-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Games
          </Link>
        </div>

        <GlitchTitle text="IN DEVELOPMENT" className="text-3xl sm:text-4xl" />

        <TerminalPanel title="root@glitchout:~$">
          <p className="text-left text-sm leading-relaxed text-neon-100/80">
            <span className="text-neon-500">&gt;</span> operation not yet deployed
            <br />
            <span className="caret-blink text-neon-500">&gt; check back closer to the next event</span>
          </p>
        </TerminalPanel>
      </div>

      <ReportIssueButton />
    </main>
  );
}
