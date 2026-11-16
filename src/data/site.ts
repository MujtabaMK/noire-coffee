/** Site-wide navigation & contact details. Placeholders — replace with real details. */

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Our Coffee", href: "#menu" },
  { label: "Our Story", href: "#philosophy" },
  { label: "Experience", href: "#experience" },
] as const;

export const CONTACT = {
  instagram: "https://instagram.com/",
  instagramHandle: "@noire.coffee",
  email: "hello@noire.coffee",
  phone: "+91 00000 00000",
  addressLines: ["12 Placeholder Lane", "Bandra West, Mumbai 400050"],
  hours: [
    { days: "Mon — Fri", time: "7:30 — 22:00" },
    { days: "Sat — Sun", time: "8:30 — 23:00" },
  ],
} as const;
