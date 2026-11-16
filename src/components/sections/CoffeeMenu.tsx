"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/animations/gsap";
import { revealFade, revealLines } from "@/animations/scrollAnimations";
import { formatPrice, menu, type MenuItem } from "@/data/menu";

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  return (
    <article data-card data-cursor="Taste" className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-noir-2">
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 92vw"
          placeholder="blur"
          className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/10 to-transparent opacity-80 transition-opacity duration-700 group-hover:opacity-60" />
        <span className="absolute left-5 top-5 font-mono text-[0.65rem] tracking-[0.2em] text-cream/70">
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className="absolute bottom-5 left-5 right-5 translate-y-3 text-[0.62rem] uppercase tracking-[0.3em] text-bronze-soft opacity-0 transition-all duration-700 ease-[var(--ease-luxe)] group-hover:translate-y-0 group-hover:opacity-100">
          {item.notes}
        </p>
      </div>
      <div className="relative flex items-baseline justify-between gap-6 pt-7">
        <h3 className="display text-[1.9rem] text-cream">{item.name}</h3>
        <p className="shrink-0 font-sans text-sm tracking-[0.15em] text-bronze">
          <span className="sr-only">Price: </span>
          {formatPrice(item.price)}
        </p>
      </div>
      <span
        aria-hidden
        className="mt-5 block h-px w-full origin-left scale-x-[0.18] bg-line transition-[scale,background-color] duration-1000 ease-[var(--ease-luxe)] group-hover:scale-x-100 group-hover:bg-bronze/60"
      />
      <p className="mt-5 max-w-sm text-[0.92rem] leading-relaxed text-taupe">{item.description}</p>
    </article>
  );
}

export default function CoffeeMenu() {
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
        // staggered cards, batched per row as they enter
        gsap.set(q("[data-card]"), { autoAlpha: 0, y: 60 });
        const batch = gsap.utils.toArray<HTMLElement>(q("[data-card]"));
        batch.forEach((card, i) => {
          gsap.to(card, {
            autoAlpha: 1,
            y: 0,
            duration: 1.3,
            ease: "expo.out",
            delay: (i % 3) * 0.12,
            scrollTrigger: { trigger: card, start: "top 90%", once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section id="menu" ref={ref} aria-labelledby="menu-title" className="relative bg-noir-2 py-28 md:py-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-14">
        <header className="mb-16 grid gap-10 md:mb-24 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p data-intro className="eyebrow mb-8">
              Signature Menu
            </p>
            <h2 id="menu-title" data-headline className="display text-[clamp(2.6rem,6.2vw,5.6rem)] text-cream">
              The art of the <em className="text-bronze-soft">perfect cup.</em>
            </h2>
          </div>
          <p data-intro className="max-w-sm text-[0.98rem] leading-[1.8] text-taupe lg:col-span-4 lg:col-start-9">
            Six signatures, pulled from a single house blend roasted every week in small batches.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-x-8 gap-y-20 sm:grid-cols-2 xl:grid-cols-3 xl:gap-x-12">
          {menu.map((item, i) => (
            <MenuCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
