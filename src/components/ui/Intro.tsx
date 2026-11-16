"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/animations/gsap";
import { markIntroDone, onSceneReady } from "@/lib/intro";
import { lockScroll } from "@/lib/scroll";

const LETTERS = ["N", "O", "I", "R", "É"];
const MAX_WAIT = 7; // seconds — never hold the visitor hostage to a slow GPU

/**
 * Opening title sequence. Letters rise, a counter runs while the 3D scene
 * compiles, then the curtain lifts to reveal the machine.
 * Server-rendered visible so there is never a flash of unstyled content.
 */
export default function Intro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const q = gsap.utils.selector(root);

      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      lockScroll(true);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const counter = { v: 0 };
      const render = () => {
        if (countRef.current) countRef.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
      };

      const finish = () => {
        lockScroll(false);
        markIntroDone();
        gsap.set(root, { display: "none" });
      };

      if (reduced) {
        let off = () => {};
        const go = () => {
          off();
          gsap.to(root, { autoAlpha: 0, duration: 0.4, onComplete: finish });
        };
        off = onSceneReady(go);
        const t = gsap.delayedCall(MAX_WAIT, go);
        return () => {
          off();
          t.kill();
          lockScroll(false);
        };
      }

      // Act I — the name assembles while the counter loads to ~84
      const enter = gsap.timeline();
      enter
        .from(q("[data-letter]"), { yPercent: 110, duration: 1.4, stagger: 0.075, ease: "expo.out" }, 0.15)
        .from(q("[data-meta]"), { autoAlpha: 0, y: 12, duration: 1, stagger: 0.08, ease: "power3.out" }, 0.5)
        .to(counter, { v: 84, duration: 2.1, ease: "power2.inOut", onUpdate: render }, 0.2)
        .fromTo(q("[data-bar]"), { scaleX: 0 }, { scaleX: 0.84, duration: 2.1, ease: "power2.inOut" }, 0.2);

      // Act II — once the scene is ready AND act I has played, complete & lift the curtain
      let lifted = false;
      const lift = () => {
        if (lifted) return;
        lifted = true;
        gsap
          .timeline({ onComplete: finish })
          .to(counter, { v: 100, duration: 0.6, ease: "power2.out", onUpdate: render })
          .to(q("[data-bar]"), { scaleX: 1, duration: 0.6, ease: "power2.out" }, "<")
          .to(q("[data-letter]"), { yPercent: -110, duration: 0.9, stagger: 0.05, ease: "expo.in" }, "+=0.15")
          .to(q("[data-meta]"), { autoAlpha: 0, duration: 0.4 }, "<")
          .to(root, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.25, ease: "expo.inOut" }, "-=0.35")
          .add(() => markIntroDone(), "-=0.7"); // hero entrance overlaps the curtain
      };

      let sceneIsReady = false;
      const tryLift = () => sceneIsReady && !enter.isActive() && lift();
      enter.eventCallback("onComplete", tryLift);
      const off = onSceneReady(() => {
        sceneIsReady = true;
        tryLift();
      });
      const safety = gsap.delayedCall(MAX_WAIT, lift);

      return () => {
        off();
        safety.kill();
        lockScroll(false);
      };
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      id="intro"
      aria-hidden
      className="fixed inset-0 z-[90] flex flex-col bg-noir px-6 py-6 text-cream sm:px-10 lg:px-14"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      <div className="flex justify-between text-[0.6rem] uppercase tracking-[0.4em] text-taupe">
        <span data-meta>Specialty Coffee House</span>
        <span data-meta className="hidden sm:inline">Est. 2026</span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <p className="display flex text-[clamp(4rem,17vw,15rem)] leading-none tracking-[0.06em]">
          {LETTERS.map((l, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.08em]">
              <span data-letter className={`inline-block ${l === "É" ? "text-bronze" : ""}`}>
                {l}
              </span>
            </span>
          ))}
        </p>
      </div>

      <div className="flex items-end justify-between gap-8">
        <p data-meta className="display max-w-[14rem] text-lg italic text-bronze-soft sm:text-xl">
          Crafted slowly. Poured perfectly.
        </p>
        <div data-meta className="flex flex-col items-end gap-3">
          <span ref={countRef} className="font-mono text-[0.7rem] tracking-[0.3em] text-cream">
            000
          </span>
          <span className="relative block h-px w-32 bg-line sm:w-48">
            <span data-bar className="absolute inset-0 origin-left bg-bronze" style={{ transform: "scaleX(0)" }} />
          </span>
        </div>
      </div>
    </div>
  );
}
