"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useLazyScroll } from "@/hooks/useLazyScroll";

/** Renders nothing — just turns on the eased "lazy scroll" for this route tree. */
export default function LazyScrollEffect() {
  const reduced = useReducedMotion();
  useLazyScroll(reduced);
  return null;
}
