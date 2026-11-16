"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";
import { gsap, useGSAP } from "@/animations/gsap";
import { CONTACT, NAV_LINKS } from "@/data/site";
import { lockScroll, onAnchorClick } from "@/lib/scroll";
import Logo from "@/components/ui/Logo";
import InstagramIcon from "@/components/ui/InstagramIcon";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/** Full-screen touch-friendly menu with a curtain + staggered link reveal. */
export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  // unlock scrolling synchronously so the smooth-scroll to the target isn't blocked
  const closeForNav = () => {
    lockScroll(false);
    onClose();
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      tlRef.current = gsap
        .timeline({ paused: true, defaults: { ease: "expo.out" } })
        .set(root, { autoAlpha: 1 })
        .fromTo(root, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" })
        .from(q("[data-mm-item]"), { yPercent: 120, autoAlpha: 0, duration: 1, stagger: 0.06 }, 0.45)
        .from(q("[data-mm-foot]"), { autoAlpha: 0, y: 20, duration: 0.8 }, 0.7);
    },
    { scope: rootRef },
  );

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (open) {
      tl.timeScale(1).play();
      lockScroll(true);
      const first = rootRef.current?.querySelector<HTMLElement>("a,button");
      first?.focus({ preventScroll: true });
    } else {
      tl.timeScale(1.8).reverse();
      lockScroll(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => () => lockScroll(false), []);

  return (
    <div
      ref={rootRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      inert={!open}
      className="invisible fixed inset-0 z-[70] flex flex-col bg-noir-2 px-6 pb-10 pt-5 sm:px-10 lg:hidden"
    >
      <div className="flex h-12 items-center justify-between">
        <Logo />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-mr-2 flex h-12 w-12 items-center justify-center text-cream"
        >
          <X size={24} strokeWidth={1.25} aria-hidden />
        </button>
      </div>

      <nav aria-label="Mobile" className="mt-14 flex-1">
        <ul className="flex flex-col gap-2">
          {[...NAV_LINKS, { label: "Find Us", href: "#visit" }].map((l, i) => (
            <li key={l.href} className="overflow-hidden">
              <a
                data-mm-item
                href={l.href}
                onClick={(e) => onAnchorClick(e, closeForNav)}
                className="group flex items-baseline gap-5 py-2.5"
              >
                <span className="font-mono text-[0.65rem] text-bronze">0{i + 1}</span>
                <span className="display text-[2.6rem] leading-none text-cream transition-colors group-active:text-bronze sm:text-5xl">
                  {l.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div data-mm-foot className="flex flex-col gap-6 border-t border-line pt-8">
        <a href="#menu" onClick={(e) => onAnchorClick(e, closeForNav)} className="btn-luxe w-full justify-between">
          View the menu
          <ArrowRight size={15} strokeWidth={1.5} aria-hidden />
        </a>
        <div className="flex items-center justify-between text-xs text-taupe">
          <span>{CONTACT.addressLines[1]}</span>
          <a
            href={CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="NOIRÉ on Instagram"
            className="flex h-11 w-11 items-center justify-center text-cream"
          >
            <InstagramIcon />
          </a>
        </div>
      </div>
    </div>
  );
}
