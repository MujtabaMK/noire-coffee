"use client";

import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { CONTACT, NAV_LINKS } from "@/data/site";
import { onAnchorClick } from "@/lib/scroll";
import Logo from "@/components/ui/Logo";
import InstagramIcon from "@/components/ui/InstagramIcon";

export default function Footer() {
  return (
    <footer id="visit" aria-labelledby="footer-title" className="relative bg-noir pt-24 md:pt-32">
      <h2 id="footer-title" className="sr-only">
        Visit, contact and opening hours
      </h2>
      <div className="mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-14">
        <div className="grid gap-14 border-t border-line pt-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Logo size="lg" />
            <p className="mt-6 max-w-xs text-[0.95rem] leading-relaxed text-taupe">
              A specialty coffee house devoted to the slow craft of the perfect cup. Crafted slowly. Poured perfectly.
            </p>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-8 inline-flex items-center gap-3 text-sm text-cream"
            >
              <InstagramIcon size={17} />
              {CONTACT.instagramHandle}
            </a>
          </div>

          <nav aria-label="Footer" className="lg:col-span-2">
            <h3 className="mb-6 text-[0.62rem] uppercase tracking-[0.35em] text-bronze">Explore</h3>
            <ul className="space-y-4">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={(e) => onAnchorClick(e)} className="link-underline text-sm text-cream/80 hover:text-cream">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <address className="not-italic lg:col-span-3">
            <h3 className="mb-6 text-[0.62rem] uppercase tracking-[0.35em] text-bronze">Find Us</h3>
            <p className="flex gap-3 text-sm leading-relaxed text-cream/80">
              <MapPin size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-taupe" aria-hidden />
              <span>
                {CONTACT.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </p>
            <p className="mt-4 flex items-center gap-3 text-sm text-cream/80">
              <Phone size={16} strokeWidth={1.5} className="shrink-0 text-taupe" aria-hidden />
              <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="link-underline">
                {CONTACT.phone}
              </a>
            </p>
            <p className="mt-4 flex items-center gap-3 text-sm text-cream/80">
              <Mail size={16} strokeWidth={1.5} className="shrink-0 text-taupe" aria-hidden />
              <a href={`mailto:${CONTACT.email}`} className="link-underline">
                {CONTACT.email}
              </a>
            </p>
          </address>

          <div className="lg:col-span-3">
            <h3 className="mb-6 text-[0.62rem] uppercase tracking-[0.35em] text-bronze">Opening Hours</h3>
            <ul className="space-y-4">
              {CONTACT.hours.map((h) => (
                <li key={h.days} className="flex items-center justify-between gap-6 border-b border-line/70 pb-4 text-sm">
                  <span className="flex items-center gap-3 text-cream/80">
                    <Clock size={15} strokeWidth={1.5} className="text-taupe" aria-hidden />
                    {h.days}
                  </span>
                  <span className="font-mono text-xs tracking-wider text-cream">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* oversized wordmark */}
        <p
          aria-hidden
          className="display pointer-events-none mt-24 select-none text-center text-[19vw] leading-[0.8] tracking-[0.06em] text-transparent [-webkit-text-stroke:1px_#383029] md:mt-32"
        >
          NOIRÉ
        </p>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-line py-8 text-[0.68rem] uppercase tracking-[0.25em] text-taupe/80 sm:flex-row sm:items-center">
          <p>© 2026 NOIRÉ Specialty Coffee House</p>
          <p>Beyond the ordinary.</p>
        </div>
      </div>
    </footer>
  );
}
