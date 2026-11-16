"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { HIGH_QUALITY, LOW_QUALITY, type SceneQuality } from "@/components/three/quality";
import { getDeviceTier, hasWebGL } from "@/lib/device";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import FallbackExperience from "./FallbackExperience";
import { markSceneReady } from "@/lib/intro";

/* The whole Three.js / R3F bundle is split out and only fetched on the client. */
const CoffeeScene = dynamic(() => import("@/components/three/CoffeeScene"), { ssr: false });

const noopSubscribe = () => () => {};

type Support = "pending" | "webgl" | "none";

export default function CoffeeExperience() {
  const reducedMotion = useReducedMotion();
  const support = useSyncExternalStore<Support>(
    noopSubscribe,
    () => (hasWebGL() ? "webgl" : "none"),
    () => "pending",
  );
  const tier = useSyncExternalStore<"high" | "low">(noopSubscribe, getDeviceTier, () => "high");

  const quality: SceneQuality = useMemo(
    () => ({ ...(tier === "high" ? HIGH_QUALITY : LOW_QUALITY), reducedMotion }),
    [tier, reducedMotion],
  );

  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);

  // Stop the render loop entirely when the hero is scrolled out of view.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // No WebGL → the photographic fallback is "ready" immediately.
  useEffect(() => {
    if (support === "none") markSceneReady();
  }, [support]);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden>
      {/* atmospheric backdrop visible while loading and behind the canvas edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,#2a2018_0%,#16120e_45%,#100e0c_75%)]" />

      {support === "webgl" && (
        <CoffeeScene
          quality={quality}
          active={active}
          onReady={() => {
            setReady(true);
            markSceneReady();
          }}
        />
      )}
      {support === "none" && <FallbackExperience />}

      {/* dissolve the canvas in once its first frame is drawn (the Intro covers the wait) */}
      <div
        className={`pointer-events-none absolute inset-0 bg-noir transition-opacity duration-[1600ms] ease-[var(--ease-luxe)] ${
          ready || support === "none" ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}
