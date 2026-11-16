"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { coffeeState } from "@/animations/coffeeTimeline";
import espresso from "../../../public/images/menu-espresso.jpg";

/**
 * Shown when WebGL is unavailable. A cinematic top-down espresso shot that
 * slowly pushes in as the visitor scrolls (driven by the same shared progress
 * as the 3D scene), with soft CSS steam drifting over it.
 */
export default function FallbackExperience() {
  const mediaRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = mediaRef.current;
    if (!el) return;
    const setScale = gsap.quickSetter(el, "scale");
    const setRot = gsap.quickSetter(el, "rotate", "deg");
    const tick = () => {
      const p = coffeeState.progress;
      setScale(1.05 + p * 0.45);
      setRot(p * 18);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={mediaRef} className="absolute inset-0 will-change-transform">
        <Image src={espresso} alt="" fill priority sizes="100vw" className="object-cover opacity-70" placeholder="blur" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#100e0ccc_55%,#100e0c_85%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="steam-wisp absolute block h-28 w-16 rounded-full bg-cream/25"
            style={{ left: `${(i - 1.5) * 26}px`, animationDelay: `${i * 1.3}s` }}
          />
        ))}
      </div>
    </div>
  );
}
