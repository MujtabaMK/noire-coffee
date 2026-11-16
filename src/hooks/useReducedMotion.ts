"use client";

import { useMediaQuery } from "./useMediaQuery";

/** True when the visitor has asked the OS to minimise motion. SSR-safe (false on the server). */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
