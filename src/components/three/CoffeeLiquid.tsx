"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { coffeeState, getPourState, SCENE } from "@/animations/coffeeTimeline";
import { BAY_LIGHT_DIR, KEY_LIGHT_DIR, NOISE_GLSL } from "./shaderChunks";
import { useDisposable } from "./useDisposable";
import { useQuality } from "./quality";

/**
 * The espresso body. A disc that rises inside the cup with scroll progress;
 * its radius follows the cup's inner profile so it always meets the wall.
 * The shader adds impact ripples where the two streams land, a foamy hot-spot,
 * a darker meniscus and glossy highlights — no fluid simulation needed.
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
  uniform float uAgitation;
  uniform float uSpout;
  uniform vec3 uKeyDir;
  uniform vec3 uBayDir;
  uniform float uBay;
  varying vec2 vLocal;
  varying vec3 vWorld;

  ${NOISE_GLSL}

  // ripple rings radiating from a stream impact point; accumulates the slope
  void ripple(vec2 p, vec2 c, inout vec2 grad, inout float foam) {
    vec2 d = p - c;
    float r = length(d) + 1e-4;
    float k = 150.0;
    float att = exp(-r * 16.0);
    float ph = r * k - uTime * 20.0;
    float slope = (cos(ph) * k - 16.0 * sin(ph)) * att;
    grad += slope * (d / r) * 0.0016 * uAgitation;
    foam += exp(-r * 55.0) * uAgitation;
  }

  void main() {
    vec2 p = vLocal;
    float r = length(p) / uRadius;

    vec2 grad = vec2(0.0);
    float foam = 0.0;
    ripple(p, vec2(-uSpout, 0.0), grad, foam);
    ripple(p, vec2( uSpout, 0.0), grad, foam);

    // slow sloshing so the surface never looks frozen
    float n1 = vnoise(p * 22.0 + vec2(uTime * 0.35, -uTime * 0.27));
    float n2 = vnoise(p * 41.0 - vec2(uTime * 0.21, uTime * 0.31));
    grad += (vec2(n1, n2) - 0.5) * (0.035 + 0.08 * uAgitation);

    // local y maps to world -z (disc is rotated -90° about x)
    vec3 N = normalize(vec3(-grad.x, 1.0, grad.y));
    vec3 V = normalize(cameraPosition - vWorld);

    vec3 deep   = srgb(vec3(0.075, 0.035, 0.018));
    vec3 body   = srgb(vec3(0.20, 0.10, 0.045));
    vec3 col = mix(body, deep, smoothstep(0.0, 1.0, r));
    // tiger-flecked hot-spot where the streams hit
    col = mix(col, srgb(vec3(0.62, 0.38, 0.19)), clamp(foam * 0.9, 0.0, 0.85));
    // meniscus — darker ring hugging the porcelain
    col *= mix(1.0, 0.45, smoothstep(0.86, 1.0, r));

    vec3 Hk = normalize(normalize(uKeyDir) + V);
    vec3 Hb = normalize(normalize(uBayDir) + V);
    float specK = pow(max(dot(N, Hk), 0.0), 160.0) * 1.6;
    float specB = pow(max(dot(N, Hb), 0.0), 90.0) * 1.2 * uBay;
    float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);

    col += (specK + specB) * srgb(vec3(1.0, 0.9, 0.78));
    col += fres * srgb(vec3(0.35, 0.27, 0.2)) * 0.6;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function CoffeeLiquid() {
  const { segments, octaves, reducedMotion } = useQuality();
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.CircleGeometry(1, segments);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      defines: { FBM_OCTAVES: octaves },
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: 0.1 },
        uAgitation: { value: 0 },
        uSpout: { value: SCENE.spoutOffset },
        uKeyDir: { value: new THREE.Vector3(...KEY_LIGHT_DIR) },
        uBayDir: { value: new THREE.Vector3(...BAY_LIGHT_DIR) },
        uBay: { value: 1 },
      },
    });
    return { geometry, material };
  }, [segments, octaves]);

  const disposables = useMemo(() => [geometry, material], [geometry, material]);
  useDisposable(disposables);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const s = getPourState(coffeeState.progress);
    mesh.visible = s.fill > 0.0005;
    if (!mesh.visible) return;
    mesh.position.y = s.surfaceY;
    mesh.scale.setScalar(s.surfaceRadius);
    const u = (mesh.material as THREE.ShaderMaterial).uniforms;
    u.uRadius.value = s.surfaceRadius;
    u.uAgitation.value = s.agitation;
    if (!reducedMotion) u.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      ref={meshRef}
      name="CoffeeLiquid"
      geometry={geometry}
      material={material}
      position={[SCENE.brewX, 0, SCENE.brewZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
    />
  );
}
