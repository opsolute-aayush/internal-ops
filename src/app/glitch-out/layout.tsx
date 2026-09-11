import type { ReactNode } from "react";
import VideoOverlay from "@/components/glitch-out/VideoOverlay";
import ClickSound from "@/components/glitch-out/ClickSound";
import LazyScrollEffect from "@/components/glitch-out/LazyScrollEffect";

// Glitch Out's own always-mounted effects (sabotage/swap video pop-ups, the
// nav click blip, the eased "lazy" page scroll) — scoped to this game's
// route tree instead of the root layout, so they never run on the
// mission-select home screen or on a future game that doesn't want them.
// A new game gets the same pattern: its own app/<game>/layout.tsx for
// whatever global effects IT needs.
export default function GlitchOutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <VideoOverlay />
      <ClickSound />
      <LazyScrollEffect />
    </>
  );
}
