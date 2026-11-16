"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { coffeeState, getMachineState, range, smooth } from "@/animations/coffeeTimeline";
import { useDisposable } from "./useDisposable";
import { useQuality } from "./quality";

/* ──────────────────────────── Volumetric light beam ────────────────────────────
 * A soft additive cone falling from the LED strip under the group head onto the
 * cup — the "single shaft of light in a dark studio" shot. Fades at its edges
 * (view-angle based) and towards the bottom, intensity follows the machine.
 */

const coneVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const coneFrag = /* glsl */ `
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    vec3 V = normalize(-vViewPos);
    float facing = abs(dot(normalize(vNormalV), V));
    float soft = pow(facing, 1.4);                       // feathered silhouette
    float along = smoothstep(0.0, 0.55, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));
    float shimmer = 0.88 + 0.12 * sin(vUv.y * 22.0 - uTime * 0.6 + vUv.x * 12.0);
    float a = uIntensity * soft * along * shimmer * 0.22;
    gl_FragColor = vec4(vec3(1.0, 0.82, 0.58) * a, a);
  }
`;

function LightCone() {
  const ref = useRef<THREE.Mesh>(null);
  const { reducedMotion } = useQuality();

  const { geometry, material } = useMemo(() => {
    // open cone: narrow at the LED strip, wide at the drip tray (uv.y 0 = bottom, 1 = top)
    const geometry = new THREE.CylinderGeometry(0.16, 0.62, 1.25, 48, 1, true);
    const material = new THREE.ShaderMaterial({
      vertexShader: coneVert,
      fragmentShader: coneFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uIntensity: { value: 0 }, uTime: { value: 0 } },
    });
    return { geometry, material };
  }, []);
  const disposables = useMemo(() => [geometry, material], [geometry, material]);
  useDisposable(disposables);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const p = coffeeState.progress;
    const m = getMachineState(p);
    // strongest while brewing, softened in the final close-up so it never washes out the crema
    const intensity = m.bayLight * (1 - 0.55 * smooth(range(p, 0.82, 1)));
    mesh.visible = intensity > 0.02;
    const u = (mesh.material as THREE.ShaderMaterial).uniforms;
    u.uIntensity.value = intensity;
    if (!reducedMotion) u.uTime.value = state.clock.elapsedTime;
  });

  // from LED strip (0, 1.62, 0.22) towards the cup (0, 0.4, 0.62)
  return (
    <mesh
      ref={ref}
      name="LightCone"
      geometry={geometry}
      material={material}
      position={[0, 1.01, 0.42]}
      rotation={[-0.32, 0, 0]}
      renderOrder={5}
    />
  );
}

/* ──────────────────────────────── Dust motes ────────────────────────────────
 * A few hundred slow, warm specks hanging in the key light. Near the camera
 * they become soft bokeh — very "product film".
 */

const dustVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * 0.05 + aSeed * 40.0;
    p.x += sin(t * 1.3 + aSeed * 9.0) * 0.12;
    p.y += sin(t * 0.9 + aSeed * 3.0) * 0.18 + uTime * 0.012 * (0.5 + aSeed);
    p.y = mod(p.y, 2.8) + 0.05;
    p.z += cos(t * 1.1 + aSeed * 5.0) * 0.12;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = (0.6 + aSeed * 1.4) * 34.0 * uPixelRatio / -mv.z;
    gl_PointSize = min(size, 42.0 * uPixelRatio);
    // twinkle as motes turn through the light
    vAlpha = (0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 30.0), 3.0));
    vAlpha *= smoothstep(0.3, 1.4, -mv.z);              // fade the ones that brush the lens
  }
`;

const dustFrag = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = exp(-d * d * 22.0) * (1.0 - smoothstep(0.4, 0.5, d));
    gl_FragColor = vec4(vec3(1.0, 0.86, 0.66), a * vAlpha * uOpacity);
  }
`;

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

function DustMotes() {
  const { tier, reducedMotion } = useQuality();
  const ref = useRef<THREE.Points>(null);
  const dpr = useThree((s) => s.viewport.dpr);
  const count = tier === "high" ? 260 : 90;

  const { geometry, material } = useMemo(() => {
    const random = mulberry32(0x0d057);
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (random() - 0.5) * 4.2;
      pos[i * 3 + 1] = random() * 2.8;
      pos[i * 3 + 2] = -0.4 + random() * 2.6;
      seeds[i] = random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0.9), 3.5);
    const material = new THREE.ShaderMaterial({
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uOpacity: { value: 0.5 } },
    });
    return { geometry, material };
  }, [count]);
  const disposables = useMemo(() => [geometry, material], [geometry, material]);
  useDisposable(disposables);

  useFrame((state) => {
    const pts = ref.current;
    if (!pts) return;
    const u = (pts.material as THREE.ShaderMaterial).uniforms;
    if (!reducedMotion) u.uTime.value = state.clock.elapsedTime;
    u.uPixelRatio.value = dpr;
    // a touch denser while the machine is alive
    const m = getMachineState(coffeeState.progress);
    u.uOpacity.value = 0.32 + 0.3 * m.bayLight;
  });

  return <points ref={ref} name="DustMotes" geometry={geometry} material={material} renderOrder={6} />;
}

export default function Atmosphere() {
  return (
    <>
      <LightCone />
      <DustMotes />
    </>
  );
}
