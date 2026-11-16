"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "@/animations/gsap";

const ROW_A = ["Crafted slowly", "Poured perfectly", "Beyond the ordinary"];
const ROW_B = ["Single origin", "Small batch", "Est. 2026", "Specialty coffee"];

function Row({ items, outline, row }: { items: string[]; outline?: boolean; row: string }) {
  // repeated so the band never shows an edge while it travels
  const seq = [...items, ...items, ...items];
  return (
    <div data-row={row} className="flex w-max items-center gap-[0.35em] whitespace-nowrap will-change-transform">
      {seq.map((t, i) => (
        <span key={i} className="flex items-center gap-[0.35em]">
          <span
            className={
              outline
                ? "text-transparent [-webkit-text-stroke:1px_rgba(184,138,90,0.55)]"
                : "italic text-cream"
            }
          >
            {t}
          </span>
          <span className="inline-block h-[0.12em] w-[0.12em] rotate-45 bg-bronze" />
        </span>
      ))}
    </div>
  );
}

/** Oversized editorial band that drifts with the scroll and leans with its velocity. */
export default function Marquee() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const st = { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6 };
        gsap.fromTo(q('[data-row="a"]'), { xPercent: 0 }, { xPercent: -22, ease: "none", scrollTrigger: st });
        gsap.fromTo(q('[data-row="b"]'), { xPercent: -26 }, { xPercent: -4, ease: "none", scrollTrigger: { ...st } });

        const skew = gsap.quickTo(q("[data-skew]"), "skewX", { duration: 0.5, ease: "power3" });
        ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => skew(gsap.utils.clamp(-8, 8, self.getVelocity() / -260)),
          onLeave: () => skew(0),
          onLeaveBack: () => skew(0),
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-hidden className="relative overflow-hidden border-y border-line/50 bg-noir py-14 md:py-20">
      <div data-skew className="display flex flex-col gap-2 text-[clamp(3.2rem,10vw,9rem)] leading-[1.05] md:gap-4">
        <Row items={ROW_A} row="a" />
        <Row items={ROW_B} row="b" outline />
      </div>
    </section>
  );
}
