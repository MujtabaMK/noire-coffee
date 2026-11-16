/** Client-side capability detection, cached after first call. */

let webglCache: boolean | null = null;

export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    webglCache = !!gl;
    // free the probe context immediately
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

let tierCache: "high" | "low" | null = null;

/** Heuristic GPU tier: phones / small tablets / low-memory devices get the light scene. */
export function getDeviceTier(): "high" | "low" {
  if (tierCache) return tierCache;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 768;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const fewCores = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
  tierCache = (coarse && small) || lowMemory || fewCores ? "low" : "high";
  return tierCache;
}

export const isTouchSmallScreen = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
