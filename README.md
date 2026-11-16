# NOIRÉ — Specialty Coffee House

A cinematic, scroll-directed website for a fictional luxury coffee brand. The centrepiece is a fully
procedural 3D espresso machine that pours a shot into a porcelain cup as you scroll.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Three.js · React Three Fiber · drei ·
GSAP + ScrollTrigger + SplitText · Tailwind CSS v4 · Lucide icons.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Set `NEXT_PUBLIC_SITE_URL` in production so Open Graph / canonical URLs resolve to your domain.

## How the 3D story works

```
Hero.tsx ── one GSAP timeline + ONE pinned ScrollTrigger (scrub: 1.1)
   │            writes ──► coffeeState.progress (0 → 1)        src/animations/coffeeTimeline.ts
   │            and animates the DOM overlay (captions, HUD, rail, reveal) on the same timeline
   ▼
CoffeeScene (R3F canvas, lazy-loaded, client-only)
   every component reads coffeeState.progress inside useFrame — no React re-renders
   ├─ CoffeeCamera      spline camera path through 7 keyframes, portrait dolly-out, pointer parallax
   ├─ Lighting          procedural Lightformer environment (no HDR download) + key / rim / bay lights
   ├─ EspressoMachine   E61-style machine: gauge needle, lamps, lever, pump vibration
   ├─ CoffeeCup         lathe-turned porcelain cup & saucer
   ├─ CoffeeStream      two shader streams pinned spout → liquid surface
   ├─ CoffeeLiquid      rising surface with impact ripples (radius follows the cup's inner profile)
   ├─ CoffeeCrema       blooming, tiger-striped crema shader
   └─ SteamParticles    GPU-animated soft steam
```

| Progress   | Stage                                                      |
| ---------- | ---------------------------------------------------------- |
| 0 – 15%    | Intro: studio wide shot, hero copy                         |
| 15 – 35%   | Activation: lamps, pressure builds to 9 bar, lever lifts   |
| 35 – 65%   | Extraction: double stream, cup fills, shot timer runs      |
| 65 – 80%   | Crema: golden layer blooms, steam rises                    |
| 80 – 100%  | Reveal: product shot, "Every drop has a story."            |

Tune the beats in `src/animations/coffeeTimeline.ts` (`getPourState`, `getMachineState`) and the camera
in `src/components/three/CoffeeCamera.tsx` (`KEYS`).

## Editing content

- **Menu:** `src/data/menu.ts` (names, notes, prices, images)
- **Nav / contact / hours / address:** `src/data/site.ts` (currently placeholders)
- **Brand tokens:** `@theme` block in `src/app/globals.css`

## Performance & accessibility

- The Three.js bundle is code-split (`next/dynamic`, `ssr: false`); hero text is server-rendered.
- Device tiering (`src/lib/device.ts`): phones get fewer segments, fewer particles, no MSAA, lower DPR.
  `PerformanceMonitor` lowers DPR further if FPS drops.
- The render loop stops when the hero is off-screen (IntersectionObserver → `frameloop="never"`).
- Contact shadows and the environment map are rendered once, not every frame.
- All imperatively created geometries, materials and textures are disposed on unmount (`useDisposable`);
  all GSAP tweens, ScrollTriggers and SplitText instances are reverted via `useGSAP` / `gsap.matchMedia`.
- `prefers-reduced-motion`: no pinning or scrubbing; a still, finished-cup composition; no steam.
- No WebGL: a scroll-driven photographic fallback with CSS steam (`FallbackExperience.tsx`).
- Semantic landmarks, skip link, accessible mobile dialog (Esc, focus, inert), keyboard lightbox,
  JSON-LD `CafeOrCoffeeShop` structured data, Open Graph / Twitter metadata.

## Image credits

Photography from [Unsplash](https://unsplash.com) (Unsplash License), stored locally in `public/images`.
