/**
 * NOIRÉ — single source of truth for the cinematic coffee timeline.
 *
 * ONE GSAP ScrollTrigger (created in Hero.tsx) writes `coffeeState.progress`.
 * Every 3D component reads it inside `useFrame`, so there is exactly one scroll
 * controller, zero React re-renders per frame, and the whole scene scrubs
 * forwards/backwards deterministically from a single number (0 → 1).
 */

export const coffeeState = {
  /** Smoothed scroll progress of the pinned hero (0 → 1). Written only by GSAP. */
  progress: 0,
};

export const STAGES = {
  intro: [0, 0.15],
  activation: [0.15, 0.35],
  pour: [0.35, 0.65],
  crema: [0.65, 0.8],
  reveal: [0.8, 1],
} as const;

export type StageKey = keyof typeof STAGES;

/* ───────────────────────── math helpers ───────────────────────── */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Normalised position of p inside [a, b], clamped. */
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ───────────────────────── scene geometry constants ───────────────────────── */
/* Shared by machine, cup, stream and liquid so everything stays physically connected. */

export const SCENE = {
  /** Brew axis: the group head & cup are centred here. */
  brewX: 0,
  brewZ: 0.62,
  dripTrayTop: 0.385,
  saucerHeight: 0.035,
  /** World y of the two spout tips. */
  spoutY: 1.1,
  /** Horizontal offset of each spout from the brew axis. */
  spoutOffset: 0.045,
} as const;

/** Cup is modelled in its own local space with its base at y = 0. */
export const CUP = {
  baseY: SCENE.dripTrayTop + SCENE.saucerHeight, // world y of cup foot
  height: 0.41,
  innerBottom: 0.06,
  innerTop: 0.4,
  innerBottomR: 0.11,
  innerTopR: 0.272,
  outerBottomR: 0.15,
  outerTopR: 0.298,
  /** Fraction of inner height the espresso finally reaches. */
  maxFill: 0.86,
} as const;

/** Inner radius of the cup at normalised inner-height t (0 = bottom, 1 = rim). */
export const cupInnerRadius = (t: number) =>
  CUP.innerBottomR + (CUP.innerTopR - CUP.innerBottomR) * Math.pow(clamp01(t), 0.55);

/** Outer radius of the cup at normalised outer-height t. */
export const cupOuterRadius = (t: number) =>
  CUP.outerBottomR + (CUP.outerTopR - CUP.outerBottomR) * Math.pow(clamp01(t), 0.6);

/* ───────────────────────── derived timeline state ───────────────────────── */

export interface PourState {
  /** 0 → 1 how full the cup is. */
  fill: number;
  /** Normalised inner-height of the surface (0 → CUP.maxFill). */
  level: number;
  /** World y of the liquid surface. */
  surfaceY: number;
  /** Radius of the liquid surface. */
  surfaceRadius: number;
  /** World y of the top / bottom of the falling stream. */
  streamTop: number;
  streamBottom: number;
  /** 0 → 1 stream body thickness (thins at the end of the shot). */
  streamThickness: number;
  /** 0 → 1 how strongly the stream agitates the surface. */
  agitation: number;
  /** 0 → 1 crema coverage. */
  crema: number;
  /** 0 → 1 steam intensity. */
  steam: number;
}

const pourStateCache: PourState = {
  fill: 0,
  level: 0,
  surfaceY: 0,
  surfaceRadius: 0,
  streamTop: 0,
  streamBottom: 0,
  streamThickness: 0,
  agitation: 0,
  crema: 0,
  steam: 0,
};

/**
 * Compute the full liquid state for progress p. Pure & allocation-free
 * (returns a shared object) so it is safe to call from several useFrame hooks.
 */
export function getPourState(p: number): PourState {
  const s = pourStateCache;

  // Fill rises across the pour stage. Slight ease-out: a tapered cup widens,
  // so the level climbs more slowly as it fills.
  s.fill = range(p, 0.375, 0.645);
  s.level = s.fill <= 0 ? 0 : 0.035 + (CUP.maxFill - 0.035) * Math.pow(s.fill, 0.82);
  const innerH = CUP.innerTop - CUP.innerBottom;
  s.surfaceY = CUP.baseY + CUP.innerBottom + s.level * innerH;
  s.surfaceRadius = cupInnerRadius(s.level) - 0.002;

  // Stream: first drops fall from the spouts, then a continuous ribbon, then the tail
  // detaches and falls into the cup.
  const head = easeOutCubic(range(p, 0.35, 0.385)); // leading edge travelling down
  const tail = smooth(range(p, 0.625, 0.66)); // trailing edge falling away
  const top = SCENE.spoutY;
  const bottomTarget = s.fill > 0 ? s.surfaceY : CUP.baseY + CUP.innerBottom;
  s.streamBottom = lerp(top, bottomTarget, head);
  s.streamTop = lerp(top, bottomTarget, tail);
  // "Mouse tail": full body mid-shot, blonding & thinning towards the end.
  s.streamThickness = head > 0 && tail < 1 ? 1 - 0.45 * smooth(range(p, 0.56, 0.63)) : 0;

  s.agitation = smooth(range(p, 0.37, 0.39)) * (1 - smooth(range(p, 0.62, 0.7)));

  // Crema: a little forms during extraction, then blooms across the surface.
  s.crema = 0.3 * range(p, 0.38, 0.64) + 0.7 * smoother(range(p, 0.64, 0.8));

  s.steam = smooth(range(p, 0.62, 0.8));
  return s;
}

export interface MachineState {
  /** Heating lamp glow 0 → 1. */
  heat: number;
  /** "Ready" lamp glow 0 → 1. */
  ready: number;
  /** Pressure in bar (0 → ~9). */
  pressure: number;
  /** E61 lever 0 = down (idle), 1 = up (brewing). */
  lever: number;
  /** 0 → 1 pump vibration amount. */
  vibration: number;
  /** Warm cup-light under the group head. */
  bayLight: number;
}

const machineStateCache: MachineState = {
  heat: 0,
  ready: 0,
  pressure: 0,
  lever: 0,
  vibration: 0,
  bayLight: 0,
};

export function getMachineState(p: number): MachineState {
  const m = machineStateCache;
  m.heat = smooth(range(p, 0.15, 0.21));
  m.ready = smooth(range(p, 0.27, 0.31));
  m.lever = smooth(range(p, 0.3, 0.345)) * (1 - smooth(range(p, 0.64, 0.69)));
  // Pressure ramps with a little overshoot, holds at 9 bar during extraction,
  // then bleeds off when the lever drops.
  const ramp = range(p, 0.18, 0.34);
  const overshoot = Math.sin(ramp * Math.PI) * 0.6 * ramp;
  m.pressure = 9 * smoother(ramp) + overshoot - 8.2 * smooth(range(p, 0.65, 0.72));
  m.vibration = smooth(range(p, 0.335, 0.36)) * (1 - smooth(range(p, 0.62, 0.66)));
  m.bayLight = 0.25 + 0.75 * smooth(range(p, 0.2, 0.32));
  return m;
}

/** Shot timer shown in the overlay HUD (seconds, 0 → 27). */
export const getShotSeconds = (p: number) => Math.round(27 * range(p, 0.35, 0.65));
