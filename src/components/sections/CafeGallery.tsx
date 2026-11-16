"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { gsap, useGSAP, MOTION_OK } from "@/animations/gsap";
import { revealFade, revealImage, revealLines } from "@/animations/scrollAnimations";
import { cn } from "@/lib/cn";
import interior from "../../../public/images/gallery-interior.jpg";
import barista from "../../../public/images/gallery-barista.jpg";
import beans from "../../../public/images/gallery-beans.jpg";
import pour from "../../../public/images/gallery-pour.jpg";
import cups from "../../../public/images/gallery-cups.jpg";
import bar from "../../../public/images/gallery-bar.jpg";
import ambience from "../../../public/images/gallery-ambience.jpg";

interface Shot {
  src: StaticImageData;
  alt: string;
  caption: string;
  /** grid placement classes */
  layout: string;
  aspect: string;
}

const SHOTS: Shot[] = [
  {
    src: interior,
    alt: "Warm, softly lit café interior with long wooden tables",
    caption: "The Room",
    layout: "col-span-2 md:col-span-7",
    aspect: "aspect-[16/11]",
  },
  {
    src: barista,
    alt: "Barista pouring steamed milk into a cup to create latte art",
    caption: "The Barista",
    layout: "col-span-1 md:col-span-5 md:mt-24",
    aspect: "aspect-[4/5]",
  },
  {
    src: beans,
    alt: "A single latte resting on a bed of roasted beans",
    caption: "The Beans",
    layout: "col-span-1 md:col-span-4",
    aspect: "aspect-[4/5] md:aspect-square",
  },
  {
    src: pour,
    alt: "Milk being poured into a cup of espresso held in hand",
    caption: "The Pour",
    layout: "col-span-1 md:col-span-4 md:-mt-16",
    aspect: "aspect-[4/5]",
  },
  {
    src: cups,
    alt: "Four cups with latte art arranged on a round wooden board",
    caption: "The Cups",
    layout: "col-span-1 md:col-span-4 md:mt-10",
    aspect: "aspect-[4/5] md:aspect-square",
  },
  {
    src: bar,
    alt: "Espresso bar with pendant lights and coffee equipment",
    caption: "The Bar",
    layout: "col-span-2 md:col-span-5",
    aspect: "aspect-[4/3]",
  },
  {
    src: ambience,
    alt: "Café sign glowing under warm pendant lights",
    caption: "After Hours",
    layout: "col-span-2 md:col-span-7 md:mt-20",
    aspect: "aspect-[16/10]",
  },
];

export default function CafeGallery() {
  const ref = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        revealLines(q("[data-headline]")[0]);
        revealFade(q("[data-intro]"), root.querySelector("header"));
        q("[data-shot]").forEach((shot, i) => {
          revealImage(shot.querySelector("[data-frame]"), { direction: i % 2 ? "left" : "up" });
          const inner = shot.querySelector("[data-inner]");
          if (inner) {
            gsap.fromTo(
              inner,
              { yPercent: -6 },
              { yPercent: 6, ease: "none", scrollTrigger: { trigger: shot, start: "top bottom", end: "bottom top", scrub: true } },
            );
          }
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  /* ── lightbox (native <dialog>: focus-trapped, Esc to close) ── */
  const openAt = (i: number) => {
    setActive(i);
    dialogRef.current?.showModal();
  };
  const close = useCallback(() => dialogRef.current?.close(), []);
  const step = useCallback((dir: 1 | -1) => {
    setActive((a) => (a === null ? a : (a + dir + SHOTS.length) % SHOTS.length));
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => setActive(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    d.addEventListener("close", onClose);
    d.addEventListener("keydown", onKey);
    return () => {
      d.removeEventListener("close", onClose);
      d.removeEventListener("keydown", onKey);
    };
  }, [step]);

  const current = active === null ? null : SHOTS[active];

  return (
    <section id="experience" ref={ref} aria-labelledby="experience-title" className="relative bg-noir-2 py-28 md:py-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-14">
        <header className="mb-16 grid gap-10 md:mb-24 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p data-intro className="eyebrow mb-8">
              Café Experience
            </p>
            <h2 id="experience-title" data-headline className="display text-[clamp(2.6rem,6.2vw,5.6rem)] text-cream">
              Stay a little <em className="text-bronze-soft">longer.</em>
            </h2>
          </div>
          <p data-intro className="max-w-sm text-[0.98rem] leading-[1.8] text-taupe lg:col-span-4 lg:col-start-9">
            Low light, warm walnut, the hiss of the steam wand. A room designed for slow mornings and long conversations.
          </p>
        </header>

        <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-12 md:gap-8">
          {SHOTS.map((s, i) => (
            <li key={s.caption} data-shot className={cn("group relative", s.layout)}>
              <button
                type="button"
                onClick={() => openAt(i)}
                aria-label={`View larger: ${s.caption} — ${s.alt}`}
                data-cursor="View"
                className="block w-full text-left"
              >
                <div data-frame className={cn("relative overflow-hidden bg-noir", s.aspect)}>
                  <div data-inner className="absolute -inset-y-[7%] inset-x-0">
                    <Image
                      src={s.src}
                      alt={s.alt}
                      fill
                      sizes="(min-width: 768px) 55vw, 50vw"
                      placeholder="blur"
                      className="object-cover transition-[scale,filter] duration-[1600ms] ease-[var(--ease-luxe)] [filter:saturate(0.85)_brightness(0.88)] group-hover:scale-[1.05] group-hover:[filter:saturate(1)_brightness(1)]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-transparent to-transparent opacity-70" />
                  <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center border border-cream/30 text-cream opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Expand size={14} strokeWidth={1.5} aria-hidden />
                  </span>
                </div>
                <span className="mt-4 flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.35em] text-taupe">
                  <span className="font-mono text-bronze">{String(i + 1).padStart(2, "0")}</span>
                  {s.caption}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        aria-label={current ? `${current.caption} — enlarged` : "Gallery"}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-0 h-full max-h-none w-full max-w-none bg-noir/95 p-0 text-cream backdrop:bg-noir/80 backdrop:backdrop-blur-sm open:animate-[lightbox-in_0.7s_cubic-bezier(0.22,1,0.36,1)]"
      >
        {current && (
          <div className="flex h-full flex-col px-4 pb-6 pt-4 sm:px-10">
            <div className="flex items-center justify-between">
              <p className="text-[0.62rem] uppercase tracking-[0.35em] text-taupe">
                <span className="font-mono text-bronze">{String((active ?? 0) + 1).padStart(2, "0")}</span>
                <span className="mx-3 text-line">/</span>
                {current.caption}
              </p>
              <button type="button" onClick={close} aria-label="Close" className="flex h-12 w-12 items-center justify-center">
                <X size={22} strokeWidth={1.25} aria-hidden />
              </button>
            </div>
            <div className="relative my-4 flex-1">
              <Image key={active} src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" />
            </div>
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={() => step(-1)} aria-label="Previous image" className="btn-luxe !px-4 !py-3">
                <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next image" className="btn-luxe !px-4 !py-3">
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
