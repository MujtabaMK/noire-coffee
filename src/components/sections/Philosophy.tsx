"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/animations/gsap";
import { parallax, revealFade, revealImage, revealLines } from "@/animations/scrollAnimations";
import portafilter from "../../../public/images/philosophy-portafilter.jpg";
import beans from "../../../public/images/philosophy-beans.jpg";

const PRINCIPLES = [
  { value: "93°", label: "Extraction temperature" },
  { value: "9", label: "Bars of pressure" },
  { value: "27s", label: "To the perfect shot" },
];

export default function Philosophy() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        revealLines(q("[data-headline]")[0]);
        revealFade(q("[data-fade]"), root.querySelector("[data-copy]"));
        revealImage(q("[data-frame-main]")[0]);
        revealImage(q("[data-frame-small]")[0], { direction: "left", start: "top 90%" });
        parallax(q("[data-parallax-main]")[0], 7, q("[data-frame-main]")[0]);
        gsap.fromTo(
          q("[data-frame-small]"),
          { yPercent: 18 },
          { yPercent: -18, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true } },
        );
        gsap.from(q("[data-stat]"), {
          autoAlpha: 0,
          y: 24,
          duration: 1.1,
          stagger: 0.12,
          ease: "expo.out",
          scrollTrigger: { trigger: q("[data-stats]")[0], start: "top 88%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section
      id="philosophy"
      ref={ref}
      aria-labelledby="philosophy-title"
      className="relative overflow-hidden bg-noir py-28 md:py-40 lg:py-48"
    >
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-16 px-6 sm:px-10 lg:grid-cols-12 lg:gap-10 lg:px-14">
        {/* copy */}
        <div data-copy className="lg:col-span-6 lg:pt-16 xl:col-span-5">
          <p data-fade className="eyebrow mb-8">
            Our Philosophy
          </p>
          <h2 id="philosophy-title" data-headline className="display text-[clamp(2.6rem,6.2vw,5.6rem)] text-cream">
            Not just coffee. <em className="text-bronze-soft">An obsession.</em>
          </h2>
          <p data-fade className="mt-10 max-w-md text-base leading-[1.85] text-taupe md:text-[1.05rem]">
            Every bean has a story. Every extraction has a purpose. At NOIRÉ, we believe exceptional coffee begins with
            patience, precision, and passion.
          </p>

          <dl data-stats className="mt-14 grid max-w-md grid-cols-3 border-t border-line pt-8">
            {PRINCIPLES.map((p) => (
              <div key={p.label} data-stat className="pr-4">
                <dt className="sr-only">{p.label}</dt>
                <dd className="display text-4xl text-cream md:text-5xl">{p.value}</dd>
                <dd className="mt-3 text-[0.62rem] uppercase leading-relaxed tracking-[0.22em] text-taupe">{p.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* imagery */}
        <div className="relative lg:col-span-6 lg:col-start-7 xl:col-span-6 xl:col-start-7">
          <div data-frame-main className="relative aspect-[4/5] w-full overflow-hidden sm:ml-auto sm:w-[85%]">
            <div data-parallax-main className="absolute -inset-y-[8%] inset-x-0">
              <Image
                src={portafilter}
                alt="Freshly ground coffee in a portafilter beside roasted beans on dark wood"
                fill
                sizes="(min-width: 1024px) 45vw, 90vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-noir/50 via-transparent to-transparent" />
          </div>
          <div
            data-frame-small
            className="absolute -bottom-10 left-0 aspect-square w-[44%] overflow-hidden border-[10px] border-noir sm:w-[38%] lg:-left-6"
          >
            <Image
              src={beans}
              alt="Close-up of glossy, dark-roasted coffee beans"
              fill
              sizes="(min-width: 1024px) 20vw, 45vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
          <p className="absolute -right-2 top-1/2 hidden origin-center translate-x-1/2 rotate-90 text-[0.6rem] uppercase tracking-[0.5em] text-taupe/70 xl:block">
            Single origin · Hand selected
          </p>
        </div>
      </div>
    </section>
  );
}
