"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { coffeeState, range, smooth } from "@/animations/coffeeTimeline";
import { useQuality } from "./quality";

/**
 * Scroll-directed camera. Position and look-at target each follow a
 * Catmull-Rom spline through hand-placed keyframes (one per story beat),
 * so the move is continuous with no stops at keyframes. Portrait screens get
 * an automatic dolly-out; desktops get a whisper of pointer parallax.
 */

interface Key {
  t: number;
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
}

const KEYS: Key[] = [
  { t: 0.0, pos: [0.0, 1.75, 7.6], target: [0, 1.15, 0.1], fov: 30 }, // establishing — studio wide
  { t: 0.15, pos: [0.7, 1.6, 5.7], target: [0, 1.2, 0.2], fov: 30 }, // slow push-in
  { t: 0.3, pos: [1.55, 1.75, 4.3], target: [-0.25, 1.55, 0.35], fov: 30 }, // 3/4 on the gauge
  { t: 0.45, pos: [1.15, 1.2, 3.15], target: [0, 1.0, 0.6], fov: 31 }, // the stream
  { t: 0.62, pos: [0.65, 1.3, 2.55], target: [0, 0.82, 0.62], fov: 32 }, // cup filling
  { t: 0.8, pos: [-0.2, 1.62, 2.3], target: [0, 0.84, 0.62], fov: 31 }, // orbiting over the crema
  { t: 1.0, pos: [-0.55, 1.45, 2.22], target: [0, 0.93, 0.62], fov: 30 }, // hero cup — low product angle
];

export default function CoffeeCamera() {
  const { reducedMotion, tier } = useQuality();
  const size = useThree((s) => s.size);
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

  const { posCurve, targetCurve } = useMemo(
    () => ({
      posCurve: new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal"),
      targetCurve: new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.target)), false, "centripetal"),
    }),
    [],
  );
  const scratch = useRef({ pos: new THREE.Vector3(), target: new THREE.Vector3(), dir: new THREE.Vector3() });

  useEffect(() => {
    if (reducedMotion || tier === "low") return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion, tier]);

  useFrame((state, delta) => {
    const p = coffeeState.progress;
    const tmp = scratch.current;
    const camera = state.camera as THREE.PerspectiveCamera;

    // map progress → curve parameter (keyframes are not evenly spaced in time)
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].t) i++;
    const local = range(p, KEYS[i].t, KEYS[i + 1].t);
    const u = (i + local) / (KEYS.length - 1);
    posCurve.getPoint(u, tmp.pos);
    targetCurve.getPoint(u, tmp.target);
    const fov = THREE.MathUtils.lerp(KEYS[i].fov, KEYS[i + 1].fov, local);

    // composition: during the intro, offset the machine away from the hero copy
    const aspect = size.width / size.height;
    const intro = 1 - smooth(range(p, 0.0, 0.16));
    if (aspect > 1.05) {
      tmp.target.x -= 0.95 * intro;
      // while captions sit bottom-left, keep the cup right of centre
      const captions = smooth(range(p, 0.12, 0.2)) * (1 - smooth(range(p, 0.76, 0.86)));
      tmp.target.x -= 0.3 * captions;
      // reduced motion shows one still frame beside the hero copy — keep the cup clear of it
      if (reducedMotion) tmp.target.x -= 0.4;
    } else {
      tmp.target.y -= 0.6 * intro;
    }

    // portrait / narrow screens: dolly out so the machine still fits
    if (aspect < 1.2) {
      const k = THREE.MathUtils.clamp(1.2 / aspect, 1, 2.05);
      // the dolly-out relaxes towards the final close-up so the cup still fills the frame
      const relax = THREE.MathUtils.lerp(1, 0.72, smooth(range(p, 0.6, 1)));
      const factor = 1 + (k - 1) * relax;
      tmp.dir.subVectors(tmp.pos, tmp.target).multiplyScalar(factor);
      tmp.pos.copy(tmp.target).add(tmp.dir);
    }

    // living camera — tiny idle drift + pointer parallax (eased)
    if (!reducedMotion) {
      const t = state.clock.elapsedTime;
      const ptr = pointer.current;
      const ease = 1 - Math.exp(-delta * 2.5);
      ptr.sx += (ptr.x - ptr.sx) * ease;
      ptr.sy += (ptr.y - ptr.sy) * ease;
      const strength = 0.16 * (1 - 0.6 * smooth(range(p, 0.6, 1)));
      tmp.pos.x += Math.sin(t * 0.21) * 0.035 + ptr.sx * strength;
      tmp.pos.y += Math.sin(t * 0.17 + 1.2) * 0.02 - ptr.sy * strength * 0.5;
    }

    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.target);
    if (Math.abs(camera.fov - fov) > 0.001) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
