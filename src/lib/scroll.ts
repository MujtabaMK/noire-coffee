"use client";

import { ScrollSmoother } from "@/animations/gsap";

const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Smoothly scroll to an in-page section. Uses ScrollSmoother when active, native scrolling otherwise. */
export function scrollToHash(hash: string) {
  if (typeof window === "undefined") return;
  const toTop = hash === "#home" || hash === "#top" || hash === "#";
  const el = toTop ? null : document.querySelector<HTMLElement>(hash);
  if (!toTop && !el) return;

  const smoother = ScrollSmoother.get();
  if (smoother) {
    smoother.scrollTo(toTop ? 0 : el, !prefersReduced(), "top top");
  } else {
    const top = toTop ? 0 : el!.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: prefersReduced() ? "auto" : "smooth" });
  }
  history.replaceState(null, "", toTop ? " " : hash);
}

/** onClick handler for anchor links: smooth-scrolls instead of jumping. */
export function onAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, after?: () => void) {
  const href = e.currentTarget.getAttribute("href");
  if (!href || !href.startsWith("#")) return;
  e.preventDefault();
  after?.();
  scrollToHash(href);
}

/** Freeze / release page scrolling (menu overlay, intro). */
export function lockScroll(lock: boolean) {
  ScrollSmoother.get()?.paused(lock);
  document.documentElement.style.overflow = lock ? "hidden" : "";
}
