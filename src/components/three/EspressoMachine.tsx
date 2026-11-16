"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { coffeeState, getMachineState, SCENE } from "@/animations/coffeeTimeline";
import { useDisposable } from "./useDisposable";
import { useQuality } from "./quality";

/* ─────────────────────────────────────────────────────────────────────────────
 * A procedural dual-boiler E61-style espresso machine.
 * Satin-black body, brushed-steel fascia, polished chrome brew group,
 * walnut portafilter, bronze NOIRÉ accents. Units ≈ decimetres.
 *
 *   housing  y 1.67 → 2.25        towers  x ±0.5 → ±1.2
 *   group head axis (0, ·, 0.62)  spouts  y 1.10
 *   drip tray top y 0.385
 * ──────────────────────────────────────────────────────────────────────────── */

const BREW_Z = SCENE.brewZ;
const FASCIA_Z = 0.552;

/* ───────────────── canvas textures (gauge face + nameplate) ───────────────── */

function makeGaugeTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const cx = size / 2;

  const bg = g.createRadialGradient(cx, cx * 0.8, 20, cx, cx, cx);
  bg.addColorStop(0, "#f6efe3");
  bg.addColorStop(1, "#d9cdb9");
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);

  const angleFor = (bar: number) => ((-135 + (270 * bar) / 16) * Math.PI) / 180;
  const pt = (a: number, r: number) => [cx + r * Math.sin(a), cx - r * Math.cos(a)] as const;

  // Brew zone arc (8–10 bar) in bronze
  g.strokeStyle = "#b88a5a";
  g.lineWidth = 18;
  g.beginPath();
  g.arc(cx, cx, 196, angleFor(8) - Math.PI / 2, angleFor(10.5) - Math.PI / 2);
  g.stroke();

  // Ticks
  for (let v = 0; v <= 16; v += 0.5) {
    const major = v % 2 === 0;
    const a = angleFor(v);
    const [x1, y1] = pt(a, major ? 172 : 186);
    const [x2, y2] = pt(a, 210);
    g.strokeStyle = "#1c1713";
    g.lineWidth = major ? 6 : 2.5;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    if (major) {
      const [tx, ty] = pt(a, 138);
      g.fillStyle = "#1c1713";
      g.font = "500 34px Georgia, serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(v), tx, ty);
    }
  }

  g.fillStyle = "#6b5a49";
  g.font = "600 26px Helvetica, Arial, sans-serif";
  g.textAlign = "center";
  g.fillText("BAR", cx, cx + 92);
  g.fillStyle = "#b88a5a";
  g.font = "italic 30px Georgia, serif";
  g.fillText("Noiré", cx, cx - 74);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeNameplateTexture() {
  const w = 1024;
  const h = 160;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#8c6238");
  grad.addColorStop(0.45, "#d8b088");
  grad.addColorStop(0.55, "#c39567");
  grad.addColorStop(1, "#7d5530");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  // brushed lines
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = `rgba(255,240,220,${Math.random() * 0.06})`;
    g.lineWidth = 1;
    const y = Math.random() * h;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  g.fillStyle = "#1a120c";
  g.font = "500 96px Georgia, 'Times New Roman', serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  // Hand-spaced lettering
  const letters = "NOIRÉ".split("");
  const spacing = 128;
  letters.forEach((l, i) => g.fillText(l, w / 2 + (i - (letters.length - 1) / 2) * spacing, h / 2 + 6));

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ───────────────────────────── geometry builders ───────────────────────────── */

function groupHeadGeometry(segments: number) {
  // (radius, y) profile — chunky E61 bell, top at y = 0
  const pts = [
    [0.0, 0.0],
    [0.215, 0.0],
    [0.238, -0.018],
    [0.238, -0.062],
    [0.2, -0.088],
    [0.188, -0.11],
    [0.188, -0.185],
    [0.214, -0.205],
    [0.218, -0.262],
    [0.2, -0.285],
    [0.0, -0.29],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, segments);
}

function basketGeometry(segments: number) {
  const pts = [
    [0.0, 0.0],
    [0.15, 0.0],
    [0.178, 0.025],
    [0.195, 0.085],
    [0.212, 0.1],
    [0.212, 0.12],
    [0.0, 0.12],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, segments);
}

function handleGeometry(segments: number) {
  // Turned walnut handle — profile along its length (x = radius, y = length)
  const pts: THREE.Vector2[] = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = 0.036 + 0.014 * Math.sin(t * Math.PI * 0.9) + (t > 0.92 ? -0.03 * ((t - 0.92) / 0.08) : 0);
    pts.push(new THREE.Vector2(Math.max(r, 0.004), t * 0.42));
  }
  pts.unshift(new THREE.Vector2(0, 0));
  pts.push(new THREE.Vector2(0, 0.42));
  return new THREE.LatheGeometry(pts, Math.max(16, segments / 3));
}

