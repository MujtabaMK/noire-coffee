"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/animations/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Bespoke cursor (desktop only): a precise dot plus a lagging ring.
 *  - over links / buttons the ring swells
 *  - over [data-cursor="Label"] it becomes a bronze disc carrying the label
 *  - [data-magnetic] elements lean towards the pointer
 */
export default function Cursor() {
  const fine = useMediaQuery("(pointer: fine)");
  const reduced = useReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const dot = dotRef.current;
      const ring = ringRef.current;
      const label = labelRef.current;
      if (!fine || reduced || !dot || !ring || !label) return;

      const html = document.documentElement;
      html.classList.add("has-cursor");
      gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

      const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
      const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
      const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
      const ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });

      let mode: "idle" | "link" | "label" = "idle";
      let magnet: HTMLElement | null = null;
      let visible = false;

      const setMode = (next: typeof mode, text = "") => {
        if (next === mode && label.textContent === text) return;
        mode = next;
        label.textContent = text;
        const size = next === "label" ? 96 : next === "link" ? 70 : 40;
        gsap.to(ring, {
          width: size,
          height: size,
          backgroundColor: next === "label" ? "rgba(184,138,90,0.95)" : "rgba(184,138,90,0)",
          borderColor: next === "idle" ? "rgba(244,235,221,0.45)" : "rgba(184,138,90,0.9)",
          duration: 0.5,
          ease: "expo.out",
        });
        gsap.to(label, { autoAlpha: next === "label" ? 1 : 0, duration: 0.3 });
        gsap.to(dot, { scale: next === "idle" ? 1 : 0, duration: 0.3 });
      };

      const releaseMagnet = () => {
        if (!magnet) return;
        gsap.to(magnet, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
        magnet = null;
      };

      let lastX = -1;
      let lastY = -1;
      const updateHover = (target: Element | null, x: number, y: number) => {
        const hit = target?.closest<HTMLElement>("a, button, [data-cursor]");
        if (hit?.dataset.cursor) setMode("label", hit.dataset.cursor);
        else if (hit) setMode("link");
        else setMode("idle");

        const m = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
        if (m !== magnet) releaseMagnet();
        if (m) {
          magnet = m;
          const r = m.getBoundingClientRect();
          const strength = Number(m.dataset.magnetic) || 0.3;
          gsap.to(m, {
            x: (x - (r.left + r.width / 2)) * strength,
            y: (y - (r.top + r.height / 2)) * strength,
            duration: 0.6,
            ease: "power3.out",
          });
        }
      };

      // content moves under a still pointer while scrolling — re-check what's beneath it
      let scrollRaf = 0;
      const onScroll = () => {
        if (!visible || scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = 0;
          updateHover(document.elementFromPoint(lastX, lastY), lastX, lastY);
        });
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        lastX = e.clientX;
        lastY = e.clientY;
        if (!visible) {
          visible = true;
          gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
          gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
        }
        dx(e.clientX);
        dy(e.clientY);
        rx(e.clientX);
        ry(e.clientY);
        updateHover(e.target as Element | null, e.clientX, e.clientY);
      };
      const onLeave = () => {
        visible = false;
        releaseMagnet();
        gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 });
      };
      const onDown = () => gsap.to(ring, { scale: 0.85, duration: 0.2 });
      const onUp = () => gsap.to(ring, { scale: 1, duration: 0.4, ease: "expo.out" });

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      return () => {
        html.classList.remove("has-cursor");
        releaseMagnet();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", onScroll);
        cancelAnimationFrame(scrollRaf);
        document.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
      };
    },
    { dependencies: [fine, reduced] },
  );

  if (!fine || reduced) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <div
        ref={ringRef}
        className="invisible absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-cream/45 opacity-0"
      >
        <span
          ref={labelRef}
          className="invisible text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-noir opacity-0"
        />
      </div>
      <div ref={dotRef} className="invisible absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-bronze opacity-0" />
    </div>
  );
}
