"use client";

import { createContext, useContext } from "react";

export interface SceneQuality {
  /** "high" for desktops/laptops, "low" for phones & small tablets. */
  tier: "high" | "low";
  /** Radial segments for lathe / cylinder geometry. */
  segments: number;
  /** Steam particle count. */
  particles: number;
  /** fbm octaves in shaders. */
  octaves: number;
  /** Disable all time-based motion (prefers-reduced-motion). */
  reducedMotion: boolean;
}

export const HIGH_QUALITY: SceneQuality = {
  tier: "high",
  segments: 96,
  particles: 90,
  octaves: 4,
  reducedMotion: false,
};

export const LOW_QUALITY: SceneQuality = {
  tier: "low",
  segments: 44,
  particles: 40,
  octaves: 3,
  reducedMotion: false,
};

export const QualityContext = createContext<SceneQuality>(HIGH_QUALITY);
export const useQuality = () => useContext(QualityContext);
