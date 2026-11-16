"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Menu as MenuIcon } from "lucide-react";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "@/animations/gsap";
import { NAV_LINKS } from "@/data/site";
import { onAnchorClick } from "@/lib/scroll";
import { onIntroDone } from "@/lib/intro";
import Logo from "@/components/ui/Logo";
import MobileMenu from "./MobileMenu";

/**
 * Transparent at the top; gains a blurred noir backdrop once you scroll.
 * Slides away while scrolling down (to keep the film uncluttered) and
 * returns the instant you scroll up. All via one ScrollTrigger — no React state per scroll.
 */
export default function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const enter = gsap.from(header, { yPercent: -100, autoAlpha: 0, duration: 1.4, delay: 0.15, ease: "expo.out", paused: true });
        return onIntroDone(() => enter.play());
      });

      const st = ScrollTrigger.create({
        start: 60,
        end: "max",
        onToggle: (self) => header.toggleAttribute("data-scrolled", self.isActive),
        onUpdate: (self) => {
          if (openRef.current) return;
          const hide = self.direction === 1 && self.scroll() > 420;
          gsap.to(header, { yPercent: hide ? -100 : 0, duration: 0.6, ease: "power3.out", overwrite: "auto" });
        },
      });
      return () => {
        st.kill();
        mm.revert();
      };
    },
    { scope: headerRef },
  );

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="group fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-700 ease-[var(--ease-luxe)] border-b border-transparent data-[scrolled]:border-line/60 data-[scrolled]:bg-noir/70 data-[scrolled]:backdrop-blur-xl"
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-18 max-w-[1600px] items-center justify-between px-6 sm:px-10 md:h-20 lg:px-14"
        >
          <a href="#home" onClick={(e) => onAnchorClick(e)} aria-label="NOIRÉ — back to top" className="shrink-0">
            <Logo />
          </a>

          <ul className="hidden items-center gap-10 lg:flex xl:gap-14">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => onAnchorClick(e)}
                  className="link-underline text-[0.7rem] font-medium uppercase tracking-[0.28em] text-cream/80 transition-colors duration-500 hover:text-cream"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 sm:gap-6">
            <a
              href="#visit"
              onClick={(e) => onAnchorClick(e)}
              className="link-underline hidden items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-cream/80 transition-colors duration-500 hover:text-cream sm:inline-flex"
            >
              <MapPin size={14} strokeWidth={1.5} className="text-bronze" aria-hidden />
              Find Us
            </a>
            <a href="#menu" onClick={(e) => onAnchorClick(e)} className="btn-luxe hidden !px-5 !py-3 sm:inline-flex" data-magnetic="0.3">
              Menu
            </a>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              data-magnetic="0.4"
              className="-mr-2 flex h-12 w-12 items-center justify-center text-cream lg:hidden"
            >
              <MenuIcon size={22} strokeWidth={1.25} aria-hidden />
            </button>
          </div>
        </nav>
      </header>
      <MobileMenu open={open} onClose={close} />
    </>
  );
}
