"use client";

import { usePathname } from "next/navigation";
import AmbientGlitch from "@/components/glitch-out/AmbientGlitch";

// The neon/CRT ambient layer (scanlines, circuit grid, floating glitch
// debris) is the shared "cyberpunk terminal" identity every game page uses.
// The mission-select home screen ("/") deliberately breaks from that look
// (see app/page.tsx + mission-board.module.css), and can't just paint over
// it — .scanlines sits at z-index 30, above all page content — so it opts
// out here instead.
export default function ThemeChrome() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />
      <AmbientGlitch />
    </>
  );
}