function railGeometry() {
  // Rounded-rectangle cup-warmer rail on top of the machine
  const hw = 1.05;
  const hd = 0.56;
  const r = 0.12;
  const y = 0;
  const pts: THREE.Vector3[] = [];
  const corners: Array<[number, number, number]> = [
    [hw - r, hd - r, 0],
    [-(hw - r), hd - r, Math.PI / 2],
    [-(hw - r), -(hd - r), Math.PI],
    [hw - r, -(hd - r), (3 * Math.PI) / 2],
  ];
  for (const [cx, cz, start] of corners) {
    for (let i = 0; i <= 6; i++) {
      const a = start + (i / 6) * (Math.PI / 2);
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r));
    }
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
  return new THREE.TubeGeometry(curve, 120, 0.016, 10, true);
}

function wandGeometry(points: Array<[number, number, number]>, radius: number) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  return new THREE.TubeGeometry(curve, 48, radius, 12, false);
}

/* ─────────────────────────────── component ─────────────────────────────── */

export default function EspressoMachine() {
  const { segments, reducedMotion } = useQuality();

  const bodyRef = useRef<THREE.Group>(null);
  const needleRef = useRef<THREE.Mesh>(null);
  const leverRef = useRef<THREE.Group>(null);
  const heatLampRef = useRef<THREE.MeshStandardMaterial>(null);
  const readyLampRef = useRef<THREE.MeshStandardMaterial>(null);
  const bayStripRef = useRef<THREE.MeshBasicMaterial>(null);

  /* Materials — created once, shared across meshes, disposed on unmount. */
  const mats = useMemo(() => {
    const chrome = new THREE.MeshStandardMaterial({ color: "#e4e0da", metalness: 1, roughness: 0.1, envMapIntensity: 1.25 });
    const brushed = new THREE.MeshStandardMaterial({ color: "#a39d95", metalness: 1, roughness: 0.3, envMapIntensity: 1 });
    const satin = new THREE.MeshPhysicalMaterial({
      color: "#16130f",
      metalness: 0.55,
      roughness: 0.42,
      clearcoat: 0.7,
      clearcoatRoughness: 0.22,
      envMapIntensity: 0.9,
    });
    const bronze = new THREE.MeshStandardMaterial({ color: "#c0915f", metalness: 1, roughness: 0.26, envMapIntensity: 1.1 });
    const rubber = new THREE.MeshStandardMaterial({ color: "#0b0a09", metalness: 0, roughness: 0.9 });
    const walnut = new THREE.MeshPhysicalMaterial({ color: "#3a2114", metalness: 0, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3 });
    const recess = new THREE.MeshStandardMaterial({ color: "#050404", metalness: 0.2, roughness: 0.8 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      metalness: 0,
      roughness: 0.02,
      transparent: true,
      opacity: 0.12,
      envMapIntensity: 1.5,
      depthWrite: false,
    });
    return { chrome, brushed, satin, bronze, rubber, walnut, recess, glass };
  }, []);

  const textures = useMemo(() => {
    const gauge = makeGaugeTexture();
    const plate = makeNameplateTexture();
    return { gauge, plate };
  }, []);

  const geos = useMemo(
    () => ({
      groupHead: groupHeadGeometry(segments),
      basket: basketGeometry(segments),
      handle: handleGeometry(segments),
      rail: railGeometry(),
      steamWand: wandGeometry(
        [
          [0.98, 1.67, 0.36],
          [1.0, 1.58, 0.5],
          [1.04, 1.38, 0.62],
          [1.06, 1.0, 0.72],
          [1.07, 0.74, 0.76],
        ],
        0.02,
      ),
      waterWand: wandGeometry(
        [
          [-0.98, 1.67, 0.36],
          [-1.0, 1.58, 0.5],
          [-1.02, 1.42, 0.58],
          [-1.03, 1.22, 0.6],
        ],
        0.022,
      ),
    }),
    [segments],
  );

  const disposables = useMemo(
    () => [...Object.values(mats), ...Object.values(textures), ...Object.values(geos)],
    [mats, textures, geos],
  );
  useDisposable(disposables);

  /* Scroll-driven machine life: lamps, gauge, lever, pump vibration. */
  useFrame((state) => {
    const m = getMachineState(coffeeState.progress);
    const t = reducedMotion ? 0 : state.clock.elapsedTime;

    if (heatLampRef.current) heatLampRef.current.emissiveIntensity = 0.05 + m.heat * 3.2 * (1 - m.ready * 0.6);
    if (readyLampRef.current) readyLampRef.current.emissiveIntensity = 0.04 + m.ready * 3.6;
    if (bayStripRef.current) bayStripRef.current.color.setScalar(0.15 + m.bayLight * 1.4);

    if (needleRef.current) {
      const jitter = m.vibration * Math.sin(t * 37) * 0.09 + m.vibration * Math.sin(t * 13.7) * 0.05;
      const bar = Math.max(0, m.pressure + jitter);
      const deg = -135 + (270 * bar) / 16;
      needleRef.current.rotation.z = -THREE.MathUtils.degToRad(deg);
    }

    if (leverRef.current) leverRef.current.rotation.x = THREE.MathUtils.lerp(1.3, -0.05, m.lever);

    if (bodyRef.current) {
      const v = m.vibration * 0.0016;
      bodyRef.current.position.x = Math.sin(t * 83) * v;
      bodyRef.current.position.y = Math.sin(t * 71 + 1.3) * v * 0.6;
    }
  });

  const slatZ = useMemo(() => Array.from({ length: 11 }, (_, i) => 0.0 + i * 0.09), []);

  return (
    <group ref={bodyRef} name="EspressoMachine">
      {/* ── feet ── */}
      {[
        [-1.05, -0.65],
        [1.05, -0.65],
        [-1.05, 0.55],
        [1.05, 0.55],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.04, z]} material={mats.chrome}>
          <cylinderGeometry args={[0.055, 0.07, 0.08, 20]} />
        </mesh>
      ))}

      {/* ── base plinth ── */}
      <RoundedBox args={[2.5, 0.2, 1.55]} radius={0.04} smoothness={3} position={[0, 0.18, -0.075]} material={mats.satin} />
      <mesh position={[0, 0.282, -0.075]} material={mats.chrome}>
        <boxGeometry args={[2.5, 0.012, 1.56]} />
      </mesh>

      {/* ── side towers ── */}
      {[-0.85, 0.85].map((x) => (
        <group key={x}>
          <RoundedBox args={[0.7, 1.34, 1.3]} radius={0.035} smoothness={3} position={[x, 0.95, -0.15]} material={mats.satin} />
          {/* bronze pin-line on the inner front edge */}
          <mesh position={[x > 0 ? 0.535 : -0.535, 0.95, 0.503]} material={mats.bronze}>
            <boxGeometry args={[0.01, 1.18, 0.008]} />
          </mesh>
          {/* vents */}
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[x, 0.46 + i * 0.05, 0.503]} material={mats.recess}>
              <boxGeometry args={[0.44, 0.012, 0.006]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── back of brew bay + brushed splash panel ── */}
      <mesh position={[0, 0.95, -0.475]} material={mats.satin}>
        <boxGeometry args={[1.0, 1.34, 0.65]} />
      </mesh>
      <mesh position={[0, 0.95, -0.148]} material={mats.brushed}>
        <planeGeometry args={[1.0, 1.34]} />
      </mesh>

      {/* ── chrome belt line ── */}
      <RoundedBox args={[2.54, 0.05, 1.42]} radius={0.02} smoothness={2} position={[0, 1.645, -0.15]} material={mats.chrome} />

      {/* ── top housing ── */}
      <RoundedBox args={[2.5, 0.58, 1.38]} radius={0.05} smoothness={4} position={[0, 1.96, -0.15]} material={mats.satin} />
      {/* brushed fascia */}
      <RoundedBox args={[2.3, 0.42, 0.02]} radius={0.008} smoothness={2} position={[0, 1.96, FASCIA_Z - 0.008]} material={mats.brushed} />

      {/* warm LED strip under the housing — lights the cup bay */}
      <mesh position={[0, 1.618, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.05]} />
        <meshBasicMaterial ref={bayStripRef} color="#ffcf96" toneMapped={false} />
      </mesh>

      {/* ── nameplate ── */}
      <mesh position={[0, 2.075, FASCIA_Z + 0.006]}>
        <planeGeometry args={[0.62, 0.097]} />
        <meshStandardMaterial map={textures.plate} metalness={0.85} roughness={0.32} envMapIntensity={1.2} />
      </mesh>

      {/* ── pressure gauge ── */}
      <group position={[-0.72, 1.96, FASCIA_Z + 0.01]}>
        <mesh material={mats.chrome}>
          <torusGeometry args={[0.165, 0.022, 16, Math.max(32, segments / 2)]} />
        </mesh>
        <mesh position={[0, 0, -0.004]}>
          <circleGeometry args={[0.162, Math.max(32, segments / 2)]} />
          <meshStandardMaterial map={textures.gauge} roughness={0.55} metalness={0} />
        </mesh>
        <mesh ref={needleRef} position={[0, 0, 0.006]}>
          <boxGeometry args={[0.009, 0.15, 0.004]} />
          <meshStandardMaterial color="#8e2b1d" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]} material={mats.bronze}>
          <cylinderGeometry args={[0.018, 0.018, 0.012, 20]} />
        </mesh>
        <mesh position={[0, 0, 0.018]} material={mats.glass}>
          <circleGeometry args={[0.16, 32]} />
        </mesh>
      </group>

      {/* ── indicator lamps ── */}
      {[
        { x: 0.52, ref: heatLampRef, color: "#ff7a2e" },
        { x: 0.7, ref: readyLampRef, color: "#ffe1b0" },
      ].map(({ x, ref, color }) => (
        <group key={x} position={[x, 1.96, FASCIA_Z + 0.01]}>
          <mesh material={mats.chrome}>
            <torusGeometry args={[0.038, 0.009, 10, 28]} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.03, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              ref={ref}
              color="#2a1a10"
              emissive={color}
              emissiveIntensity={0.05}
              roughness={0.2}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      {/* power toggle */}
      <group position={[0.88, 1.96, FASCIA_Z + 0.01]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.chrome}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 20]} />
        </mesh>
        <mesh position={[0, 0.02, 0.04]} rotation={[0.9, 0, 0]} material={mats.chrome}>
          <cylinderGeometry args={[0.008, 0.011, 0.09, 12]} />
        </mesh>
      </group>

      {/* ── valve knobs on the housing sides ── */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.26, 1.96, 0.2]} rotation={[0, 0, (s * Math.PI) / 2]}>
          <mesh position={[0, 0.02, 0]} material={mats.chrome}>
            <cylinderGeometry args={[0.035, 0.035, 0.05, 20]} />
          </mesh>
          <mesh position={[0, 0.075, 0]} material={mats.walnut}>
            <cylinderGeometry args={[0.07, 0.075, 0.07, 28]} />
          </mesh>
          <mesh position={[0, 0.113, 0]} material={mats.bronze}>
            <cylinderGeometry args={[0.05, 0.05, 0.008, 28]} />
          </mesh>
        </group>
      ))}

      {/* ── steam & hot-water wands ── */}
      <mesh geometry={geos.steamWand} material={mats.chrome} />
      <mesh position={[0.98, 1.665, 0.36]} material={mats.chrome}>
        <sphereGeometry args={[0.042, 20, 14]} />
      </mesh>
      <mesh position={[1.07, 0.72, 0.76]} material={mats.chrome}>
        <cylinderGeometry args={[0.014, 0.022, 0.05, 14]} />
      </mesh>
      <mesh geometry={geos.waterWand} material={mats.chrome} />
      <mesh position={[-0.98, 1.665, 0.36]} material={mats.chrome}>
        <sphereGeometry args={[0.044, 20, 14]} />
      </mesh>

      {/* ── cup-warmer tray & rail ── */}
      <mesh position={[0, 2.256, -0.15]} material={mats.brushed}>
        <boxGeometry args={[2.25, 0.012, 1.2]} />
      </mesh>
      <mesh geometry={geos.rail} position={[0, 2.33, -0.15]} material={mats.chrome} />
      {[
        [-0.93, -0.59],
        [0.93, -0.59],
        [-0.93, 0.29],
        [0.93, 0.29],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 2.29, z]} material={mats.chrome}>
          <cylinderGeometry args={[0.012, 0.012, 0.08, 10]} />
        </mesh>
      ))}

      {/* ── brew group ── */}
      <RoundedBox args={[0.52, 0.12, 0.36]} radius={0.03} smoothness={3} position={[0, 1.6, BREW_Z - 0.12]} material={mats.chrome} />
      <mesh geometry={geos.groupHead} position={[0, 1.62, BREW_Z]} material={mats.chrome} />

      {/* E61 mechanism: horizontal cylinder + dome + lever */}
      <mesh position={[0, 1.53, BREW_Z + 0.24]} rotation={[Math.PI / 2, 0, 0]} material={mats.chrome}>
        <cylinderGeometry args={[0.072, 0.08, 0.26, Math.max(24, segments / 3)]} />
      </mesh>
      <mesh position={[0, 1.53, BREW_Z + 0.37]} material={mats.chrome}>
        <sphereGeometry args={[0.072, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <group ref={leverRef} position={[0, 1.6, BREW_Z + 0.3]} rotation={[1.3, 0, 0]}>
        <mesh position={[0, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.chrome}>
          <cylinderGeometry args={[0.02, 0.02, 0.07, 14]} />
        </mesh>
        <mesh position={[0, 0.14, 0]} material={mats.chrome}>
          <cylinderGeometry args={[0.011, 0.015, 0.28, 12]} />
        </mesh>
        <mesh position={[0, 0.3, 0]} material={mats.walnut}>
          <sphereGeometry args={[0.042, 24, 16]} />
        </mesh>
      </group>

      {/* ── portafilter ── */}
      <group position={[0, 1.21, BREW_Z]}>
        <mesh geometry={geos.basket} material={mats.chrome} />
        {/* bayonet lugs */}
        {[0, Math.PI].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.215, 0.108, Math.sin(a) * 0.215]} material={mats.chrome}>
            <boxGeometry args={[0.05, 0.025, 0.08]} />
          </mesh>
        ))}
        {/* spout block + double spout */}
        <mesh position={[0, -0.022, 0]} material={mats.chrome}>
          <cylinderGeometry args={[0.07, 0.055, 0.045, 24]} />
        </mesh>
        {[-SCENE.spoutOffset, SCENE.spoutOffset].map((x) => (
          <mesh key={x} position={[x, -0.07, 0]} material={mats.chrome}>
            <cylinderGeometry args={[0.019, 0.015, 0.075, 14]} />
          </mesh>
        ))}
        {/* handle: chrome neck + turned walnut grip */}
        <group rotation={[0, 0.62, 0]}>
          <group position={[0, 0.06, 0.19]} rotation={[Math.PI / 2 - 0.08, 0, 0]}>
            <mesh position={[0, 0.1, 0]} material={mats.chrome}>
              <cylinderGeometry args={[0.024, 0.032, 0.2, 16]} />
            </mesh>
            <mesh geometry={geos.handle} position={[0, 0.19, 0]} material={mats.walnut} />
            <mesh position={[0, 0.615, 0]} material={mats.bronze}>
              <sphereGeometry args={[0.018, 16, 10]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ── drip tray ── */}
      <RoundedBox args={[1.08, 0.1, 1.02]} radius={0.025} smoothness={3} position={[0, 0.335, 0.45]} material={mats.chrome} />
      <mesh position={[0, 0.376, 0.45]} rotation={[-Math.PI / 2, 0, 0]} material={mats.recess}>
        <planeGeometry args={[0.98, 0.92]} />
      </mesh>
      {slatZ.map((z) => (
        <mesh key={z} position={[0, 0.381, z]} material={mats.brushed}>
          <boxGeometry args={[0.98, 0.008, 0.042]} />
        </mesh>
      ))}

      {/* rubber footprint pads beneath the drip tray front */}
      <mesh position={[0, 0.29, 0.95]} material={mats.rubber}>
        <boxGeometry args={[1.0, 0.01, 0.02]} />
      </mesh>
    </group>
  );
}
