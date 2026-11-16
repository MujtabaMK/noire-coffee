"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { coffeeState, getPourState, range, SCENE } from "@/animations/coffeeTimeline";
import { BAY_LIGHT_DIR, KEY_LIGHT_DIR, NOISE_GLSL } from "./shaderChunks";
import { useDisposable } from "./useDisposable";
import { useQuality } from "./quality";

/**
 * Two procedural espresso streams falling from the double spout.
 * Each is an open cylinder whose top is pinned to a spout tip and whose bottom
 * is pinned to the rising liquid surface (both from getPourState), so the
 * stream is always visually connected to machine and cup.
 * The vertex shader adds the bead-like "mouse tail" undulation and sway; the
 * fragment shader adds flowing tiger-striping and amber translucent edges.
 */

const STREAM_RADIUS = 0.0105;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uLength;
  uniform float uThickness;
  uniform float uHeadTip;
  uniform float uTailTip;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying float vDist;
  varying float vAround;

  void main() {
    vec3 p = position;
    float v = -p.y;                       // 0 at spout → 1 at surface
    float dist = v * uLength;             // world distance below spout
    float phase = modelMatrix[3].x * 97.0;

    // flared where it leaves the spout, then narrows as it accelerates
    float neck = mix(1.45, 0.92, smoothstep(0.0, 0.07, dist));
    float beads = 1.0 + 0.16 * sin(dist * 95.0 - uTime * 30.0 + phase)
                      + 0.07 * sin(dist * 240.0 - uTime * 55.0 + phase * 1.7);
    float rad = neck * beads * uThickness;
    // rounded leading drop while the first pour is falling
    rad *= mix(1.0, (1.0 - smoothstep(0.9, 1.0, v)) * 1.2, uHeadTip);
    // tapered tail as the last drops detach
    rad *= mix(1.0, smoothstep(0.0, 0.25, v), uTailTip);
    p.xz *= rad;

    // gentle sway increasing with fall distance (in local units → scaled by radius)
    float sway = smoothstep(0.0, 0.35, dist);
    p.x += sin(uTime * 3.1 + dist * 16.0 + phase) * 0.22 * sway;
    p.z += cos(uTime * 2.3 + dist * 11.0 + phase) * 0.16 * sway;

    vec4 w = modelMatrix * vec4(p, 1.0);
    vWorld = w.xyz;
    vNormalW = normalize(mat3(modelMatrix) * vec3(normal.x, 0.0, normal.z));
    vDist = dist;
    vAround = uv.x;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uBlond;
  uniform vec3 uKeyDir;
  uniform vec3 uBayDir;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying float vDist;
  varying float vAround;

  ${NOISE_GLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vWorld);
    float facing = abs(dot(N, V));
    float edge = pow(1.0 - facing, 1.6);

    float flow = fbm(vec2(vAround * 6.0, vDist * 55.0 - uTime * 16.0));
    float streak = vnoise(vec2(vAround * 18.0, vDist * 140.0 - uTime * 30.0));

    vec3 core  = srgb(vec3(0.17, 0.075, 0.03));
    vec3 amber = srgb(vec3(0.72, 0.42, 0.18));
    vec3 blond = srgb(vec3(0.86, 0.62, 0.36));

    vec3 col = mix(core, amber, clamp(edge * 0.95 + flow * 0.35 + streak * 0.12 - 0.1, 0.0, 1.0));
    col = mix(col, blond, uBlond * (0.4 + edge * 0.5));

    // glossy specular streaks
    float specK = pow(max(dot(N, normalize(normalize(uKeyDir) + V)), 0.0), 60.0);
    float specB = pow(max(dot(N, normalize(normalize(uBayDir) + V)), 0.0), 40.0);
    col += (specK * 1.3 + specB * 0.9) * srgb(vec3(1.0, 0.88, 0.72)) * (0.6 + streak * 0.6);

    gl_FragColor = vec4(col, 0.97);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function CoffeeStream() {
  const { reducedMotion } = useQuality();
  const groupRef = useRef<THREE.Group>(null);
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(1, 1, 1, 16, 72, true);
    geometry.translate(0, -0.5, 0); // top at y = 0, extends to y = -1
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      defines: { FBM_OCTAVES: 3 },
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uLength: { value: 0.5 },
        uThickness: { value: 1 },
        uHeadTip: { value: 0 },
        uTailTip: { value: 0 },
        uBlond: { value: 0 },
        uKeyDir: { value: new THREE.Vector3(...KEY_LIGHT_DIR) },
        uBayDir: { value: new THREE.Vector3(...BAY_LIGHT_DIR) },
      },
    });
    return { geometry, material };
  }, []);

  const disposables = useMemo(() => [geometry, material], [geometry, material]);
  useDisposable(disposables);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const p = coffeeState.progress;
    const s = getPourState(p);
    const length = s.streamTop - s.streamBottom;
    group.visible = s.streamThickness > 0 && length > 0.004;
    if (!group.visible) return;

    for (const mesh of [leftRef.current, rightRef.current]) {
      if (!mesh) continue;
      mesh.position.y = s.streamTop;
      mesh.scale.set(STREAM_RADIUS, length, STREAM_RADIUS);
    }

    if (!leftRef.current) return;
    const u = (leftRef.current.material as THREE.ShaderMaterial).uniforms;
    u.uLength.value = length;
    u.uThickness.value = s.streamThickness;
    u.uHeadTip.value = 1 - range(p, 0.378, 0.386);
    u.uTailTip.value = range(p, 0.622, 0.632);
    u.uBlond.value = range(p, 0.55, 0.64);
    if (!reducedMotion) u.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group ref={groupRef} name="CoffeeStream" visible={false}>
      <mesh
        ref={leftRef}
        geometry={geometry}
        material={material}
        position={[SCENE.brewX - SCENE.spoutOffset, SCENE.spoutY, SCENE.brewZ]}
        renderOrder={3}
      />
      <mesh
        ref={rightRef}
        geometry={geometry}
        material={material}
        position={[SCENE.brewX + SCENE.spoutOffset, SCENE.spoutY, SCENE.brewZ]}
        renderOrder={3}
      />
    </group>
  );
}
