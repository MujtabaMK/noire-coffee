"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/animations/gsap";
import { revealFade, revealImage, revealLines } from "@/animations/scrollAnimations";
import sourced from "../../../public/images/craft-sourced.jpg";
import roasted from "../../../public/images/craft-roasted.jpg";
import extracted from "../../../public/images/craft-extracted.jpg";

interface Step {
  n: string;
  title: string;
  text: string;
  image: StaticImageData;
  alt: string;
}

const STEPS: Step[] = [
  {
    n: "01",
    title: "Carefully Sourced",
    text: "Exceptional coffee starts with exceptional beans.",
    image: sourced,
    alt: "A bowl of hand-selected roasted coffee beans",
  },
  {
    n: "02",
    title: "Expertly Roasted",
    text: "Precision roasting brings every flavour to life.",
    image: roasted,
    alt: "Evenly roasted coffee beans with a soft sheen",
  },
  {
    n: "03",
    title: "Perfectly Extracted",
    text: "Every cup is a balance of science and art.",
    image: extracted,
    alt: "Portafilters with ground coffee and beans beside a latte",
  },
];

export default function CoffeeCraft() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        revealLines(q("[data-headline]")[0]);
        revealFade(q("[data-intro]"), root.querySelector("header"));
        // the bronze thread draws across as you scroll through the steps
        gsap.fromTo(
          q("[data-thread]"),
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: q("[data-steps]")[0], start: "top 75%", end: "bottom 60%", scrub: 0.8 },
          },
        );
        q("[data-step]").forEach((step, i) => {
          revealImage(step.querySelector("[data-frame]"), { start: "top 88%" });
          gsap.from(step.querySelectorAll("[data-step-text]"), {
            autoAlpha: 0,
            y: 30,
            duration: 1.2,
            stagger: 0.08,
            delay: 0.25 + i * 0.05,
            ease: "expo.out",
            scrollTrigger: { trigger: step, start: "top 85%", once: true },
          });
          gsap.from(step.querySelector("[data-num]"), {
            yPercent: 60,
            autoAlpha: 0,
            duration: 1.6,
            ease: "expo.out",
            scrollTrigger: { trigger: step, start: "top 85%", once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section id="craft" ref={ref} aria-labelledby="craft-title" className="relative overflow-hidden bg-noir py-28 md:py-40">
      <div className="mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-14">
        <header className="mb-16 max-w-3xl md:mb-24">
          <p data-intro className="eyebrow mb-8">
            Coffee Craft
          </p>
          <h2 id="craft-title" data-headline className="display text-[clamp(2.6rem,6.2vw,5.6rem)] text-cream">
            From bean to <em className="text-bronze-soft">beautiful.</em>
          </h2>
        </header>

        <div data-steps className="relative">
          <span
            data-thread
            aria-hidden
            className="absolute left-0 right-0 top-0 hidden h-px origin-left bg-bronze/60 md:block"
            style={{ transform: "scaleX(0)" }}
          />
          <ol className="grid grid-cols-1 gap-20 md:grid-cols-3 md:gap-8 lg:gap-12">
            {STEPS.map((s, i) => (
              <li key={s.n} data-step className={`relative md:pt-12 ${i === 1 ? "md:mt-24" : i === 2 ? "md:mt-48" : ""}`}>
                <span aria-hidden className="absolute -top-[5px] left-0 hidden h-[9px] w-[9px] rotate-45 bg-bronze md:block" />
                <div className="overflow-hidden">
                  <p
                    data-num
                    className="display select-none text-[5.5rem] leading-none text-transparent [-webkit-text-stroke:1px_var(--color-bronze)] md:text-[7rem]"
                    aria-hidden
                  >
                    {s.n}
                  </p>
                </div>
                <div data-frame className="relative mt-6 aspect-[3/4] overflow-hidden">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 768px) 30vw, 92vw"
                    placeholder="blur"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-noir/60 to-transparent" />
                </div>
                <h3 data-step-text className="display mt-8 text-[1.9rem] text-cream">
                  <span className="sr-only">Step {s.n}: </span>
                  {s.title}
                </h3>
                <p data-step-text className="mt-3 max-w-xs text-[0.95rem] leading-relaxed text-taupe">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
