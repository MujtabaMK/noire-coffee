"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { coffeeState, getPourState, SCENE } from "@/animations/coffeeTimeline";
import { useDisposable } from "./useDisposable";
import { useQuality } from "./quality";

/**
 * Soft, slow wisps of steam rising from the finished cup.
 * GPU-animated points (no per-frame CPU work besides two uniforms),
 * each sprite is a procedural soft disc — no textures to load.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute vec3 aOffset;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    float life = fract(uTime * 0.085 + aSeed);
    vec3 p = aOffset;
    p.y += life * 0.95;
    float sway = sin(life * 4.2 + aSeed * 12.0) * 0.07 + sin(uTime * 0.5 + aSeed * 7.0) * 0.03;
    p.x += sway * life * 1.8;
    p.z += cos(life * 3.1 + aSeed * 9.0) * 0.05 * life;
    p.xz *= 1.0 + life * 0.9;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.35 + life * 1.5) / -mv.z;
    vAlpha = uIntensity * smoothstep(0.0, 0.18, life) * (1.0 - smoothstep(0.45, 1.0, life));
    vSeed = aSeed;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = exp(-d * d * 18.0) * (1.0 - smoothstep(0.42, 0.5, d));
    gl_FragColor = vec4(vec3(0.96, 0.92, 0.86), a * vAlpha * 0.075 * (0.8 + 0.4 * vSeed));
    #include <colorspace_fragment>
  }
`;

/** Small seeded PRNG so particle placement is deterministic. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function SteamParticles() {
  const { particles, reducedMotion } = useQuality();
  const pointsRef = useRef<THREE.Points>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const { geometry, material } = useMemo(() => {
    const random = mulberry32(0x6e6f6972); // deterministic layout → pure render
    const geometry = new THREE.BufferGeometry();
    const offsets = new Float32Array(particles * 3);
    const seeds = new Float32Array(particles);
    for (let i = 0; i < particles; i++) {
      const a = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * 0.17;
      offsets[i * 3] = Math.cos(a) * r;
      offsets[i * 3 + 1] = random() * 0.02;
      offsets[i * 3 + 2] = Math.sin(a) * r;
      seeds[i] = random();
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(offsets, 3));
    geometry.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.5, 0), 1.2);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uSize: { value: 380 },
        uPixelRatio: { value: 1 },
      },
    });
    return { geometry, material };
  }, [particles]);

  const disposables = useMemo(() => [geometry, material], [geometry, material]);
  useDisposable(disposables);

  useFrame((state) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const s = getPourState(coffeeState.progress);
    const intensity = reducedMotion ? 0 : s.steam;
    pts.visible = intensity > 0.01;
    if (!pts.visible) return;
    pts.position.y = s.surfaceY;
    const u = (pts.material as THREE.ShaderMaterial).uniforms;
    u.uIntensity.value = intensity;
    u.uTime.value = state.clock.elapsedTime;
    u.uPixelRatio.value = dpr;
  });

  return (
    <points
      ref={pointsRef}
      name="SteamParticles"
      geometry={geometry}
      material={material}
      position={[SCENE.brewX, 0, SCENE.brewZ]}
      renderOrder={4}
      visible={false}
    />
  );
}
