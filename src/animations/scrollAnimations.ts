"use client";

import { gsap, ScrollTrigger, SplitText } from "./gsap";

/**
 * Reusable scroll-triggered reveals for the editorial sections.
 * Call these inside a `useGSAP` / `gsap.matchMedia` scope so every tween,
 * ScrollTrigger and SplitText instance is reverted automatically on unmount.
 */

const EASE = "expo.out";

/** Masked line-by-line headline reveal. Re-splits automatically on resize/font load. */
export function revealLines(el: Element | null, opts: { delay?: number; start?: string } = {}) {
  if (!el) return;
  return SplitText.create(el, {
    type: "lines",
    mask: "lines",
    linesClass: "split-line",
    autoSplit: true,
    onSplit(self) {
      return gsap.from(self.lines, {
        yPercent: 115,
        duration: 1.35,
        stagger: 0.1,
        delay: opts.delay ?? 0,
        ease: EASE,
        scrollTrigger: { trigger: el, start: opts.start ?? "top 85%", once: true },
      });
    },
  });
}

/** Soft rise + fade for body copy, labels, buttons. */
export function revealFade(targets: gsap.TweenTarget, trigger: Element | null, opts: { stagger?: number; y?: number; delay?: number } = {}) {
  if (!trigger) return;
  return gsap.from(targets, {
    y: opts.y ?? 28,
    autoAlpha: 0,
    duration: 1.2,
    stagger: opts.stagger ?? 0.08,
    delay: opts.delay ?? 0,
    ease: EASE,
    scrollTrigger: { trigger, start: "top 82%", once: true },
  });
}

/** Curtain-style image reveal: the frame wipes open while the photo settles from a zoom. */
export function revealImage(frame: Element | null, opts: { direction?: "up" | "left"; start?: string } = {}) {
  if (!frame) return;
  const img = frame.querySelector("img");
  const from = opts.direction === "left" ? "inset(0% 0% 0% 100%)" : "inset(100% 0% 0% 0%)";
  const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: opts.start ?? "top 85%", once: true } });
  tl.fromTo(frame, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" });
  if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 2.2, ease: EASE }, 0);
  return tl;
}

/** Scrubbed vertical parallax for an image inside an overflow-hidden frame. */
export function parallax(target: Element | null, amount = 12, trigger?: Element | null) {
  if (!target) return;
  return gsap.fromTo(
    target,
    { yPercent: -amount },
    {
      yPercent: amount,
      ease: "none",
      scrollTrigger: { trigger: trigger ?? target, start: "top bottom", end: "bottom top", scrub: true },
    },
  );
}

/** Recalculate all trigger positions (e.g. after images finish loading). */
export const refreshScroll = () => ScrollTrigger.refresh();
