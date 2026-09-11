"use client";

import { useEffect } from "react";

// If the wheel happened over something with its own scrollable overflow
// (an activity feed, a log panel, a long dropdown — the admin dashboard has
// several), that element handles the wheel itself and we back off entirely
// instead of preventDefault()-ing it into always scrolling the page. Without
// this, hovering one of those lists would either fight the page scroll or
// make the inner list impossible to scroll at all.
function findScrollableAncestor(el: Element | null): Element | null {
  while (el && el !== document.body && el !== document.documentElement) {
    const style = getComputedStyle(el);
    if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return null;
}

// "Lazy scroll": the page never jumps straight to where the wheel/trackpad
// says to go. Every wheel tick nudges a target position, and the actual
// scroll position eases toward it a little every frame — same idea in
// either direction (down/up), and folds in trackpad deltaX too so a
// diagonal swipe doesn't feel dead. Native touch-scrolling on mobile is
// left alone (already inertial); this only intercepts wheel input. Shared
// by the mission-select home screen and Glitch Out's own pages (see
// app/glitch-out/layout.tsx) — a future game's layout can opt in too.
export function useLazyScroll(reduced: boolean) {
  useEffect(() => {
    if (reduced) return;
    // How much of the remaining distance to close per frame. Higher =
    // snappier/less "laggy", lower = heavier/slower. This is deliberately
    // on the snappier end — a lazy scroll should still feel controlled,
    // not delayed.
    const EASE = 0.16;
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    let current = window.scrollY;
    let target = window.scrollY;
    let raf = 0;

    function step() {
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        window.scrollTo(0, current);
        raf = 0;
        return;
      }
      window.scrollTo(0, current);
      raf = requestAnimationFrame(step);
    }

    function onWheel(e: WheelEvent) {
      if (findScrollableAncestor(e.target as Element | null)) return;
      e.preventDefault();
      target = Math.max(0, Math.min(target + e.deltaY + e.deltaX, maxScroll()));
      if (!raf) raf = requestAnimationFrame(step);
    }

    function onResize() {
      target = Math.min(target, maxScroll());
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);
}
