"use client";

import Image from "next/image";
import { useRef } from "react";
import { MapPin } from "lucide-react";
import { gsap, useGSAP, MOTION_OK } from "@/animations/gsap";
import { revealFade, revealLines } from "@/animations/scrollAnimations";
import { onAnchorClick } from "@/lib/scroll";
import cup from "../../../public/images/cta-cup.jpg";

export default function FinalCTA() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // slow cinematic push-in on the photograph while the section crosses the screen
        gsap.fromTo(
          q("[data-bg]"),
          { scale: 1.25, yPercent: -6 },
          { scale: 1, yPercent: 6, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true } },
        );
        revealLines(q("[data-headline]")[0], { start: "top 75%" });
        revealFade(q("[data-fade]"), q("[data-headline]")[0], { delay: 0.3 });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section
      id="visit-cta"
      ref={ref}
      aria-labelledby="cta-title"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-noir py-32"
    >
      <div data-bg className="absolute inset-0">
        <Image src={cup} alt="" fill sizes="100vw" placeholder="blur" className="object-cover object-[50%_60%]" />
      </div>
      {/* cinematic grade: heavy vignette + warm low-key wash */}
      <div className="absolute inset-0 bg-noir/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,transparent_0%,rgba(16,14,12,0.55)_50%,#100e0c_100%)]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-noir to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-noir to-transparent" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p data-fade className="eyebrow mb-10 justify-center">
          Visit NOIRÉ
        </p>
        <h2 id="cta-title" data-headline className="display text-[clamp(2.8rem,7.5vw,6.8rem)] text-cream">
          Your next favourite cup <em className="text-bronze-soft">awaits.</em>
        </h2>
        <p data-fade className="mx-auto mt-8 max-w-md text-base leading-relaxed text-cream/75 md:text-lg">
          Come discover the NOIRÉ experience.
        </p>
        <div data-fade className="mt-12">
          <a href="#visit" onClick={(e) => onAnchorClick(e)} className="btn-luxe bg-noir/30 backdrop-blur-sm" data-magnetic="0.35">
            <MapPin size={15} strokeWidth={1.5} aria-hidden />
            Find our café
          </a>
        </div>
      </div>
    </section>
  );
}
