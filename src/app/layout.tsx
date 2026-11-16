import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ASSET_BASE, PAGE_PATH, SITE_URL } from "@/lib/site-url";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NOIRÉ — Specialty Coffee House | Beyond the ordinary.",
    template: "%s | NOIRÉ Specialty Coffee House",
  },
  description:
    "NOIRÉ is a specialty coffee house crafting extraordinary coffee, one cup at a time. Single-origin beans, precision roasting and perfectly pulled espresso. Crafted slowly. Poured perfectly.",
  keywords: [
    "specialty coffee",
    "coffee house",
    "espresso bar",
    "single origin coffee",
    "NOIRÉ",
    "luxury café",
    "latte",
    "cappuccino",
  ],
  applicationName: "NOIRÉ",
  authors: [{ name: "NOIRÉ Specialty Coffee House" }],
  alternates: { canonical: PAGE_PATH },
  icons: { icon: { url: `${ASSET_BASE}/icon.svg`, type: "image/svg+xml" } },
  openGraph: {
    type: "website",
    siteName: "NOIRÉ — Specialty Coffee House",
    title: "NOIRÉ — Beyond the ordinary.",
    description: "An extraordinary coffee experience, crafted one cup at a time.",
    url: PAGE_PATH,
    images: [{ url: `${ASSET_BASE}/images/cta-cup.jpg`, width: 2000, height: 1312, alt: "A cup of NOIRÉ coffee in warm light" }],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "NOIRÉ — Beyond the ordinary.",
    description: "An extraordinary coffee experience, crafted one cup at a time.",
    images: [`${ASSET_BASE}/images/cta-cup.jpg`],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#100E0C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="grain">{children}</body>
    </html>
  );
}
