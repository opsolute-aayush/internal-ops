"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Scoped to the incoming page's own content: a key-remount + .glitch-reveal,
// the exact same mechanism the admin dashboard uses when switching tabs.
// There used to also be a full-viewport "boot" overlay (black screen +
// centered loading text + scattered glitch bars) layered on top of this. It
// made every navigation feel like the whole screen was wiping out, not just
// the content glitching in, so it was removed in favor of this
// component-level effect alone.
export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // The glitch-in flicker is part of the neon game-page identity (see
  // ThemeChrome for the same split). The mission-select home screen ("/")
  // has its own, calmer look and opts out of it, same as the scanlines/grid.
  const isHome = pathname === "/";

  return (
    <div key={pathname} className={`flex min-h-full flex-1 flex-col ${isHome ? "" : "glitch-reveal"}`}>
      {children}
    </div>
  );
}
