"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { coffeeState, getPourState, SCENE } from "@/animations/coffeeTimeline";
import { BAY_LIGHT_DIR, KEY_LIGHT_DIR, NOISE_GLSL } from "./shaderChunks";
import { useDisposable } from "./useDisposable";
import { useQuality } from "./quality";

/**
 * Golden-brown crema layer floating on the espresso. Coverage blooms outward
 * from where the streams land; a slow polar swirl, tiger-striping, micro-bubbles
 * and a darker rim give it the look of a freshly pulled shot.
 */

const vertexShader = /* glsl */ `
  uniform float uRadius;
  varying vec2 vLocal;
  varying vec3 vWorld;
  void main() {
    vLocal = position.xy * uRadius;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uRadius;
  uniform float uCrema;
  uniform float uSwirl;
  uniform vec3 uKeyDir;
  uniform vec3 uBayDir;
  varying vec2 vLocal;
  varying vec3 vWorld;

  ${NOISE_GLSL}

  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  void main() {
    vec2 p = vLocal / uRadius;          // normalised disc coords (-1..1)
    float r = length(p);

    // polar swirl — stronger towards the centre, slowly turning
    float twist = uSwirl * (1.0 - r) * 0.55 + uTime * 0.02;
    vec2 q = rot(twist) * p;

    float body  = fbm(q * 2.6 + 4.0);
    // tiger striping: domain-warped, stretched noise
    float tiger = fbm(vec2(q.x * 7.0, q.y * 15.0) + body * 2.4 + 7.3);
    float micro = vnoise(q * 110.0);

    vec3 golden = srgb(vec3(0.70, 0.45, 0.22));
    vec3 hazel  = srgb(vec3(0.50, 0.28, 0.12));
    vec3 dark   = srgb(vec3(0.25, 0.12, 0.05));

    vec3 col = mix(golden, hazel, smoothstep(0.32, 0.72, body));
    col = mix(col, dark, smoothstep(0.5, 0.78, tiger) * 0.6);
    col = mix(col, srgb(vec3(0.78, 0.55, 0.32)), (1.0 - smoothstep(0.0, 0.5, r)) * 0.25 * smoothstep(0.4, 0.6, body));
    col = mix(col, dark, smoothstep(0.7, 1.0, r) * 0.65);           // darker rim against the porcelain
    col += step(0.88, micro) * 0.03;                                // micro-bubbles

    // coverage blooms outward with a ragged, organic edge
    float edge = uCrema * 1.35 - r + (body - 0.5) * 0.35;
    float alpha = smoothstep(0.0, 0.12, edge) * smoothstep(0.0, 0.06, uCrema);
    alpha *= 0.96;

    // satin sheen
    vec2 g = vec2(fbm(q * 6.0 + 1.3), fbm(q * 6.0 + 9.1)) - 0.5;
    vec3 N = normalize(vec3(-g.x * 0.25, 1.0, g.y * 0.25));
    vec3 V = normalize(cameraPosition - vWorld);
    float specK = pow(max(dot(N, normalize(normalize(uKeyDir) + V)), 0.0), 48.0) * 0.45;
    float specB = pow(max(dot(N, normalize(normalize(uBayDir) + V)), 0.0), 36.0) * 0.35;
    col += (specK + specB) * srgb(vec3(1.0, 0.92, 0.8));

    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function CoffeeCrema() {
  const { segments, octaves, reducedMotion } = useQuality();
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.CircleGeometry(1, segments);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      defines: { FBM_OCTAVES: octaves },
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: 0.1 },
        uCrema: { value: 0 },
        uSwirl: { value: 0 },
        uKeyDir: { value: new THREE.Vector3(...KEY_LIGHT_DIR) },
        uBayDir: { value: new THREE.Vector3(...BAY_LIGHT_DIR) },
      },
    });
    return { geometry, material };
  }, [segments, octaves]);

  const disposables = useMemo(() => [geometry, material], [geometry, material]);
  useDisposable(disposables);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const p = coffeeState.progress;
    const s = getPourState(p);
    mesh.visible = s.fill > 0.0005 && s.crema > 0.002;
    if (!mesh.visible) return;
    mesh.position.y = s.surfaceY + 0.0012;
    mesh.scale.setScalar(s.surfaceRadius);
    const u = (mesh.material as THREE.ShaderMaterial).uniforms;
    u.uRadius.value = s.surfaceRadius;
    u.uCrema.value = s.crema;
    // swirl is scroll-driven so it reverses naturally when scrolling back up
    u.uSwirl.value = p * 2.0;
    if (!reducedMotion) u.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      ref={meshRef}
      name="CoffeeCrema"
      geometry={geometry}
      material={material}
      position={[SCENE.brewX, 0, SCENE.brewZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={2}
      visible={false}
    />
  );
}
