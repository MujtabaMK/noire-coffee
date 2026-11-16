import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// Published as a static page: mujtabakhan.com/coffee.html with all assets under /coffee/
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "/coffee";

export default function config(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    output: "export",
    // JS/CSS/fonts/imported images load from /coffee/_next/... in production
    assetPrefix: isDev ? undefined : ASSET_BASE,
    images: { unoptimized: true },
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },
  };
}
