"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, MOTION_OK, REDUCED } from "@/animations/gsap";
import { coffeeState, getMachineState, getShotSeconds, range, smooth } from "@/animations/coffeeTimeline";
import { onAnchorClick } from "@/lib/scroll";
import { onIntroDone } from "@/lib/intro";
import CoffeeExperience from "./CoffeeExperience";

const CAPTIONS = [
  {
    key: "activation",
    index: "02",
    title: "Ninety-three degrees.",
    body: "The boiler settles, the pressure builds to nine bars. Anticipation is part of the ritual.",
    in: 0.165,
    out: 0.33,
  },
  {
    key: "pour",
    index: "03",
    title: "The extraction.",
    body: "Twenty-seven seconds of liquid patience — a slow, honeyed stream, the purest expression of the bean.",
    in: 0.385,
    out: 0.615,
  },
  {
    key: "crema",
    index: "04",
    title: "The crema.",
    body: "A veil of gold settles on the surface — the quiet signature of a perfect shot.",
    in: 0.665,
    out: 0.795,
  },
] as const;

const RAIL = ["Prelude", "Awakening", "Extraction", "Crema", "Reveal"] as const;
const RAIL_STOPS = [0, 0.15, 0.35, 0.65, 0.8, 1];

/**
 * Pinned full-screen hero. Owns the ONE ScrollTrigger that drives the entire
 * coffee story: it scrubs `coffeeState.progress` (read by every 3D component)
 * and, on the same timeline, the DOM overlay — captions, HUD, rail, reveal.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const tempRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const mm = gsap.matchMedia();

      mm.add({ motion: MOTION_OK, reduced: REDUCED, mobile: "(max-width: 767px)" }, (ctx) => {
        const { motion, mobile } = ctx.conditions as { motion: boolean; reduced: boolean; mobile: boolean };

        if (!motion) {
          // Reduced motion: a single, still, finished-cup composition. No pinning, no scrub.
          coffeeState.progress = 0.8;
          return;
        }

        coffeeState.progress = 0;

        // Entrance — held until the intro curtain lifts
        const entrance = gsap
          .timeline({ paused: true })
          .from(q("[data-hero-in]"), { yPercent: 40, y: 30, autoAlpha: 0, duration: 1.6, stagger: 0.09, ease: "expo.out" })
          .from(q("[data-hero-cue]"), { autoAlpha: 0, duration: 1.2 }, 0.9);
        const offIntro = onIntroDone(() => entrance.play());

        let lastTemp = "";
        let lastBar = "";
        let lastTime = "";
        const updateHud = () => {
          const p = coffeeState.progress;
          const temp = (20 + 73 * smooth(range(p, 0.15, 0.3))).toFixed(1);
          const bar = Math.max(0, getMachineState(p).pressure).toFixed(1);
          const secs = String(getShotSeconds(p)).padStart(2, "0");
          if (temp !== lastTemp && tempRef.current) tempRef.current.textContent = (lastTemp = temp);
          if (bar !== lastBar && barRef.current) barRef.current.textContent = (lastBar = bar);
          if (secs !== lastTime && timeRef.current) timeRef.current.textContent = `00:${(lastTime = secs)}`;
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * (mobile ? 3.4 : 4.4))}`,
            pin: true,
            scrub: 1.1, // eased catch-up: smooth, never jumps, pauses when scrolling stops
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // 1. The master progress value for the whole 3D scene
        tl.to(coffeeState, { progress: 1, duration: 1, onUpdate: updateHud }, 0);

        // 2. Stage 1 — hero copy & scroll cue leave
        tl.to(q("[data-hero-cue]"), { autoAlpha: 0, duration: 0.03 }, 0.01);
        tl.to(q("[data-hero-copy]"), { autoAlpha: 0, y: -50, duration: 0.09, ease: "power2.in" }, 0.035);

        // 3. Stages 2–4 — captions
        CAPTIONS.forEach((c) => {
          const el = q(`[data-caption="${c.key}"]`);
          tl.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.035, ease: "power2.out" }, c.in);
          tl.to(el, { autoAlpha: 0, y: -40, duration: 0.03, ease: "power2.in" }, c.out - 0.03);
        });

        // HUD (temperature / pressure / shot timer)
        tl.fromTo(q("[data-hud]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.16);
        tl.to(q("[data-hud]"), { autoAlpha: 0, duration: 0.03 }, 0.79);

        // Progress rail
        tl.fromTo(q("[data-rail-fill]"), { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
        RAIL.forEach((_, i) => {
          const el = q(`[data-rail-item="${i}"]`);
          if (i > 0) tl.to(el, { opacity: 1, duration: 0.02 }, RAIL_STOPS[i]);
          if (i < RAIL.length - 1) tl.to(el, { opacity: 0.35, duration: 0.02 }, RAIL_STOPS[i + 1]);
        });

        // 5. Final reveal
        tl.fromTo(q("[data-reveal-shade]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.82);
        tl.fromTo(
          q("[data-reveal-logo]"),
          { autoAlpha: 0, letterSpacing: "0.75em", y: 20 },
          { autoAlpha: 1, letterSpacing: "0.32em", y: 0, duration: 0.09, ease: "power2.out" },
          0.84,
        );
        tl.fromTo(q("[data-reveal-line]"), { scaleX: 0 }, { scaleX: 1, duration: 0.06, ease: "power2.out" }, 0.88);
        tl.fromTo(q("[data-reveal-tag]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power2.out" }, 0.895);

        // Hand-off: dissolve into the next section
        tl.fromTo(q("[data-handoff]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.95);

        updateHud();
        return () => offIntro();
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-label="NOIRÉ — an espresso being poured"
      className="relative h-svh min-h-[560px] w-full overflow-hidden bg-noir"
    >
      <CoffeeExperience />

      {/* cinematic vignette & top shade for the nav */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(16,14,12,0.75)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-noir/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-noir/85 via-noir/40 to-transparent md:hidden" />
      {/* left-side shade keeps the hero copy & captions legible over the scene */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] bg-gradient-to-r from-noir/75 via-noir/30 to-transparent md:block" />

      {/* ── Stage 1 · Hero copy ── */}
      <div
        data-hero-copy
        className="absolute inset-x-0 bottom-0 px-6 pb-20 sm:px-10 md:inset-y-0 md:right-auto md:flex md:w-[52%] md:items-center md:pb-0 md:pl-14 lg:pl-20 xl:pl-28"
      >
        <div className="max-w-xl">
          <p data-hero-in className="eyebrow mb-6 md:mb-8">
            Est. 2026
          </p>
          <h1 data-hero-in className="display text-[clamp(3.6rem,13vw,10.5rem)] leading-[0.9] tracking-[0.04em] text-cream">
            NOIRÉ
          </h1>
          <p data-hero-in className="mt-3 text-[0.66rem] font-medium uppercase tracking-[0.55em] text-taupe md:mt-5 md:text-xs">
            Specialty Coffee House
          </p>
          <p data-hero-in className="display mt-7 text-[clamp(1.9rem,4.2vw,3.4rem)] italic text-bronze-soft md:mt-12">
            Beyond the ordinary.
          </p>
          <p data-hero-in className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-taupe md:mt-5 md:text-base">
            An extraordinary coffee experience, crafted one cup at a time.
          </p>
          <div data-hero-in className="mt-8 md:mt-10">
            <a href="#menu" onClick={(e) => onAnchorClick(e)} className="btn-luxe" data-magnetic="0.35">
              Explore our coffee
              <ArrowRight size={15} strokeWidth={1.5} aria-hidden />
            </a>
          </div>
        </div>
      </div>

      {/* scroll cue */}
      <div
        data-hero-cue
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
        aria-hidden
      >
        <span className="text-[0.6rem] uppercase tracking-[0.45em] text-taupe">Scroll to brew</span>
        <span className="relative block h-12 w-px overflow-hidden bg-line">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_cubic-bezier(0.22,1,0.36,1)_infinite] bg-bronze" />
        </span>
      </div>

      {/* ── Stages 2–4 · captions ── */}
      {CAPTIONS.map((c) => (
        <div
          key={c.key}
          data-caption={c.key}
          className="invisible pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-16 opacity-0 sm:px-10 md:bottom-20 md:left-14 md:right-auto md:max-w-md md:p-0 lg:left-20 xl:left-28"
        >
          <p className="eyebrow mb-4">
            {c.index} <span className="text-taupe">/ 05</span>
          </p>
          <h2 className="display text-[clamp(2rem,4vw,3.25rem)] text-cream">{c.title}</h2>
          <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-taupe">{c.body}</p>
        </div>
      ))}

      {/* ── HUD ── */}
      <dl
        data-hud
        className="invisible pointer-events-none absolute left-6 top-24 flex gap-6 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-taupe opacity-0 sm:left-10 md:left-auto md:right-24 md:top-28 md:flex-col md:items-end md:gap-4 lg:right-28"
      >
        <div className="flex flex-col gap-1 md:items-end">
          <dt className="text-bronze/80">Temp</dt>
          <dd className="text-cream">
            <span ref={tempRef}>20.0</span>°C
          </dd>
        </div>
        <div className="flex flex-col gap-1 md:items-end">
          <dt className="text-bronze/80">Pressure</dt>
          <dd className="text-cream">
            <span ref={barRef}>0.0</span> bar
          </dd>
        </div>
        <div className="flex flex-col gap-1 md:items-end">
          <dt className="text-bronze/80">Shot</dt>
          <dd className="text-cream">
            <span ref={timeRef}>00:00</span>
          </dd>
        </div>
      </dl>

      {/* ── progress rail ── */}
      <nav
        aria-hidden
        className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 items-stretch gap-4 lg:right-10 md:flex"
      >
        <ol className="flex flex-col justify-between py-1 text-right text-[0.58rem] uppercase tracking-[0.35em] text-cream">
          {RAIL.map((label, i) => (
            <li key={label} data-rail-item={i} className={i === 0 ? "opacity-100" : "opacity-35"}>
              {label}
            </li>
          ))}
        </ol>
        <span className="relative block h-64 w-px bg-line">
          <span data-rail-fill className="absolute inset-0 origin-top bg-bronze" style={{ transform: "scaleY(0)" }} />
        </span>
      </nav>

      {/* ── Stage 5 · reveal ── */}
      <div
        data-reveal-shade
        className="invisible pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-noir/95 via-noir/70 to-transparent opacity-0"
      />
      <div className="pointer-events-none absolute inset-x-0 top-[12%] flex flex-col items-center px-6 text-center [text-shadow:0_2px_30px_rgba(16,14,12,0.9)] md:top-[9%]">
        <p data-reveal-logo className="display invisible text-[clamp(2.6rem,8vw,6rem)] tracking-[0.32em] text-cream opacity-0">
          NOIRÉ
        </p>
        <span data-reveal-line className="mt-4 block h-px w-24 origin-center bg-bronze" style={{ transform: "scaleX(0)" }} />
        <div data-reveal-tag className="invisible opacity-0">
          <p className="display mt-6 text-[clamp(1.4rem,3vw,2.2rem)] italic text-bronze-soft">Every drop has a story.</p>
          <p className="mt-3 text-[0.56rem] uppercase tracking-[0.3em] text-taupe sm:text-[0.62rem] sm:tracking-[0.45em]">Crafted slowly. Poured perfectly.</p>
        </div>
      </div>

      {/* hand-off gradient into the next section */}
      <div data-handoff className="invisible pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-noir to-transparent opacity-0" />
    </section>
  );
}
