import Navbar from "@/components/navigation/Navbar";
import Hero from "@/components/hero/Hero";
import Philosophy from "@/components/sections/Philosophy";
import CoffeeMenu from "@/components/sections/CoffeeMenu";
import CoffeeCraft from "@/components/sections/CoffeeCraft";
import CafeGallery from "@/components/sections/CafeGallery";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";
import Marquee from "@/components/sections/Marquee";
import Intro from "@/components/ui/Intro";
import Cursor from "@/components/ui/Cursor";
import SmoothScroller from "@/components/ui/SmoothScroller";
import { menu } from "@/data/menu";
import { CONTACT } from "@/data/site";

/** Structured data so search engines understand this is a café with a menu. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  name: "NOIRÉ — Specialty Coffee House",
  slogan: "Beyond the ordinary.",
  foundingDate: "2026",
  servesCuisine: "Specialty Coffee",
  priceRange: "₹₹",
  email: CONTACT.email,
  telephone: CONTACT.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.addressLines[0],
    addressLocality: "Mumbai",
    addressCountry: "IN",
  },
  hasMenu: {
    "@type": "Menu",
    hasMenuSection: {
      "@type": "MenuSection",
      name: "Signature Coffee",
      hasMenuItem: menu.map((m) => ({
        "@type": "MenuItem",
        name: m.name,
        description: m.description,
        offers: { "@type": "Offer", price: m.price, priceCurrency: "INR" },
      })),
    },
  },
};

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-bronze focus:px-4 focus:py-2 focus:text-noir"
      >
        Skip to content
      </a>
      {/* fixed layers live outside the smooth-scroll wrapper */}
      <Intro />
      <noscript>
        <style>{"#intro{display:none!important}"}</style>
      </noscript>
      <Cursor />
      <Navbar />
      {/* must render before #smooth-wrapper so the smoother exists before any ScrollTrigger */}
      <SmoothScroller />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main id="main">
            <Hero />
            <Philosophy />
            <Marquee />
            <CoffeeMenu />
            <CoffeeCraft />
            <CafeGallery />
            <FinalCTA />
          </main>
          <Footer />
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
