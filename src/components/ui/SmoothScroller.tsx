"use client";

import { gsap, ScrollSmoother, useGSAP } from "@/animations/gsap";

/**
 * Weighted, inertial scrolling for desktop (mouse / trackpad) — the "heavy
 * paper" feel of a luxury campaign site. Touch devices and reduced-motion keep
 * native scrolling.
 *
 * IMPORTANT: this component must be rendered BEFORE #smooth-wrapper in the
 * tree. React runs layout effects in tree order, so the smoother exists before
 * any section creates its ScrollTriggers (the pinned hero needs the smoother's
 * transform-based pinning).
 */
export default function SmoothScroller() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.2,
        smoothTouch: false,
        effects: false,
        normalizeScroll: false,
      });
      return () => smoother.kill();
    });
    return () => mm.revert();
  });
  return null;
}
