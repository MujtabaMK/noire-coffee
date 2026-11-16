/**
 * Where the site is published. The page lives at  {SITE_URL}{PAGE_PATH}
 * and every asset (JS, CSS, fonts, images) lives under  {SITE_URL}{ASSET_BASE}/
 *   e.g. https://mujtabakhan.com/coffee.html  +  https://mujtabakhan.com/coffee/...
 * Override with NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_ASSET_BASE / NEXT_PUBLIC_PAGE_PATH.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mujtabakhan.com").replace(/\/$/, "");
export const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "/coffee";
export const PAGE_PATH = process.env.NEXT_PUBLIC_PAGE_PATH ?? "/coffee.html";
